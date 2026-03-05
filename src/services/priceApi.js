/**
 * Bitcoin price service with multi-source fallback:
 *   1. CoinGecko  (primary — best data)
 *   2. CoinCap    (free, no key, price + supply + market cap)
 *   3. Binance    (price + 24h change, no key needed)
 *   4. Kraken     (price + 24h change derived from open, no key needed)
 */

const CG    = 'https://api.coingecko.com/api/v3';
const CC    = 'https://api.coincap.io/v2';
const BN    = 'https://api.binance.com/api/v3';
const KR    = 'https://api.kraken.com/0/public';
// jsdelivr-hosted currency CDN (no key, daily updated, ~5 KB)
const FXCDN = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';

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
 * Returns { usd, change24h, marketCap, supply } or null if every source fails.
 */
export async function fetchBtcSpot() {
  // 1) CoinGecko
  try {
    const d = await get(
      `${CG}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    );
    if (d?.bitcoin?.usd) return {
      usd:       d.bitcoin.usd,
      change24h: d.bitcoin.usd_24h_change ?? 0,
      marketCap: d.bitcoin.usd_market_cap ?? 0,
      supply:    null,
    };
  } catch { /* try next */ }

  // 2) CoinCap — price + change + marketCap + supply in one call
  try {
    const d = await get(`${CC}/assets/bitcoin`);
    if (d?.data?.priceUsd) return {
      usd:       parseFloat(d.data.priceUsd),
      change24h: parseFloat(d.data.changePercent24Hr ?? 0),
      marketCap: parseFloat(d.data.marketCapUsd    ?? 0),
      supply:    parseFloat(d.data.supply           ?? 0),
    };
  } catch { /* try next */ }

  // 3) Binance — price + 24h change
  try {
    const d = await get(`${BN}/ticker/24hr?symbol=BTCUSDT`);
    if (d?.lastPrice) {
      const usd = parseFloat(d.lastPrice);
      return {
        usd,
        change24h: parseFloat(d.priceChangePercent ?? 0),
        marketCap: usd * 19_900_000,
        supply:    null,
      };
    }
  } catch { /* try next */ }

  // 4) Kraken — price, derive 24h change from today's open
  try {
    const d = await get(`${KR}/Ticker?pair=XBTUSD`);
    const t = d?.result?.XXBTZUSD;
    if (t) {
      const usd   = parseFloat(t.c[0]);
      const open  = parseFloat(t.o);
      return {
        usd,
        change24h: open ? ((usd - open) / open) * 100 : 0,
        marketCap: usd * 19_900_000,
        supply:    null,
      };
    }
  } catch { /* all failed */ }

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
  // 1) CoinGecko
  try {
    const d = await get(
      `${CG}/coins/bitcoin/market_chart?vs_currency=usd&days=${days}&interval=daily`
    );
    if (Array.isArray(d?.prices) && d.prices.length > 3)
      return d.prices.map(([ts, p]) => toChartPoint(ts, p));
  } catch { /* try next */ }

  // 2) Kraken OHLC — interval=1440 min (daily), max 720 candles
  try {
    const since = Math.floor((Date.now() - days * 86_400_000) / 1000);
    const d = await get(`${KR}/OHLC?pair=XBTUSD&interval=1440&since=${since}`);
    const pair = d?.result?.XXBTZUSD ?? d?.result?.XBTUSD;
    if (Array.isArray(pair) && pair.length > 3)
      return pair
        .slice(-days)
        .map(([ts, , , , close]) => toChartPoint(ts * 1000, parseFloat(close)));
  } catch { /* try next */ }

  // 3) CoinCap history
  try {
    const end   = Date.now();
    const start = end - days * 86_400_000;
    const d = await get(`${CC}/assets/bitcoin/history?interval=d1&start=${start}&end=${end}`);
    if (Array.isArray(d?.data) && d.data.length > 3)
      return d.data.map(p => toChartPoint(p.time, parseFloat(p.priceUsd)));
  } catch { /* all failed */ }

  return null;
}

// ── Multi-currency BTC prices ────────────────────────────────────────────────
/**
 * Returns CoinGecko-style object: { usd: 72000, eur: 66000, eur_24h_change: 1.2, ... }
 * or null if every source fails.
 * @param {string[]} currencyCodes - e.g. ['usd','eur','gbp',...]
 */
export async function fetchMultiCurrencyBtc(currencyCodes) {
  const codes = currencyCodes.map(c => c.toLowerCase());

  // 1) CoinGecko
  try {
    const d = await get(
      `${CG}/simple/price?ids=bitcoin&vs_currencies=${codes.join(',')}&include_24hr_change=true`
    );
    if (d?.bitcoin) return d.bitcoin;
  } catch { /* try next */ }

  // 2) Binance USD + jsdelivr FX rates (free, no key, daily data)
  try {
    const [ticker, fx] = await Promise.all([
      get(`${BN}/ticker/price?symbol=BTCUSDT`),
      get(FXCDN),
    ]);
    const btcUsd = parseFloat(ticker?.price ?? 0);
    const rates  = fx?.usd; // { eur: 0.92, gbp: 0.79, jpy: 149.5, ... }
    if (btcUsd > 0 && rates) {
      const result = {};
      for (const code of codes) {
        if (code === 'usd') { result.usd = btcUsd; continue; }
        const rate = rates[code];
        if (rate) result[code] = Math.round(btcUsd * rate);
      }
      // 24h change not available from this source — default 0
      return result;
    }
  } catch { /* try next */ }

  // 3) Kraken USD + jsdelivr FX rates
  try {
    const [ticker, fx] = await Promise.all([
      get(`${KR}/Ticker?pair=XBTUSD`),
      get(FXCDN),
    ]);
    const t = ticker?.result?.XXBTZUSD;
    const btcUsd = t ? parseFloat(t.c[0]) : 0;
    const rates  = fx?.usd;
    if (btcUsd > 0 && rates) {
      const result = {};
      for (const code of codes) {
        if (code === 'usd') { result.usd = btcUsd; continue; }
        const rate = rates[code];
        if (rate) result[code] = Math.round(btcUsd * rate);
      }
      return result;
    }
  } catch { /* all failed */ }

  return null;
}
