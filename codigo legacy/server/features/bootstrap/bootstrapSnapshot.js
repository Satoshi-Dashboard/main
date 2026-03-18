import { cacheGetJsonBatch } from '../../core/runtimeCache.js';

/**
 * Registry of Redis cache keys per module/feed.
 * Each key matches the exact string used by the corresponding service's cacheSetJson() call.
 * Keys verified from: publicDataFeeds.js FEED_DEFS, btcRates.js, and server/features/*
 */
const BOOTSTRAP_REGISTRY = {
  // ── Core prices ──
  btcRates:                    'btc-rates',
  btcRatesFiat:                'btc-rates-fiat',

  // ── Mempool (S01, S04, S05) ──
  mempoolOverview:             'public:mempool:overview',
  mempoolOfficialUsage:        'public:mempool:official-usage',
  mempoolLive:                 'public:mempool:live',
  mempoolNode:                 'public:mempool:node',

  // ── Fear & Greed (S11) ──
  fearGreed:                   'public:alternative:fng:31',

  // ── Multi-Currency (S03) ──
  s03MultiCurrency:            's03:multi-currency:investing',

  // ── Stablecoins (S10) ──
  s10StablecoinList:           's08:stablecoins:list',
  s10StablecoinLivePrices:     's08:stablecoins:live-prices',

  // ── Bitnodes (S06) ──
  bitnodes:                    'bitnodes-cache',

  // ── Lightning (S07) ──
  lightningWorld:              'public:lightning:world',
  lightningChannelsGeo:        'public:lightning:channels-geo',

  // ── BTCMap (S08) ──
  btcmapBusinesses:            'public:btcmap:businesses-by-country',

  // ── BitInfoCharts (S12, S13) ──
  s12BtcDistribution:          's10-btc-distribution',
  s13AddressesRicher:          's14-addresses-richer',

  // ── Global Assets (S14) ──
  s14GlobalAssets:             's13:global-assets:newhedge',

  // ── BTC vs Gold (S15) ──
  s15BtcVsGold:               'public:s15:btc-vs-gold:composed',

  // ── S18 Halving Cycles ──
  s18BtcCycles:                'public:s18:btc-cycles:composed',

  // ── US National Debt (S30) ──
  s30UsDebt:                   'public:us-national-debt:composed',

  // ── Geo (S06, S07) ──
  geoCountries:                'public:geo:countries',

  // ── Binance history (S02 default range) ──
  binanceHistory365:           'public:binance:btc-history:365:1d',

  // ── S16 Mayer Multiple warmup history ──
  binanceHistory2025:          'public:binance:btc-history:2025:1d',
};

/**
 * Reads all bootstrap payloads from Redis in a single MGET round-trip.
 * Returns { modules: { [registryKey]: payload }, _meta: { ... } }
 */
export async function getBootstrapSnapshot() {
  const cacheKeys = Object.values(BOOTSTRAP_REGISTRY);
  const registryKeys = Object.keys(BOOTSTRAP_REGISTRY);

  const batchResult = await cacheGetJsonBatch(cacheKeys);

  // Map Redis cache keys back to human-friendly registry keys
  const modules = {};
  let populated = 0;
  for (let i = 0; i < cacheKeys.length; i++) {
    const val = batchResult[cacheKeys[i]];
    if (val != null) {
      modules[registryKeys[i]] = val;
      populated++;
    }
  }

  return {
    modules,
    _meta: {
      cachedAt: new Date().toISOString(),
      totalKeys: cacheKeys.length,
      populatedKeys: populated,
    },
  };
}

export { BOOTSTRAP_REGISTRY };
