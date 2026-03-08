import { cacheGetJson, cacheSetJson, withCacheLock } from './runtimeCache.js';

const LIST_URL = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=stablecoins&order=market_cap_desc&per_page=250&page=1';
const DETAIL_URL = (id) => `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=14&interval=daily`;
const PEG_MONITORED_SYMBOLS = new Set(['USDT', 'USDC', 'DAI', 'FDUSD', 'PYUSD', 'USDS']);
const COINGECKO_HARD_MINUTE_LIMIT = 30;
const COINGECKO_HARD_MONTHLY_LIMIT = 10_000;
const COINGECKO_SAFE_MINUTE_BUDGET = 1;

const FETCH_TIMEOUT_MS = 12_000;
const LIST_REFRESH_MS = 60_000;
const DETAIL_REFRESH_MS = 5 * 60_000;
const LIVE_PRICE_REFRESH_MS = 60_000;

const LIST_CACHE_KEY = 's08:stablecoins:list';
const LIST_LOCK_KEY = 's08:stablecoins:list:refresh';
const LIVE_CACHE_KEY = 's08:stablecoins:live-prices';
const LIVE_LOCK_KEY = 's08:stablecoins:live-prices:refresh';

const detailMemory = new Map();
let listMemory = null;
let livePriceMemory = null;

