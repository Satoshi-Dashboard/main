import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cacheGetJson, cacheSetJson, withCacheLock } from './server/runtimeCache.js';

const CACHE_FILE = path.resolve(process.cwd(), 'btc_rates_cache.json');
const BINANCE_BTC_URL = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';
const BINANCE_BTC_24H_URL = 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT';
const COINGECKO_BTC_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true';
const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest?base=USD';
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 60_000;
const SHARED_CACHE_TTL_SECONDS = 90;
const SHARED_CACHE_KEY = 'btc-rates';
const SHARED_LOCK_KEY = 'btc-rates-refresh';

let memoryCache = null;

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

function sanitizeBtcUsd(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function isPayloadFresh(payload, nowMs = Date.now()) {
  const updatedAt = new Date(String(payload?.updated_at || ''));
  if (!Number.isFinite(updatedAt.getTime())) return false;
  return nowMs - updatedAt.getTime() < CACHE_TTL_MS;
}

function isValidRatesPayload(payload) {
  return (
    payload
    && typeof payload === 'object'
    && typeof payload.updated_at === 'string'
    && payload.rates
    && typeof payload.rates === 'object'
  );
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

async function fetchBtcUsdWithFallback() {
  try {
    const binance = await fetchJsonWithTimeout(BINANCE_BTC_URL, 'binance');
    const btcUsd = sanitizeBtcUsd(binance?.price);
    if (!btcUsd) throw new ExternalApiError('binance', 'Invalid BTC price');

    let change24h = null;
    try {
      const ticker = await fetchJsonWithTimeout(BINANCE_BTC_24H_URL, 'binance');
      const parsed = Number(ticker?.priceChangePercent);
      if (Number.isFinite(parsed)) change24h = parsed;
    } catch {
      /* keep null, not fatal for Binance primary */
    }

    return { btcUsd, change24h, source: 'Binance BTCUSDT' };
  } catch (binanceError) {
    try {
      const cg = await fetchJsonWithTimeout(COINGECKO_BTC_URL, 'coingecko');
      const btcUsd = sanitizeBtcUsd(cg?.bitcoin?.usd);
      if (!btcUsd) throw new Error('Invalid BTC price from CoinGecko');
      const change24h = Number(cg?.bitcoin?.usd_24h_change);
      return {
        btcUsd,
        change24h: Number.isFinite(change24h) ? change24h : null,
        source: 'CoinGecko BTCUSD fallback',
      };
    } catch {
      throw new ExternalApiError(
        'binance',
        binanceError instanceof Error ? binanceError.message : 'Binance API unavailable',
      );
    }
  }
}

async function fetchFrankfurterRates() {
  const frankfurter = await fetchJsonWithTimeout(FRANKFURTER_URL, 'frankfurter');
  if (!frankfurter || typeof frankfurter !== 'object' || typeof frankfurter.rates !== 'object') {
    throw new ExternalApiError('frankfurter', 'Invalid Frankfurter payload');
  }
  return frankfurter.rates;
}

function buildRates(btcUsd, fiatRates) {
  const entries = [['USD', Number(btcUsd.toFixed(2))]];

  Object.entries(fiatRates).forEach(([code, fxRate]) => {
    const parsedRate = Number(fxRate);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) return;
    const converted = Number((btcUsd * parsedRate).toFixed(2));
    entries.push([code.toUpperCase(), converted]);
  });

  entries.sort((a, b) => a[0].localeCompare(b[0]));
  return Object.fromEntries(entries);
}

export async function updateBtcRates() {
  const { btcUsd, change24h, source } = await fetchBtcUsdWithFallback();
  const fiatRates = await fetchFrankfurterRates();

  const payload = {
    updated_at: normalizeTimestamp(),
    btc_usd: Number(btcUsd.toFixed(2)),
    btc_change_24h_pct: Number.isFinite(change24h) ? Number(change24h.toFixed(3)) : null,
    source_btc: source,
    source_fiat: 'Frankfurter ECB',
    rates: buildRates(btcUsd, fiatRates),
  };

  memoryCache = payload;
  await writeDiskCache(payload);
  await cacheSetJson(SHARED_CACHE_KEY, payload, { ttlSeconds: SHARED_CACHE_TTL_SECONDS });
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
