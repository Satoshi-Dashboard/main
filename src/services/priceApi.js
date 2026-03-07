/**
 * Bitcoin price service:
 *   - Spot: internal /api/btc/rates cache
 *   - History: internal /api/public/binance/btc-history
 *   - Multi-currency: internal /api/s03/multi-currency
 */

const SPOT_CACHE_MS = 10_000;

let spotMemoryCache = {
  expiresAt: 0,
  value: null,
};

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

// ── Generic timed fetch ──────────────────────────────────────────────────────
async function get(url, ms = 8000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  } finally {
    clearTimeout(tid);
  }
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
    const cache = await get('/api/btc/rates');
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

// ── Historical daily price series ────────────────────────────────────────────
function toChartPoint(ts, price) {
  return {
    ts,
    price,
    date: new Date(ts)
      .toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })
      .replace('/', '.'),
  };
}

/**
 * Returns array of { ts, price, date } or null if every source fails.
 * @param {number} days - 7 | 30 | 90 | 365
 */
export async function fetchBtcHistory(days) {
  try {
    const safeDays = [7, 30, 90, 365].includes(Number(days)) ? Number(days) : 365;
    const payload = await get(`/api/public/binance/btc-history?days=${safeDays}`);
    const rows = Array.isArray(payload?.data) ? payload.data : payload;
    if (Array.isArray(rows) && rows.length > 1) {
      return rows.map((row) => toChartPoint(Number(row.ts), Number(row.price)))
        .filter((item) => Number.isFinite(item.ts) && Number.isFinite(item.price) && item.price > 0);
    }
  } catch { /* failed */ }

  return null;
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
    const cache = await get('/api/s03/multi-currency');
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
