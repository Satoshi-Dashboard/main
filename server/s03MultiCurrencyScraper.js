import { cacheGetJson, cacheSetJson, withCacheLock } from './runtimeCache.js';
import { getBtcRates } from '../btcRates.js';

const SOURCE_URL = 'https://www.investing.com/currencies/single-currency-crosses?currency=usd';

const FETCH_TIMEOUT_MS = 12_000;
const REFRESH_INTERVAL_MS = 30_000;

const SHARED_CACHE_KEY = 's03:multi-currency:investing';
const SHARED_LOCK_KEY = 's03:multi-currency:investing:refresh';

let memoryCache = null;

class S03ScrapeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'S03ScrapeError';
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

function isValidPayload(payload) {
  return (
    payload
    && typeof payload === 'object'
    && typeof payload.updated_at === 'string'
    && typeof payload.next_update_at === 'string'
    && payload.rates
    && typeof payload.rates === 'object'
    && Number.isFinite(Number(payload.btc_usd))
  );
}

function isPayloadFresh(payload, nowMs = Date.now()) {
  if (!isValidPayload(payload)) return false;
  const next = parseIsoDate(payload.next_update_at);
  if (!next) return false;
  return nowMs < next.getTime();
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

function invertPairChangePct(pairPct) {
  if (!Number.isFinite(pairPct)) return null;
  const factor = 1 + (pairPct / 100);
  if (factor <= 0) return null;
  return ((1 / factor) - 1) * 100;
}

function parseUsdPairsFromHtml(html) {
  const rows = {};
  const rowRegex = /<tr[^>]*class="[^"]*dynamic-table-v2_row__[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  let match = rowRegex.exec(html);

  while (match) {
    const rowHtml = match[1] || '';
    const hrefMatch = rowHtml.match(/<a[^>]*href="(?:https:\/\/www\.investing\.com)?\/currencies\/([a-z0-9-]+)"/i);
    const titleMatch = rowHtml.match(/<a[^>]*title="([^"]+)"/i);
    if (!hrefMatch || !titleMatch) {
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

    const anchorEnd = Math.max(
      rowHtml.indexOf(hrefMatch[0]) + hrefMatch[0].length,
      rowHtml.indexOf(titleMatch[0]) + titleMatch[0].length,
    );
    const afterAnchor = rowHtml.slice(Math.max(0, anchorEnd));
    const priceMatch = afterAnchor.match(/dynamic-table-v2_col-other[^>]*>\s*(?:<span[^>]*>)?\s*([+-]?\d[\d,.]*)\s*(?:<\/span>)?\s*<\/td>/i);

    const chgPctMatch = rowHtml.match(/--cell-positions:chg-pct[^>]*>\s*([+-]?\d[\d,.]*)%\s*</i);
    const pairPrice = parseNumber(priceMatch?.[1]);
    const pairChange24hPct = parseNumber(chgPctMatch?.[1]);

    if (Number.isFinite(pairPrice) && pairPrice > 0) {
      const usdQuote = base === 'USD' ? pairPrice : (1 / pairPrice);
      const usdQuoteChange24hPct = base === 'USD'
        ? pairChange24hPct
        : invertPairChangePct(pairChange24hPct);

      const priority = base === 'USD' ? 2 : 1;
      const current = rows[code];
      if (!current || priority >= Number(current._priority || 0)) {
        rows[code] = {
          usd_quote: usdQuote,
          usd_quote_change_24h_pct: Number.isFinite(usdQuoteChange24hPct)
            ? usdQuoteChange24hPct
            : null,
          _priority: priority,
        };
      }
    }

    match = rowRegex.exec(html);
  }

  Object.values(rows).forEach((row) => {
    if (row && typeof row === 'object') delete row._priority;
  });

  return rows;
}

function sortObjectByKey(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort((a, b) => a[0].localeCompare(b[0])),
  );
}

function combineChangePct(aPct, bPct) {
  if (!Number.isFinite(aPct) || !Number.isFinite(bPct)) return null;
  const aFactor = 1 + (aPct / 100);
  const bFactor = 1 + (bPct / 100);
  if (aFactor <= 0 || bFactor <= 0) return null;
  return ((aFactor * bFactor) - 1) * 100;
}

