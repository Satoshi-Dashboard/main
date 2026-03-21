/**
 * S17 — US Median Home Price
 *
 * FRED data: fetched from external Zatobox API
 * BTC history: fetched internally from Binance
 *
 * Returns unified chart payload with:
 *   series_usd  — home price in USD  (quarterly FRED, interpolated monthly)
 *   series_btc  — home price in BTC  (series_usd / Binance daily close)
 *
 * Sources:
 *   Zatobox API  → FRED MSPUS (https://api.zatobox.io/api/fred/mspus)
 *   Binance      → BTCUSDT 1d klines
 */

const ZATOBOX_FRED_URL = 'https://api.zatobox.io/api/fred/mspus';
const BINANCE_KLINES   = 'https://api.binance.com/api/v3/klines';
const SOURCE_URL        = 'https://fred.stlouisfed.org/series/MSPUS';

const DAY_MS = 86_400_000;

// ── Error ────────────────────────────────────────────────────────────────────

export class S17ApiError extends Error {
  constructor(msg) { super(msg); this.name = 'S17ApiError'; }
}

// ── Zatobox (FRED) helpers ──────────────────────────────────────────────────

async function fetchFredFromZatobox() {
  // Get all available data (limit=100 to cover all ~250 quarterly observations)
  const url = `${ZATOBOX_FRED_URL}?limit=100`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new S17ApiError(`Zatobox ${res.status}`);
  const json = await res.json();

  // Expected format: { observations: [{date, value}, ...] }
  const obs = json.observations ?? [];
  return obs
    .filter(o => o.value !== '.' && o.value != null && Number.isFinite(o.value))
    .map(o => ({ date: o.date, value: Number(o.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Binance helpers ─────────────────────────────────────────────────────────

async function fetchBinanceDailyHistory(startMs) {
  const all = [];
  let from = startMs;

  while (true) {
    const params = new URLSearchParams({
      symbol:    'BTCUSDT',
      interval:  '1d',
      startTime: String(Math.round(from)),
      limit:     '1000',
    });
    let res;
    try {
      res = await fetch(`${BINANCE_KLINES}?${params}`, {
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      throw new S17ApiError(`Binance fetch failed: ${e.message}`);
    }
    if (!res.ok) throw new S17ApiError(`Binance ${res.status}`);
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    all.push(...rows);
    if (rows.length < 1000) break;
    from = Number(rows[rows.length - 1][0]) + 1;
  }

  const map = new Map();
  for (const row of all) {
    const ts = Number(row[0]);
    const close = Number(row[4]);
    if (Number.isFinite(ts) && Number.isFinite(close) && close > 0) {
      map.set(ts, close);
    }
  }
  return map;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function quarterLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
}

function nextFredRelease(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  const m = d.getUTCMonth();
  const releaseMonths = [5, 5, 5, 8, 8, 8, 11, 11, 11, 2, 2, 2];
  const yearOffset = m >= 9 ? 1 : 0;
  return new Date(Date.UTC(d.getUTCFullYear() + yearOffset, releaseMonths[m], 1)).toISOString();
}

// ── Interpolation: quarterly → monthly ───────────────────────────────────────

function interpolateFredMonthly(observations) {
  if (observations.length < 2) return [];

  const first = new Date(observations[0].date + 'T00:00:00Z');
  const now = new Date();
  const points = [];

  let cursor = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1));
  while (cursor <= now) {
    points.push({ ts: cursor.getTime(), usd: null });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }

  for (const pt of points) {
    let lo = null, hi = null;
    for (const obs of observations) {
      const obsTs = new Date(obs.date + 'T00:00:00Z').getTime();
      if (obsTs <= pt.ts) lo = { ts: obsTs, v: obs.value };
      else if (hi === null) hi = { ts: obsTs, v: obs.value };
    }
    if (lo && hi) {
      const t = (pt.ts - lo.ts) / (hi.ts - lo.ts);
      pt.usd = lo.v + (hi.v - lo.v) * t;
    } else if (lo) {
      pt.usd = lo.v;
    }
  }

  return points.filter(p => p.usd !== null);
}

// ── Historical Fallback (2011 - 2017) ──────────────────────────────────────

const BTC_HISTORICAL_FALLBACK = [
  { ts: 1293840000000, price: 0.30 },   // Jan 2011
  { ts: 1296518400000, price: 0.90 },   // Feb 2011
  { ts: 1298937600000, price: 0.90 },   // Mar 2011
  { ts: 1301616000000, price: 1.50 },   // Apr 2011
  { ts: 1304208000000, price: 6.00 },   // May 2011
  { ts: 1306886400000, price: 15.00 },  // Jun 2011
  { ts: 1309478400000, price: 14.00 },  // Jul 2011
  { ts: 1312156800000, price: 10.00 },  // Aug 2011
  { ts: 1314835200000, price: 7.00 },   // Sep 2011
  { ts: 1317427200000, price: 4.00 },   // Oct 2011
  { ts: 1320105600000, price: 3.00 },   // Nov 2011
  { ts: 1322697600000, price: 4.00 },   // Dec 2011
  { ts: 1325376000000, price: 6.00 },   // Jan 2012
  { ts: 1328054400000, price: 5.00 },   // Feb 2012
  { ts: 1330560000000, price: 5.00 },   // Mar 2012
  { ts: 1333238400000, price: 5.00 },   // Apr 2012
  { ts: 1335830400000, price: 5.00 },   // May 2012
  { ts: 1338508800000, price: 6.00 },   // Jun 2012
  { ts: 1341100800000, price: 8.00 },   // Jul 2012
  { ts: 1343779200000, price: 10.00 },  // Aug 2012
  { ts: 1346457600000, price: 11.00 },  // Sep 2012
  { ts: 1349049600000, price: 12.00 },  // Oct 2012
  { ts: 1351728000000, price: 11.00 },  // Nov 2012
  { ts: 1354320000000, price: 13.00 },  // Dec 2012
  { ts: 1356998400000, price: 17.00 },  // Jan 2013
  { ts: 1359676800000, price: 25.00 },  // Feb 2013
  { ts: 1362096000000, price: 60.00 },  // Mar 2013
  { ts: 1364774400000, price: 130.00 }, // Apr 2013
  { ts: 1367366400000, price: 120.00 }, // May 2013
  { ts: 1370044800000, price: 100.00 }, // Jun 2013
  { ts: 1372636800000, price: 90.00 },  // Jul 2013
  { ts: 1375315200000, price: 110.00 }, // Aug 2013
  { ts: 1377993600000, price: 130.00 }, // Sep 2013
  { ts: 1380585600000, price: 170.00 }, // Oct 2013
  { ts: 1383264000000, price: 500.00 }, // Nov 2013
  { ts: 1385856000000, price: 800.00 }, // Dec 2013
  { ts: 1388534400000, price: 850.00 }, // Jan 2014
  { ts: 1391212800000, price: 600.00 }, // Feb 2014
  { ts: 1393632000000, price: 500.00 }, // Mar 2014
  { ts: 1396310400000, price: 450.00 }, // Apr 2014
  { ts: 1398902400000, price: 500.00 }, // May 2014
  { ts: 1401580800000, price: 600.00 }, // Jun 2014
  { ts: 1404172800000, price: 600.00 }, // Jul 2014
  { ts: 1406851200000, price: 500.00 }, // Aug 2014
  { ts: 1409529600000, price: 400.00 }, // Sep 2014
  { ts: 1412121600000, price: 350.00 }, // Oct 2014
  { ts: 1414800000000, price: 350.00 }, // Nov 2014
  { ts: 1417392000000, price: 330.00 }, // Dec 2014
  { ts: 1420070400000, price: 250.00 }, // Jan 2015
  { ts: 1422748800000, price: 230.00 }, // Feb 2015
  { ts: 1425168000000, price: 260.00 }, // Mar 2015
  { ts: 1427846400000, price: 240.00 }, // Apr 2015
  { ts: 1430438400000, price: 240.00 }, // May 2015
  { ts: 1433116800000, price: 240.00 }, // Jun 2015
  { ts: 1435708800000, price: 280.00 }, // Jul 2015
  { ts: 1438387200000, price: 240.00 }, // Aug 2015
  { ts: 1441065600000, price: 240.00 }, // Sep 2015
  { ts: 1443657600000, price: 280.00 }, // Oct 2015
  { ts: 1446336000000, price: 350.00 }, // Nov 2015
  { ts: 1448928000000, price: 430.00 }, // Dec 2015
  { ts: 1451606400000, price: 400.00 }, // Jan 2016
  { ts: 1454284800000, price: 410.00 }, // Feb 2016
  { ts: 1456790400000, price: 420.00 }, // Mar 2016
  { ts: 1459468800000, price: 430.00 }, // Apr 2016
  { ts: 1462060800000, price: 460.00 }, // May 2016
  { ts: 1464739200000, price: 650.00 }, // Jun 2016
  { ts: 1467331200000, price: 670.00 }, // Jul 2016
  { ts: 1470009600000, price: 580.00 }, // Aug 2016
  { ts: 1472688000000, price: 610.00 }, // Sep 2016
  { ts: 1475280000000, price: 640.00 }, // Oct 2016
  { ts: 1477958400000, price: 720.00 }, // Nov 2016
  { ts: 1480550400000, price: 850.00 }, // Dec 2016
  { ts: 1483228800000, price: 950.00 }, // Jan 2017
  { ts: 1485907200000, price: 1050.00 }, // Feb 2017
  { ts: 1488326400000, price: 1100.00 }, // Mar 2017
  { ts: 1491004800000, price: 1200.00 }, // Apr 2017
  { ts: 1493596800000, price: 1800.00 }, // May 2017
  { ts: 1496275200000, price: 2500.00 }, // Jun 2017
  { ts: 1498867200000, price: 2400.00 }, // Jul 2017
];

// ── Build chart points ────────────────────────────────────────────────────────

function buildChartPoints(monthlyUsd, btcDailyMap) {
  const points = [];

  for (const { ts, usd } of monthlyUsd) {
    const monthStart = ts;
    const monthEnd = new Date(new Date(ts).setUTCMonth(new Date(ts).getUTCMonth() + 1)).getTime();
    const btcPrices = [];

    // 1. Try Binance
    for (const [dayTs, price] of btcDailyMap) {
      if (dayTs >= monthStart && dayTs < monthEnd) btcPrices.push(price);
    }

    let medianBtc = null;

    if (btcPrices.length > 0) {
      btcPrices.sort((a, b) => a - b);
      medianBtc = btcPrices[Math.floor(btcPrices.length / 2)];
    } else {
      // 2. Fallback to historical static data
      const fallback = BTC_HISTORICAL_FALLBACK.find(f => f.ts >= monthStart && f.ts < monthEnd);
      if (fallback) {
        medianBtc = fallback.price;
      }
    }

    if (!medianBtc) continue;

    const homeInBtc = usd / medianBtc;
    const d = new Date(ts);
    const dateStr = d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', timeZone: 'UTC',
    });

    points.push({
      ts,
      usd: Math.round(usd),
      btcPrice: medianBtc < 1 ? Number(medianBtc.toFixed(2)) : Math.round(medianBtc),
      homeInBtc,
      date: dateStr,
    });
  }

  return points;
}

// ── Cache ───────────────────────────────────────────────────────────────────

let _cache = null;

function isCacheStale() {
  if (!_cache) return true;
  const nextRelease = new Date(_cache.next_update_at).getTime();
  const maxAge = 7 * 24 * 3600 * 1000;
  return Date.now() >= nextRelease || Date.now() - _cache.fetched_at_ms > maxAge;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getS17HousePricePayload() {
  if (!isCacheStale() && _cache) return _cache.payload;
  return refreshS17HousePriceCache();
}

export async function refreshS17HousePriceCache() {
  let fredObs, btcMap;

  try {
    [fredObs, btcMap] = await Promise.all([
      fetchFredFromZatobox(),
      fetchBinanceDailyHistory(new Date('2011-01-01T00:00:00Z').getTime()),
    ]);
  } catch (err) {
    if (_cache) {
      console.warn('[s17] upstream unavailable, serving stale:', err.message);
      return {
        ..._cache.payload,
        is_fallback: true,
        fallback_note: err.message,
        stale_age_ms: Date.now() - _cache.fetched_at_ms,
      };
    }
    throw err;
  }

  const latest = fredObs[fredObs.length - 1];
  const monthlyUsd = interpolateFredMonthly(fredObs);
  const points = buildChartPoints(monthlyUsd, btcMap);
  const now = new Date().toISOString();

  const payload = {
    updated_at: now,
    next_update_at: nextFredRelease(latest.date),
    source_provider: 'Zatobox (FRED) + Binance',
    source_url: SOURCE_URL,
    is_fallback: false,
    data: {
      latest_date: latest.date,
      latest_value: latest.value,
      quarter_label: quarterLabel(latest.date),
      observations: fredObs,
      points,
    },
  };

  _cache = { payload, fetched_at_ms: Date.now(), next_update_at: payload.next_update_at };

  console.log(
    `[s17] cache updated — ${quarterLabel(latest.date)}: $${latest.value.toLocaleString()},`,
    `${points.length} chart points`,
  );

  return payload;
}

export function getS17HousePriceStatus() {
  if (!_cache) return { status: 'pending', source_provider: 'Zatobox (FRED) + Binance' };
  const p = _cache.payload;
  return {
    status: 'ready',
    last_updated: p.updated_at,
    next_update: p.next_update_at,
    source_provider: p.source_provider,
    is_fallback: p.is_fallback,
    latest_quarter: p.data.quarter_label,
    latest_value_usd: p.data.latest_value,
    chart_points: p.data.points.length,
  };
}
