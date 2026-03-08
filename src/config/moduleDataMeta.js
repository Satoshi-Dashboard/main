const INTERNAL_PROVIDER = {
  name: 'Satoshi Dashboard',
  url: 'https://github.com/Satoshi-Dashboard/main',
};

const DEFAULT_META = {
  providers: [INTERNAL_PROVIDER],
  refreshMinutes: 24 * 60,
  showSharedStrip: true,
};

const MODULE_DATA_META = {
  'bitcoin-overview': {
    providers: [
      { name: 'Binance', url: 'https://api.binance.com' },
      { name: 'mempool.space', url: 'https://mempool.space' },
      { name: 'Alternative.me', url: 'https://alternative.me/crypto/fear-and-greed-index/' },
    ],
    refreshSeconds: 30,
  },
  'price-chart': {
    providers: [{ name: 'Binance', url: 'https://api.binance.com' }],
    refreshLabel: 'on load',
  },
  'multi-currency': {
    providers: [
      { name: 'Investing', url: 'https://www.investing.com/currencies/single-currency-crosses?currency=usd' },
      { name: 'Binance', url: 'https://api.binance.com' },
    ],
    refreshSeconds: 30,
    desktopOverlayInModule: true,
    showSharedStripOnResponsive: false,
  },
  'mempool-gauge': {
    providers: [{ name: 'mempool.space', url: 'https://mempool.space' }],
    refreshSeconds: 30,
  },
  'long-term-trend': {
    providers: [{ name: 'mempool.space', url: 'https://mempool.space' }],
    refreshLabel: 'live',
    desktopOverlayInModule: true,
  },
  'nodes-map': {
    providers: [
      { name: 'Bitnodes', url: 'https://bitnodes.io' },
    ],
    refreshRangeLabel: '10 min - 12 h',
    showSharedStrip: false,
  },
  'lightning-nodes-map': {
    providers: [{ name: 'mempool.space', url: 'https://mempool.space' }],
    refreshMinutes: 1,
    showSharedStrip: false,
  },
  'btcmap-business-density': {
    providers: [
      { name: 'BTC Map', url: 'https://btcmap.org' },
      { name: 'Natural Earth', url: 'https://www.naturalearthdata.com/' },
    ],
    refreshMinutes: 360,
    showSharedStrip: false,
  },
  'lightning-network': {
    providers: [{ name: 'Binance', url: 'https://api.binance.com' }],
    refreshSeconds: 15,
  },
  'stablecoin-peg': {
    providers: [{ name: 'CoinGecko', url: 'https://www.coingecko.com/en/api' }],
    refreshMinutes: 2,
    sharedMetaAbsoluteCard: true,
  },
  'fear-greed': {
    providers: [{ name: 'Alternative.me', url: 'https://alternative.me/crypto/fear-and-greed-index/' }],
    refreshLabel: 'daily update',
  },
  'address-distribution': {
    providers: [{ name: 'BitInfoCharts', url: 'https://bitinfocharts.com' }],
    refreshMinutes: 30,
    showSharedStrip: false,
  },
  'wealth-pyramid': {
    providers: [{ name: 'BitInfoCharts', url: 'https://bitinfocharts.com' }],
    refreshMinutes: 30,
    showSharedStrip: false,
  },
  'global-assets': {
    providers: [{ name: 'Newhedge', url: 'https://newhedge.io/bitcoin/global-asset-values' }],
    refreshMinutes: 60,
    showTitleInStrip: true,
    stripTitle: 'Total Global Asset Values',
  },
  'btc-vs-gold': {
    providers: [{ name: 'CoinGecko', url: 'https://www.coingecko.com/en/api' }],
    refreshMinutes: 60,
  },
  'price-performance': {
    providers: [{ name: 'CoinGecko', url: 'https://www.coingecko.com/en/api' }],
    refreshMinutes: 60,
  },
  'node-versions': {
    providers: [
      { name: 'Binance', url: 'https://api.binance.com' },
      { name: 'Alternative.me', url: 'https://alternative.me' },
      { name: 'The Economist', url: 'https://github.com/TheEconomist/big-mac-data' },
    ],
    refreshLabel: 'annual index',
  },
  'big-mac-index': {
    providers: [{ name: 'CoinGecko', url: 'https://www.coingecko.com/en/api' }],
    refreshMinutes: 60,
  },
  'us-national-debt': {
    providers: [
      { name: 'U.S. Treasury FiscalData', url: 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny' },
      { name: 'U.S. Census ACS', url: 'https://api.census.gov/data/2024/acs/acs1?get=NAME,B01003_001E&for=us:1' },
    ],
    refreshMinutes: 15,
  },
  'thank-you-satoshi': {
    showSharedStrip: false,
  },
};

export function getModuleDataMeta(module) {
  const key = String(module?.slugBase || '');
  return {
    ...DEFAULT_META,
    ...(MODULE_DATA_META[key] || {}),
  };
}
