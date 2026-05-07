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
const S06_BtcQueue = lazyWithPreload(() => import('@/features/modules/live/S06_BtcQueue'));
const S07_NodesMap = lazyWithPreload(() => import('@/features/modules/live/S07_NodesMap'));
const S08_LightningNodesMap = lazyWithPreload(() => import('@/features/modules/live/S08_LightningNodesMap'));
const S09_BtcMapBusinessesMap = lazyWithPreload(() => import('@/features/modules/live/S09_BtcMapBusinessesMap'));
const S10_LightningNetwork = lazyWithPreload(() => import('@/features/modules/live/S10_LightningNetwork'));
const S11_StablecoinPegHealth = lazyWithPreload(() => import('@/features/modules/live/S11_StablecoinPegHealth'));
const S12_FearGreedIndex = lazyWithPreload(() => import('@/features/modules/live/S12_FearGreedIndex'));
const S13_AddressDistribution = lazyWithPreload(() => import('@/features/modules/live/S13_AddressDistribution'));
const S14_WealthPyramid = lazyWithPreload(() => import('@/features/modules/live/S14_WealthPyramid'));
const S15_GlobalAssetsTreemap = lazyWithPreload(() => import('@/features/modules/live/S15_GlobalAssetsTreemap'));
const S16_BTCvsGold = lazyWithPreload(() => import('@/features/modules/live/S16_BTCvsGold'));
const S17_MayerMultiple = lazyWithPreload(() => import('@/features/modules/live/S17_MayerMultiple'));
const S18_PricePerformance = lazyWithPreload(() => import('@/features/modules/live/S18_PricePerformance'));
const S19_CycleSpiral = lazyWithPreload(() => import('@/features/modules/live/S19_CycleSpiral'));
const S20_PowerLawModel = lazyWithPreload(() => import('@/features/modules/under-construction/S20_PowerLawModel'));
const S21_StockToFlow = lazyWithPreload(() => import('@/features/modules/under-construction/S21_StockToFlow'));
const S23_SeasonalityHeatmap = lazyWithPreload(() => import('@/features/modules/under-construction/S23_SeasonalityHeatmap'));
const S24_BigMacIndex = lazyWithPreload(() => import('@/features/modules/live/S24_BigMacIndex'));
const S25_NetworkActivity = lazyWithPreload(() => import('@/features/modules/under-construction/S25_NetworkActivity'));
const S26_LogRegression = lazyWithPreload(() => import('@/features/modules/under-construction/S26_LogRegression'));
const S27_MVRVScore = lazyWithPreload(() => import('@/features/modules/under-construction/S27_MVRVScore'));
const S28_GoogleTrends = lazyWithPreload(() => import('@/features/modules/under-construction/S28_GoogleTrends'));
const S29_BTCDominance = lazyWithPreload(() => import('@/features/modules/under-construction/S29_BTCDominance'));
const S30_UTXODistribution = lazyWithPreload(() => import('@/features/modules/under-construction/S30_UTXODistribution'));
const S31_USNationalDebt = lazyWithPreload(() => import('@/features/modules/live/S31_USNationalDebt'));
const S32_Khunsa = lazyWithPreload(() => import('@/features/modules/live/S32_Khunsa'));

const MODULE_DEFS = [
  { slugBase: 'bitcoin-price-market-overview', title: 'Bitcoin Overview', component: S01_BitcoinOverview },
  { slugBase: 'bitcoin-price-chart-live', title: 'Price Chart', component: S02_PriceChart },
  { slugBase: 'bitcoin-price-multi-currency', title: 'Multi-Currency', component: S03_MultiCurrencyBoard },
  { slugBase: 'bitcoin-mempool-fees', title: 'Mempool Gauge', component: S04_MempoolGauge },
  { slugBase: 'bitcoin-mempool-trend', title: 'Long-Term Trend', component: S05_LongTermTrend },
  { slugBase: 'bitcoin-mempool-queue-v2', title: 'BTC Queue', component: S06_BtcQueue },
  { slugBase: 'bitcoin-nodes-world-map', title: 'Nodes Map', component: S07_NodesMap },
  { slugBase: 'lightning-nodes-world-map', title: 'Lightning Nodes Map', component: S08_LightningNodesMap },
  { slugBase: 'bitcoin-merchant-map', title: 'BTC Map Business Density', component: S09_BtcMapBusinessesMap },
  { slugBase: 'lightning-network-stats', title: 'Lightning Network', component: S10_LightningNetwork },
  { slugBase: 'stablecoin-peg-tracker', title: 'Stablecoin Peg Health', component: S11_StablecoinPegHealth },
  { slugBase: 'bitcoin-fear-greed-index', title: 'Fear & Greed', component: S12_FearGreedIndex },
  { slugBase: 'bitcoin-address-distribution', title: 'Address Distribution', component: S13_AddressDistribution },
  { slugBase: 'bitcoin-wealth-pyramid', title: 'Wealth Pyramid', component: S14_WealthPyramid },
  { slugBase: 'bitcoin-vs-global-assets', title: 'Global Assets', component: S15_GlobalAssetsTreemap },
  { slugBase: 'bitcoin-vs-gold-chart', title: 'BTC vs Gold', component: S16_BTCvsGold },
  { slugBase: 'bitcoin-mayer-multiple', title: 'Mayer Multiple', component: S17_MayerMultiple },
  { slugBase: 'bitcoin-price-performance', title: 'US Median Home Price in ₿', component: S18_PricePerformance },
  { slugBase: 'bitcoin-halving-cycle-spiral', title: 'Cycle Spiral', component: S19_CycleSpiral },
  { slugBase: 'bitcoin-power-law-model', title: 'Power Law Model', component: S20_PowerLawModel },
  { slugBase: 'bitcoin-stock-to-flow-model', title: 'Stock to Flow', component: S21_StockToFlow },
  { slugBase: 'bitcoin-seasonality-heatmap', title: 'Seasonality', component: S23_SeasonalityHeatmap },
  { slugBase: 'bitcoin-big-mac-index', title: 'Big Mac Index', component: S24_BigMacIndex },
  { slugBase: 'bitcoin-network-activity', title: 'Network Activity', component: S25_NetworkActivity },
  { slugBase: 'bitcoin-log-regression-channel', title: 'Log Regression', component: S26_LogRegression },
  { slugBase: 'bitcoin-mvrv-score', title: 'MVRV Score', component: S27_MVRVScore },
  { slugBase: 'bitcoin-google-trends', title: 'Google Trends', component: S28_GoogleTrends },
  { slugBase: 'bitcoin-dominance-chart', title: 'BTC Dominance', component: S29_BTCDominance },
  { slugBase: 'bitcoin-utxo-distribution', title: 'UTXO Distribution', component: S30_UTXODistribution },
  { slugBase: 'us-national-debt-live-counter', title: 'U.S. National Debt', component: S31_USNationalDebt },
  { slugBase: 'khunsa-coinos-donation', title: 'Support Khunsa', component: S32_Khunsa },
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
