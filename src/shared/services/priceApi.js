/**
 * Bitcoin price service:
 *   - Spot: internal /api/btc/rates cache
 *   - History: internal /api/public/binance/btc-history
 *   - Multi-currency: internal /api/s03/multi-currency
 */

import { fetchJson } from '@/shared/lib/api.js';

const SPOT_CACHE_MS = 10_000;
const DEFAULT_HISTORY_CACHE_MS = 5 * 60 * 1000;
const LONG_HISTORY_CACHE_MS = 60 * 60 * 1000;

let spotMemoryCache = {
  expiresAt: 0,
  value: null,
};

const historyMemoryCache = new Map();
const historyInFlight = new Map();

function readSpotCache(now = Date.now()) {
  if (spotMemoryCache.value && now < spotMemoryCache.expiresAt) {
    return { ...spotMemoryCache.value };
  }
  return null;
}

function writeSpotCache(payload, now = Date.now()) {
  spotMemoryCache = {
    expiresAt: now + SPOT_CACHE_MS,
    value: { ...payload },
  };
  return payload;
}

function getHistoryCacheKey(days, interval) {
  return `${days}:${interval}`;
}

function cloneHistoryRows(rows) {
  return Array.isArray(rows) ? rows.map((row) => ({ ...row })) : null;
}

function getHistoryCacheTtl(days, interval) {
  if (Number(days) >= 1825 && interval === '1d') {
    return LONG_HISTORY_CACHE_MS;
  }
  return DEFAULT_HISTORY_CACHE_MS;
}

function readHistoryCache(key, now = Date.now()) {
  const cached = historyMemoryCache.get(key);
  if (!cached) return null;
  if (now >= cached.expiresAt) {
    historyMemoryCache.delete(key);
    return null;
  }
  return cloneHistoryRows(cached.value);
}

function writeHistoryCache(key, rows, ttl, now = Date.now()) {
  const value = cloneHistoryRows(rows);
  historyMemoryCache.set(key, {
    expiresAt: now + ttl,
    value,
  });
  return cloneHistoryRows(value);
}

// ── Spot price + 24h change + market cap + supply ───────────────────────────
/**
 * Returns { usd, change24h, marketCap, supply, source } or null if every source fails.
 */
export async function fetchBtcSpot() {
  const now = Date.now();
  const cached = readSpotCache(now);
  if (cached) return cached;

  try {
    const cache = await fetchJson('/api/btc/rates', { timeout: 8000 });
    const usd = Number(cache?.btc_usd);
    const change24h = Number(cache?.btc_change_24h_pct ?? 0);

    if (Number.isFinite(usd) && usd > 0) {
      const sourceBtc = String(cache?.source_btc || '').toLowerCase();
      const source = sourceBtc.includes('coingecko') ? 'coingecko_fallback' : 'binance';

      return writeSpotCache({
        usd,
        change24h: Number.isFinite(change24h) ? change24h : 0,
        marketCap: usd * 19_900_000,
        supply: null,
        source,
      }, now);
    }
  } catch { /* failed */ }

  return null;
}

// ── Historical price series ──────────────────────────────────────────────────
const INTRADAY_INTERVALS = new Set(['5m', '15m', '30m', '1h']);

function formatAxisLabel(date, interval) {
  if (INTRADAY_INTERVALS.has(interval)) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false });
  }
  return date
    .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
    .replace('/', '.');
}

function formatTooltipLabel(date, interval) {
  if (interval === '5m' || interval === '15m' || interval === '30m') {
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  }
  if (interval === '1h') {
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: 'numeric', hour12: true,
    });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function toChartPoint(ts, price, interval) {
  const date = new Date(ts);
  return {
    ts,
    price,
    axisLabel: formatAxisLabel(date, interval),
    tooltipLabel: formatTooltipLabel(date, interval),
  };
}

/**
 * Returns array of { ts, price, axisLabel, tooltipLabel } or null if every source fails.
 * @param {number} days - 1 | 7 | 30 | 90 | 365 | 1825 | 2025
 * @param {string} interval - '5m' | '30m' | '1h' | '1d'
 */
