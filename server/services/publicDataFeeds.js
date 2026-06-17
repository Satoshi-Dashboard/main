import { cacheGetJson, cacheSetJson, withCacheLock } from '../core/runtimeCache.js';
import { getBtcRates } from './btcRates.js';
import {
  fetchJsonWithTimeout,
  fetchTextWithTimeout,
  _callBitcoinRpcOverTor,
  fetchBtcMapCountryAreaForPlace,
  fetchAllBtcMapPlaces,
  fetchBinanceCloseAt,
} from '../shared/utils/fetchUtils.js';
import fs from 'node:fs';
import path from 'node:path';
import {
  SUPABASE_PROJECT_URL,
  fetchSupabaseEdgeFunctionJson,
} from '../shared/adapters/supabaseAdapter.js';
import {
  _patchFranceOverseas,
  aggregateBtcMapBusinessesByCountry,
  getBtcMapPlaceCountryResolutionMap,
  saveBtcMapPlaceCountryResolutionMap,
  resolveBtcMapFallbackCountries,
} from '../shared/utils/geoUtils.js';
import { normalizeTimestamp, parseIsoDate } from '../shared/utils/timeUtils.js';
import {
  normalizeOfficialMempoolUsage,
  estimateBitcoinCirculatingSupply,
  buildS15GoldSnapshot,
  toChartPoint,
  validateArray,
  validateObject,
  validateS15GoldPayload,
  validateCountryBusinessPayload,
  validateUsNationalDebtSeries,
  validateUsPopulationEstimate,
  validateJohoeHistoryPayload,
  validateJohoeLatestPayload,
  normalizeJohoeHistoryResponse,
  normalizeJohoeLatestResponse,
  isJohoeSourceFresh,
  assertFreshJohoeHistoryPayload,
  assertFreshJohoeLatestPayload,
  stripJohoeBandMeta,
  buildJohoeViewPoint,
  buildJohoeCompactPoints,
  downsampleJohoeCompactPoints,
  normalizeDebtToPennyRows,
  normalizeUsPopulationEstimate,
  buildUsNationalDebtSnapshot,
  parseBigMacUsd,
  candlesNeeded,
  historyFeedKey,
  US_NATIONAL_DEBT_SERIES_PAGE_SIZE,
  ACS_POPULATION_MIN_YEAR,
  BTC_GENESIS_TS,
  BTC_CURRENT_HALVING_REWARD,
  JOHOE_BTC_QUEUE_BUCKET_BOUNDARIES,
  JOHOE_BTC_QUEUE_GROUPS,
} from '../shared/utils/normalizeUtils.js';
import { SatoshiBaseError, PublicFeedError } from '../shared/errors/SatoshiBaseError.js';

const DAY_MS = 86_400_000;
const BTCMAP_PLACE_COUNTRY_CACHE_KEY = 'public:btcmap:place-country-map';
const BTCMAP_PLACE_COUNTRY_CACHE_TTL_SECONDS = 90 * 24 * 60 * 60;
const BTCMAP_MAX_FALLBACK_AREA_LOOKUPS = 120;
const BTCMAP_INDIVIDUAL_CACHE_KEY = 'public:btcmap:businesses-individual';
const BTCMAP_INDIVIDUAL_CACHE_TTL_SECONDS = 8 * 60 * 60; // 8 h — same refresh cadence as by-country feed
const BTCMAP_AREA_LOOKUP_CONCURRENCY = 6;
const BINANCE_KLINES_BASE_URLS = [
  'https://api.binance.com/api/v3/klines',
  'https://api.binance.us/api/v3/klines',
];
const SCRAPER_BASE_URL = String(process.env.SCRAPER_BASE_URL || 'https://api.zatobox.io').trim();
const SUPABASE_EDGE_FUNCTIONS_BASE_URL = SUPABASE_PROJECT_URL ? `${SUPABASE_PROJECT_URL}/functions/v1` : '';
const S15_GOLD_SCRAPER_PATH = '/api/scrape/companiesmarketcap-gold';
const S04_KNOT_API_URL = String(process.env.KNOT_API_URL || 'https://knotapi.zatobox.io/api/v1/init-data').trim();
const S04_MEMPOOL_SPACE_USAGE_SCRAPER_PATH = '/api/scrape/mempool-space-memory-usage';
const S04_MEMPOOL_SPACE_TRANSACTION_FEES_SCRAPER_PATH = '/api/scrape/mempool-space-transaction-fees';
const S04_MEMPOOL_SPACE_UNCONFIRMED_TRANSACTIONS_SCRAPER_PATH = '/api/scrape/mempool-space-unconfirmed-transactions';
const JOHOE_BTC_QUEUE_HISTORY_PATH = '/api/scrape/johoe-btc-queue/history';
const JOHOE_BTC_QUEUE_LATEST_PATH = '/api/scrape/johoe-btc-queue/latest';
const JOHOE_BTC_QUEUE_HISTORY_FUNCTION = 'johoe-btc-queue-history';
const JOHOE_BTC_QUEUE_LATEST_FUNCTION = 'johoe-btc-queue-latest';
const JOHOE_BTC_QUEUE_CONFIG = {
  range: '24h',
  historyFeedKey: 'johoeBtcQueueHistory24h',
  cacheKey: 'public:johoe:btc-queue:24h:composed',
  lockKey: 'public:johoe:btc-queue:24h:composed:refresh',
  fallbackTtlSeconds: 120,
  bootstrapPointBudget: 180,
};

