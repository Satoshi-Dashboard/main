import { lazy } from 'react';

const S01_BitcoinOverview = lazy(() => import('../components/sections/S01_BitcoinOverview'));
const S02_PriceChart = lazy(() => import('../components/sections/S02_PriceChart'));
const S03_MultiCurrencyBoard = lazy(() => import('../components/sections/S03_MultiCurrencyBoard'));
const S04_MempoolGauge = lazy(() => import('../components/sections/S04_MempoolGauge'));
const S05_LongTermTrend = lazy(() => import('../components/sections/S05_LongTermTrend'));
const S08_NodesMap = lazy(() => import('../components/sections/S08_NodesMap'));
const S08b_LightningNodesMap = lazy(() => import('../components/sections/S08b_LightningNodesMap'));
const S08c_BtcMapBusinessesMap = lazy(() => import('../components/sections/S08c_BtcMapBusinessesMap'));
const S09_LightningNetwork = lazy(() => import('../components/sections/S09_LightningNetwork'));
const S09b_StablecoinPegHealth = lazy(() => import('../components/sections/S09b_StablecoinPegHealth'));
const S10_FearGreedIndex = lazy(() => import('../components/sections/S10_FearGreedIndex'));
const S11_AddressDistribution = lazy(() => import('../components/sections/S11_AddressDistribution'));
const S12_BTCvsGold = lazy(() => import('../components/sections/S12_BTCvsGold'));
const S13_GlobalAssetsTreemap = lazy(() => import('../components/sections/S13_GlobalAssetsTreemap'));
const S15_WealthPyramid = lazy(() => import('../components/sections/S15_WealthPyramid'));
const S16_MayerMultiple = lazy(() => import('../components/sections/S16_MayerMultiple'));
const S17_PricePerformance = lazy(() => import('../components/sections/S17_PricePerformance'));
const S18_CycleSpiral = lazy(() => import('../components/sections/S18_CycleSpiral'));
const S19_PowerLawModel = lazy(() => import('../components/sections/S19_PowerLawModel'));
const S20_StockToFlow = lazy(() => import('../components/sections/S20_StockToFlow'));
const S21_NodeVersions = lazy(() => import('../components/sections/S21_NodeVersions'));
const S22_SeasonalityHeatmap = lazy(() => import('../components/sections/S22_SeasonalityHeatmap'));
const S23_BigMacIndex = lazy(() => import('../components/sections/S23_BigMacIndex'));
const S24_NetworkActivity = lazy(() => import('../components/sections/S24_NetworkActivity'));
const S25_LogRegression = lazy(() => import('../components/sections/S25_LogRegression'));
const S26_MVRVScore = lazy(() => import('../components/sections/S26_MVRVScore'));
const S27_GoogleTrends = lazy(() => import('../components/sections/S27_GoogleTrends'));
const S28_BTCDominance = lazy(() => import('../components/sections/S28_BTCDominance'));
const S29_UTXODistribution = lazy(() => import('../components/sections/S29_UTXODistribution'));
const S30_USNationalDebt = lazy(() => import('../components/sections/S30_USNationalDebt'));
const S29_ThankYouSatoshi = lazy(() => import('../components/sections/S29_ThankYouSatoshi'));