async function fetchSourceHtml() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(SOURCE_URL, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html',
        'User-Agent': 'satoshi-dashboard/1.0 (+module-s03-scraper)',
      },
    });

    if (!response.ok) {
      throw new S03ScrapeError(`Investing single-currency-crosses HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new S03ScrapeError('Investing single-currency-crosses request timeout');
    }
    if (error instanceof S03ScrapeError) throw error;
    throw new S03ScrapeError(error instanceof Error ? error.message : String(error));
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBtcAnchor() {
  const payload = await getBtcRates();
  const btcUsd = parseNumber(payload?.btc_usd);
  const change24h = parseNumber(payload?.btc_change_24h_pct);

  if (!Number.isFinite(btcUsd) || btcUsd <= 0) {
    throw new S03ScrapeError('Invalid BTCUSD anchor from /api/btc/rates');
  }

  return {
    btcUsd,
    change24hPct: Number.isFinite(change24h) ? change24h : null,
    sourceLabel: String(payload?.source_btc || 'Binance BTCUSDT'),
    sourceUrl: String(payload?.source_btc_url || 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
    updatedAt: String(payload?.updated_at || normalizeTimestamp()),
  };
}

function buildRatesFromUsdQuotes(usdQuotes, btcUsd) {
  const rates = {
    USD: Number(btcUsd.toFixed(2)),
  };

  Object.entries(usdQuotes || {}).forEach(([code, quote]) => {
    if (code === 'USD') return;
    const usdQuote = Number(quote);
    if (!Number.isFinite(usdQuote) || usdQuote <= 0) return;
    rates[code] = Number((btcUsd * usdQuote).toFixed(2));
  });

  return sortObjectByKey(rates);
}

function buildChangesFromFx(btcChange24hPct, fxChangesByCode) {
  const changes = {
    USD: Number.isFinite(btcChange24hPct) ? Number(btcChange24hPct.toFixed(3)) : null,
  };

  Object.entries(fxChangesByCode || {}).forEach(([code, fxChange]) => {
    if (code === 'USD') return;
    const combinedChange = combineChangePct(btcChange24hPct, Number(fxChange));
    changes[code] = Number.isFinite(combinedChange) ? Number(combinedChange.toFixed(3)) : null;
  });

  return sortObjectByKey(changes);
}

function deriveUsdQuotesFromRates(payload) {
  const btcUsd = Number(payload?.btc_usd);
  if (!Number.isFinite(btcUsd) || btcUsd <= 0) return {};
  const quotes = {};

  Object.entries(payload?.rates || {}).forEach(([code, rate]) => {
    const parsedRate = Number(rate);
    if (!/^[A-Z]{3}$/.test(code)) return;
    if (code === 'USD') {
      quotes.USD = 1;
      return;
    }
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) return;
    quotes[code] = parsedRate / btcUsd;
  });

  if (!Number.isFinite(quotes.USD)) quotes.USD = 1;
  return quotes;
}

function reanchorPayload(basePayload, btcAnchor) {
  const usdQuotes = basePayload?.fx_usd_quotes && typeof basePayload.fx_usd_quotes === 'object'
    ? basePayload.fx_usd_quotes
    : deriveUsdQuotesFromRates(basePayload);

  const fxChanges = basePayload?.fx_changes_24h_pct && typeof basePayload.fx_changes_24h_pct === 'object'
    ? basePayload.fx_changes_24h_pct
    : {};

  const btcUsd = Number(btcAnchor?.btcUsd);
  const btcChange24hPct = Number(btcAnchor?.change24hPct);

  if (!Number.isFinite(btcUsd) || btcUsd <= 0) return basePayload;

  return {
    ...basePayload,
    source_provider: 'USD from /api/btc/rates + FX factors from Investing USD crosses',
    source_url: SOURCE_URL,
    source_btc: String(btcAnchor?.sourceLabel || basePayload?.source_btc || 'Binance BTCUSDT'),
    source_btc_url: String(btcAnchor?.sourceUrl || basePayload?.source_btc_url || 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
    btc_anchor_updated_at: String(btcAnchor?.updatedAt || basePayload?.btc_anchor_updated_at || basePayload?.updated_at),
    btc_usd: Number(btcUsd.toFixed(2)),
    btc_change_24h_pct: Number.isFinite(btcChange24hPct)
      ? Number(btcChange24hPct.toFixed(3))
      : null,
    rates: buildRatesFromUsdQuotes(usdQuotes, btcUsd),
    changes_24h_pct: buildChangesFromFx(btcChange24hPct, fxChanges),
    fx_usd_quotes: sortObjectByKey({ ...usdQuotes, USD: 1 }),
    fx_changes_24h_pct: sortObjectByKey(fxChanges),
  };
}

function buildPayload(usdPairs, btcAnchor) {
  const btcUsd = Number(btcAnchor?.btcUsd);
  const btcChange24hPct = Number(btcAnchor?.change24hPct);

  if (!Number.isFinite(btcUsd) || btcUsd <= 0) {
    throw new S03ScrapeError('BTCUSD anchor missing');
  }

  const fxUsdQuotes = { USD: 1 };
  const fxChanges = {};

  Object.entries(usdPairs).forEach(([code, row]) => {
    const usdQuote = Number(row?.usd_quote);
    if (!Number.isFinite(usdQuote) || usdQuote <= 0) return;

    fxUsdQuotes[code] = usdQuote;
    const fxChange = Number(row?.usd_quote_change_24h_pct);
    fxChanges[code] = Number.isFinite(fxChange) ? fxChange : null;
  });

  const rates = buildRatesFromUsdQuotes(fxUsdQuotes, btcUsd);
  const changes = buildChangesFromFx(btcChange24hPct, fxChanges);

  const now = Date.now();
  return {
    updated_at: normalizeTimestamp(new Date(now)),
    next_update_at: normalizeTimestamp(new Date(now + REFRESH_INTERVAL_MS)),
    source_provider: 'USD from /api/btc/rates + FX factors from Investing USD crosses',
    source_url: SOURCE_URL,
    source_btc: String(btcAnchor?.sourceLabel || 'Binance BTCUSDT'),
    source_btc_url: String(btcAnchor?.sourceUrl || 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
    btc_anchor_updated_at: String(btcAnchor?.updatedAt || normalizeTimestamp(new Date(now))),
    btc_usd: Number(btcUsd.toFixed(2)),
    btc_change_24h_pct: Number.isFinite(btcChange24hPct) ? Number(btcChange24hPct.toFixed(3)) : null,
    rates,
    changes_24h_pct: changes,
    fx_usd_quotes: sortObjectByKey(fxUsdQuotes),
    fx_changes_24h_pct: sortObjectByKey(fxChanges),
    upstream_pairs: Object.keys(usdPairs).length,
    refresh_policy: {
      min_interval_ms: REFRESH_INTERVAL_MS,
      hard_minute_limit: null,
      hard_daily_limit: null,
      safe_minute_budget: 2,
      safe_daily_budget: 2880,
      providers: {
        fx: 'investing-single-currency-crosses',
        btc_anchor: 'binance-btcusdt',
      },
    },
    is_fallback: false,
  };
}

function getSharedTtlSeconds(now = Date.now()) {
  const ttlMs = Math.max(20_000, REFRESH_INTERVAL_MS + 15_000);
  return Math.max(20, Math.floor((now + ttlMs - now) / 1000));
}

function stalePayload(payload, reason) {
  if (!isValidPayload(payload)) return null;
  const updatedAt = parseIsoDate(payload.updated_at);
  const staleAgeMs = updatedAt ? Math.max(0, Date.now() - updatedAt.getTime()) : null;

  return {
    ...payload,
    is_fallback: true,
    fallback_note: reason,
    stale_age_ms: staleAgeMs,
  };
}

export async function refreshS03MultiCurrencyPayload() {
  const [html, btcAnchor] = await Promise.all([
    fetchSourceHtml(),
    fetchBtcAnchor(),
  ]);

  const usdPairs = parseUsdPairsFromHtml(html);
  const payload = buildPayload(usdPairs, btcAnchor);

  memoryCache = payload;
  await cacheSetJson(SHARED_CACHE_KEY, payload, { ttlSeconds: getSharedTtlSeconds() });
  return payload;
}

export async function getS03MultiCurrencyPayload({ forceFresh = false } = {}) {
  let basePayload = null;

  if (!forceFresh && isPayloadFresh(memoryCache)) {
    basePayload = memoryCache;
  }

  if (!basePayload && !forceFresh && !memoryCache) {
    const shared = await cacheGetJson(SHARED_CACHE_KEY);
    if (isValidPayload(shared)) memoryCache = shared;
  }

  if (!basePayload && !forceFresh && isPayloadFresh(memoryCache)) {
    basePayload = memoryCache;
  }

  if (!basePayload) {
    const refreshed = await withCacheLock(
      SHARED_LOCK_KEY,
      async () => refreshS03MultiCurrencyPayload(),
      { ttlSeconds: 30, waitMs: 3500, pollMs: 140 },
    );

    if (isValidPayload(refreshed)) {
      basePayload = refreshed;
    }
  }

  if (!basePayload) {
    try {
      basePayload = await refreshS03MultiCurrencyPayload();
    } catch (error) {
      const shared = await cacheGetJson(SHARED_CACHE_KEY);
      if (isValidPayload(shared)) {
        memoryCache = shared;
        basePayload = stalePayload(shared, 'Serving stale cache while scraper refresh recovers');
      } else if (isValidPayload(memoryCache)) {
        basePayload = stalePayload(memoryCache, 'Serving in-memory stale cache while scraper refresh recovers');
      } else {
        throw error;
      }
    }
  }

  try {
    const anchor = await fetchBtcAnchor();
    return reanchorPayload(basePayload, anchor);
  } catch (error) {
    if (isValidPayload(basePayload)) {
      return stalePayload(
        basePayload,
        `Serving cached FX snapshot while BTC anchor refresh recovers (${error instanceof Error ? error.message : 'unknown error'})`,
      );
    }
    throw error;
  }
}

export async function getS03MultiCurrencyStatus() {
  const payload = await getS03MultiCurrencyPayload();
  return {
    status: 'ready',
    last_updated: payload.updated_at,
    next_update: payload.next_update_at,
    source_provider: payload.source_provider,
    source_url: payload.source_url,
    is_fallback: Boolean(payload.is_fallback),
    pairs: Number(payload.upstream_pairs || 0),
  };
}

export { S03ScrapeError };
