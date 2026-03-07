import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cacheGetJson, cacheSetJson, withCacheLock } from './server/runtimeCache.js';

const CACHE_FILE = path.resolve(process.cwd(), 'btc_rates_cache.json');

const BINANCE_BTC_24H_URLS = [
  'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
  'https://api.binance.us/api/v3/ticker/24hr?symbol=BTCUSDT',
];
const COINGECKO_BTC_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true';
const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest?base=USD';

const FETCH_TIMEOUT_MS = 10_000;

const SPOT_REFRESH_MS = 5_000;
const FIAT_REFRESH_MS = 6 * 60 * 60 * 1000;
const COINGECKO_FALLBACK_MIN_INTERVAL_MS = 60_000;

const SHARED_CACHE_KEY = 'btc-rates';
const SHARED_LOCK_KEY = 'btc-rates-refresh';

let memoryCache = null;

const providerState = globalThis.__SATOSHI_BTC_RATES_PROVIDER_STATE__ || {
  lastCoinGeckoAttemptMs: 0,
};

if (!globalThis.__SATOSHI_BTC_RATES_PROVIDER_STATE__) {
  globalThis.__SATOSHI_BTC_RATES_PROVIDER_STATE__ = providerState;
}

class ExternalApiError extends Error {
  constructor(source, message) {
    super(message);
    this.name = 'ExternalApiError';
    this.source = source;
  }
}

