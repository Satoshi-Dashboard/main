import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cacheGetJson, cacheSetJson, withCacheLock } from './server/shared/runtimeCache.js';

const CACHE_FILE = path.resolve(process.cwd(), 'btc_rates_cache.json');

const BINANCE_BTC_24H_URLS = [
  'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT',
  'https://api.binance.us/api/v3/ticker/24hr?symbol=BTCUSDT',
];
const INVESTING_USD_CROSSES_URL = 'https://www.investing.com/currencies/single-currency-crosses?currency=usd';
const SCRAPER_BASE_URL = String(process.env.SCRAPER_BASE_URL || 'https://api.zatobox.io').trim();

const FETCH_TIMEOUT_MS = 10_000;

const SPOT_REFRESH_MS = 5_000;
const FIAT_REFRESH_MS = 30_000;

const SHARED_CACHE_KEY = 'btc-rates';
const SHARED_LOCK_KEY = 'btc-rates-refresh';
const FIAT_SHARED_CACHE_KEY = 'btc-rates-fiat';
const FIAT_SHARED_LOCK_KEY = 'btc-rates-fiat-refresh';

let memoryCache = null;
let fiatMemoryCache = null;

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

function sanitizeFxRate(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseNumber(value) {
  const cleaned = stripHtml(value)
    .replace(/,/g, '')
    .replace(/%/g, '')
    .replace(/\+/g, '')
    .replace(/\s+/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function invertPairRate(pairPrice) {
  if (!Number.isFinite(pairPrice) || pairPrice <= 0) return null;
  return 1 / pairPrice;
}

function parseUsdQuotesFromInvestingHtml(html) {
  const rows = {};
  const rowRegex = /<tr[^>]*class="[^"]*dynamic-table-v2_row__[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  let match = rowRegex.exec(html);

  while (match) {
    const rowHtml = match[1] || '';
    const titleMatch = rowHtml.match(/<a[^>]*title="([^"]+)"/i);
    if (!titleMatch) {
      match = rowRegex.exec(html);
      continue;
    }

    const title = String(titleMatch[1] || '').toUpperCase();
    const titleParts = title.match(/^([A-Z]{3})\/([A-Z]{3})$/);
    if (!titleParts) {
      match = rowRegex.exec(html);
      continue;
    }

    const base = titleParts[1];
    const quote = titleParts[2];
    if (base !== 'USD' && quote !== 'USD') {
      match = rowRegex.exec(html);
      continue;
    }

    const code = base === 'USD' ? quote : base;
    const priceMatch = rowHtml.match(/dynamic-table-v2_col-other[^>]*>\s*(?:<span[^>]*>)?\s*([+-]?\d[\d,.]*)\s*(?:<\/span>)?\s*<\/td>/i);
    const pairPrice = parseNumber(priceMatch?.[1]);
    if (!Number.isFinite(pairPrice) || pairPrice <= 0) {
      match = rowRegex.exec(html);
      continue;
    }

    const usdQuote = base === 'USD' ? pairPrice : invertPairRate(pairPrice);
    if (Number.isFinite(usdQuote) && usdQuote > 0) {
      rows[code] = usdQuote;
    }

    match = rowRegex.exec(html);
  }

  return Object.fromEntries(
    Object.entries(rows)
      .filter(([, value]) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a[0].localeCompare(b[0])),
  );
}

async function fetchTextWithTimeout(url, source, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html, text/plain;q=0.9, */*;q=0.5',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new ExternalApiError(source, `HTTP ${response.status}`);
    }

    return await response.text();
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

function isValidFiatPayload(payload) {
  return Boolean(
    payload
      && typeof payload === 'object'
      && typeof payload.updated_at === 'string'
      && typeof payload.next_update_at === 'string'
      && typeof payload.source_provider === 'string'
      && payload.rates
      && typeof payload.rates === 'object'
      && Object.keys(payload.rates).length > 0,
  );
}

function isFiatPayloadFresh(payload, nowMs = Date.now()) {
  if (!isValidFiatPayload(payload)) return false;
  const nextUpdate = parseIsoDate(payload.next_update_at);
  if (!nextUpdate) return false;
  return nowMs < nextUpdate.getTime();
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

async function fetchSpotFromBinance(previousPayload) {
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

  // If both Binance endpoints fail, use cached data if available
  if (isValidRatesPayload(previousPayload)) {
    const fallbackChange = Number(previousPayload?.btc_change_24h_pct);
    return {
      btcUsd: Number(previousPayload.btc_usd),
      change24h: Number.isFinite(fallbackChange) ? fallbackChange : null,
      sourceLabel: previousPayload.source_btc || 'cached_spot',
      sourceUrl: previousPayload.source_btc_url || 'https://api.binance.com',
    };
  }

  if (lastBinanceError) {
    throw lastBinanceError;
  }

  throw new ExternalApiError('binance', 'Binance API unavailable');
}

function getSharedTtlSeconds(now = Date.now()) {
  const next = now + SPOT_REFRESH_MS;
  const ttlMs = Math.max(10_000, next - now + 10_000);
  return Math.max(10, Math.floor(ttlMs / 1000));
}

function getFiatSharedTtlSeconds(now = Date.now()) {
  const next = now + FIAT_REFRESH_MS;
  const ttlMs = Math.max(10 * 60_000, next - now + 10 * 60_000);
  return Math.max(600, Math.floor(ttlMs / 1000));
}

function buildFiatPayload(rates, {
  sourceProvider = 'investing',
  sourceUrl = INVESTING_USD_CROSSES_URL,
} = {}) {
  const now = Date.now();
  return {
    updated_at: normalizeTimestamp(new Date(now)),
    next_update_at: normalizeTimestamp(new Date(now + FIAT_REFRESH_MS)),
    source_provider: sourceProvider,
    source_url: sourceUrl,
    rates,
  };
}

function deriveFiatPayloadFromBtcRatesPayload(payload) {
  const btcUsd = sanitizeBtcUsd(payload?.btc_usd);
  if (!btcUsd || !payload?.rates || typeof payload.rates !== 'object') return null;

  const normalizedRates = { USD: 1 };
  Object.entries(payload.rates).forEach(([code, value]) => {
    const safeValue = sanitizeFxRate(value);
    if (!safeValue) return;
    const currencyCode = String(code).toUpperCase();
    if (currencyCode === 'USD') {
      normalizedRates.USD = 1;
      return;
    }
    normalizedRates[currencyCode] = safeValue / btcUsd;
  });

  return buildFiatPayload(normalizedRates, {
    sourceProvider: 'derived_from_cached_btc_rates',
    sourceUrl: INVESTING_USD_CROSSES_URL,
  });
}

async function fetchUsdFxFromInvesting() {
  let html = null;
  let sourceProvider = 'investing';
  let sourceUrl = INVESTING_USD_CROSSES_URL;

  if (SCRAPER_BASE_URL) {
    const proxyUrl = `${SCRAPER_BASE_URL}/api/scrape/investing-currencies`;
    try {
      const payload = await fetchJsonWithTimeout(proxyUrl, 'investing');
      if (typeof payload?.html === 'string' && payload.html.length > 500) {
        html = payload.html;
        sourceProvider = 'investing-zatobox';
        sourceUrl = proxyUrl;
      }
    } catch {
      html = null;
    }
  }

  if (!html) {
    html = await fetchTextWithTimeout(INVESTING_USD_CROSSES_URL, 'investing', {
      'User-Agent': 'satoshi-dashboard/1.0 (+btc-rates-investing)',
    });
  }

  const rates = {
    USD: 1,
    ...parseUsdQuotesFromInvestingHtml(html),
  };

  if (Object.keys(rates).length <= 1) {
    throw new ExternalApiError('investing', 'Investing returned no USD cross FX rates');
  }

  return { rates, sourceProvider, sourceUrl };
}

async function updateFiatRates() {
  const { rates, sourceProvider, sourceUrl } = await fetchUsdFxFromInvesting();
  const payload = buildFiatPayload(rates, { sourceProvider, sourceUrl });
  fiatMemoryCache = payload;
  await cacheSetJson(FIAT_SHARED_CACHE_KEY, payload, { ttlSeconds: getFiatSharedTtlSeconds() });
  return payload;
}

async function getFiatRates({ forceFresh = false } = {}) {
  if (!forceFresh && isFiatPayloadFresh(fiatMemoryCache)) {
    return fiatMemoryCache;
  }

  if (!forceFresh && !fiatMemoryCache) {
    const shared = await cacheGetJson(FIAT_SHARED_CACHE_KEY);
    if (isValidFiatPayload(shared)) {
      fiatMemoryCache = shared;
    }
  }

  if (!forceFresh && isFiatPayloadFresh(fiatMemoryCache)) {
    return fiatMemoryCache;
  }

  const refreshed = await withCacheLock(
    FIAT_SHARED_LOCK_KEY,
    async () => updateFiatRates(),
    { ttlSeconds: 20, waitMs: 3000, pollMs: 120 },
  ).catch(() => null);

  if (isValidFiatPayload(refreshed)) {
    return refreshed;
  }

  const shared = await cacheGetJson(FIAT_SHARED_CACHE_KEY);
  if (isValidFiatPayload(shared)) {
    fiatMemoryCache = shared;
    return shared;
  }

  if (isValidFiatPayload(fiatMemoryCache)) {
    return fiatMemoryCache;
  }

  return await updateFiatRates();
}

function buildMergedRates(spotUsd, fiatPayload) {
  const merged = { USD: Number(spotUsd.toFixed(2)) };
  Object.entries(fiatPayload?.rates || {}).forEach(([code, fxRate]) => {
    const safeRate = sanitizeFxRate(fxRate);
    if (!safeRate) return;
    if (String(code).toUpperCase() === 'USD') {
      merged.USD = Number(spotUsd.toFixed(2));
      return;
    }
    const converted = spotUsd * safeRate;
    merged[String(code).toUpperCase()] = Number(converted >= 1 ? converted.toFixed(2) : converted.toFixed(6));
  });
  return merged;
}

export async function updateBtcRates() {
  const basePayload = isValidRatesPayload(memoryCache) ? memoryCache : null;

  const [spot, fiat] = await Promise.all([
    fetchSpotFromBinance(basePayload),
    getFiatRates().catch(async (error) => {
      const shared = await cacheGetJson(FIAT_SHARED_CACHE_KEY);
      if (isValidFiatPayload(shared)) {
        fiatMemoryCache = shared;
        return shared;
      }
      if (isValidFiatPayload(fiatMemoryCache)) {
        return fiatMemoryCache;
      }
      const derived = deriveFiatPayloadFromBtcRatesPayload(basePayload);
      if (isValidFiatPayload(derived)) {
        fiatMemoryCache = derived;
        return derived;
      }
      throw error;
    }),
  ]);

  const now = Date.now();
  const payload = {
    updated_at: normalizeTimestamp(new Date(now)),
    next_update_at: normalizeTimestamp(new Date(now + SPOT_REFRESH_MS)),
    btc_usd: Number(spot.btcUsd.toFixed(2)),
    btc_change_24h_pct: Number.isFinite(spot.change24h) ? Number(spot.change24h.toFixed(3)) : null,
    source_btc: spot.sourceLabel,
    source_btc_url: spot.sourceUrl,
    source_fiat: fiat.source_provider,
    source_fiat_url: fiat.source_url,
    refresh_policy: {
      spot_interval_ms: SPOT_REFRESH_MS,
      fiat_interval_ms: FIAT_REFRESH_MS,
    },
    rates: buildMergedRates(spot.btcUsd, fiat),
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
  ).catch(() => null);

  if (isValidRatesPayload(refreshed)) {
    return refreshed;
  }

  const shared = await cacheGetJson(SHARED_CACHE_KEY);
  if (isValidRatesPayload(shared)) {
    memoryCache = shared;
    return shared;
  }

  if (memoryCache && isValidRatesPayload(memoryCache)) {
    return memoryCache;
  }

  const disk = await readDiskCache();
  if (disk) {
    memoryCache = disk;
    return disk;
  }

  return await updateBtcRates();
}

export { ExternalApiError };
