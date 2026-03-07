import { cacheGetJson, cacheSetJson, withCacheLock } from './runtimeCache.js';
import { getBtcRates } from '../btcRates.js';

const FETCH_TIMEOUT_MS = 12_000;
const DAY_MS = 86_400_000;
const BINANCE_KLINES_BASE_URLS = [
  'https://api.binance.com/api/v3/klines',
  'https://api.binance.us/api/v3/klines',
];

const memCache = new Map();

const FEED_DEFS = {
  mempoolOverview: {
    cacheKey: 'public:mempool:overview',
    lockKey: 'public:mempool:overview:refresh',
    refreshMs: 30_000,
    sourceProvider: 'mempool.space + alternative.me',
    sourceUrl: 'https://mempool.space + https://api.alternative.me/fng/',
    safeMinuteBudget: 2,
    safeDailyBudget: 2880,
  },
  mempoolLive: {
    cacheKey: 'public:mempool:live',
    lockKey: 'public:mempool:live:refresh',
    refreshMs: 10_000,
    sourceProvider: 'mempool.space',
    sourceUrl: 'https://mempool.space/api/v1/blocks',
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  fearGreed7: {
    cacheKey: 'public:alternative:fng:7',
    lockKey: 'public:alternative:fng:7:refresh',
    refreshMs: 60_000,
    sourceProvider: 'alternative.me',
    sourceUrl: 'https://api.alternative.me/fng/?limit=7',
    safeMinuteBudget: 1,
    safeDailyBudget: 1440,
  },
  fearGreed31: {
    cacheKey: 'public:alternative:fng:31',
    lockKey: 'public:alternative:fng:31:refresh',
    refreshMs: 60_000,
    sourceProvider: 'alternative.me',
    sourceUrl: 'https://api.alternative.me/fng/?limit=31',
    safeMinuteBudget: 1,
    safeDailyBudget: 1440,
  },
  geoCountries: {
    cacheKey: 'public:geo:countries',
    lockKey: 'public:geo:countries:refresh',
    refreshMs: 24 * 60 * 60_000,
    sourceProvider: 'natural-earth-vector',
    sourceUrl: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
    safeMinuteBudget: 1,
    safeDailyBudget: 24,
  },
  geoLand: {
    cacheKey: 'public:geo:land',
    lockKey: 'public:geo:land:refresh',
    refreshMs: 24 * 60 * 60_000,
    sourceProvider: 'naturalearth',
    sourceUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson',
    safeMinuteBudget: 1,
    safeDailyBudget: 24,
  },
  lightningWorld: {
    cacheKey: 'public:lightning:world',
    lockKey: 'public:lightning:world:refresh',
    refreshMs: 60_000,
    sourceProvider: 'mempool.space',
    sourceUrl: 'https://mempool.space/api/v1/lightning/nodes/world',
    safeMinuteBudget: 1,
    safeDailyBudget: 1440,
  },
  coingeckoBtcMarketChart365: {
    cacheKey: 'public:coingecko:btc-market-chart:365',
    lockKey: 'public:coingecko:btc-market-chart:365:refresh',
    refreshMs: 60 * 60_000,
    sourceProvider: 'coingecko',
    sourceUrl: 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily',
    hardMinuteLimit: 30,
    safeMinuteBudget: 1,
    safeDailyBudget: 120,
  },
  binanceHistory7: {
    cacheKey: 'public:binance:btc-history:7',
    lockKey: 'public:binance:btc-history:7:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=7 | https://api.binance.us/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=7',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory30: {
    cacheKey: 'public:binance:btc-history:30',
    lockKey: 'public:binance:btc-history:30:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=30 | https://api.binance.us/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=30',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory90: {
    cacheKey: 'public:binance:btc-history:90',
    lockKey: 'public:binance:btc-history:90:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=90 | https://api.binance.us/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=90',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory365: {
    cacheKey: 'public:binance:btc-history:365',
    lockKey: 'public:binance:btc-history:365:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=365 | https://api.binance.us/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=365',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  s21BigMacUsd: {
    cacheKey: 'public:s21:big-mac-usd',
    lockKey: 'public:s21:big-mac-usd:refresh',
    refreshMs: 24 * 60 * 60_000,
    sourceProvider: 'the-economist',
    sourceUrl: 'https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/output-data/big-mac-adjusted-index.csv',
    safeMinuteBudget: 1,
    safeDailyBudget: 24,
  },
  s21History: {
    cacheKey: 'public:s21:history',
    lockKey: 'public:s21:history:refresh',
    refreshMs: 12 * 60 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines | https://api.binance.us/api/v3/klines',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 1,
    safeDailyBudget: 120,
  },
  s21Combined: {
    cacheKey: 'public:s21:combined',
    lockKey: 'public:s21:combined:refresh',
    refreshMs: 60_000,
    sourceProvider: 'satoshi-dashboard-internal',
    sourceUrl: '/api/btc/rates + cached providers',
    safeMinuteBudget: 1,
    safeDailyBudget: 1440,
  },
};

const HISTORY_PERIODS = [
  { key: '1y', unit: 'years', value: 1 },
  { key: '30d', unit: 'days', value: 30 },
  { key: '7d', unit: 'days', value: 7 },
  { key: '10y', unit: 'years', value: 10 },
  { key: '5y', unit: 'years', value: 5 },
  { key: '3y', unit: 'years', value: 3 },
];

export class PublicFeedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PublicFeedError';
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

function isFreshPayload(payload, nowMs = Date.now()) {
  const next = parseIsoDate(payload?.next_update_at);
  if (!next) return false;
  return nowMs < next.getTime();
}

function stalePayload(payload, reason) {
  if (!payload || typeof payload !== 'object') return null;
  const updated = parseIsoDate(payload.updated_at);
  return {
    ...payload,
    is_fallback: true,
    fallback_note: reason,
    stale_age_ms: updated ? Math.max(0, Date.now() - updated.getTime()) : null,
  };
}

function buildPayload(feedDef, data) {
  const nowMs = Date.now();
  return {
    updated_at: normalizeTimestamp(new Date(nowMs)),
    next_update_at: normalizeTimestamp(new Date(nowMs + feedDef.refreshMs)),
    source_provider: feedDef.sourceProvider,
    source_url: feedDef.sourceUrl,
    is_fallback: false,
    fallback_note: null,
    refresh_policy: {
      min_interval_ms: feedDef.refreshMs,
      hard_minute_limit: feedDef.hardMinuteLimit || null,
      hard_daily_limit: feedDef.hardDailyLimit || null,
      safe_minute_budget: feedDef.safeMinuteBudget || null,
      safe_daily_budget: feedDef.safeDailyBudget || null,
    },
    data,
  };
}

function getFeedTtlSeconds(feedDef) {
  const ttlMs = Math.max(60_000, feedDef.refreshMs + 120_000);
  return Math.max(60, Math.floor(ttlMs / 1000));
}

async function fetchJsonWithTimeout(url, {
  timeoutMs = FETCH_TIMEOUT_MS,
  headers,
} = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new PublicFeedError(`Upstream HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new PublicFeedError('Upstream request timeout');
    }
    if (error instanceof PublicFeedError) throw error;
    throw new PublicFeedError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchTextWithTimeout(url, {
  timeoutMs = FETCH_TIMEOUT_MS,
  headers,
} = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/plain, text/csv, text/html;q=0.9, */*;q=0.5',
        ...headers,
      },
    });

    if (!response.ok) {
      throw new PublicFeedError(`Upstream HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new PublicFeedError('Upstream request timeout');
    }
    if (error instanceof PublicFeedError) throw error;
    throw new PublicFeedError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

function toChartPoint(ts, price) {
  return {
    ts,
    price,
    date: new Date(ts)
      .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
      .replace('/', '.'),
  };
}

function validateArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function validateObject(value) {
  return Boolean(value && typeof value === 'object');
}

function getDef(feedKey) {
  const feed = FEED_DEFS[feedKey];
  if (!feed) throw new PublicFeedError(`Unknown feed: ${feedKey}`);
  return feed;
}

async function refreshFeed(feedKey, fetchData) {
  const feedDef = getDef(feedKey);
  const data = await fetchData();
  const payload = buildPayload(feedDef, data);
  memCache.set(feedDef.cacheKey, payload);
  await cacheSetJson(feedDef.cacheKey, payload, { ttlSeconds: getFeedTtlSeconds(feedDef) });
  return payload;
}

async function getFeed(feedKey, fetchData, validateData = validateObject) {
  const feedDef = getDef(feedKey);
  const fromMemory = memCache.get(feedDef.cacheKey);
  if (validateData(fromMemory?.data) && isFreshPayload(fromMemory)) {
    return fromMemory;
  }

  const shared = await cacheGetJson(feedDef.cacheKey);
  if (validateData(shared?.data)) {
    memCache.set(feedDef.cacheKey, shared);
    if (isFreshPayload(shared)) {
      return shared;
    }
  }

  const refreshed = await withCacheLock(
    feedDef.lockKey,
    async () => refreshFeed(feedKey, fetchData),
    { ttlSeconds: 20, waitMs: 3200, pollMs: 120 },
  ).catch(() => null);

  if (validateData(refreshed?.data)) {
    return refreshed;
  }

  try {
    return await refreshFeed(feedKey, fetchData);
  } catch (error) {
    const staleSource = validateData(shared?.data)
      ? shared
      : (validateData(fromMemory?.data) ? fromMemory : null);

    if (staleSource) {
      return stalePayload(
        staleSource,
        `Serving stale payload while upstream refresh recovers (${error instanceof Error ? error.message : 'unknown error'})`,
      );
    }

    if (error instanceof PublicFeedError) throw error;
    throw new PublicFeedError(error instanceof Error ? error.message : String(error));
  }
}

function getUtcDayStartMs(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getPeriodStartMs(period) {
  const date = new Date();
  if (period.unit === 'days') date.setUTCDate(date.getUTCDate() - period.value);
  else date.setUTCFullYear(date.getUTCFullYear() - period.value);
  return getUtcDayStartMs(date);
}

async function fetchBinanceCloseAtFromBase(base, startTimeMs) {
  const exactParams = new URLSearchParams({
    symbol: 'BTCUSDT',
    interval: '1d',
    startTime: String(startTimeMs),
    endTime: String(startTimeMs + DAY_MS),
    limit: '1',
  });

  const exact = await fetchJsonWithTimeout(`${base}?${exactParams.toString()}`);
  const exactClose = Number(exact?.[0]?.[4]);
  if (Number.isFinite(exactClose) && exactClose > 0) {
    return exactClose;
  }

  const fallbackParams = new URLSearchParams({
    symbol: 'BTCUSDT',
    interval: '1d',
    startTime: String(startTimeMs),
    limit: '1',
  });
  const fallback = await fetchJsonWithTimeout(`${base}?${fallbackParams.toString()}`);
  const close = Number(fallback?.[0]?.[4]);
  if (!Number.isFinite(close) || close <= 0) {
    throw new PublicFeedError('Invalid Binance close value');
  }
  return close;
}

async function fetchBinanceCloseAt(startTimeMs) {
  let lastError = null;

  for (const base of BINANCE_KLINES_BASE_URLS) {
    try {
      return await fetchBinanceCloseAtFromBase(base, startTimeMs);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof PublicFeedError) {
    throw lastError;
  }

  throw new PublicFeedError('Binance klines unavailable');
}

function parseCsvLine(line) {
  const out = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  out.push(current);
  return out;
}

function parseBigMacUsd(csvText) {
  const lines = String(csvText || '').split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new PublicFeedError('Big Mac CSV is empty');
  }

  const header = parseCsvLine(lines[0]);
  const isoIndex = header.indexOf('iso_a3');
  const dateIndex = header.indexOf('date');
  const priceIndex = header.indexOf('dollar_price');
  if (isoIndex < 0 || dateIndex < 0 || priceIndex < 0) {
    throw new PublicFeedError('Big Mac CSV columns missing');
  }

  let latest = null;
  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i]);
    if (row[isoIndex] !== 'USA') continue;

    const price = Number(row[priceIndex]);
    const date = new Date(row[dateIndex]);
    if (!Number.isFinite(price) || price <= 0) continue;
    if (!Number.isFinite(date.getTime())) continue;

    if (!latest || date > latest.date) {
      latest = {
        price,
        date,
      };
    }
  }

  if (!latest) {
    throw new PublicFeedError('Big Mac USA row missing');
  }

  return {
    usd: latest.price,
    as_of: latest.date.toISOString().slice(0, 10),
  };
}

export async function getMempoolOverviewPayload() {
  return getFeed(
    'mempoolOverview',
    async () => {
      const [difficulty, fees, hashrate, mempool, fearGreed, heightText] = await Promise.all([
        fetchJsonWithTimeout('https://mempool.space/api/v1/difficulty-adjustment'),
        fetchJsonWithTimeout('https://mempool.space/api/v1/fees/recommended'),
        fetchJsonWithTimeout('https://mempool.space/api/v1/mining/hashrate/3d'),
        fetchJsonWithTimeout('https://mempool.space/api/mempool'),
        fetchJsonWithTimeout('https://api.alternative.me/fng/?limit=7'),
        fetchTextWithTimeout('https://mempool.space/api/blocks/tip/height', {
          headers: { Accept: 'text/plain' },
        }),
      ]);

      return {
        difficulty,
        fees,
        hashrate,
        mempool,
        block_height: Number(heightText),
        fear_greed: fearGreed,
      };
    },
    validateObject,
  );
}

export async function getMempoolLivePayload() {
  return getFeed(
    'mempoolLive',
    async () => {
      const [blocks, mempoolBlocks, fees] = await Promise.all([
        fetchJsonWithTimeout('https://mempool.space/api/v1/blocks'),
        fetchJsonWithTimeout('https://mempool.space/api/v1/fees/mempool-blocks'),
        fetchJsonWithTimeout('https://mempool.space/api/v1/fees/recommended'),
      ]);

      return {
        blocks: Array.isArray(blocks) ? blocks.slice(0, 8) : [],
        mempool_blocks: Array.isArray(mempoolBlocks) ? mempoolBlocks.slice(0, 8) : [],
        fees,
      };
    },
    validateObject,
  );
}

export async function getFearGreedPayload({ limit = 31 } = {}) {
  const normalized = Number(limit) <= 7 ? 7 : 31;
  const key = normalized === 7 ? 'fearGreed7' : 'fearGreed31';
  const url = normalized === 7
    ? 'https://api.alternative.me/fng/?limit=7'
    : 'https://api.alternative.me/fng/?limit=31';

  return getFeed(
    key,
    async () => fetchJsonWithTimeout(url),
    validateObject,
  );
}

export async function getCountriesGeoPayload() {
  return getFeed(
    'geoCountries',
    async () => fetchJsonWithTimeout('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'),
    validateObject,
  );
}

export async function getLandGeoPayload() {
  return getFeed(
    'geoLand',
    async () => fetchJsonWithTimeout('https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson'),
    validateObject,
  );
}

export async function getLightningWorldPayload() {
  return getFeed(
    'lightningWorld',
    async () => fetchJsonWithTimeout('https://mempool.space/api/v1/lightning/nodes/world'),
    validateObject,
  );
}

export async function getCoingeckoBitcoinMarketChartPayload({ days = 365 } = {}) {
  const normalizedDays = Number(days);
  if (normalizedDays !== 365) {
    throw new PublicFeedError('Unsupported days value for market chart');
  }

  return getFeed(
    'coingeckoBtcMarketChart365',
    async () => fetchJsonWithTimeout('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily'),
    validateObject,
  );
}

function historyFeedKey(days) {
  if (days === 7) return 'binanceHistory7';
  if (days === 30) return 'binanceHistory30';
  if (days === 90) return 'binanceHistory90';
  return 'binanceHistory365';
}

export async function getBinanceBtcHistoryPayload({ days = 365 } = {}) {
  const normalizedDays = [7, 30, 90, 365].includes(Number(days)) ? Number(days) : 365;
  const key = historyFeedKey(normalizedDays);

  return getFeed(
    key,
    async () => {
      let lastError = null;

      for (const base of BINANCE_KLINES_BASE_URLS) {
        const params = new URLSearchParams({
          symbol: 'BTCUSDT',
          interval: '1d',
          limit: String(normalizedDays),
        });

        try {
          const payload = await fetchJsonWithTimeout(`${base}?${params.toString()}`);
          const points = Array.isArray(payload)
            ? payload
              .map((row) => {
                const ts = Number(row?.[0]);
                const price = Number(row?.[4]);
                if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0) return null;
                return toChartPoint(ts, price);
              })
              .filter(Boolean)
            : [];

          if (points.length > 0) {
            return points;
          }

          lastError = new PublicFeedError('Invalid Binance history payload');
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError instanceof PublicFeedError) {
        throw lastError;
      }

      throw new PublicFeedError('Binance history unavailable');
    },
    validateArray,
  );
}

async function getS21BigMacUsdPayload() {
  return getFeed(
    's21BigMacUsd',
    async () => {
      const csv = await fetchTextWithTimeout(
        'https://raw.githubusercontent.com/TheEconomist/big-mac-data/master/output-data/big-mac-adjusted-index.csv',
      );
      return parseBigMacUsd(csv);
    },
    validateObject,
  );
}

async function getS21HistoryPayload() {
  return getFeed(
    's21History',
    async () => {
      const entries = await Promise.all(
        HISTORY_PERIODS.map(async (period) => {
          const start = getPeriodStartMs(period);
          const close = await fetchBinanceCloseAt(start);
          return [period.key, close];
        }),
      );
      return Object.fromEntries(entries);
    },
    validateObject,
  );
}

export async function getS21BigMacSatsPayload() {
  return getFeed(
    's21Combined',
    async () => {
      const [rates, bigMacPayload, historyPayload] = await Promise.all([
        getBtcRates(),
        getS21BigMacUsdPayload(),
        getS21HistoryPayload(),
      ]);

      return {
        spot_btc_usd: Number(rates?.btc_usd) || null,
        spot_change_24h_pct: Number(rates?.btc_change_24h_pct) || null,
        big_mac_usd: Number(bigMacPayload?.data?.usd) || null,
        big_mac_as_of: String(bigMacPayload?.data?.as_of || ''),
        history_btc: historyPayload?.data || {},
        source_spot: String(rates?.source_btc || 'Binance BTCUSDT'),
      };
    },
    validateObject,
  );
}
