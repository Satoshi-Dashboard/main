import S01_BitcoinOverview from '../components/sections/S01_BitcoinOverview';
import S02_PriceChart from '../components/sections/S02_PriceChart';
import S03_MultiCurrencyBoard from '../components/sections/S03_MultiCurrencyBoard';
import S04_MempoolGauge from '../components/sections/S04_MempoolGauge';
import S05_LongTermTrend from '../components/sections/S05_LongTermTrend';
import S08_NodesMap from '../components/sections/S08_NodesMap';
import S09_LightningNetwork from '../components/sections/S09_LightningNetwork';
import S10_FearGreedIndex from '../components/sections/S10_FearGreedIndex';
import S11_AddressDistribution from '../components/sections/S11_AddressDistribution';
import S12_BTCvsGold from '../components/sections/S12_BtcVsGold';
import S13_GlobalAssetsTreemap from '../components/sections/S13_GlobalAssetsTreemap';
import S14_TransactionCount from '../components/sections/S14_TransactionCount';
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

export const MODULES = [
  { code: 'S01', slug: 's01-bitcoin-overview', title: 'Bitcoin Overview', component: S01_BitcoinOverview },
  { code: 'S02', slug: 's02-price-chart', title: 'Price Chart', component: S02_PriceChart },
  { code: 'S03', slug: 's03-multi-currency', title: 'Multi-Currency', component: S03_MultiCurrencyBoard },
  { code: 'S04', slug: 's04-mempool-gauge', title: 'Mempool Gauge', component: S04_MempoolGauge },
  { code: 'S05', slug: 's05-long-term-trend', title: 'Long-Term Trend', component: S05_LongTermTrend },
  { code: 'S08', slug: 's08-nodes-map', title: 'Nodes Map', component: S08_NodesMap },
  { code: 'S09', slug: 's09-lightning-network', title: 'Lightning Network', component: S09_LightningNetwork },
  { code: 'S10', slug: 's10-fear-greed', title: 'Fear & Greed', component: S10_FearGreedIndex },
  { code: 'S11', slug: 's11-address-distribution', title: 'Address Distribution', component: S11_AddressDistribution },
  { code: 'S12', slug: 's12-btc-vs-gold', title: 'BTC vs Gold', component: S12_BTCvsGold },
  { code: 'S13', slug: 's13-global-assets', title: 'Global Assets', component: S13_GlobalAssetsTreemap },
  { code: 'S14', slug: 's14-transaction-count', title: 'Transaction Count', component: S14_TransactionCount },
  { code: 'S15', slug: 's15-wealth-pyramid', title: 'Wealth Pyramid', component: S15_WealthPyramid },
  { code: 'S16', slug: 's16-mayer-multiple', title: 'Mayer Multiple', component: S16_MayerMultiple },
  { code: 'S17', slug: 's17-price-performance', title: 'Price Performance', component: S17_PricePerformance },
  { code: 'S18', slug: 's18-cycle-spiral', title: 'Cycle Spiral', component: S18_CycleSpiral },
  { code: 'S19', slug: 's19-power-law-model', title: 'Power Law Model', component: S19_PowerLawModel },
  { code: 'S20', slug: 's20-stock-to-flow', title: 'Stock to Flow', component: S20_StockToFlow },
  { code: 'S21', slug: 's21-node-versions', title: 'Node Versions', component: S21_NodeVersions },
  { code: 'S22', slug: 's22-seasonality', title: 'Seasonality', component: S22_SeasonalityHeatmap },
  { code: 'S23', slug: 's23-big-mac-index', title: 'Big Mac Index', component: S23_BigMacIndex },
  { code: 'S24', slug: 's24-network-activity', title: 'Network Activity', component: S24_NetworkActivity },
  { code: 'S25', slug: 's25-log-regression', title: 'Log Regression', component: S25_LogRegression },
  { code: 'S26', slug: 's26-mvrv-score', title: 'MVRV Score', component: S26_MVRVScore },
  { code: 'S27', slug: 's27-google-trends', title: 'Google Trends', component: S27_GoogleTrends },
  { code: 'S28', slug: 's28-btc-dominance', title: 'BTC Dominance', component: S28_BTCDominance },
  { code: 'S29', slug: 's29-utxo-distribution', title: 'UTXO Distribution', component: S29_UTXODistribution },
  { code: 'S30', slug: 's30-thank-you-satoshi', title: 'Thank You Satoshi', component: S30_ThankYouSatoshi },
];

export const MODULES_BY_SLUG = Object.fromEntries(MODULES.map((module) => [module.slug, module]));
