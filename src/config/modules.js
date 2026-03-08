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
  { slugBase: 'bitcoin-overview', title: 'Bitcoin Overview', component: S01_BitcoinOverview },
  { slugBase: 'price-chart', title: 'Price Chart', component: S02_PriceChart },
  { slugBase: 'multi-currency', title: 'Multi-Currency', component: S03_MultiCurrencyBoard },
  { slugBase: 'mempool-gauge', title: 'Mempool Gauge', component: S04_MempoolGauge },
  { slugBase: 'long-term-trend', title: 'Long-Term Trend', component: S05_LongTermTrend },
  { slugBase: 'nodes-map', title: 'Nodes Map', component: S08_NodesMap },
  { slugBase: 'lightning-nodes-map', title: 'Lightning Nodes Map', component: S08b_LightningNodesMap },
  { slugBase: 'btcmap-business-density', title: 'BTC Map Business Density', component: S08c_BtcMapBusinessesMap },
  { slugBase: 'lightning-network', title: 'Lightning Network', component: S09_LightningNetwork },
  { slugBase: 'stablecoin-peg', title: 'Stablecoin Peg Health', component: S09b_StablecoinPegHealth },
  { slugBase: 'fear-greed', title: 'Fear & Greed', component: S10_FearGreedIndex },
  { slugBase: 'address-distribution', title: 'Address Distribution', component: S11_AddressDistribution },
  { slugBase: 'wealth-pyramid', title: 'Wealth Pyramid', component: S15_WealthPyramid },
  { slugBase: 'global-assets', title: 'Global Assets', component: S13_GlobalAssetsTreemap },
  { slugBase: 'btc-vs-gold', title: 'BTC vs Gold', component: S12_BTCvsGold },
  { slugBase: 'mayer-multiple', title: 'Mayer Multiple', component: S16_MayerMultiple },
  { slugBase: 'price-performance', title: 'Price Performance', component: S17_PricePerformance },
  { slugBase: 'cycle-spiral', title: 'Cycle Spiral', component: S18_CycleSpiral },
  { slugBase: 'power-law-model', title: 'Power Law Model', component: S19_PowerLawModel },
  { slugBase: 'stock-to-flow', title: 'Stock to Flow', component: S20_StockToFlow },
  { slugBase: 'node-versions', title: 'Big Mac Sats Tracker', component: S21_NodeVersions },
  { slugBase: 'seasonality', title: 'Seasonality', component: S22_SeasonalityHeatmap },
  { slugBase: 'big-mac-index', title: 'Big Mac Index', component: S23_BigMacIndex },
  { slugBase: 'network-activity', title: 'Network Activity', component: S24_NetworkActivity },
  { slugBase: 'log-regression', title: 'Log Regression', component: S25_LogRegression },
  { slugBase: 'mvrv-score', title: 'MVRV Score', component: S26_MVRVScore },
  { slugBase: 'google-trends', title: 'Google Trends', component: S27_GoogleTrends },
  { slugBase: 'btc-dominance', title: 'BTC Dominance', component: S28_BTCDominance },
  { slugBase: 'utxo-distribution', title: 'UTXO Distribution', component: S29_UTXODistribution },
  { slugBase: 'us-national-debt', title: 'U.S. National Debt', component: S30_USNationalDebt },
  { slugBase: 'thank-you-satoshi', title: 'Thank You Satoshi', component: S29_ThankYouSatoshi },
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

export const MODULES_BY_SLUG = Object.fromEntries(MODULES.map((module) => [module.slug, module]));
