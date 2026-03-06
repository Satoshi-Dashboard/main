/**
 * Bitcoin price service:
 *   - Spot: Binance primary, CoinGecko fallback
 *   - History: BTCUSDT daily klines
 *   - Multi-currency: direct BTC<FIAT> pairs available on Binance
 */

const CG    = 'https://api.coingecko.com/api/v3';
const BN    = 'https://api.binance.com/api/v3';

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
  // 1) Binance (primary)
  try {
    const d = await get(`${BN}/ticker/24hr?symbol=BTCUSDT`);
    if (d?.lastPrice) {
      const usd = parseFloat(d.lastPrice);
      const change24h = parseFloat(d.priceChangePercent ?? 0);
      if (!Number.isFinite(usd) || usd <= 0) throw new Error('Invalid Binance price');

      return {
        usd,
        change24h: Number.isFinite(change24h) ? change24h : 0,
        marketCap: usd * 19_900_000,
        supply:    null,
        source:    'binance',
      };
    }
  } catch { /* fallback */ }

  // 2) CoinGecko (fallback only if Binance fails)
  try {
    const d = await get(
      `${CG}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    );
    const usd = Number(d?.bitcoin?.usd);
    const change24h = Number(d?.bitcoin?.usd_24h_change ?? 0);
    const marketCap = Number(d?.bitcoin?.usd_market_cap ?? 0);
    if (!Number.isFinite(usd) || usd <= 0) return null;

    return {
      usd,
      change24h: Number.isFinite(change24h) ? change24h : 0,
      marketCap: Number.isFinite(marketCap) ? marketCap : usd * 19_900_000,
      supply: null,
      source: 'coingecko_fallback',
    };
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
  // Binance daily klines, max 1000 candles per request.
  try {
    const limit = Math.min(Math.max(days, 2), 1000);
    const d = await get(`${BN}/klines?symbol=BTCUSDT&interval=1d&limit=${limit}`);
    if (Array.isArray(d) && d.length > 1) {
      return d.map((row) => {
        const openTime = Number(row?.[0]);
        const close = Number(row?.[4]);
        return toChartPoint(openTime, close);
      }).filter((x) => Number.isFinite(x.ts) && Number.isFinite(x.price));
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

  // 0) Internal backend cache (Binance BTC + Frankfurter fiat)
  try {
    const cache = await get('/api/btc/rates');
    const rates = cache?.rates;
    if (rates && typeof rates === 'object') {
      const result = {};
      const cacheCodes = Object.keys(rates)
        .filter((k) => /^[A-Z]{3}$/.test(k))
        .map((k) => k.toLowerCase());
      const effectiveCodes = requestedCodes.length ? requestedCodes : cacheCodes;
      const defaultChange = Number(cache?.btc_change_24h_pct);

      for (const code of effectiveCodes) {
        const key = code.toUpperCase();
        const price = Number(rates[key]);
        if (!Number.isFinite(price) || price <= 0) continue;

        result[code] = price;
        if (Number.isFinite(defaultChange)) {
          result[`${code}_24h_change`] = defaultChange;
        }
      }

      if (Object.keys(result).length > 0) {
        result.__source = `${cache?.source_btc || 'internal_cache'} + ${cache?.source_fiat || 'fiat_source'}`;
        return result;
      }
    }
  } catch { /* try Binance direct */ }

  // Binance-only: direct BTC<QUOTE> pairs. Unsupported quotes are omitted.
  const symbolByCode = {
    usd: 'BTCUSDT',
    eur: 'BTCEUR',
    gbp: 'BTCGBP',
    try: 'BTCTRY',
    rub: 'BTCRUB',
    brl: 'BTCBRL',
    aud: 'BTCAUD',
    bidr: 'BTCBIDR',
    pln: 'BTCPLN',
    ars: 'BTCARS',
    idr: 'BTCIDR',
  };

  const codes = requestedCodes.length ? requestedCodes : Object.keys(symbolByCode);

  const jobs = codes.map(async (code) => {
    const symbol = symbolByCode[code];
    if (!symbol) return null;

    try {
      const t = await get(`${BN}/ticker/24hr?symbol=${symbol}`);
      const price = Number(t?.lastPrice);
      const change = Number(t?.priceChangePercent);
      if (!Number.isFinite(price) || price <= 0) return null;

      return {
        code,
        price,
        change: Number.isFinite(change) ? change : null,
      };
    } catch {
      return null;
    }
  });

  const settled = await Promise.all(jobs);
  const result = {};
  settled.forEach((row) => {
    if (!row) return;
    result[row.code] = row.price;
    if (row.change != null) result[`${row.code}_24h_change`] = row.change;
  });

  if (Object.keys(result).length > 0) {
    result.__source = 'binance_direct';
    return result;
  }

  return null;
}
