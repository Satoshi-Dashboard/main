import { lazy } from 'react';
import { buildLegacyModuleRedirects } from '@/features/module-registry/legacyModuleRedirects.js';

function lazyWithPreload(loader) {
  const Component = lazy(loader);
  Component.preload = loader;
  return Component;
}

const S01_BitcoinOverview = lazyWithPreload(() => import('@/features/modules/live/S01_BitcoinOverview'));
const S02_PriceChart = lazyWithPreload(() => import('@/features/modules/live/S02_PriceChart'));
const S03_MultiCurrencyBoard = lazyWithPreload(() => import('@/features/modules/live/S03_MultiCurrencyBoard'));
const S04_MempoolGauge = lazyWithPreload(() => import('@/features/modules/live/S04_MempoolGauge'));
const S05_LongTermTrend = lazyWithPreload(() => import('@/features/modules/live/S05_LongTermTrend'));
const S06_NodesMap = lazyWithPreload(() => import('@/features/modules/live/S06_NodesMap'));
const S07_LightningNodesMap = lazyWithPreload(() => import('@/features/modules/live/S07_LightningNodesMap'));
const S08_BtcMapBusinessesMap = lazyWithPreload(() => import('@/features/modules/live/S08_BtcMapBusinessesMap'));
const S09_LightningNetwork = lazyWithPreload(() => import('@/features/modules/live/S09_LightningNetwork'));
const S10_StablecoinPegHealth = lazyWithPreload(() => import('@/features/modules/live/S10_StablecoinPegHealth'));
const S11_FearGreedIndex = lazyWithPreload(() => import('@/features/modules/live/S11_FearGreedIndex'));
const S12_AddressDistribution = lazyWithPreload(() => import('@/features/modules/live/S12_AddressDistribution'));
const S13_WealthPyramid = lazyWithPreload(() => import('@/features/modules/live/S13_WealthPyramid'));
const S14_GlobalAssetsTreemap = lazyWithPreload(() => import('@/features/modules/live/S14_GlobalAssetsTreemap'));
const S15_BTCvsGold = lazyWithPreload(() => import('@/features/modules/live/S15_BTCvsGold'));
const S16_MayerMultiple = lazyWithPreload(() => import('@/features/modules/live/S16_MayerMultiple'));
const S17_PricePerformance = lazyWithPreload(() => import('@/features/modules/live/S17_PricePerformance'));
const S18_CycleSpiral = lazyWithPreload(() => import('@/features/modules/live/S18_CycleSpiral'));
const S19_PowerLawModel = lazyWithPreload(() => import('@/features/modules/under-construction/S19_PowerLawModel'));
const S20_StockToFlow = lazyWithPreload(() => import('@/features/modules/under-construction/S20_StockToFlow'));
const S21_BigMacSatsTracker = lazyWithPreload(() => import('@/features/modules/under-construction/S21_BigMacSatsTracker'));
const S22_SeasonalityHeatmap = lazyWithPreload(() => import('@/features/modules/under-construction/S22_SeasonalityHeatmap'));
const S23_BigMacIndex = lazyWithPreload(() => import('@/features/modules/under-construction/S23_BigMacIndex'));
const S24_NetworkActivity = lazyWithPreload(() => import('@/features/modules/under-construction/S24_NetworkActivity'));
const S25_LogRegression = lazyWithPreload(() => import('@/features/modules/under-construction/S25_LogRegression'));
const S26_MVRVScore = lazyWithPreload(() => import('@/features/modules/under-construction/S26_MVRVScore'));
const S27_GoogleTrends = lazyWithPreload(() => import('@/features/modules/under-construction/S27_GoogleTrends'));
const S28_BTCDominance = lazyWithPreload(() => import('@/features/modules/under-construction/S28_BTCDominance'));
const S29_UTXODistribution = lazyWithPreload(() => import('@/features/modules/under-construction/S29_UTXODistribution'));
const S30_USNationalDebt = lazyWithPreload(() => import('@/features/modules/live/S30_USNationalDebt'));
const S31_ThankYouSatoshi = lazyWithPreload(() => import('@/features/modules/live/S31_ThankYouSatoshi'));