export async function fetchBtcHistory(days, interval = '1d') {
  const validDays = [1, 7, 30, 90, 365, 1825, 2025].includes(Number(days)) ? Number(days) : 365;
  const safeInterval = ['5m', '15m', '30m', '1h', '1d'].includes(interval) ? interval : '1d';
  const cacheKey = getHistoryCacheKey(validDays, safeInterval);
  const now = Date.now();
  const cached = readHistoryCache(cacheKey, now);
  if (cached) return cached;

  const inFlight = historyInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight.then((rows) => cloneHistoryRows(rows));
  }

  const request = (async () => {
    try {
      const payload = await fetchJson(
        `/api/public/binance/btc-history?days=${validDays}&interval=${safeInterval}`,
        { timeout: 8000 },
      );
      const rows = Array.isArray(payload?.data) ? payload.data : payload;
      if (Array.isArray(rows) && rows.length > 1) {
        const points = rows
          .map((row) => toChartPoint(Number(row.ts), Number(row.price), safeInterval))
          .filter((item) => Number.isFinite(item.ts) && Number.isFinite(item.price) && item.price > 0);

        if (points.length > 1) {
          return writeHistoryCache(cacheKey, points, getHistoryCacheTtl(validDays, safeInterval), now);
        }
      }
    } catch { /* failed */ }

    return null;
  })();

  historyInFlight.set(cacheKey, request);

  try {
    return await request;
  } finally {
    historyInFlight.delete(cacheKey);
  }
}

// ── Multi-currency BTC prices ────────────────────────────────────────────────
/**
 * Returns CoinGecko-style object: { usd: 72000, eur: 66000, eur_24h_change: 1.2, ... }
 * or null if every source fails.
 * @param {string[]} currencyCodes - e.g. ['usd','eur','gbp',...]
 */
export async function fetchMultiCurrencyBtc(currencyCodes) {
  const requestedCodes = Array.isArray(currencyCodes)
    ? currencyCodes.map(c => String(c).toLowerCase()).filter(Boolean)
    : [];

  try {
    const cache = await fetchJson('/api/s03/multi-currency', { timeout: 8000 });
    const rates = cache?.rates;
    const changes = cache?.changes_24h_pct;

    if (rates && typeof rates === 'object') {
      const result = {};
      const cacheCodes = Object.keys(rates)
        .filter((k) => /^[A-Z]{3}$/.test(k))
        .map((k) => k.toLowerCase());
      const effectiveCodes = requestedCodes.length ? requestedCodes : cacheCodes;

      for (const code of effectiveCodes) {
        const key = code.toUpperCase();
        const price = Number(rates[key]);
        if (!Number.isFinite(price) || price <= 0) continue;

        result[code] = price;
        const change = Number(changes?.[key]);
        if (Number.isFinite(change)) {
          result[`${code}_24h_change`] = change;
        }
      }

      if (Object.keys(result).length > 0) {
        const spot = await fetchBtcSpot().catch(() => null);
        if (spot && Number.isFinite(spot.usd) && spot.usd > 0 && Number.isFinite(result.usd) && result.usd > 0) {
          const ratio = spot.usd / result.usd;
          result.usd = spot.usd;

          if (Number.isFinite(spot.change24h)) {
            result.usd_24h_change = spot.change24h;
          }

          if (Number.isFinite(ratio) && ratio > 0) {
            effectiveCodes.forEach((code) => {
              if (code === 'usd') return;
              const value = Number(result[code]);
              if (!Number.isFinite(value) || value <= 0) return;
              result[code] = Number((value * ratio).toFixed(2));
            });
          }
        }

        result.__source = String(cache?.source_provider || 'USD from /api/btc/rates + FX factors from Investing USD crosses');
        result.__is_fallback = Boolean(cache?.is_fallback);
        return result;
      }
    }
  } catch { /* failed */ }

  return null;
}