const MODULE_DEFS = [
  { slugBase: 'bitcoin-price-market-overview', title: 'Bitcoin Overview', component: S01_BitcoinOverview },
  { slugBase: 'bitcoin-price-chart-live', title: 'Price Chart', component: S02_PriceChart },
  { slugBase: 'bitcoin-price-multi-currency', title: 'Multi-Currency', component: S03_MultiCurrencyBoard },
  { slugBase: 'bitcoin-mempool-fees', title: 'Mempool Gauge', component: S04_MempoolGauge },
  { slugBase: 'bitcoin-mempool-trend', title: 'Long-Term Trend', component: S05_LongTermTrend },
  { slugBase: 'bitcoin-nodes-world-map', title: 'Nodes Map', component: S08_NodesMap },
  { slugBase: 'lightning-nodes-world-map', title: 'Lightning Nodes Map', component: S08b_LightningNodesMap },
  { slugBase: 'bitcoin-merchant-map', title: 'BTC Map Business Density', component: S08c_BtcMapBusinessesMap },
  { slugBase: 'lightning-network-stats', title: 'Lightning Network', component: S09_LightningNetwork },
  { slugBase: 'stablecoin-peg-tracker', title: 'Stablecoin Peg Health', component: S09b_StablecoinPegHealth },
  { slugBase: 'bitcoin-fear-greed-index', title: 'Fear & Greed', component: S10_FearGreedIndex },
  { slugBase: 'bitcoin-address-distribution', title: 'Address Distribution', component: S11_AddressDistribution },
  { slugBase: 'bitcoin-wealth-pyramid', title: 'Wealth Pyramid', component: S15_WealthPyramid },
  { slugBase: 'bitcoin-vs-global-assets', title: 'Global Assets', component: S13_GlobalAssetsTreemap },
  { slugBase: 'bitcoin-vs-gold-chart', title: 'BTC vs Gold', component: S12_BTCvsGold },
  { slugBase: 'bitcoin-mayer-multiple', title: 'Mayer Multiple', component: S16_MayerMultiple },
  { slugBase: 'bitcoin-price-performance', title: 'Price Performance', component: S17_PricePerformance },
  { slugBase: 'bitcoin-halving-cycle-spiral', title: 'Cycle Spiral', component: S18_CycleSpiral },
  { slugBase: 'bitcoin-power-law-model', title: 'Power Law Model', component: S19_PowerLawModel },
  { slugBase: 'bitcoin-stock-to-flow-model', title: 'Stock to Flow', component: S20_StockToFlow },
  { slugBase: 'bitcoin-big-mac-sats-tracker', title: 'Big Mac Sats Tracker', component: S21_NodeVersions },
  { slugBase: 'bitcoin-seasonality-heatmap', title: 'Seasonality', component: S22_SeasonalityHeatmap },
  { slugBase: 'bitcoin-big-mac-index', title: 'Big Mac Index', component: S23_BigMacIndex },
  { slugBase: 'bitcoin-network-activity', title: 'Network Activity', component: S24_NetworkActivity },
  { slugBase: 'bitcoin-log-regression-channel', title: 'Log Regression', component: S25_LogRegression },
  { slugBase: 'bitcoin-mvrv-score', title: 'MVRV Score', component: S26_MVRVScore },
  { slugBase: 'bitcoin-google-trends', title: 'Google Trends', component: S27_GoogleTrends },
  { slugBase: 'bitcoin-dominance-chart', title: 'BTC Dominance', component: S28_BTCDominance },
  { slugBase: 'bitcoin-utxo-distribution', title: 'UTXO Distribution', component: S29_UTXODistribution },
  { slugBase: 'us-national-debt-live-counter', title: 'U.S. National Debt', component: S30_USNationalDebt },
  { slugBase: 'satoshi-nakamoto-bitcoin-whitepaper', title: 'Thank You Satoshi', component: S29_ThankYouSatoshi },
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

const LEGACY_MODULE_SLUGS = [
  's01-bitcoin-overview',
  's02-price-chart',
  's03-multi-currency',
  's04-mempool-gauge',
  's05-long-term-trend',
  's06-nodes-map',
  's07-lightning-nodes-map',
  's08-btcmap-business-density',
  's09-lightning-network',
  's10-stablecoin-peg',
  's11-fear-greed',
  's12-address-distribution',
  's13-wealth-pyramid',
  's14-global-assets',
  's15-btc-vs-gold',
  's16-mayer-multiple',
  's17-price-performance',
  's18-cycle-spiral',
  's19-power-law-model',
  's20-stock-to-flow',
  's21-node-versions',
  's22-seasonality',
  's23-big-mac-index',
  's24-network-activity',
  's25-log-regression',
  's26-mvrv-score',
  's27-google-trends',
  's28-btc-dominance',
  's29-utxo-distribution',
  's30-us-national-debt',
  's31-thank-you-satoshi',
];

export const LEGACY_MODULE_REDIRECTS = Object.fromEntries(
  LEGACY_MODULE_SLUGS.map((slug, index) => [slug, index === 0 ? '/' : `/module/${MODULES[index].slug}`]),
);

export function getModulePath(moduleOrCode) {
  const module = typeof moduleOrCode === 'string' ? MODULES_BY_CODE[moduleOrCode] : moduleOrCode;
  if (!module) return '/';
  return module.code === FIRST_MODULE.code ? '/' : `/module/${module.slug}`;
}