const MODULE_DEFS = [
  { slugBase: 'bitcoin-price-market-overview', title: 'Bitcoin Overview', component: S01_BitcoinOverview },
  { slugBase: 'bitcoin-price-chart-live', title: 'Price Chart', component: S02_PriceChart },
  { slugBase: 'bitcoin-price-multi-currency', title: 'Multi-Currency', component: S03_MultiCurrencyBoard },
  { slugBase: 'bitcoin-mempool-fees', title: 'Mempool Gauge', component: S04_MempoolGauge },
  { slugBase: 'bitcoin-mempool-trend', title: 'Long-Term Trend', component: S05_LongTermTrend },
  { slugBase: 'bitcoin-mempool-queue-v2', title: 'BTC Queue', component: S32_BtcQueue },
  { slugBase: 'bitcoin-nodes-world-map', title: 'Nodes Map', component: S06_NodesMap },
  { slugBase: 'lightning-nodes-world-map', title: 'Lightning Nodes Map', component: S07_LightningNodesMap },
  { slugBase: 'bitcoin-merchant-map', title: 'BTC Map Business Density', component: S08_BtcMapBusinessesMap },
  { slugBase: 'lightning-network-stats', title: 'Lightning Network', component: S09_LightningNetwork },
  { slugBase: 'stablecoin-peg-tracker', title: 'Stablecoin Peg Health', component: S10_StablecoinPegHealth },
  { slugBase: 'bitcoin-fear-greed-index', title: 'Fear & Greed', component: S11_FearGreedIndex },
  { slugBase: 'bitcoin-address-distribution', title: 'Address Distribution', component: S12_AddressDistribution },
  { slugBase: 'bitcoin-wealth-pyramid', title: 'Wealth Pyramid', component: S13_WealthPyramid },
  { slugBase: 'bitcoin-vs-global-assets', title: 'Global Assets', component: S14_GlobalAssetsTreemap },
  { slugBase: 'bitcoin-vs-gold-chart', title: 'BTC vs Gold', component: S15_BTCvsGold },
  { slugBase: 'bitcoin-mayer-multiple', title: 'Mayer Multiple', component: S16_MayerMultiple },
  { slugBase: 'bitcoin-price-performance', title: 'US Median Home Price in ₿', component: S17_PricePerformance },
  { slugBase: 'bitcoin-halving-cycle-spiral', title: 'Cycle Spiral', component: S18_CycleSpiral },
  { slugBase: 'bitcoin-power-law-model', title: 'Power Law Model', component: S19_PowerLawModel },
  { slugBase: 'bitcoin-stock-to-flow-model', title: 'Stock to Flow', component: S20_StockToFlow },
  { slugBase: 'bitcoin-big-mac-sats-tracker', title: 'Big Mac Sats Tracker', component: S21_BigMacSatsTracker },
  { slugBase: 'bitcoin-seasonality-heatmap', title: 'Seasonality', component: S22_SeasonalityHeatmap },
  { slugBase: 'bitcoin-big-mac-index', title: 'Big Mac Index', component: S23_BigMacIndex },
  { slugBase: 'bitcoin-network-activity', title: 'Network Activity', component: S24_NetworkActivity },
  { slugBase: 'bitcoin-log-regression-channel', title: 'Log Regression', component: S25_LogRegression },
  { slugBase: 'bitcoin-mvrv-score', title: 'MVRV Score', component: S26_MVRVScore },
  { slugBase: 'bitcoin-google-trends', title: 'Google Trends', component: S27_GoogleTrends },
  { slugBase: 'bitcoin-dominance-chart', title: 'BTC Dominance', component: S28_BTCDominance },
  { slugBase: 'bitcoin-utxo-distribution', title: 'UTXO Distribution', component: S29_UTXODistribution },
  { slugBase: 'us-national-debt-live-counter', title: 'U.S. National Debt', component: S30_USNationalDebt },
  { slugBase: 'satoshi-nakamoto-bitcoin-whitepaper', title: 'Thank You Satoshi', component: S31_ThankYouSatoshi },
];

const toCode = (index) => `S${String(index + 1).padStart(2, '0')}`;

// Strict policy: codes/slugs are auto-generated from array order.
// Adding/removing modules automatically reindexes all Sxx/slugs with no gaps.
export const MODULES = MODULE_DEFS.map((module, index) => {
  const code = toCode(index);
  return {
    ...module,
    code,
    slug: `${code.toLowerCase()}-${module.slugBase}`,
  };
});

function assertModuleRegistry(modules) {
  const seenCodes = new Set();
  const seenSlugs = new Set();

  modules.forEach((module, index) => {
    const code = String(module.code || '');
    const slug = String(module.slug || '');
    const expectedCode = toCode(index);
    const expectedPrefix = `${expectedCode.toLowerCase()}-`;

    if (seenCodes.has(code)) {
      throw new Error(`Duplicate module code detected: ${code}`);
    }
    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate module slug detected: ${slug}`);
    }
    if (code !== expectedCode) {
      throw new Error(`Module code sequence mismatch: expected ${expectedCode}, got ${code}`);
    }
    if (!slug.startsWith(expectedPrefix)) {
      throw new Error(`Module slug must start with ${expectedPrefix}: ${slug}`);
    }

    seenCodes.add(code);
    seenSlugs.add(slug);
  });
}

assertModuleRegistry(MODULES);

export const FIRST_MODULE = MODULES[0];
export const MODULES_BY_SLUG = Object.fromEntries(MODULES.map((module) => [module.slug, module]));
export const MODULES_BY_CODE = Object.fromEntries(MODULES.map((module) => [module.code, module]));

export const LEGACY_MODULE_REDIRECTS = buildLegacyModuleRedirects(MODULES);

export function getModulePath(moduleOrCode) {
  const module = typeof moduleOrCode === 'string' ? MODULES_BY_CODE[moduleOrCode] : moduleOrCode;
  if (!module) return '/';
  return module.code === FIRST_MODULE.code ? '/' : `/module/${module.slug}`;
}

export function preloadModule(moduleOrSlugOrCode) {
  const module = typeof moduleOrSlugOrCode === 'string'
    ? MODULES_BY_SLUG[moduleOrSlugOrCode] || MODULES_BY_CODE[moduleOrSlugOrCode]
    : moduleOrSlugOrCode;
  return module?.component?.preload?.() ?? Promise.resolve();
}