async function fetchJsonWithTimeout(url, source) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new ExternalApiError(source, `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ExternalApiError) throw error;
    if (error?.name === 'AbortError') {
      throw new ExternalApiError(source, 'Request timeout');
    }
    throw new ExternalApiError(source, error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function parseIsoDate(value) {
  const date = new Date(String(value || ''));
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

function sanitizeBtcUsd(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isValidRatesPayload(payload) {
  return (
    payload
    && typeof payload === 'object'
    && typeof payload.updated_at === 'string'
    && typeof payload.next_update_at === 'string'
    && payload.rates
    && typeof payload.rates === 'object'
  );
}

function isPayloadFresh(payload, nowMs = Date.now()) {
  if (!isValidRatesPayload(payload)) return false;
  const nextUpdate = parseIsoDate(payload.next_update_at);
  if (!nextUpdate) return false;
  return nowMs < nextUpdate.getTime();
}

function hasUsableFiatSnapshot(payload, nowMs = Date.now()) {
  const updatedAt = parseIsoDate(payload?.fx?.updated_at);
  if (!updatedAt) return false;
  if (!payload?.fx?.rates || typeof payload.fx.rates !== 'object') return false;
  return (nowMs - updatedAt.getTime()) < FIAT_REFRESH_MS;
}

async function readDiskCache() {
  try {
    const text = await readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(text);
    return isValidRatesPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeDiskCache(payload) {
  try {
    await writeFile(CACHE_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch {
    /* ignore write errors in serverless/read-only environments */
  }
}

function buildRates(btcUsd, fiatRates) {
  const entries = [['USD', Number(btcUsd.toFixed(2))]];

  Object.entries(fiatRates || {}).forEach(([code, fxRate]) => {
    const parsedRate = Number(fxRate);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) return;
    const converted = Number((btcUsd * parsedRate).toFixed(2));
    entries.push([code.toUpperCase(), converted]);
  });

  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return Object.fromEntries(entries);
}

function getCoingeckoWaitMs(nowMs = Date.now()) {
  const elapsed = nowMs - providerState.lastCoinGeckoAttemptMs;
  return Math.max(0, COINGECKO_FALLBACK_MIN_INTERVAL_MS - elapsed);
}

async function fetchSpotWithFallback(previousPayload) {
  try {
    let lastBinanceError = null;

    for (const binanceUrl of BINANCE_BTC_24H_URLS) {
      try {
        const ticker = await fetchJsonWithTimeout(binanceUrl, 'binance');
        const btcUsd = sanitizeBtcUsd(ticker?.lastPrice);
        if (!btcUsd) throw new ExternalApiError('binance', 'Invalid BTC price');

        const change24h = Number(ticker?.priceChangePercent);
        const isUs = binanceUrl.includes('binance.us');
        return {
          btcUsd,
          change24h: Number.isFinite(change24h) ? change24h : null,
          sourceLabel: isUs ? 'Binance.US BTCUSDT' : 'Binance BTCUSDT',
          sourceUrl: binanceUrl,
        };
      } catch (error) {
        lastBinanceError = error;
      }
    }

    if (lastBinanceError) {
      throw lastBinanceError;
    }

    throw new ExternalApiError('binance', 'Binance API unavailable');
  } catch (binanceError) {
    const waitMs = getCoingeckoWaitMs();

    if (waitMs > 0 && isValidRatesPayload(previousPayload)) {
      const fallbackChange = Number(previousPayload?.btc_change_24h_pct);
      return {
        btcUsd: Number(previousPayload.btc_usd),
        change24h: Number.isFinite(fallbackChange) ? fallbackChange : null,
        sourceLabel: previousPayload.source_btc || 'cached_spot',
        sourceUrl: previousPayload.source_btc_url || 'https://api.binance.com',
      };
    }

    providerState.lastCoinGeckoAttemptMs = Date.now();

    try {
      const cg = await fetchJsonWithTimeout(COINGECKO_BTC_URL, 'coingecko');
      const btcUsd = sanitizeBtcUsd(cg?.bitcoin?.usd);
      if (!btcUsd) throw new Error('Invalid BTC price from CoinGecko');

      const change24h = Number(cg?.bitcoin?.usd_24h_change);
      return {
        btcUsd,
        change24h: Number.isFinite(change24h) ? change24h : null,
        sourceLabel: 'CoinGecko BTCUSD fallback',
        sourceUrl: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      };
    } catch {
      throw new ExternalApiError(
        'binance',
        binanceError instanceof Error ? binanceError.message : 'Binance API unavailable',
      );
    }
  }
}

async function fetchFiatRates(previousPayload) {
  if (hasUsableFiatSnapshot(previousPayload)) {
    return {
      rates: previousPayload.fx.rates,
      updatedAt: previousPayload.fx.updated_at,
      sourceLabel: previousPayload.source_fiat || 'Frankfurter ECB',
      sourceUrl: previousPayload.source_fiat_url || 'https://api.frankfurter.dev/v1/latest?base=USD',
    };
  }

  try {
    const frankfurter = await fetchJsonWithTimeout(FRANKFURTER_URL, 'frankfurter');
    if (!frankfurter || typeof frankfurter !== 'object' || typeof frankfurter.rates !== 'object') {
      throw new ExternalApiError('frankfurter', 'Invalid Frankfurter payload');
    }

    return {
      rates: frankfurter.rates,
      updatedAt: normalizeTimestamp(),
      sourceLabel: 'Frankfurter ECB',
      sourceUrl: FRANKFURTER_URL,
    };
  } catch (error) {
    if (hasUsableFiatSnapshot(previousPayload)) {
      return {
        rates: previousPayload.fx.rates,
        updatedAt: previousPayload.fx.updated_at,
        sourceLabel: previousPayload.source_fiat || 'Frankfurter ECB',
        sourceUrl: previousPayload.source_fiat_url || FRANKFURTER_URL,
      };
    }

    if (error instanceof ExternalApiError) throw error;
    throw new ExternalApiError('frankfurter', error instanceof Error ? error.message : String(error));
  }
}

function getSharedTtlSeconds(now = Date.now()) {
  const next = now + SPOT_REFRESH_MS;
  const ttlMs = Math.max(10_000, next - now + 10_000);
  return Math.max(10, Math.floor(ttlMs / 1000));
}

export async function updateBtcRates() {
  const basePayload = isValidRatesPayload(memoryCache) ? memoryCache : null;

  const [spot, fiat] = await Promise.all([
    fetchSpotWithFallback(basePayload),
    fetchFiatRates(basePayload),
  ]);

  const now = Date.now();
  const payload = {
    updated_at: normalizeTimestamp(new Date(now)),
    next_update_at: normalizeTimestamp(new Date(now + SPOT_REFRESH_MS)),
    btc_usd: Number(spot.btcUsd.toFixed(2)),
    btc_change_24h_pct: Number.isFinite(spot.change24h) ? Number(spot.change24h.toFixed(3)) : null,
    source_btc: spot.sourceLabel,
    source_btc_url: spot.sourceUrl,
    source_fiat: fiat.sourceLabel,
    source_fiat_url: fiat.sourceUrl,
    fx: {
      base: 'USD',
      updated_at: fiat.updatedAt,
      rates: fiat.rates,
    },
    refresh_policy: {
      spot_interval_ms: SPOT_REFRESH_MS,
      fiat_interval_ms: FIAT_REFRESH_MS,
      coingecko_fallback_min_interval_ms: COINGECKO_FALLBACK_MIN_INTERVAL_MS,
    },
    rates: buildRates(spot.btcUsd, fiat.rates),
  };

  memoryCache = payload;
  await writeDiskCache(payload);
  await cacheSetJson(SHARED_CACHE_KEY, payload, { ttlSeconds: getSharedTtlSeconds(now) });
  return payload;
}

export async function getBtcRates({ forceFresh = false } = {}) {
  if (!forceFresh && isPayloadFresh(memoryCache)) {
    return memoryCache;
  }

  if (!forceFresh && !memoryCache) {
    const shared = await cacheGetJson(SHARED_CACHE_KEY);
    if (isValidRatesPayload(shared)) {
      memoryCache = shared;
    }
  }

  if (!forceFresh && !memoryCache) {
    const disk = await readDiskCache();
    if (disk) memoryCache = disk;
  }

  if (!forceFresh && isPayloadFresh(memoryCache)) {
    return memoryCache;
  }

  const refreshed = await withCacheLock(
    SHARED_LOCK_KEY,
    async () => updateBtcRates(),
    { ttlSeconds: 20, waitMs: 3000, pollMs: 120 },
  );

  if (isValidRatesPayload(refreshed)) {
    return refreshed;
  }

  try {
    const shared = await cacheGetJson(SHARED_CACHE_KEY);
    if (isValidRatesPayload(shared)) {
      memoryCache = shared;
      if (!forceFresh || isPayloadFresh(shared)) return shared;
    }

    return await updateBtcRates();
  } catch (error) {
    if (memoryCache && isValidRatesPayload(memoryCache)) {
      return memoryCache;
    }

    const disk = await readDiskCache();
    if (disk) {
      memoryCache = disk;
      return disk;
    }

    throw error;
  }
}

export { ExternalApiError };
