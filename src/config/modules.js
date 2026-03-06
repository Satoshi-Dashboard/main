import S01_BitcoinOverview from '../components/sections/S01_BitcoinOverview';
import S02_PriceChart from '../components/sections/S02_PriceChart';
import S03_MultiCurrencyBoard from '../components/sections/S03_MultiCurrencyBoard';
import S04_MempoolGauge from '../components/sections/S04_MempoolGauge';
import S05_LongTermTrend from '../components/sections/S05_LongTermTrend';
import S08_NodesMap from '../components/sections/S08_NodesMap';
import S09_LightningNetwork from '../components/sections/S09_LightningNetwork';
import S09b_StablecoinPegHealth from '../components/sections/S09b_StablecoinPegHealth';
import S10_FearGreedIndex from '../components/sections/S10_FearGreedIndex';
import S11_AddressDistribution from '../components/sections/S11_AddressDistribution';
import S12_BTCvsGold from '../components/sections/S12_BTCvsGold';
import S13_GlobalAssetsTreemap from '../components/sections/S13_GlobalAssetsTreemap';
import S15_WealthPyramid from '../components/sections/S15_WealthPyramid';
import S16_MayerMultiple from '../components/sections/S16_MayerMultiple';
import S17_PricePerformance from '../components/sections/S17_PricePerformance';
import S18_CycleSpiral from '../components/sections/S18_CycleSpiral';
import S19_PowerLawModel from '../components/sections/S19_PowerLawModel';
import S20_StockToFlow from '../components/sections/S20_StockToFlow';
import S21_NodeVersions from '../components/sections/S21_NodeVersions';
import S22_SeasonalityHeatmap from '../components/sections/S22_SeasonalityHeatmap';
import S23_BigMacIndex from '../components/sections/S23_BigMacIndex';
import S24_NetworkActivity from '../components/sections/S24_NetworkActivity';
import S25_LogRegression from '../components/sections/S25_LogRegression';
import S26_MVRVScore from '../components/sections/S26_MVRVScore';
import S27_GoogleTrends from '../components/sections/S27_GoogleTrends';
import S28_BTCDominance from '../components/sections/S28_BTCDominance';
import S29_UTXODistribution from '../components/sections/S29_UTXODistribution';
import S30_ThankYouSatoshi from '../components/sections/S30_ThankYouSatoshi';

const MODULE_DEFS = [
  { slugBase: 'bitcoin-overview', title: 'Bitcoin Overview', component: S01_BitcoinOverview },
  { slugBase: 'price-chart', title: 'Price Chart', component: S02_PriceChart },
  { slugBase: 'multi-currency', title: 'Multi-Currency', component: S03_MultiCurrencyBoard },
  { slugBase: 'mempool-gauge', title: 'Mempool Gauge', component: S04_MempoolGauge },
  { slugBase: 'long-term-trend', title: 'Long-Term Trend', component: S05_LongTermTrend },
  { slugBase: 'nodes-map', title: 'Nodes Map', component: S08_NodesMap },
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
  { slugBase: 'thank-you-satoshi', title: 'Thank You Satoshi', component: S30_ThankYouSatoshi },
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
