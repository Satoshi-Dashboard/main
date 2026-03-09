import { cacheGetJson, cacheSetJson, withCacheLock } from '../core/runtimeCache.js';
import { getBtcRates } from './btcRates.js';

const FETCH_TIMEOUT_MS = 12_000;
const DAY_MS = 86_400_000;
const US_NATIONAL_DEBT_SERIES_PAGE_SIZE = 40;
const US_NATIONAL_DEBT_RATE_WINDOW = 30;
const ACS_POPULATION_MIN_YEAR = 2020;
const BTCMAP_PLACE_COUNTRY_CACHE_KEY = 'public:btcmap:place-country-map';
const BTCMAP_PLACE_COUNTRY_CACHE_TTL_SECONDS = 90 * 24 * 60 * 60;
const BTCMAP_MAX_FALLBACK_AREA_LOOKUPS = 120;
const BTCMAP_AREA_LOOKUP_CONCURRENCY = 6;
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
    refreshMs: 21_600_000,
    sourceProvider: 'alternative.me',
    sourceUrl: 'https://api.alternative.me/fng/?limit=7',
    safeMinuteBudget: 1,
    safeDailyBudget: 4,
  },
  fearGreed31: {
    cacheKey: 'public:alternative:fng:31',
    lockKey: 'public:alternative:fng:31:refresh',
    refreshMs: 21_600_000,
    sourceProvider: 'alternative.me',
    sourceUrl: 'https://api.alternative.me/fng/?limit=31',
    safeMinuteBudget: 1,
    safeDailyBudget: 4,
  },
  geoCountries: {
    cacheKey: 'public:geo:countries',
    lockKey: 'public:geo:countries:refresh',
    refreshMs: 2_592_000_000,
    sourceProvider: 'natural-earth-vector',
    sourceUrl: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
    safeMinuteBudget: 1,
    safeDailyBudget: 1,
  },
  geoCountriesHighRes: {
    cacheKey: 'public:geo:countries:highres',
    lockKey: 'public:geo:countries:highres:refresh',
    refreshMs: 2_592_000_000,
    sourceProvider: 'natural-earth-vector',
    sourceUrl: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson',
    safeMinuteBudget: 1,
    safeDailyBudget: 1,
  },
  geoLand: {
    cacheKey: 'public:geo:land',
    lockKey: 'public:geo:land:refresh',
    refreshMs: 2_592_000_000,
    sourceProvider: 'naturalearth',
    sourceUrl: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_110m_land.geojson',
    safeMinuteBudget: 1,
    safeDailyBudget: 1,
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
  btcMapBusinessesByCountry: {
    cacheKey: 'public:btcmap:businesses-by-country',
    lockKey: 'public:btcmap:businesses-by-country:refresh',
    refreshMs: 6 * 60 * 60_000,
    sourceProvider: 'btcmap.org',
    sourceUrl: 'https://api.btcmap.org/v4/places',
    safeMinuteBudget: 1,
    safeDailyBudget: 4,
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
  binanceHistory1: {
    cacheKey: 'public:binance:btc-history:1',
    lockKey: 'public:binance:btc-history:1:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24 | https://api.binance.us/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=24',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
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
  // ── Interval-specific entries (used by S02 range tabs) ──────────────────
  binanceHistory_1_15m: {
    cacheKey: 'public:binance:btc-history:1:15m',
    lockKey: 'public:binance:btc-history:1:15m:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=15m',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory_1_5m: {
    cacheKey: 'public:binance:btc-history:1:5m',
    lockKey: 'public:binance:btc-history:1:5m:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=5m',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory_1_30m: {
    cacheKey: 'public:binance:btc-history:1:30m',
    lockKey: 'public:binance:btc-history:1:30m:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=30m',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory_7_1h: {
    cacheKey: 'public:binance:btc-history:7:1h',
    lockKey: 'public:binance:btc-history:7:1h:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory_30_1h: {
    cacheKey: 'public:binance:btc-history:30:1h',
    lockKey: 'public:binance:btc-history:30:1h:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory_90_1d: {
    cacheKey: 'public:binance:btc-history:90:1d',
    lockKey: 'public:binance:btc-history:90:1d:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory_365_1d: {
    cacheKey: 'public:binance:btc-history:365:1d',
    lockKey: 'public:binance:btc-history:365:1d:refresh',
    refreshMs: 5 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory_1825_1d: {
    cacheKey: 'public:binance:btc-history:1825:1d',
    lockKey: 'public:binance:btc-history:1825:1d:refresh',
    refreshMs: 60 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  usNationalDebtSeries: {
    cacheKey: 'public:macro:us-national-debt:series',
    lockKey: 'public:macro:us-national-debt:series:refresh',
    refreshMs: 15 * 60_000,
    sourceProvider: 'u.s.-treasury-fiscaldata',
    sourceUrl: 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny',
    safeMinuteBudget: 1,
    safeDailyBudget: 96,
  },
  usPopulationEstimate: {
    cacheKey: 'public:macro:us-population:estimate',
    lockKey: 'public:macro:us-population:estimate:refresh',
    refreshMs: 30 * DAY_MS,
    sourceProvider: 'u.s.-census-acs-1-year',
    sourceUrl: 'https://api.census.gov/data/{year}/acs/acs1?get=NAME,B01003_001E&for=us:1',
    safeMinuteBudget: 1,
    safeDailyBudget: 1,
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
    refreshMs: 604_800_000,
    sourceProvider: 'satoshi-dashboard-internal',
    sourceUrl: '/api/btc/rates + cached providers',
    safeMinuteBudget: 1,
    safeDailyBudget: 1,
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

function validateCountryBusinessPayload(value) {
  return validateObject(value) && Array.isArray(value.country_counts);
}

function validateUsNationalDebtSeries(value) {
  return Array.isArray(value)
    && value.length >= 2
    && value.every((row) => row?.record_date && Number.isFinite(Number(row?.total_debt)));
}

function validateUsPopulationEstimate(value) {
  return validateObject(value) && Number.isFinite(Number(value.population));
}

function toUtcDayMs(value) {
  const date = new Date(`${String(value || '').slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(date.getTime())) return null;
  return date.getTime();
}

function normalizeDebtToPennyRows(payload) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows
    .map((row) => {
      const recordDate = String(row?.record_date || '').slice(0, 10);
      const totalDebt = Number(row?.tot_pub_debt_out_amt);
      const debtHeldPublic = Number(row?.debt_held_public_amt);
      const intragovHoldings = Number(row?.intragov_hold_amt);

      if (!recordDate || !Number.isFinite(totalDebt) || totalDebt <= 0) {
        return null;
      }

      return {
        record_date: recordDate,
        total_debt: totalDebt,
        debt_held_public: Number.isFinite(debtHeldPublic) ? debtHeldPublic : null,
        intragovernmental_holdings: Number.isFinite(intragovHoldings) ? intragovHoldings : null,
      };
    })
    .filter(Boolean);
}

function normalizeUsPopulationEstimate(payload, year) {
  const row = Array.isArray(payload?.[1]) ? payload[1] : null;
  const geography = String(row?.[0] || 'United States').trim() || 'United States';
  const population = Number(row?.[1]);

  if (!Number.isFinite(population) || population <= 0) {
    return null;
  }

  return {
    geography,
    population: Math.round(population),
    dataset_year: year,
    dataset: `ACS 1-Year ${year}`,
    series: 'B01003_001E',
  };
}

function computeUsNationalDebtRates(series) {
  const ordered = [...series].sort((a, b) => String(a.record_date).localeCompare(String(b.record_date)));
  const latest = ordered.at(-1) || null;
  const previous = ordered.at(-2) || null;
  const trailingWindow = ordered.slice(-Math.min(US_NATIONAL_DEBT_RATE_WINDOW, ordered.length));
  const earliest = trailingWindow[0] || null;
  const latestMs = toUtcDayMs(latest?.record_date);
  const earliestMs = toUtcDayMs(earliest?.record_date);
  const previousMs = toUtcDayMs(previous?.record_date);

  let ratePerSecond = null;
  if (latest && earliest && Number.isFinite(latestMs) && Number.isFinite(earliestMs) && latestMs > earliestMs) {
    ratePerSecond = (Number(latest.total_debt) - Number(earliest.total_debt)) / ((latestMs - earliestMs) / 1000);
  }

  if ((!Number.isFinite(ratePerSecond) || ratePerSecond === null) && latest && previous && Number.isFinite(latestMs) && Number.isFinite(previousMs) && latestMs > previousMs) {
    ratePerSecond = (Number(latest.total_debt) - Number(previous.total_debt)) / ((latestMs - previousMs) / 1000);
  }

  const safeRatePerSecond = Number.isFinite(ratePerSecond) ? ratePerSecond : 0;

  return {
    latest,
    previous,
    windowStart: earliest?.record_date || latest?.record_date || null,
    windowEnd: latest?.record_date || null,
    windowObservations: trailingWindow.length,
    ratePerSecond: safeRatePerSecond,
    ratePerMinute: safeRatePerSecond * 60,
    ratePerHour: safeRatePerSecond * 60 * 60,
    ratePerDay: safeRatePerSecond * 60 * 60 * 24,
    ratePerWeek: safeRatePerSecond * 60 * 60 * 24 * 7,
    ratePerYear: safeRatePerSecond * 60 * 60 * 24 * 365,
  };
}

function buildUsNationalDebtSnapshot(series, populationEstimate, projectionBaseAt) {
  const rates = computeUsNationalDebtRates(series);
  const totalDebt = Number(rates.latest?.total_debt);
  const debtHeldPublic = Number(rates.latest?.debt_held_public);
  const intragovernmentalHoldings = Number(rates.latest?.intragovernmental_holdings);
  const population = Number(populationEstimate?.population);
  const debtPerPerson = Number.isFinite(totalDebt) && Number.isFinite(population) && population > 0
    ? totalDebt / population
    : null;
  const latestOfficialDelta = rates.previous
    ? Number(rates.latest.total_debt) - Number(rates.previous.total_debt)
    : null;

  if (!Number.isFinite(totalDebt) || totalDebt <= 0) {
    throw new PublicFeedError('U.S. national debt payload is incomplete');
  }

  return {
    total_debt: totalDebt,
    debt_held_public: Number.isFinite(debtHeldPublic) ? debtHeldPublic : null,
    intragovernmental_holdings: Number.isFinite(intragovernmentalHoldings) ? intragovernmentalHoldings : null,
    official_record_date: rates.latest?.record_date || null,
    previous_record_date: rates.previous?.record_date || null,
    latest_official_delta: Number.isFinite(latestOfficialDelta) ? latestOfficialDelta : null,
    projection_base_at: projectionBaseAt,
    interpolation_window_start: rates.windowStart,
    interpolation_window_end: rates.windowEnd,
    interpolation_window_observations: rates.windowObservations,
    population: Number.isFinite(population) ? population : null,
    population_dataset_year: populationEstimate?.dataset_year || null,
    population_dataset: populationEstimate?.dataset || null,
    population_series: populationEstimate?.series || null,
    debt_per_person: Number.isFinite(debtPerPerson) ? debtPerPerson : null,
    debt_per_taxpayer: null,
    debt_per_adult: null,
    rate_per_second: rates.ratePerSecond,
    rate_per_minute: rates.ratePerMinute,
    rate_per_hour: rates.ratePerHour,
    rate_per_day: rates.ratePerDay,
    rate_per_week: rates.ratePerWeek,
    rate_per_year: rates.ratePerYear,
    methodology: {
      interpolation: `Projected real-time interpolation from the trailing ${rates.windowObservations} official Treasury observations.`,
      population_basis: populationEstimate?.dataset
        ? `${populationEstimate.dataset} table ${populationEstimate.series}`
        : null,
      official_series: 'Debt to the Penny',
    },
  };
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

  const sharedAfterLock = await cacheGetJson(feedDef.cacheKey);
  if (validateData(sharedAfterLock?.data)) {
    memCache.set(feedDef.cacheKey, sharedAfterLock);
    if (isFreshPayload(sharedAfterLock)) {
      return sharedAfterLock;
    }
    return stalePayload(
      sharedAfterLock,
      'Serving stale payload while shared refresh completes',
    );
  }

  const staleSource = validateData(shared?.data)
    ? shared
    : (validateData(fromMemory?.data) ? fromMemory : null);

  if (staleSource) {
    return stalePayload(
      staleSource,
      'Serving stale payload while upstream refresh lock settles',
    );
  }

  try {
    return await refreshFeed(feedKey, fetchData);
  } catch (error) {
    const staleFallback = validateData(shared?.data)
      ? shared
      : (validateData(fromMemory?.data) ? fromMemory : null);

    if (staleFallback) {
      return stalePayload(
        staleFallback,
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

function getFeatureCountryCode(feature) {
  const primary = String(feature?.properties?.ISO_A2 || feature?.properties?.iso_a2 || feature?.properties?.['ISO3166-1-Alpha-2'] || '').toUpperCase();
  const fallback = String(feature?.properties?.ISO_A2_EH || feature?.properties?.ADM0_A3_US || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(primary)) return primary;
  if (/^[A-Z]{2}$/.test(fallback)) return fallback;
  return primary || fallback;
}

function getFeatureCountryName(feature, idx) {
  return String(
    feature?.properties?.ADMIN
    || feature?.properties?.NAME
    || feature?.properties?.name
    || `Country ${idx + 1}`,
  ).trim();
}

function createBbox() {
  return {
    minLon: Infinity,
    minLat: Infinity,
    maxLon: -Infinity,
    maxLat: -Infinity,
  };
}

function updateBbox(bbox, lon, lat) {
  bbox.minLon = Math.min(bbox.minLon, lon);
  bbox.minLat = Math.min(bbox.minLat, lat);
  bbox.maxLon = Math.max(bbox.maxLon, lon);
  bbox.maxLat = Math.max(bbox.maxLat, lat);
}

function computeRingBbox(ring) {
  const bbox = createBbox();
  ring.forEach((point) => {
    const lon = Number(point?.[0]);
    const lat = Number(point?.[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
    updateBbox(bbox, lon, lat);
  });
  return bbox;
}

function bboxContainsPoint(bbox, lon, lat) {
  return lon >= bbox.minLon && lon <= bbox.maxLon && lat >= bbox.minLat && lat <= bbox.maxLat;
}

function normalizeRing(ring) {
  if (!Array.isArray(ring) || ring.length < 4) return null;
  const normalized = ring
    .map((point) => {
      const lon = Number(point?.[0]);
      const lat = Number(point?.[1]);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      return [lon, lat];
    })
    .filter(Boolean);

  if (normalized.length < 4) return null;

  const bbox = computeRingBbox(normalized);
  return {
    points: normalized,
    bbox,
    centroid: getPolygonCentroid(normalized, bbox),
    planarArea: getRingPlanarArea(normalized),
  };
}

function getRingPlanarArea(points) {
  if (!Array.isArray(points) || points.length < 4) return 0;
  let area = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    area += (xj * yi) - (xi * yj);
  }
  return Math.abs(area / 2);
}

function getPolygonCentroid(points, fallbackBbox = null) {
  if (!Array.isArray(points) || points.length < 4) {
    const bbox = fallbackBbox || createBbox();
    return {
      lon: (bbox.minLon + bbox.maxLon) / 2,
      lat: (bbox.minLat + bbox.maxLat) / 2,
    };
  }

  let areaTwice = 0;
  let centroidLon = 0;
  let centroidLat = 0;

  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const factor = (xj * yi) - (xi * yj);
    areaTwice += factor;
    centroidLon += (xj + xi) * factor;
    centroidLat += (yj + yi) * factor;
  }

  if (Math.abs(areaTwice) < 1e-9) {
    const bbox = fallbackBbox || computeRingBbox(points);
    return {
      lon: (bbox.minLon + bbox.maxLon) / 2,
      lat: (bbox.minLat + bbox.maxLat) / 2,
    };
  }

  return {
    lon: centroidLon / (3 * areaTwice),
    lat: centroidLat / (3 * areaTwice),
  };
}

function normalizePolygonSet(coordinates) {
  if (!Array.isArray(coordinates) || !coordinates.length) return null;
  const rings = coordinates.map(normalizeRing).filter(Boolean);
  if (!rings.length) return null;

  const bbox = createBbox();
  rings.forEach((ring) => {
    updateBbox(bbox, ring.bbox.minLon, ring.bbox.minLat);
    updateBbox(bbox, ring.bbox.maxLon, ring.bbox.maxLat);
  });

  const outerRing = rings[0];
  return {
    bbox,
    rings,
    centroid: outerRing?.centroid || getPolygonCentroid([], bbox),
    planarArea: Math.max(outerRing?.planarArea || 0, 0),
  };
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = (Math.sin(dLat / 2) ** 2)
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * (Math.sin(dLon / 2) ** 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildCountryGeometryIndex(geoJson) {
  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];
  return features
    .map((feature, idx) => {
      const geometry = feature?.geometry;
      const code = getFeatureCountryCode(feature);
      const name = getFeatureCountryName(feature, idx);
      if (!code || !geometry) return null;

      const polygonSets = [];
      if (geometry.type === 'Polygon') {
        const polygon = normalizePolygonSet(geometry.coordinates);
        if (polygon) polygonSets.push(polygon);
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygonCoords) => {
          const polygon = normalizePolygonSet(polygonCoords);
          if (polygon) polygonSets.push(polygon);
        });
      }

      if (!polygonSets.length) return null;

      const bbox = createBbox();
      polygonSets.forEach((polygon) => {
        updateBbox(bbox, polygon.bbox.minLon, polygon.bbox.minLat);
        updateBbox(bbox, polygon.bbox.maxLon, polygon.bbox.maxLat);
      });

      return {
        code,
        name,
        bbox,
        polygons: polygonSets,
        centroid: getPolygonCentroid([], bbox),
      };
    })
    .filter(Boolean);
}

function isPointOnSegment(lon, lat, lon1, lat1, lon2, lat2) {
  const cross = (lat - lat1) * (lon2 - lon1) - (lon - lon1) * (lat2 - lat1);
  if (Math.abs(cross) > 1e-10) return false;

  const dot = (lon - lon1) * (lon2 - lon1) + (lat - lat1) * (lat2 - lat1);
  if (dot < 0) return false;

  const squaredLength = ((lon2 - lon1) ** 2) + ((lat2 - lat1) ** 2);
  return dot <= squaredLength;
}

function pointInRing(lon, lat, ring) {
  if (!bboxContainsPoint(ring.bbox, lon, lat)) return false;

  let inside = false;
  const points = ring.points;

  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];

    if (isPointOnSegment(lon, lat, xi, yi, xj, yj)) {
      return true;
    }

    const intersects = ((yi > lat) !== (yj > lat))
      && (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);

    if (intersects) inside = !inside;
  }

  return inside;
}

function pointInPolygon(lon, lat, polygon) {
  if (!bboxContainsPoint(polygon.bbox, lon, lat)) return false;
  const [outerRing, ...holes] = polygon.rings;
  if (!outerRing || !pointInRing(lon, lat, outerRing)) return false;
  return !holes.some((hole) => pointInRing(lon, lat, hole));
}

function bboxArea(bbox) {
  if (!bbox) return Infinity;
  const width = Math.max(0, bbox.maxLon - bbox.minLon);
  const height = Math.max(0, bbox.maxLat - bbox.minLat);
  return width * height;
}

function locateCountryCandidates(countryIndex, lon, lat) {
  const matches = [];
  for (const country of countryIndex) {
    if (!bboxContainsPoint(country.bbox, lon, lat)) continue;

    for (const polygon of country.polygons) {
      if (!pointInPolygon(lon, lat, polygon)) continue;
      matches.push({
        country_code: country.code,
        country_name: country.name,
        polygon_bbox_area: bboxArea(polygon.bbox),
        polygon_planar_area: polygon.planarArea || bboxArea(polygon.bbox),
        centroid_distance_km: haversineKm(lat, lon, polygon.centroid.lat, polygon.centroid.lon),
      });
      break;
    }
  }

  matches.sort((a, b) => {
    if (a.centroid_distance_km !== b.centroid_distance_km) {
      return a.centroid_distance_km - b.centroid_distance_km;
    }
    if (a.polygon_planar_area !== b.polygon_planar_area) {
      return a.polygon_planar_area - b.polygon_planar_area;
    }
    return a.polygon_bbox_area - b.polygon_bbox_area;
  });

  return matches;
}

function getResolutionConfidence(matches) {
  if (!matches.length) return 'none';
  if (matches.length === 1) return 'high';

  const [best, second] = matches;
  const bestDistance = Math.max(best.centroid_distance_km, 0.0001);
  const secondDistance = Math.max(second.centroid_distance_km, 0.0001);
  const distanceRatio = secondDistance / bestDistance;
  const areaRatio = Math.max(second.polygon_planar_area || 0.0001, 0.0001) / Math.max(best.polygon_planar_area || 0.0001, 0.0001);

  if (distanceRatio >= 3 || areaRatio >= 8) return 'high';
  if (distanceRatio >= 1.5 || areaRatio >= 3) return 'medium';
  return 'low';
}

function normalizeBtcMapCountryAreaResponse(value) {
  if (!Array.isArray(value)) return null;
  const row = value.find((item) => String(item?.tags?.type || '').toLowerCase() === 'country') || value[0];
  const code = String(row?.tags?.iso_a2 || '').toUpperCase();
  const name = String(row?.tags?.name || '').trim();
  if (!/^[A-Z]{2}$/.test(code) || !name) return null;
  return {
    country_code: code,
    country_name: name,
    area_id: Number(row?.id) || null,
    resolved_at: normalizeTimestamp(),
  };
}

async function fetchBtcMapCountryAreaForPlace(placeId) {
  const payload = await fetchJsonWithTimeout(`https://api.btcmap.org/v4/places/${placeId}/areas?type=country`);
  return normalizeBtcMapCountryAreaResponse(payload);
}

function normalizePlaceCountryResolutionMap(value) {
  const rawEntries = value?.entries;
  if (!rawEntries || typeof rawEntries !== 'object') {
    return {
      updated_at: null,
      entries: {},
    };
  }

  const entries = Object.fromEntries(
    Object.entries(rawEntries)
      .filter(([, row]) => row?.country_code && row?.country_name)
      .map(([placeId, row]) => [String(placeId), {
        country_code: String(row.country_code || '').toUpperCase(),
        country_name: String(row.country_name || '').trim(),
        area_id: Number(row.area_id) || null,
        resolved_at: row.resolved_at ? String(row.resolved_at) : null,
      }]),
  );

  return {
    updated_at: value?.updated_at ? String(value.updated_at) : null,
    entries,
  };
}

async function getBtcMapPlaceCountryResolutionMap() {
  const fromMemory = memCache.get(BTCMAP_PLACE_COUNTRY_CACHE_KEY);
  if (fromMemory?.entries) return normalizePlaceCountryResolutionMap(fromMemory);

  const shared = await cacheGetJson(BTCMAP_PLACE_COUNTRY_CACHE_KEY);
  const normalized = normalizePlaceCountryResolutionMap(shared);
  memCache.set(BTCMAP_PLACE_COUNTRY_CACHE_KEY, normalized);
  return normalized;
}

async function saveBtcMapPlaceCountryResolutionMap(mapPayload) {
  const normalized = normalizePlaceCountryResolutionMap(mapPayload);
  normalized.updated_at = normalizeTimestamp();
  memCache.set(BTCMAP_PLACE_COUNTRY_CACHE_KEY, normalized);
  await cacheSetJson(BTCMAP_PLACE_COUNTRY_CACHE_KEY, normalized, { ttlSeconds: BTCMAP_PLACE_COUNTRY_CACHE_TTL_SECONDS });
  return normalized;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const currentIndex = cursor;
      cursor += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function resolveBtcMapFallbackCountries(candidates, cachedResolutionMap) {
  const resolvedMap = new Map();
  candidates.forEach((candidate) => {
    const cached = cachedResolutionMap.entries[String(candidate.place.id)];
    if (cached?.country_code && cached?.country_name) {
      resolvedMap.set(candidate.place.id, cached);
    }
  });

  const missingCandidates = candidates.filter((candidate) => !resolvedMap.has(candidate.place.id));
  if (!missingCandidates.length) {
    return {
      resolvedMap,
      updatedResolutionMap: cachedResolutionMap,
      cache_hits: resolvedMap.size,
      cache_misses: 0,
      new_entries: 0,
    };
  }

  const fallbackRows = await mapWithConcurrency(
    missingCandidates,
    BTCMAP_AREA_LOOKUP_CONCURRENCY,
    async (candidate) => {
      try {
        const resolved = await fetchBtcMapCountryAreaForPlace(candidate.place.id);
        return resolved ? [candidate.place.id, resolved] : null;
      } catch {
        return null;
      }
    },
  );

  const newEntries = fallbackRows.filter(Boolean);
  newEntries.forEach(([placeId, resolved]) => {
    resolvedMap.set(placeId, resolved);
    cachedResolutionMap.entries[String(placeId)] = resolved;
  });

  const updatedResolutionMap = newEntries.length
    ? await saveBtcMapPlaceCountryResolutionMap(cachedResolutionMap)
    : cachedResolutionMap;

  return {
    resolvedMap,
    updatedResolutionMap,
    cache_hits: candidates.length - missingCandidates.length,
    cache_misses: missingCandidates.length,
    new_entries: newEntries.length,
  };
}

function buildCountryAccumulator(map, countryCode, countryName) {
  return map.get(countryCode) || {
    country_code: countryCode,
    country_name: countryName,
    businesses: 0,
    verified_businesses: 0,
  };
}

function addCountryAggregate(map, countryCode, countryName, verified) {
  const existing = buildCountryAccumulator(map, countryCode, countryName);
  existing.businesses += 1;
  if (verified) existing.verified_businesses += 1;
  map.set(countryCode, existing);
}

function buildBtcMapCountryDiagnostics(places, precomputedMatches, fallbackMap, fallbackStats, resolutionMap) {
  const diagnostics = {
    zero_match_places: 0,
    exact_match_places: 0,
    ambiguous_match_places: 0,
    low_confidence_places: 0,
    fallback_candidates: 0,
    fallback_hits: 0,
    fallback_misses: 0,
    exact_country_cache_size: Object.keys(resolutionMap?.entries || {}).length,
    exact_country_cache_hits: fallbackStats?.cache_hits || 0,
    exact_country_cache_misses: fallbackStats?.cache_misses || 0,
    exact_country_cache_new_entries: fallbackStats?.new_entries || 0,
    overlapping_country_pairs: {},
    sample_ambiguous_places: [],
    sample_unmatched_places: [],
  };

  places.forEach((place, index) => {
    const matches = precomputedMatches[index] || [];
    const confidence = getResolutionConfidence(matches);
    if (!matches.length) diagnostics.zero_match_places += 1;
    if (matches.length === 1) diagnostics.exact_match_places += 1;
    if (matches.length > 1) diagnostics.ambiguous_match_places += 1;
    if (confidence === 'low') diagnostics.low_confidence_places += 1;

    const needsFallback = !matches.length || confidence === 'low';
    if (needsFallback) diagnostics.fallback_candidates += 1;
    if (needsFallback && fallbackMap.has(place.id)) diagnostics.fallback_hits += 1;
    if (needsFallback && !fallbackMap.has(place.id)) diagnostics.fallback_misses += 1;

    if (matches.length > 1) {
      const pairKey = matches.slice(0, 3).map((row) => row.country_code).join(' > ');
      diagnostics.overlapping_country_pairs[pairKey] = (diagnostics.overlapping_country_pairs[pairKey] || 0) + 1;
      if (diagnostics.sample_ambiguous_places.length < 20) {
        diagnostics.sample_ambiguous_places.push({
          id: place.id,
          name: place.name || `Place ${place.id}`,
          lat: place.lat,
          lon: place.lon,
          confidence,
          candidates: matches.slice(0, 3).map((row) => ({
            country_code: row.country_code,
            country_name: row.country_name,
            centroid_distance_km: Number(row.centroid_distance_km.toFixed(2)),
          })),
          fallback_country_code: fallbackMap.get(place.id)?.country_code || null,
        });
      }
    }

    if (!matches.length && diagnostics.sample_unmatched_places.length < 20) {
      diagnostics.sample_unmatched_places.push({
        id: place.id,
        name: place.name || `Place ${place.id}`,
        lat: place.lat,
        lon: place.lon,
        fallback_country_code: fallbackMap.get(place.id)?.country_code || null,
      });
    }
  });

  diagnostics.top_overlaps = Object.entries(diagnostics.overlapping_country_pairs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([pair, count]) => ({ pair, count }));
  delete diagnostics.overlapping_country_pairs;

  return diagnostics;
}

function getCandidateDistanceMargin(matches) {
  if (!matches.length) return -1;
  if (matches.length === 1) return Number.POSITIVE_INFINITY;
  return matches[1].centroid_distance_km - matches[0].centroid_distance_km;
}

function buildFallbackCandidateQueue(places, precomputedMatches) {
  const allCandidates = places
    .map((place, index) => {
      const matches = precomputedMatches[index] || [];
      const confidence = getResolutionConfidence(matches);
      const needsFallback = !matches.length || confidence === 'low';
      if (!needsFallback) return null;
      return {
        place,
        matches,
        confidence,
        top_country_code: matches[0]?.country_code || null,
        distance_margin_km: getCandidateDistanceMargin(matches),
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const aUnmatched = a.matches.length === 0 ? 0 : 1;
      const bUnmatched = b.matches.length === 0 ? 0 : 1;
      if (aUnmatched !== bUnmatched) return aUnmatched - bUnmatched;
      if (a.distance_margin_km !== b.distance_margin_km) return a.distance_margin_km - b.distance_margin_km;
      return b.matches.length - a.matches.length;
    });

  const queue = [];
  const coveredCodes = new Set();

  allCandidates.forEach((candidate) => {
    if (candidate.top_country_code && !coveredCodes.has(candidate.top_country_code) && queue.length < BTCMAP_MAX_FALLBACK_AREA_LOOKUPS) {
      queue.push(candidate);
      coveredCodes.add(candidate.top_country_code);
    }
  });

  for (const candidate of allCandidates) {
    if (queue.length >= BTCMAP_MAX_FALLBACK_AREA_LOOKUPS) break;
    if (queue.some((row) => row.place.id === candidate.place.id)) continue;
    queue.push(candidate);
  }

  return queue;
}

function normalizeBtcMapPlace(row) {
  const id = Number(row?.id);
  const lat = Number(row?.lat);
  const lon = Number(row?.lon);
  if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    id,
    lat,
    lon,
    name: String(row?.name || '').trim(),
    verified_at: row?.verified_at ? String(row.verified_at) : null,
    updated_at: row?.updated_at ? String(row.updated_at) : null,
  };
}

async function fetchBtcMapPlacesPage(updatedSince, limit) {
  const params = new URLSearchParams({
    fields: 'id,lat,lon,name,verified_at,updated_at',
    updated_since: updatedSince,
    limit: String(limit),
  });

  return fetchJsonWithTimeout(`https://api.btcmap.org/v4/places?${params.toString()}`);
}

async function fetchAllBtcMapPlaces() {
  const limit = 5000;
  const maxPages = 20;
  const seenIds = new Set();
  const places = [];
  let cursor = '1970-01-01T00:00:00Z';

  for (let page = 0; page < maxPages; page += 1) {
    const batch = await fetchBtcMapPlacesPage(cursor, limit);
    if (!Array.isArray(batch) || batch.length === 0) break;

    let addedCount = 0;
    batch.forEach((row) => {
      const place = normalizeBtcMapPlace(row);
      if (!place || seenIds.has(place.id)) return;
      seenIds.add(place.id);
      places.push(place);
      addedCount += 1;
    });

    if (batch.length < limit) break;

    const lastUpdatedAt = String(batch[batch.length - 1]?.updated_at || '');
    if (!lastUpdatedAt || addedCount === 0) break;
    cursor = lastUpdatedAt;
  }

  return places;
}

async function aggregateBtcMapBusinessesByCountry(places, countriesGeoJson) {
  const countryIndex = buildCountryGeometryIndex(countriesGeoJson);
  const countryMap = new Map();
  let matchedBusinesses = 0;
  let verifiedBusinesses = 0;
  let unmatchedBusinesses = 0;
  let latestUpdatedAt = null;

  const precomputedMatches = places.map((place) => locateCountryCandidates(countryIndex, place.lon, place.lat));
  const fallbackCandidates = buildFallbackCandidateQueue(places, precomputedMatches);
  const cachedResolutionMap = await getBtcMapPlaceCountryResolutionMap();
  const fallbackResolution = await resolveBtcMapFallbackCountries(fallbackCandidates, cachedResolutionMap);
  const fallbackMap = fallbackResolution.resolvedMap;

  places.forEach((place, index) => {
    const matches = precomputedMatches[index];
    const fallback = fallbackMap.get(place.id) || null;
    const country = fallback || matches[0] || null;
    const verified = Boolean(place.verified_at);
    const updatedAtMs = Date.parse(place.updated_at || '');
    if (Number.isFinite(updatedAtMs)) {
      latestUpdatedAt = latestUpdatedAt == null ? updatedAtMs : Math.max(latestUpdatedAt, updatedAtMs);
    }

    if (!country) {
      unmatchedBusinesses += 1;
      return;
    }

    matchedBusinesses += 1;
    if (verified) verifiedBusinesses += 1;

    addCountryAggregate(
      countryMap,
      country.country_code || country.code,
      country.country_name || country.name,
      verified,
    );
  });

  const countryCounts = [...countryMap.values()].sort((a, b) => b.businesses - a.businesses);
  const countryLeader = countryCounts[0] || null;
  const diagnostics = buildBtcMapCountryDiagnostics(
    places,
    precomputedMatches,
    fallbackMap,
    fallbackResolution,
    fallbackResolution.updatedResolutionMap,
  );

  return {
    summary: {
      total_places: places.length,
      matched_places: matchedBusinesses,
      unmatched_places: unmatchedBusinesses,
      verified_places: verifiedBusinesses,
      countries_covered: countryCounts.length,
      leader_country_code: countryLeader?.country_code || null,
      leader_country_name: countryLeader?.country_name || null,
      leader_businesses: countryLeader?.businesses || 0,
      latest_place_update_at: latestUpdatedAt ? normalizeTimestamp(new Date(latestUpdatedAt)) : null,
      resolution_method: 'polygon-perimeter + selective btcmap country-area fallback',
    },
    diagnostics,
    country_counts: countryCounts,
  };
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

async function getCountriesGeoHighResPayload() {
  return getFeed(
    'geoCountriesHighRes',
    async () => fetchJsonWithTimeout('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson'),
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

export async function getBtcMapBusinessesByCountryPayload() {
  return getFeed(
    'btcMapBusinessesByCountry',
    async () => {
      const [places, countriesGeoPayload] = await Promise.all([
        fetchAllBtcMapPlaces(),
        getCountriesGeoHighResPayload(),
      ]);

      const countriesGeo = countriesGeoPayload?.data || countriesGeoPayload;
      return aggregateBtcMapBusinessesByCountry(places, countriesGeo);
    },
    validateCountryBusinessPayload,
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

const VALID_HISTORY_INTERVALS = new Set(['5m', '15m', '30m', '1h', '1d']);
const BINANCE_MAX_CANDLES = 1000;

function candlesNeeded(interval, days) {
  if (interval === '5m')  return days * 288;
  if (interval === '15m') return days * 96;
  if (interval === '30m') return days * 48;
  if (interval === '1h')  return days * 24;
  return days;
}

function historyFeedKey(days, interval) {
  return `binanceHistory_${days}_${interval}`;
}

export async function getBinanceBtcHistoryPayload({ days = 365, interval: rawInterval = '1d' } = {}) {
  const normalizedDays = [1, 7, 30, 90, 365, 1825].includes(Number(days)) ? Number(days) : 365;
  const interval = VALID_HISTORY_INTERVALS.has(rawInterval) ? rawInterval : '1d';
  const key = historyFeedKey(normalizedDays, interval);
  const needed = candlesNeeded(interval, normalizedDays);
  const startTime = Date.now() - normalizedDays * DAY_MS;

  return getFeed(
    key,
    async () => {
      let lastError = null;

      for (const base of BINANCE_KLINES_BASE_URLS) {
        try {
          const allRows = [];
          let fetchStart = Math.round(startTime);
          let remaining = needed;

          while (remaining > 0) {
            const batchLimit = Math.min(remaining, BINANCE_MAX_CANDLES);
            const params = new URLSearchParams({
              symbol: 'BTCUSDT',
              interval,
              startTime: String(fetchStart),
              limit: String(batchLimit),
            });

            const payload = await fetchJsonWithTimeout(`${base}?${params.toString()}`);
            if (!Array.isArray(payload) || payload.length === 0) break;

            allRows.push(...payload);
            remaining -= payload.length;

            if (payload.length < batchLimit) break;
            fetchStart = Number(payload[payload.length - 1][0]) + 1;
          }

          const points = allRows
            .map((row) => {
              const ts = Number(row?.[0]);
              const price = Number(row?.[4]);
              if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0) return null;
              return toChartPoint(ts, price);
            })
            .filter(Boolean);

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

async function getUsNationalDebtSeriesPayload() {
  return getFeed(
    'usNationalDebtSeries',
    async () => {
      const params = new URLSearchParams({
        sort: '-record_date',
        'page[number]': '1',
        'page[size]': String(US_NATIONAL_DEBT_SERIES_PAGE_SIZE),
        fields: 'record_date,tot_pub_debt_out_amt,debt_held_public_amt,intragov_hold_amt',
      });
      const payload = await fetchJsonWithTimeout(`https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?${params.toString()}`);
      const normalized = normalizeDebtToPennyRows(payload);
      if (!validateUsNationalDebtSeries(normalized)) {
        throw new PublicFeedError('Debt to the Penny payload is incomplete');
      }
      return normalized;
    },
    validateUsNationalDebtSeries,
  );
}

async function getUsPopulationEstimatePayload() {
  return getFeed(
    'usPopulationEstimate',
    async () => {
      const currentYear = new Date().getUTCFullYear();
      let lastError = null;

      for (let year = currentYear - 1; year >= ACS_POPULATION_MIN_YEAR; year -= 1) {
        try {
          const payload = await fetchJsonWithTimeout(`https://api.census.gov/data/${year}/acs/acs1?get=NAME,B01003_001E&for=us:1`);
          const normalized = normalizeUsPopulationEstimate(payload, year);
          if (validateUsPopulationEstimate(normalized)) {
            return normalized;
          }
        } catch (error) {
          lastError = error;
        }
      }

      if (lastError instanceof PublicFeedError) {
        throw lastError;
      }

      throw new PublicFeedError('U.S. Census population estimate unavailable');
    },
    validateUsPopulationEstimate,
  );
}

export async function getUsNationalDebtPayload() {
  const [debtPayload, populationPayload] = await Promise.all([
    getUsNationalDebtSeriesPayload(),
    getUsPopulationEstimatePayload(),
  ]);

  const projectionBaseAt = String(debtPayload?.updated_at || normalizeTimestamp());
  const populationYear = Number(populationPayload?.data?.dataset_year);
  const populationUrl = Number.isFinite(populationYear)
    ? `https://api.census.gov/data/${populationYear}/acs/acs1?get=NAME,B01003_001E&for=us:1`
    : 'https://api.census.gov/data/{year}/acs/acs1?get=NAME,B01003_001E&for=us:1';
  const data = buildUsNationalDebtSnapshot(
    Array.isArray(debtPayload?.data) ? debtPayload.data : [],
    populationPayload?.data || null,
    projectionBaseAt,
  );

  return {
    updated_at: projectionBaseAt,
    next_update_at: String(debtPayload?.next_update_at || normalizeTimestamp(new Date(Date.now() + 15 * 60_000))),
    source_provider: 'U.S. Treasury FiscalData + U.S. Census ACS 1-Year',
    source_url: `${debtPayload?.source_url || 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny'} + ${populationUrl}`,
    is_fallback: Boolean(debtPayload?.is_fallback || populationPayload?.is_fallback),
    fallback_note: [debtPayload?.fallback_note, populationPayload?.fallback_note].filter(Boolean).join(' | ') || null,
    refresh_policy: {
      min_interval_ms: FEED_DEFS.usNationalDebtSeries.refreshMs,
      hard_minute_limit: FEED_DEFS.usNationalDebtSeries.hardMinuteLimit || null,
      hard_daily_limit: FEED_DEFS.usNationalDebtSeries.hardDailyLimit || null,
      safe_minute_budget: FEED_DEFS.usNationalDebtSeries.safeMinuteBudget || null,
      safe_daily_budget: FEED_DEFS.usNationalDebtSeries.safeDailyBudget || null,
    },
    data,
  };
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