class S08StablecoinError extends Error {
  constructor(message) {
    super(message);
    this.name = 'S08StablecoinError';
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

function isFresh(payload, nowMs = Date.now()) {
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

function isCoingeckoListPayload(payload) {
  return Boolean(
    payload
      && typeof payload === 'object'
      && payload.source_provider === 'coingecko'
      && payload.is_fallback !== true
      && payload?.data
      && Array.isArray(payload.data.peggedAssets),
  );
}

function isCoingeckoLivePayload(payload) {
  return Boolean(
    payload
      && typeof payload === 'object'
      && payload.source_provider === 'coingecko'
      && payload.is_fallback !== true
      && payload.prices_by_symbol
      && typeof payload.prices_by_symbol === 'object',
  );
}

async function fetchJsonWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const provider = 'CoinGecko';

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new S08StablecoinError(`${provider} HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new S08StablecoinError(`${provider} request timeout`);
    }
    if (error instanceof S08StablecoinError) throw error;
    throw new S08StablecoinError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

function validateListPayload(data) {
  return Array.isArray(data);
}

function validateDetailPayload(data) {
  return Boolean(
    data
      && typeof data === 'object'
      && Array.isArray(data.prices)
      && Array.isArray(data.market_caps),
  );
}

function toNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeCoinGeckoStablecoins(rows) {
  const peggedAssets = [];

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;

    const symbol = String(row.symbol || '').toUpperCase();
    const name = String(row.name || '').trim();
    const geckoId = String(row.id || '').trim();
    if (!symbol || !name) continue;

    const price = toNumberOrNull(row.current_price);
    const marketCap = toNumberOrNull(row.market_cap);
    const marketCapDelta24h = toNumberOrNull(row.market_cap_change_24h);
    const marketCapPrevDay = Number.isFinite(marketCap) && Number.isFinite(marketCapDelta24h)
      ? marketCap - marketCapDelta24h
      : null;

    const detailId = geckoId || symbol.toLowerCase();

    peggedAssets.push({
      id: String(detailId),
      gecko_id: geckoId || null,
      symbol,
      name,
      image: typeof row.image === 'string' ? row.image : null,
      price,
      high_24h: toNumberOrNull(row.high_24h),
      low_24h: toNumberOrNull(row.low_24h),
      price_change_24h: toNumberOrNull(row.price_change_24h),
      market_cap: marketCap,
      fully_diluted_valuation: toNumberOrNull(row.fully_diluted_valuation),
      total_volume: toNumberOrNull(row.total_volume),
      market_cap_rank: toNumberOrNull(row.market_cap_rank),
      market_cap_change_24h: marketCapDelta24h,
      market_cap_change_percentage_24h: toNumberOrNull(row.market_cap_change_percentage_24h),
      price_change_percentage_24h: toNumberOrNull(row.price_change_percentage_24h),
      circulating_supply: toNumberOrNull(row.circulating_supply),
      total_supply: toNumberOrNull(row.total_supply),
      max_supply: toNumberOrNull(row.max_supply),
      ath: toNumberOrNull(row.ath),
      ath_change_percentage: toNumberOrNull(row.ath_change_percentage),
      ath_date: typeof row.ath_date === 'string' ? row.ath_date : null,
      atl: toNumberOrNull(row.atl),
      atl_change_percentage: toNumberOrNull(row.atl_change_percentage),
      atl_date: typeof row.atl_date === 'string' ? row.atl_date : null,
      last_updated: typeof row.last_updated === 'string' ? row.last_updated : null,
      circulating: {
        peggedUSD: Number.isFinite(marketCap) && marketCap > 0 ? marketCap : 0,
      },
      circulatingPrevDay: {
        peggedUSD: Number.isFinite(marketCapPrevDay) && marketCapPrevDay > 0 ? marketCapPrevDay : null,
      },
      source_provider: 'coingecko',
    });
  }

  return { peggedAssets };
}

function normalizeCoinGeckoDetail(data) {
  const prices = Array.isArray(data?.prices) ? data.prices : [];
  const marketCaps = Array.isArray(data?.market_caps) ? data.market_caps : [];

  const priceByTimestamp = new Map();
  for (const row of prices) {
    const ts = Number(row?.[0]);
    const price = Number(row?.[1]);
    if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0) continue;
    priceByTimestamp.set(ts, price);
  }

  const tokens = marketCaps
    .map((row) => {
      const ts = Number(row?.[0]);
      const marketCap = Number(row?.[1]);
      if (!Number.isFinite(ts) || !Number.isFinite(marketCap) || marketCap <= 0) return null;

      const price = Number(priceByTimestamp.get(ts));
      const derivedSupply = Number.isFinite(price) && price > 0 ? marketCap / price : null;
      const peggedUSD = Number.isFinite(derivedSupply) && derivedSupply > 0 ? derivedSupply : marketCap;

      return {
        date: Math.floor(ts / 1000),
        circulating: {
          peggedUSD,
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);

  if (tokens.length === 0) {
    throw new S08StablecoinError('Invalid CoinGecko detail payload');
  }

  return {
    tokens,
  };
}

function buildListPayload(
  data,
  {
    sourceProvider = 'coingecko',
    sourceUrl = LIST_URL,
  } = {},
) {
  const now = Date.now();
  return {
    updated_at: normalizeTimestamp(new Date(now)),
    next_update_at: normalizeTimestamp(new Date(now + LIST_REFRESH_MS)),
    source_provider: sourceProvider,
    source_url: sourceUrl,
    is_fallback: false,
    fallback_note: null,
    data,
    refresh_policy: {
      min_interval_ms: LIST_REFRESH_MS,
      hard_minute_limit: COINGECKO_HARD_MINUTE_LIMIT,
      hard_daily_limit: null,
      hard_monthly_limit: COINGECKO_HARD_MONTHLY_LIMIT,
      safe_minute_budget: COINGECKO_SAFE_MINUTE_BUDGET,
      safe_daily_budget: null,
      safe_monthly_budget: Math.floor(COINGECKO_HARD_MONTHLY_LIMIT * 0.8),
    },
  };
}

function buildDetailPayload(id, data) {
  const now = Date.now();
  return {
    id: String(id),
    updated_at: normalizeTimestamp(new Date(now)),
    next_update_at: normalizeTimestamp(new Date(now + DETAIL_REFRESH_MS)),
    source_provider: 'coingecko',
    source_url: DETAIL_URL(id),
    is_fallback: false,
    fallback_note: null,
    data,
  };
}

function buildLivePricePayload(listPayload) {
  const now = Date.now();
  const assets = Array.isArray(listPayload?.data?.peggedAssets)
    ? listPayload.data.peggedAssets
    : [];
  const pricesBySymbol = {};
  const bestMcapBySymbol = {};
  const sourceTimestamps = {};
  const confidenceBySymbol = {};

  for (const row of assets) {
    const symbol = String(row?.symbol || '').toUpperCase();
    if (!PEG_MONITORED_SYMBOLS.has(symbol)) continue;
    const price = Number(row?.price);
    if (!symbol || !Number.isFinite(price) || price <= 0) continue;

    const currentMcap = Number(row?.circulating?.peggedUSD ?? row?.market_cap ?? 0);
    const bestKnown = Number(bestMcapBySymbol[symbol] ?? -1);
    if (!(symbol in pricesBySymbol) || currentMcap > bestKnown) {
      pricesBySymbol[symbol] = price;
      bestMcapBySymbol[symbol] = Number.isFinite(currentMcap) ? currentMcap : -1;
      sourceTimestamps[symbol] = listPayload?.updated_at || normalizeTimestamp(new Date(now));
      confidenceBySymbol[symbol] = 1;
    }
  }

  if (Object.keys(pricesBySymbol).length === 0) {
    throw new S08StablecoinError('Invalid live stablecoin price payload');
  }

  return {
    updated_at: listPayload?.updated_at || normalizeTimestamp(new Date(now)),
    next_update_at: normalizeTimestamp(new Date(now + LIVE_PRICE_REFRESH_MS)),
    source_provider: 'coingecko',
    source_url: LIST_URL,
    is_fallback: false,
    fallback_note: null,
    prices_by_symbol: pricesBySymbol,
    source_timestamps: sourceTimestamps,
    confidence_by_symbol: confidenceBySymbol,
    refresh_policy: {
      min_interval_ms: LIST_REFRESH_MS,
      hard_minute_limit: COINGECKO_HARD_MINUTE_LIMIT,
      hard_daily_limit: null,
      hard_monthly_limit: COINGECKO_HARD_MONTHLY_LIMIT,
      safe_minute_budget: COINGECKO_SAFE_MINUTE_BUDGET,
      safe_daily_budget: null,
      safe_monthly_budget: Math.floor(COINGECKO_HARD_MONTHLY_LIMIT * 0.8),
      derived_from: '/api/s08/stablecoins',
      upstream_source_provider: 'coingecko',
    },
  };
}

async function refreshList() {
  const data = await fetchJsonWithTimeout(LIST_URL);
  if (!validateListPayload(data)) {
    throw new S08StablecoinError('Invalid CoinGecko stablecoins payload');
  }
  const normalizedData = normalizeCoinGeckoStablecoins(data);

  const payload = buildListPayload(normalizedData, {
    sourceProvider: 'coingecko',
    sourceUrl: LIST_URL,
  });
  listMemory = payload;
  await cacheSetJson(LIST_CACHE_KEY, payload, { ttlSeconds: 120 });
  return payload;
}

async function refreshLivePrices() {
  const listPayload = await getS08StablecoinList();
  const payload = buildLivePricePayload(listPayload);
  livePriceMemory = payload;
  await cacheSetJson(LIVE_CACHE_KEY, payload, { ttlSeconds: 120 });
  return payload;
}

export async function getS08StablecoinList() {
  if (isFresh(listMemory) && isCoingeckoListPayload(listMemory)) return listMemory;

  if (!listMemory) {
    const shared = await cacheGetJson(LIST_CACHE_KEY);
    if (shared && typeof shared === 'object') {
      listMemory = shared;
    }
  }

  if (isFresh(listMemory) && isCoingeckoListPayload(listMemory)) return listMemory;

  const refreshed = await withCacheLock(
    LIST_LOCK_KEY,
    async () => refreshList(),
    { ttlSeconds: 20, waitMs: 3000, pollMs: 120 },
  ).catch(() => null);

  if (isCoingeckoListPayload(refreshed)) {
    listMemory = refreshed;
    return refreshed;
  }

  const shared = await cacheGetJson(LIST_CACHE_KEY);
  if (isCoingeckoListPayload(shared)) {
    listMemory = shared;
    if (isFresh(shared)) return shared;
    return stalePayload(shared, 'Serving stale stablecoin list while shared refresh completes');
  }

  if (isCoingeckoListPayload(listMemory)) {
    return stalePayload(listMemory, 'Serving in-memory stale stablecoin list while shared refresh completes');
  }

  return await refreshList();
}

export async function getS08StablecoinLivePrices() {
  if (isFresh(livePriceMemory) && isCoingeckoLivePayload(livePriceMemory)) return livePriceMemory;

  if (!livePriceMemory) {
    const shared = await cacheGetJson(LIVE_CACHE_KEY);
    if (shared && typeof shared === 'object') {
      livePriceMemory = shared;
    }
  }

  if (isFresh(livePriceMemory) && isCoingeckoLivePayload(livePriceMemory)) return livePriceMemory;

  const refreshed = await withCacheLock(
    LIVE_LOCK_KEY,
    async () => refreshLivePrices(),
    { ttlSeconds: 10, waitMs: 2500, pollMs: 120 },
  ).catch(() => null);

  if (isCoingeckoLivePayload(refreshed)) {
    livePriceMemory = refreshed;
    return refreshed;
  }

  const shared = await cacheGetJson(LIVE_CACHE_KEY);
  if (isCoingeckoLivePayload(shared)) {
    livePriceMemory = shared;
    if (isFresh(shared)) return shared;
    return stalePayload(shared, 'Serving stale stablecoin prices while shared refresh completes');
  }

  if (isCoingeckoLivePayload(livePriceMemory)) {
    return stalePayload(livePriceMemory, 'Serving in-memory stale stablecoin prices while shared refresh completes');
  }

  return await refreshLivePrices();
}

async function refreshDetail(id) {
  const data = await fetchJsonWithTimeout(DETAIL_URL(id));
  if (!validateDetailPayload(data)) {
    throw new S08StablecoinError('Invalid CoinGecko detail payload');
  }
  const payload = buildDetailPayload(id, normalizeCoinGeckoDetail(data));
  detailMemory.set(String(id), payload);
  await cacheSetJson(`s08:stablecoin:detail:${id}`, payload, { ttlSeconds: 600 });
  return payload;
}

export async function getS08StablecoinDetail(id) {
  const stableId = String(id || '').trim();
  if (!stableId) {
    throw new S08StablecoinError('Missing stablecoin id');
  }

  const fromMemory = detailMemory.get(stableId);
  if (isFresh(fromMemory)) return fromMemory;

  if (!fromMemory) {
    const shared = await cacheGetJson(`s08:stablecoin:detail:${stableId}`);
    if (shared && typeof shared === 'object') {
      detailMemory.set(stableId, shared);
    }
  }

  const cached = detailMemory.get(stableId);
  if (isFresh(cached)) return cached;

  const refreshed = await withCacheLock(
    `s08:stablecoin:detail:${stableId}:refresh`,
    async () => refreshDetail(stableId),
    { ttlSeconds: 20, waitMs: 3000, pollMs: 120 },
  ).catch(() => null);

  if (refreshed && typeof refreshed === 'object' && refreshed.data) {
    detailMemory.set(stableId, refreshed);
    return refreshed;
  }

  const shared = await cacheGetJson(`s08:stablecoin:detail:${stableId}`);
  if (shared && typeof shared === 'object' && shared.data) {
    detailMemory.set(stableId, shared);
    if (isFresh(shared)) return shared;
    return stalePayload(shared, 'Serving stale stablecoin detail while shared refresh completes');
  }

  if (cached && cached.data) {
    return stalePayload(cached, 'Serving in-memory stale stablecoin detail while shared refresh completes');
  }

  return await refreshDetail(stableId);
}

export { S08StablecoinError };
