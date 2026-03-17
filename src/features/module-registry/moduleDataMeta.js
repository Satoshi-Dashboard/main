const INTERNAL_PROVIDER = {
  name: 'Satoshi Dashboard',
  url: 'https://satoshidashboard.com/landingpage',
};

const DEFAULT_META = {
  providers: [INTERNAL_PROVIDER],
  refreshMinutes: 24 * 60,
  showSharedStrip: true,
};

const UNDER_CONSTRUCTION_META = {
  providers: [],
  refreshLabel: 'in development',
  showSharedStrip: false,
};

const MODULE_DATA_META = {
  'bitcoin-price-market-overview': {
    providers: [
      { name: 'Binance', url: 'https://api.binance.com' },
      { name: 'mempool.space', url: 'https://mempool.space' },
      { name: 'Alternative.me', url: 'https://alternative.me/crypto/fear-and-greed-index/' },
    ],
    refreshSeconds: 30,
    showTitleInStrip: false,
  },
  'bitcoin-price-chart-live': {
    providers: [{ name: 'Binance', url: 'https://api.binance.com' }],
    refreshLabel: 'on load',
  },
  'bitcoin-price-multi-currency': {
    providers: [
      { name: 'Investing', url: 'https://www.investing.com/currencies/single-currency-crosses?currency=usd' },
      { name: 'Binance', url: 'https://api.binance.com' },
    ],
    refreshSeconds: 30,
    desktopOverlayInModule: true,
    showSharedStripOnResponsive: false,
  },
  'bitcoin-mempool-fees': {
    providers: [
      { name: 'mempool.space', url: 'https://mempool.space' },
      { name: 'Internal API', url: null },
    ],
    refreshSeconds: 30,
    showTitleInStrip: false,
  },
  'bitcoin-mempool-trend': {
    providers: [{ name: 'mempool.space', url: 'https://mempool.space' }],
    refreshLabel: 'live',
    desktopOverlayInModule: true,
  },
  'bitcoin-nodes-world-map': {
    providers: [
      { name: 'Bitnodes', url: 'https://bitnodes.io' },
    ],
    refreshRangeLabel: '10 min - 12 h',
    showSharedStrip: false,
  },
  'lightning-nodes-world-map': {
    providers: [{ name: 'mempool.space', url: 'https://mempool.space' }],
    refreshMinutes: 1,
    showSharedStrip: false,
  },
  'bitcoin-merchant-map': {
    providers: [
      { name: 'BTC Map', url: 'https://btcmap.org' },
      { name: 'Natural Earth', url: 'https://www.naturalearthdata.com/' },
    ],
    refreshMinutes: 360,
    showSharedStrip: false,
  },
  'lightning-network-stats': {
    providers: [{ name: 'Binance', url: 'https://api.binance.com' }],
    refreshSeconds: 15,
    showTitleInStrip: false,
  },
  'stablecoin-peg-tracker': {
    providers: [{ name: 'CoinGecko', url: 'https://www.coingecko.com/en/api' }],
    refreshMinutes: 2,
    sharedMetaAbsoluteCard: true,
  },
  'bitcoin-fear-greed-index': {
    providers: [{ name: 'Alternative.me', url: 'https://alternative.me/crypto/fear-and-greed-index/' }],
    refreshLabel: 'daily update',
    showTitleInStrip: false,
  },
  'bitcoin-address-distribution': {
    providers: [{ name: 'BitInfoCharts', url: 'https://bitinfocharts.com' }],
    refreshMinutes: 30,
    showSharedStrip: false,
    showTitleInStrip: false,
  },
  'bitcoin-wealth-pyramid': {
    providers: [{ name: 'BitInfoCharts', url: 'https://bitinfocharts.com' }],
    refreshMinutes: 30,
    showSharedStrip: false,
    showTitleInStrip: false,
  },
  'bitcoin-vs-global-assets': {
    providers: [{ name: 'Newhedge', url: 'https://newhedge.io/bitcoin/global-asset-values' }],
    refreshMinutes: 60,
    showTitleInStrip: true,
    stripTitle: 'Total Global Asset Values',
  },
  'bitcoin-vs-gold-chart': {
    providers: [
      { name: 'Binance', url: 'https://api.binance.com' },
      { name: 'CompaniesMarketCap', url: 'https://companiesmarketcap.com/' },
    ],
    refreshRangeLabel: 'spot/history 5m + gold 15m',
    showTitleInStrip: true,
    stripTitle: 'Market Cap Comparison',
  },
  'bitcoin-mayer-multiple': {
    providers: [{ name: 'Binance', url: 'https://api.binance.com' }],
    refreshRangeLabel: 'spot 10s / history 60m',
    responsiveScroll: true,
    showTitleInStrip: true,
    stripTitle: 'Mayer Multiple',
  },
  'bitcoin-price-performance': {
    providers: [
      { name: 'FRED — St. Louis Fed', url: 'https://fred.stlouisfed.org/series/MSPUS' },
      { name: 'Binance', url: 'https://api.binance.com' },
    ],
    refreshLabel: 'quarterly (FRED MSPUS)',
    showTitleInStrip: true,
    stripTitle: 'US Median Home Price in ₿',
  },
  'bitcoin-halving-cycle-spiral': {
    providers: [{ name: 'Internal', url: null }],
    refreshLabel: 'static data',
    showSharedStrip: true,
    showTitleInStrip: false,
  },
  'bitcoin-power-law-model': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-stock-to-flow-model': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-big-mac-sats-tracker': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-seasonality-heatmap': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-big-mac-index': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-network-activity': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-log-regression-channel': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-mvrv-score': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-google-trends': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-dominance-chart': {
    ...UNDER_CONSTRUCTION_META,
  },
  'bitcoin-utxo-distribution': {
    ...UNDER_CONSTRUCTION_META,
  },
  'us-national-debt-live-counter': {
    providers: [
      { name: 'U.S. Treasury FiscalData', url: 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny' },
      { name: 'U.S. Census ACS', url: 'https://api.census.gov/data/2024/acs/acs1?get=NAME,B01003_001E&for=us:1' },
    ],
    refreshMinutes: 15,
    responsiveScroll: true,
    showSharedStripOnResponsive: false,
    showTitleInStrip: false,
  },
  'satoshi-nakamoto-bitcoin-whitepaper': {
    showSharedStrip: false,
    responsiveScroll: true,
  },
};

export function getModuleDataMeta(module) {
  const key = String(module?.slugBase || '');
  return {
    ...DEFAULT_META,
    ...(MODULE_DATA_META[key] || {}),
  };
}