const memCache = new Map();
const composedCache = new Map();
const S15_COMPOSED_CACHE_KEY = 'public:s15:btc-vs-gold:composed';
const S15_COMPOSED_LOCK_KEY = 'public:s15:btc-vs-gold:composed:refresh';
const US_DEBT_COMPOSED_CACHE_KEY = 'public:us-national-debt:composed';
const US_DEBT_COMPOSED_LOCK_KEY = 'public:us-national-debt:composed:refresh';

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
  mempoolOfficialUsage: {
    cacheKey: 'public:mempool:official-usage',
    lockKey: 'public:mempool:official-usage:refresh',
    refreshMs: 30_000,
    sourceProvider: 'mempool.space-zatobox + mempool.space',
    sourceUrl: `${SCRAPER_BASE_URL}${S04_MEMPOOL_SPACE_USAGE_SCRAPER_PATH} | https://mempool.space/api/v1/init-data`,
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
  mempoolTransactionFees: {
    cacheKey: 'public:mempool:transaction-fees',
    lockKey: 'public:mempool:transaction-fees:refresh',
    refreshMs: 30_000,
    sourceProvider: 'mempool.space-zatobox + mempool.space',
    sourceUrl: `${SCRAPER_BASE_URL}${S04_MEMPOOL_SPACE_TRANSACTION_FEES_SCRAPER_PATH} | https://mempool.space/api/v1/fees/recommended`,
    safeMinuteBudget: 2,
    safeDailyBudget: 2880,
  },
  mempoolUnconfirmedTransactions: {
    cacheKey: 'public:mempool:unconfirmed-transactions',
    lockKey: 'public:mempool:unconfirmed-transactions:refresh',
    refreshMs: 10_000,
    sourceProvider: 'mempool.space-zatobox + mempool.space',
    sourceUrl: `${SCRAPER_BASE_URL}${S04_MEMPOOL_SPACE_UNCONFIRMED_TRANSACTIONS_SCRAPER_PATH} | https://mempool.space/api/v1/mempool`,
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
  lightningChannelsGeo: {
    cacheKey: 'public:lightning:channels-geo',
    lockKey: 'public:lightning:channels-geo:refresh',
    refreshMs: 5 * 60_000,          // 5 min — channels change less often than node counts
    sourceProvider: 'mempool.space',
    sourceUrl: 'https://mempool.space/api/v1/lightning/channels-geo',
    safeMinuteBudget: 1,
    safeDailyBudget: 288,
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
  mempoolNode: {
    cacheKey: 'public:mempool:node',
    lockKey: 'public:mempool:node:refresh',
    refreshMs: 5_000,
    sourceProvider: 'knotapi.zatobox.io',
    sourceUrl: S04_KNOT_API_URL,
    safeMinuteBudget: 12,
    safeDailyBudget: 17_280,
  },
  johoeBtcQueueLatest: {
    cacheKey: 'public:johoe:btc-queue:latest',
    lockKey: 'public:johoe:btc-queue:latest:refresh',
    refreshMs: 60_000,
    sourceProvider: 'supabase edge + supabase postgres',
    sourceUrl: `${SUPABASE_EDGE_FUNCTIONS_BASE_URL}/${JOHOE_BTC_QUEUE_LATEST_FUNCTION}`,
    safeMinuteBudget: 1,
    safeDailyBudget: 1440,
  },
  johoeBtcQueueHistory24h: {
    cacheKey: 'public:johoe:btc-queue:history:24h',
    lockKey: 'public:johoe:btc-queue:history:24h:refresh',
    refreshMs: 60_000,
    sourceProvider: 'supabase edge + supabase postgres',
    sourceUrl: `${SUPABASE_EDGE_FUNCTIONS_BASE_URL}/${JOHOE_BTC_QUEUE_HISTORY_FUNCTION}?range=24h`,
    safeMinuteBudget: 1,
    safeDailyBudget: 1440,
  },
  s15GoldMarketCapCurrent: {
    cacheKey: 'public:s15:gold-market-cap:current',
    lockKey: 'public:s15:gold-market-cap:current:refresh',
    refreshMs: 15 * 60_000,
    sourceProvider: 'companiesmarketcap-zatobox',
    sourceUrl: `${SCRAPER_BASE_URL}${S15_GOLD_SCRAPER_PATH}`,
    safeMinuteBudget: 1,
    safeDailyBudget: 96,
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
  binanceHistory_2025_1d: {
    cacheKey: 'public:binance:btc-history:2025:1d',
    lockKey: 'public:binance:btc-history:2025:1d:refresh',
    refreshMs: 60 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
  binanceHistory_max_1d: {
    cacheKey: 'public:binance:btc-history:max:1d',
    lockKey: 'public:binance:btc-history:max:1d:refresh',
    refreshMs: 24 * 60 * 60_000,
    sourceProvider: 'binance',
    sourceUrl: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d',
    hardMinuteLimit: 1200,
    safeMinuteBudget: 1,
    safeDailyBudget: 24,
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

function getDef(feedKey) {
  const feed = FEED_DEFS[feedKey];
  if (feed) return feed;
  // Derive a definition for valid days/interval combinations without a static entry
  // (e.g. ?days=7 with the default '1d' interval builds binanceHistory_7_1d).
  const dynamicHistory = feedKey.match(/^binanceHistory_(\d+)_(5m|15m|30m|1h|1d)$/);
  if (dynamicHistory) {
    return {
      cacheKey: `public:binance:btc-history:${dynamicHistory[1]}:${dynamicHistory[2]}`,
      lockKey: `public:binance:btc-history:${dynamicHistory[1]}:${dynamicHistory[2]}:refresh`,
      refreshMs: 5 * 60_000,
      sourceProvider: 'binance',
      sourceUrl: `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${dynamicHistory[2]}`,
      hardMinuteLimit: 1200,
      safeMinuteBudget: 4,
      safeDailyBudget: 5760,
    };
  }
  throw new PublicFeedError(`Unknown feed: ${feedKey}`);
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

function isPayloadLikeFresh(payload, nowMs = Date.now()) {
  if (!payload || typeof payload !== 'object') return false;
  const nextUpdate = parseIsoDate(payload.next_update_at);
  return Boolean(nextUpdate && nowMs < nextUpdate.getTime());
}

function getComposedCacheTtlSeconds(payload, fallbackSeconds = 300, bufferSeconds = 120) {
  const nextUpdate = parseIsoDate(payload?.next_update_at);
  if (!nextUpdate) return fallbackSeconds;
  const ttlSeconds = Math.ceil(Math.max(30_000, (nextUpdate.getTime() - Date.now()) + (bufferSeconds * 1000)) / 1000);
  return Math.max(30, ttlSeconds);
}

async function getComposedPayload({
  cacheKey,
  lockKey,
  fallbackTtlSeconds,
  buildPayload,
  validatePayload = validateObject,
  staleWhileRefreshing,
  staleWhileRecovering,
}) {
  const fromMemory = composedCache.get(cacheKey);
  if (validatePayload(fromMemory) && isPayloadLikeFresh(fromMemory)) {
    return fromMemory;
  }

  const shared = await cacheGetJson(cacheKey);
  if (validatePayload(shared)) {
    composedCache.set(cacheKey, shared);
    if (isPayloadLikeFresh(shared)) {
      return shared;
    }
  }

  const refreshed = await withCacheLock(
    lockKey,
    async () => {
      const payload = await buildPayload();
      composedCache.set(cacheKey, payload);
      await cacheSetJson(cacheKey, payload, {
        ttlSeconds: getComposedCacheTtlSeconds(payload, fallbackTtlSeconds),
      });
      return payload;
    },
    { ttlSeconds: 30, waitMs: 3200, pollMs: 120 },
  ).catch(() => null);

  if (validatePayload(refreshed)) {
    return refreshed;
  }

  const sharedAfterLock = await cacheGetJson(cacheKey);
  if (validatePayload(sharedAfterLock)) {
    composedCache.set(cacheKey, sharedAfterLock);
    if (isPayloadLikeFresh(sharedAfterLock)) {
      return sharedAfterLock;
    }
    return stalePayload(sharedAfterLock, staleWhileRefreshing);
  }

  const staleSource = validatePayload(shared)
    ? shared
    : (validatePayload(fromMemory) ? fromMemory : null);

  if (staleSource) {
    return stalePayload(staleSource, staleWhileRefreshing);
  }

  try {
    const payload = await buildPayload();
    composedCache.set(cacheKey, payload);
    await cacheSetJson(cacheKey, payload, {
      ttlSeconds: getComposedCacheTtlSeconds(payload, fallbackTtlSeconds),
    });
    return payload;
  } catch (error) {
    const staleFallback = validatePayload(shared)
      ? shared
      : (validatePayload(fromMemory) ? fromMemory : null);
    if (staleFallback) {
      return stalePayload(staleFallback, staleWhileRecovering);
    }
    throw error;
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

export async function getMempoolOverviewPayload() {
  return getFeed(
    'mempoolOverview',
    async () => {
      const results = await Promise.allSettled([
        fetchJsonWithTimeout('https://mempool.space/api/v1/difficulty-adjustment'),
        // Primary: zatobox (granular decimals via WebSocket), Fallback: mempool.space
        fetchJsonWithTimeout(`${SCRAPER_BASE_URL}${S04_MEMPOOL_SPACE_TRANSACTION_FEES_SCRAPER_PATH}`, { timeoutMs: 8_000 })
          .catch(() => fetchJsonWithTimeout('https://mempool.space/api/v1/fees/recommended')),
        fetchJsonWithTimeout('https://mempool.space/api/v1/mining/hashrate/3d'),
        fetchJsonWithTimeout('https://mempool.space/api/mempool'),
        fetchJsonWithTimeout('https://api.alternative.me/fng/?limit=7'),
        fetchTextWithTimeout('https://mempool.space/api/blocks/tip/height', {
          headers: { Accept: 'text/plain' },
        }),
      ]);
      const [difficulty, fees, hashrate, mempool, fearGreed, heightText] = results
        .map((result) => (result.status === 'fulfilled' ? result.value : null));

      // Core mempool.space feeds are required; secondary sources degrade to null.
      if (!difficulty || !mempool) {
        throw new PublicFeedError('mempool.space core feeds unavailable');
      }

      return {
        difficulty,
        fees,
        hashrate,
        mempool,
        block_height: Number(heightText) || null,
        fear_greed: fearGreed,
      };
    },
    validateObject,
  );
}

export async function getMempoolOfficialUsagePayload() {
  return getFeed(
    'mempoolOfficialUsage',
    async () => {
      // Primary: zatobox scraper, Fallback: mempool.space
      const url = `${SCRAPER_BASE_URL}${S04_MEMPOOL_SPACE_USAGE_SCRAPER_PATH}`;
      const raw = await fetchJsonWithTimeout(url, { timeoutMs: 8_000 }).catch(async () => {
        const initData = await fetchJsonWithTimeout('https://mempool.space/api/v1/init-data', { timeoutMs: 8_000 });
        return initData?.mempoolInfo ?? initData;
      });
      return normalizeOfficialMempoolUsage(raw);
    },
    (value) => validateObject(value) && Number.isFinite(Number(value?.usage)) && Number.isFinite(Number(value?.maxmempool)),
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

/** Node mempool data from knotapi.zatobox.io/api/v1/init-data.
 *  Relevant fields are nested under `mempoolInfo` (mirrors Bitcoin Knots getmempoolinfo).
 */
export async function getMempoolNodePayload() {
  return getFeed(
    'mempoolNode',
    async () => {
      const raw = await fetchJsonWithTimeout(S04_KNOT_API_URL, { timeoutMs: 8_000 });

      const d = raw?.mempoolInfo ?? {};

      const n = (v) => (typeof v === 'number'  ? v : null);
      const b = (v) => (typeof v === 'boolean' ? v : null);
      const str = (v) => (typeof v === 'string'  ? v : null);

      return {
        usage:            n(d.usage),            // node RAM used by mempool (bytes)
        maxmempool:       n(d.maxmempool),        // max allowed RAM (bytes, default 300 MB)
        size:             n(d.size),              // number of txs in this node's mempool
        bytes:            n(d.bytes),             // virtual size of all txs (bytes)
        total_fee:        n(d.total_fee),         // sum of all tx fees (BTC)
        mempoolminfee:    n(d.mempoolminfee),     // dynamic floor fee rate (BTC/kB)
        minrelaytxfee:    n(d.minrelaytxfee),     // static relay floor (BTC/kB)
        unbroadcastcount: n(d.unbroadcastcount),  // txs not yet broadcast to peers
        fullrbf:          b(d.fullrbf),           // true = full RBF enabled
        rbf_policy:       str(d.rbf_policy),
        truc_policy:      str(d.truc_policy),
        fee_economy:      n(raw?.fees?.hourFee),        // sat/vB from knotapi fees object (hourFee = low priority)
        fee_half_hour:    n(raw?.fees?.halfHourFee),  // sat/vB
        fee_fastest:      n(raw?.fees?.fastestFee),   // sat/vB
        cached_at:        null,
      };
    },
    (v) => v != null && typeof v === 'object' && v.usage != null,
  );
}

export async function getMempoolTransactionFeesPayload() {
  return getFeed(
    'mempoolTransactionFees',
    async () => {
      // Primary: zatobox scraper, Fallback: mempool.space
      const url = `${SCRAPER_BASE_URL}${S04_MEMPOOL_SPACE_TRANSACTION_FEES_SCRAPER_PATH}`;
      return fetchJsonWithTimeout(url, { timeoutMs: 8_000 }).catch(() =>
        fetchJsonWithTimeout('https://mempool.space/api/v1/fees/recommended', { timeoutMs: 8_000 }),
      );
    },
    validateObject,
  );
}

export async function getMempoolUnconfirmedTransactionsPayload() {
  return getFeed(
    'mempoolUnconfirmedTransactions',
    async () => {
      // Primary: zatobox scraper, Fallback: mempool.space
      const url = `${SCRAPER_BASE_URL}${S04_MEMPOOL_SPACE_UNCONFIRMED_TRANSACTIONS_SCRAPER_PATH}`;
      return fetchJsonWithTimeout(url, { timeoutMs: 8_000 }).catch(() =>
        fetchJsonWithTimeout('https://mempool.space/api/v1/mempool', { timeoutMs: 8_000 }),
      );
    },
    validateObject,
  );
}

async function getJohoeBtcQueueHistoryRawPayload() {
  const normalizedRange = JOHOE_BTC_QUEUE_CONFIG.range;
  const params = new URLSearchParams({ range: normalizedRange, includeBuckets: 'true' });

  return getFeed(
    JOHOE_BTC_QUEUE_CONFIG.historyFeedKey,
    async () => {
      try {
        const raw = await fetchSupabaseEdgeFunctionJson(JOHOE_BTC_QUEUE_HISTORY_FUNCTION, {
          timeoutMs: 30_000,
        });
        if (!validateJohoeHistoryPayload(raw)) {
          throw new PublicFeedError(`Johoe BTC queue history (${normalizedRange}) payload is incomplete`);
        }

        return assertFreshJohoeHistoryPayload(normalizeJohoeHistoryResponse(raw, normalizedRange), 'supabase');
      } catch {
        const raw = await fetchJsonWithTimeout(`${SCRAPER_BASE_URL}${JOHOE_BTC_QUEUE_HISTORY_PATH}?${params.toString()}`, { timeoutMs: 30_000 });
        if (!validateJohoeHistoryPayload(raw)) {
          throw new PublicFeedError(`Johoe BTC queue history (${normalizedRange}) payload is incomplete`);
        }

        return assertFreshJohoeHistoryPayload(normalizeJohoeHistoryResponse(raw, normalizedRange), 'scraper fallback');
      }
    },
    (value) => validateObject(value) && Array.isArray(value?.points) && value.points.length > 0,
  );
}

async function getJohoeBtcQueueLatestRawPayload() {
  return getFeed(
    'johoeBtcQueueLatest',
    async () => {
      try {
        const raw = await fetchSupabaseEdgeFunctionJson(JOHOE_BTC_QUEUE_LATEST_FUNCTION, {
          timeoutMs: 15_000,
        });
        if (!validateJohoeLatestPayload(raw)) {
          throw new PublicFeedError('Johoe BTC queue latest payload is incomplete');
        }

        return assertFreshJohoeLatestPayload(normalizeJohoeLatestResponse(raw), 'supabase');
      } catch {
        const raw = await fetchJsonWithTimeout(`${SCRAPER_BASE_URL}${JOHOE_BTC_QUEUE_LATEST_PATH}`, { timeoutMs: 15_000 });
        if (!validateJohoeLatestPayload(raw)) {
          throw new PublicFeedError('Johoe BTC queue latest payload is incomplete');
        }

        return assertFreshJohoeLatestPayload(normalizeJohoeLatestResponse(raw), 'scraper fallback');
      }
    },
    (value) => validateObject(value) && Number.isFinite(Number(value?.ts)),
  );
}

export async function getJohoeBtcQueuePayload() {
  const normalizedRange = JOHOE_BTC_QUEUE_CONFIG.range;

  return getComposedPayload({
    cacheKey: JOHOE_BTC_QUEUE_CONFIG.cacheKey,
    lockKey: JOHOE_BTC_QUEUE_CONFIG.lockKey,
    fallbackTtlSeconds: JOHOE_BTC_QUEUE_CONFIG.fallbackTtlSeconds,
    staleWhileRefreshing: `Serving stale BTC queue (${normalizedRange}) payload while shared refresh completes`,
    staleWhileRecovering: `Serving stale BTC queue (${normalizedRange}) payload while upstream refresh recovers`,
    buildPayload: async () => {
      const historyPromise = getJohoeBtcQueueHistoryRawPayload(normalizedRange);
      const latestPromise = getJohoeBtcQueueLatestRawPayload().catch(() => null);
      const historyPayload = await historyPromise;
      const latestPayload = await Promise.race([
        latestPromise,
        new Promise((resolve) => setTimeout(() => resolve(null), 1800)),
      ]);

      const historyPoints = Array.isArray(historyPayload?.data?.points)
        ? historyPayload.data.points.map((point) => buildJohoeViewPoint(point))
        : [];
      const latestPoint = latestPayload?.data ? buildJohoeViewPoint(latestPayload.data) : null;
      const fallbackLatest = latestPoint || historyPoints.at(-1) || null;

      if (!historyPoints.length || !fallbackLatest) {
        throw new PublicFeedError(`BTC queue (${normalizedRange}) payload has no usable chart points`);
      }

      const updatedAtCandidates = [historyPayload?.updated_at, latestPayload?.updated_at]
        .map((value) => parseIsoDate(value)?.getTime())
        .filter(Number.isFinite);
      const nextUpdateCandidates = [historyPayload?.next_update_at, latestPayload?.next_update_at]
        .map((value) => parseIsoDate(value)?.getTime())
        .filter(Number.isFinite);
      const fallbackParts = [historyPayload?.fallback_note, latestPayload?.fallback_note].filter(Boolean);
      const sourceSnapshotCandidates = [fallbackLatest?.snapshot_ts, historyPoints.at(-1)?.snapshot_ts]
        .map((value) => parseIsoDate(value)?.getTime())
        .filter(Number.isFinite);
      const sourceFetchedCandidates = [fallbackLatest?.fetched_at, historyPoints.at(-1)?.fetched_at]
        .map((value) => parseIsoDate(value)?.getTime())
        .filter(Number.isFinite);
      const sourceSnapshotAt = sourceSnapshotCandidates.length
        ? normalizeTimestamp(new Date(Math.max(...sourceSnapshotCandidates)))
        : null;
      const sourceFetchedAt = sourceFetchedCandidates.length
        ? normalizeTimestamp(new Date(Math.max(...sourceFetchedCandidates)))
        : null;
      const sourceSnapshotDate = parseIsoDate(sourceSnapshotAt);
      const sourceAgeMs = sourceSnapshotDate
        ? Math.max(0, Date.now() - sourceSnapshotDate.getTime())
        : null;
      const sourceStale = !isJohoeSourceFresh(sourceAgeMs);

      return {
        data: {
          range: normalizedRange,
          range_label: historyPayload?.data?.label || normalizedRange,
          resolution: historyPayload?.data?.resolution || null,
          rolling: Boolean(historyPayload?.data?.rolling),
          metric_options: ['count', 'weight', 'fee'],
          raw_bucket_count: JOHOE_BTC_QUEUE_BUCKET_BOUNDARIES.length,
          grouped_bucket_count: JOHOE_BTC_QUEUE_GROUPS.length,
          band_order: 'low_to_high',
          bands: JOHOE_BTC_QUEUE_GROUPS.map(stripJohoeBandMeta),
          points: buildJohoeCompactPoints(historyPoints),
          latest: fallbackLatest,
          latest_matches_history_tail: Boolean(
            latestPoint
              && historyPoints.at(-1)?.ts
              && latestPoint.ts === historyPoints.at(-1).ts,
          ),
        },
        updated_at: updatedAtCandidates.length
          ? normalizeTimestamp(new Date(Math.max(...updatedAtCandidates)))
          : normalizeTimestamp(),
        next_update_at: nextUpdateCandidates.length
          ? normalizeTimestamp(new Date(Math.min(...nextUpdateCandidates)))
          : null,
        source_provider: Array.from(new Set([
          historyPayload?.data?.meta?.provider,
          latestPayload?.data?.meta?.provider,
          historyPayload?.source_provider,
          latestPayload?.source_provider,
        ].filter(Boolean))).join(' | ') || 'supabase edge + supabase postgres',
        source_url: Array.from(new Set([historyPayload?.source_url, latestPayload?.source_url].filter(Boolean))).join(' | ') || null,
        is_fallback: Boolean(historyPayload?.is_fallback || latestPayload?.is_fallback),
        fallback_note: fallbackParts.length ? fallbackParts.join(' | ') : null,
        source_snapshot_at: sourceSnapshotAt,
        source_fetched_at: sourceFetchedAt,
        source_age_ms: sourceAgeMs,
        source_stale: sourceStale,
      };
    },
  });
}

export async function getJohoeBtcQueueBootstrapPayload() {
  const normalizedRange = JOHOE_BTC_QUEUE_CONFIG.range;
  const payload = await getJohoeBtcQueuePayload();
  const fullData = payload?.data;
  const previewBudget = JOHOE_BTC_QUEUE_CONFIG.bootstrapPointBudget;

  if (!validateObject(fullData) || !validateObject(fullData?.points)) {
    throw new PublicFeedError(`BTC queue bootstrap (${normalizedRange}) payload is unavailable`);
  }

  return {
    ...payload,
    data: {
      range: fullData.range,
      range_label: fullData.range_label,
      resolution: fullData.resolution,
      rolling: fullData.rolling,
      metric_options: fullData.metric_options,
      raw_bucket_count: fullData.raw_bucket_count,
      grouped_bucket_count: fullData.grouped_bucket_count,
      band_order: fullData.band_order,
      bands: fullData.bands,
      latest: fullData.latest,
      preview_point_budget: previewBudget,
      preview: downsampleJohoeCompactPoints(fullData.points, previewBudget),
    },
  };
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
    async () => {
      const raw = await fetchJsonWithTimeout('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');
      return _patchFranceOverseas(raw);
    },
    validateObject,
  );
}

async function getCountriesGeoHighResPayload() {
  return getFeed(
    'geoCountriesHighRes',
    async () => {
      const raw = await fetchJsonWithTimeout('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson');
      return _patchFranceOverseas(raw);
    },
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

export async function getLightningChannelsGeoPayload() {
  return getFeed(
    'lightningChannelsGeo',
    async () => fetchJsonWithTimeout('https://mempool.space/api/v1/lightning/channels-geo'),
    validateArray,
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

      // Side-cache trimmed individual places (lat/lon/name) for the /businesses endpoint.
      // Fire-and-forget — do not block the main aggregation if this fails.
      const trimmed = places.map(p => ({ id: p.id, name: p.name, lat: p.lat, lon: p.lon }));
      cacheSetJson(
        BTCMAP_INDIVIDUAL_CACHE_KEY,
        { data: trimmed, cached_at: new Date().toISOString() },
        { ttlSeconds: BTCMAP_INDIVIDUAL_CACHE_TTL_SECONDS },
      ).catch(() => {});

      const countriesGeo = countriesGeoPayload?.data || countriesGeoPayload;
      const getResolutionMap = () => getBtcMapPlaceCountryResolutionMap({
        memCache,
        cacheGetJson,
        cacheKey: BTCMAP_PLACE_COUNTRY_CACHE_KEY,
      });

      const saveResolutionMap = (mapPayload) => saveBtcMapPlaceCountryResolutionMap(mapPayload, {
        memCache,
        cacheSetJson,
        cacheKey: BTCMAP_PLACE_COUNTRY_CACHE_KEY,
        cacheTtlSeconds: BTCMAP_PLACE_COUNTRY_CACHE_TTL_SECONDS,
      });

      const resolveFallback = (candidates, cachedResolutionMap) => resolveBtcMapFallbackCountries(
        candidates,
        cachedResolutionMap,
        {
          fetchBtcMapCountryAreaForPlace,
          saveBtcMapPlaceCountryResolutionMap: saveResolutionMap,
          areaLookupConcurrency: BTCMAP_AREA_LOOKUP_CONCURRENCY,
        },
      );

      return aggregateBtcMapBusinessesByCountry(places, countriesGeo, {
        getBtcMapPlaceCountryResolutionMap: getResolutionMap,
        resolveBtcMapFallbackCountries: resolveFallback,
        maxFallbackLookups: BTCMAP_MAX_FALLBACK_AREA_LOOKUPS,
      });
    },
    validateCountryBusinessPayload,
  );
}

/**
 * Individual businesses with lat/lon — built as a side-effect of getBtcMapBusinessesByCountryPayload.
 * Returns { data: [{id, name, lat, lon},...], cached_at } or { data: [], message } if not yet cached.
 */
export async function getBtcMapBusinessesPayload() {
  const cached = await cacheGetJson(BTCMAP_INDIVIDUAL_CACHE_KEY);
  if (Array.isArray(cached?.data) && cached.data.length > 0) {
    return cached;
  }
  return { data: [], message: 'Individual place data not yet cached. The /btcmap/businesses-by-country endpoint will populate it on next refresh.' };
}

async function getS15GoldMarketCapSnapshotPayload() {
  const proxyUrl = `${SCRAPER_BASE_URL}${S15_GOLD_SCRAPER_PATH}`;

  return getFeed(
    's15GoldMarketCapCurrent',
    async () => {
      const raw = await fetchJsonWithTimeout(proxyUrl);
      const snapshot = buildS15GoldSnapshot(raw);
      if (!validateS15GoldPayload(snapshot)) {
        throw new PublicFeedError('Zatobox gold market-cap payload is incomplete');
      }
      return snapshot;
    },
    validateS15GoldPayload,
  );
}

export async function getS15BtcVsGoldMarketCapPayload() {
  return getComposedPayload({
    cacheKey: S15_COMPOSED_CACHE_KEY,
    lockKey: S15_COMPOSED_LOCK_KEY,
    fallbackTtlSeconds: 600,
    staleWhileRefreshing: 'Serving stale BTC vs Gold comparison while shared refresh completes',
    staleWhileRecovering: 'Serving stale BTC vs Gold comparison while upstream refresh recovers',
    buildPayload: async () => {
      const [historyPayload, btcRatesPayload, goldPayload] = await Promise.all([
        getBinanceBtcHistoryPayload({ days: 1825, interval: '1d' }),
        getBtcRates(),
        getS15GoldMarketCapSnapshotPayload(),
      ]);

      const historyPoints = Array.isArray(historyPayload?.data) ? historyPayload.data : [];
      const goldSnapshot = goldPayload?.data || goldPayload;
      const gold = Number(goldSnapshot?.market_cap_trillions);
      const currentBtcUsd = Number(btcRatesPayload?.btc_usd);
      const currentTs = Date.now();

      if (!Number.isFinite(gold) || gold <= 0) {
        throw new PublicFeedError('Gold market-cap snapshot is unavailable');
      }

      const points = historyPoints
        .filter((point, index) => index % 3 === 0)
        .map((point) => {
          const ts = Number(point?.ts);
          const price = Number(point?.price);
          const supply = estimateBitcoinCirculatingSupply(ts);
          if (!Number.isFinite(ts) || !Number.isFinite(price) || price <= 0 || !Number.isFinite(supply) || supply <= 0) {
            return null;
          }

          const bitcoin = Number(((price * supply) / 1e12).toFixed(2));
          const ratio = Number(((bitcoin / gold) * 100).toFixed(2));
          const gap = Number((gold - bitcoin).toFixed(2));

          return {
            ts,
            date: new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' }),
            bitcoin,
            gold,
            ratio,
            gap,
          };
        })
        .filter(Boolean);

      if (Number.isFinite(currentBtcUsd) && currentBtcUsd > 0) {
        const latestSupply = estimateBitcoinCirculatingSupply(currentTs);
        const latestBitcoin = Number(((currentBtcUsd * latestSupply) / 1e12).toFixed(2));
        const latestPoint = {
          ts: currentTs,
          date: new Date(currentTs).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit', timeZone: 'UTC' }),
          bitcoin: latestBitcoin,
          gold,
          ratio: Number(((latestBitcoin / gold) * 100).toFixed(2)),
          gap: Number((gold - latestBitcoin).toFixed(2)),
        };

        const previousTs = Number(points.at(-1)?.ts);
        if (!Number.isFinite(previousTs) || currentTs - previousTs > (12 * 60 * 60 * 1000)) {
          points.push(latestPoint);
        } else {
          points[points.length - 1] = latestPoint;
        }
      }

      if (!points.length) {
        throw new PublicFeedError('BTC vs Gold comparison has no chart points');
      }

      const latest = points.at(-1) || null;
      const updatedAtCandidates = [historyPayload?.updated_at, btcRatesPayload?.updated_at, goldPayload?.updated_at]
        .map((value) => parseIsoDate(value)?.getTime())
        .filter(Number.isFinite);
      const nextUpdateCandidates = [historyPayload?.next_update_at, btcRatesPayload?.next_update_at, goldPayload?.next_update_at]
        .map((value) => parseIsoDate(value)?.getTime())
        .filter(Number.isFinite);
      const isFallback = Boolean(historyPayload?.is_fallback || goldPayload?.is_fallback);
      const fallbackParts = [historyPayload?.fallback_note, goldPayload?.fallback_note].filter(Boolean);

      return {
        data: {
          points,
          latest,
          gold_reference: 'current_market_cap_snapshot',
          gold_market_cap_trillions: gold,
          gold_price_usd_per_ounce: goldSnapshot?.price_usd_per_ounce ?? null,
          gold_change_today_pct: goldSnapshot?.change_today_pct ?? null,
          btc_supply_methodology: `Estimated from Bitcoin issuance schedule using ${BTC_CURRENT_HALVING_REWARD} BTC block reward and 10-minute target blocks`,
        },
        updated_at: updatedAtCandidates.length ? normalizeTimestamp(new Date(Math.max(...updatedAtCandidates))) : new Date().toISOString(),
        next_update_at: nextUpdateCandidates.length ? normalizeTimestamp(new Date(Math.min(...nextUpdateCandidates))) : null,
        source_provider: 'binance + zatobox',
        source_url: `${historyPayload?.source_url || ''} | ${goldPayload?.source_url || ''}`,
        comparison_source: 'binance_price_x_protocol_supply_vs_zatobox_companiesmarketcap_gold',
        is_fallback: isFallback,
        fallback_note: fallbackParts.length ? fallbackParts.join(' | ') : null,
      };
    },
  });
}

const VALID_HISTORY_INTERVALS = new Set(['5m', '15m', '30m', '1h', '1d']);
const BINANCE_MAX_CANDLES = 1000;

export async function getBinanceBtcHistoryPayload({ days: rawDays = 365, interval: rawInterval = '1d' } = {}) {
  const isMax = String(rawDays).toLowerCase() === 'max';
  const genesisDays = Math.ceil((Date.now() - BTC_GENESIS_TS) / DAY_MS);
  const normalizedDays = isMax ? genesisDays : ([1, 7, 30, 90, 365, 1825, 2025].includes(Number(rawDays)) ? Number(rawDays) : 365);
  const interval = VALID_HISTORY_INTERVALS.has(rawInterval) ? rawInterval : '1d';
  const key = isMax ? 'binanceHistory_max_1d' : historyFeedKey(normalizedDays, interval);
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
  return getComposedPayload({
    cacheKey: US_DEBT_COMPOSED_CACHE_KEY,
    lockKey: US_DEBT_COMPOSED_LOCK_KEY,
    fallbackTtlSeconds: 900,
    staleWhileRefreshing: 'Serving stale U.S. debt snapshot while shared refresh completes',
    staleWhileRecovering: 'Serving stale U.S. debt snapshot while upstream refresh recovers',
    buildPayload: async () => {
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
    },
  });
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

// Static pre-Binance history is read at most once per process; null = not loaded yet.
let s18StaticBtcHistory = null;

function loadS18StaticBtcHistory() {
  if (s18StaticBtcHistory) return s18StaticBtcHistory;
  try {
    const content = fs.readFileSync(path.join(process.cwd(), 'server', 'data', 'btc_historical_static.json'), 'utf8');
    const parsed = JSON.parse(content);
    s18StaticBtcHistory = parsed.data || [];
  } catch (err) {
    console.warn('[getS18BtcCyclesPayload] Could not read static BTC history', err);
    s18StaticBtcHistory = [];
  }
  return s18StaticBtcHistory;
}

export async function getS18BtcCyclesPayload() {
  return getComposedPayload({
    cacheKey: 'public:s18:btc-cycles:composed',
    lockKey: 'public:s18:btc-cycles:composed:refresh',
    fallbackTtlSeconds: 86400,
    staleWhileRefreshing: 'Serving stale S18 cycles payload while shared refresh completes',
    staleWhileRecovering: 'Serving stale S18 cycles payload while upstream refresh recovers',
    buildPayload: async () => {
      const [binancePayload] = await Promise.all([
        getBinanceBtcHistoryPayload({ days: 'max', interval: '1d' }).catch(() => null)
      ]);
      const binancePoints = Array.isArray(binancePayload?.data) ? binancePayload.data : [];
      
      const staticData = loadS18StaticBtcHistory();

      const combined = [];
      staticData.forEach(pt => {
        combined.push({
          ts: pt[0],
          price: pt[1],
          date: new Date(pt[0]).toISOString()
        });
      });
      
      binancePoints.forEach(pt => {
        combined.push({
          ts: pt.ts,
          price: pt.price,
          date: new Date(pt.ts).toISOString()
        });
      });
      
      const unique = new Map();
      combined.forEach(pt => {
        const dayTs = new Date(pt.ts).setUTCHours(0, 0, 0, 0);
        unique.set(dayTs, pt);
      });
      
      const sorted = Array.from(unique.values()).sort((a, b) => a.ts - b.ts);
      
      if (!sorted.length) {
        throw new PublicFeedError('S18 BTC cycles payload has no chart points');
      }

      const updatedAtCandidates = [binancePayload?.updated_at].map((value) => parseIsoDate(value)?.getTime()).filter(Number.isFinite);
      const nextUpdateCandidates = [binancePayload?.next_update_at].map((value) => parseIsoDate(value)?.getTime()).filter(Number.isFinite);

      return {
        data: sorted,
        updated_at: updatedAtCandidates.length ? normalizeTimestamp(new Date(Math.max(...updatedAtCandidates))) : new Date().toISOString(),
        next_update_at: nextUpdateCandidates.length ? normalizeTimestamp(new Date(Math.min(...nextUpdateCandidates))) : null,
        source_provider: 'cryptocompare_static + binance',
        source_url: `local btc_historical_static.json | ${binancePayload?.source_url || ''}`,
        is_fallback: Boolean(binancePayload?.is_fallback),
        fallback_note: binancePayload?.fallback_note || null,
        refresh_policy: {
          min_interval_ms: 24 * 60 * 60_000,
        }
      };
    }
  });
}
