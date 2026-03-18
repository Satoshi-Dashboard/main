/**
 * Per-module SEO metadata keyed by `slugBase` from modules.js.
 * Each entry defines a unique title, description, and keyword set.
 */

const MODULE_SEO = {
  'bitcoin-price-market-overview': {
    title: 'Bitcoin Dashboard - Live BTC Price, Market Cap & Network Stats',
    description: 'Track live Bitcoin price, market cap, 24h volume, block height, hashrate, and Fear & Greed in one free Bitcoin dashboard built for fast market analysis.',
    keywords: ['bitcoin dashboard', 'live bitcoin price', 'btc market cap', 'bitcoin network stats'],
  },
  'bitcoin-price-chart-live': {
    title: 'Bitcoin Price Chart Live - BTC/USD Candlestick Dashboard',
    description: 'View a live Bitcoin price chart with BTC/USD candlesticks across 7-day, 30-day, 90-day, and 1-year timeframes for fast trend analysis.',
    keywords: ['bitcoin price chart', 'btc usd chart', 'live bitcoin chart', 'bitcoin candlestick chart'],
  },
  'bitcoin-price-multi-currency': {
    title: 'Bitcoin Price by Currency - Live BTC Exchange Dashboard',
    description: 'Compare live Bitcoin price in 30+ global currencies including EUR, GBP, JPY, BRL, and ARS with fast refresh intervals.',
    keywords: ['bitcoin price in usd', 'bitcoin price in eur', 'bitcoin multi currency', 'btc exchange rates'],
  },
  'bitcoin-mempool-fees': {
    title: 'Bitcoin Mempool Fees - Live Fee Rates & Congestion Gauge',
    description: 'Monitor Bitcoin mempool congestion, pending transactions, recommended fee rates, and confirmation pressure in one live mempool gauge.',
    keywords: ['bitcoin mempool fees', 'bitcoin fee tracker', 'mempool gauge', 'btc pending transactions'],
  },
  'bitcoin-mempool-trend': {
    title: 'Bitcoin Mempool Trend - Long-Term Fees & Pending Tx',
    description: 'Analyze long-term Bitcoin mempool behavior with fee trend history, congestion patterns, and network pressure across longer time windows.',
    keywords: ['bitcoin mempool trend', 'bitcoin fee history', 'mempool congestion chart', 'btc fee trend'],
  },
  'bitcoin-nodes-world-map': {
    title: 'Bitcoin Nodes Map - Full Nodes by Country',
    description: 'Explore a Bitcoin nodes map showing reachable full nodes by country to evaluate network distribution and decentralization worldwide.',
    keywords: ['bitcoin nodes map', 'bitcoin full nodes', 'btc nodes by country', 'how many bitcoin nodes'],
  },
  'lightning-nodes-world-map': {
    title: 'Lightning Nodes Map - Global Bitcoin LN Nodes',
    description: 'See where Lightning Network routing nodes are located worldwide with a global Lightning nodes map optimized for BTC network research.',
    keywords: ['lightning nodes map', 'lightning network nodes', 'bitcoin ln nodes', 'lightning map'],
  },
  'bitcoin-merchant-map': {
    title: 'Bitcoin Merchant Map - BTC Businesses by Country',
    description: 'Discover Bitcoin-friendly businesses by country with a merchant map that highlights adoption hotspots, store density, and BTC acceptance coverage.',
    keywords: ['bitcoin merchant map', 'bitcoin businesses map', 'btc merchants', 'bitcoin point of sale map'],
  },
  'lightning-network-stats': {
    title: 'Lightning Network Stats - Channels, Capacity & Nodes',
    description: 'Track live Lightning Network capacity, channel count, and active nodes to monitor Bitcoin payment infrastructure growth.',
    keywords: ['lightning network stats', 'lightning capacity', 'lightning channels', 'bitcoin payment network'],
  },
  'stablecoin-peg-tracker': {
    title: 'Stablecoin Peg Tracker - USDT, USDC & DAI Health',
    description: 'Monitor live peg deviation for USDT, USDC, DAI, BUSD, and other stablecoins to spot stability risks and off-peg events fast.',
    keywords: ['stablecoin peg tracker', 'usdt peg', 'usdc peg', 'stablecoin health'],
  },
  'bitcoin-fear-greed-index': {
    title: 'Bitcoin Fear & Greed Index - Daily Sentiment Tracker',
    description: 'Check the current Bitcoin Fear & Greed Index with recent history to understand whether market sentiment is in fear, greed, or a neutral zone.',
    keywords: ['bitcoin fear and greed index', 'btc sentiment', 'fear greed tracker', 'bitcoin market sentiment'],
  },
  'bitcoin-address-distribution': {
    title: 'Bitcoin Address Distribution - Holders by Balance',
    description: 'Review Bitcoin address distribution by balance range to see how BTC supply is spread from micro-holders to whales.',
    keywords: ['bitcoin address distribution', 'btc holders by balance', 'bitcoin whales', 'on chain distribution'],
  },
  'bitcoin-wealth-pyramid': {
    title: 'Bitcoin Wealth Pyramid - BTC Holder Tiers',
    description: 'Visualize Bitcoin holder concentration with a wealth pyramid showing BTC ownership tiers from small stackers to large whales.',
    keywords: ['bitcoin wealth pyramid', 'bitcoin holders', 'btc ownership tiers', 'bitcoin wealth distribution'],
  },
  'bitcoin-vs-global-assets': {
    title: 'Bitcoin vs Global Assets - Market Cap Treemap',
    description: 'Compare Bitcoin market capitalization against gold, major equities, real estate, and other global assets in an interactive treemap.',
    keywords: ['bitcoin vs gold market cap', 'bitcoin global assets', 'bitcoin treemap', 'btc market cap comparison'],
  },
  'bitcoin-vs-gold-chart': {
    title: 'Bitcoin vs Gold Chart - 1-Year Performance',
    description: 'Compare Bitcoin and gold performance over the last year with a normalized chart for macro and store-of-value analysis.',
    keywords: ['bitcoin vs gold', 'btc vs gold chart', 'bitcoin gold performance', 'store of value comparison'],
  },
  'bitcoin-mayer-multiple': {
    title: 'Bitcoin Mayer Multiple - Price vs 200-Day Average',
    description: 'Track the Bitcoin Mayer Multiple to compare current BTC price with its 200-day moving average and spot historical overbought or oversold zones.',
    keywords: ['bitcoin mayer multiple', 'btc 200 day moving average', 'bitcoin cycle indicator', 'mayer multiple chart'],
  },
  'bitcoin-price-performance': {
    title: 'US Median Home Price in Bitcoin - Real Estate vs BTC Chart',
    description: 'Track the U.S. median home price in Bitcoin over time using FRED MSPUS data and live BTC spot price to visualize real estate deflation in hard-money terms.',
    keywords: ['us median home price bitcoin', 'real estate in btc', 'home price vs bitcoin', 'fred mspus bitcoin chart'],
  },
  'bitcoin-halving-cycle-spiral': {
    title: 'Bitcoin Halving Cycle Spiral - 4-Year Market Cycles',
    description: 'Visualize Bitcoin halving cycles in a spiral chart to compare the current market phase with prior 4-year cycle behavior.',
    keywords: ['bitcoin halving cycle', 'bitcoin cycle spiral', 'btc halving chart', 'bitcoin four year cycle'],
  },
  'bitcoin-power-law-model': {
    title: 'Bitcoin Power Law Model - Fair Value Corridor',
    description: 'Analyze Bitcoin against the Power Law fair value corridor to see when BTC trades near long-term support or upper valuation bands.',
    keywords: ['bitcoin power law model', 'btc fair value', 'bitcoin valuation corridor', 'power law bitcoin'],
  },
  'bitcoin-stock-to-flow-model': {
    title: 'Bitcoin Stock-to-Flow Model - S2F Price Chart',
    description: 'Study the Bitcoin Stock-to-Flow model with actual BTC price overlay to understand scarcity-driven cycle analysis after each halving.',
    keywords: ['bitcoin stock to flow', 'bitcoin s2f', 'stock to flow model', 'bitcoin scarcity model'],
  },
  'bitcoin-big-mac-sats-tracker': {
    title: 'Big Mac Sats Tracker - Bitcoin Purchasing Power',
    description: 'See how many satoshis are needed to buy a Big Mac today and compare Bitcoin purchasing power against historical price changes.',
    keywords: ['big mac sats tracker', 'bitcoin purchasing power', 'sats value', 'bitcoin real world purchasing power'],
  },
  'bitcoin-seasonality-heatmap': {
    title: 'Bitcoin Seasonality Heatmap - Monthly Returns',
    description: 'Review Bitcoin monthly return patterns in a seasonality heatmap to spot stronger and weaker months across historical cycles.',
    keywords: ['bitcoin seasonality', 'bitcoin monthly returns', 'btc heatmap', 'bitcoin seasonal trends'],
  },
  'bitcoin-big-mac-index': {
    title: 'Bitcoin Big Mac Index - BTC Buying Power by Country',
    description: 'Compare Bitcoin buying power across countries with a Big Mac Index style view that converts local burger prices into BTC terms.',
    keywords: ['bitcoin big mac index', 'btc purchasing power by country', 'bitcoin buying power', 'bitcoin big mac'],
  },
  'bitcoin-network-activity': {
    title: 'Bitcoin Network Activity - Transactions & Active Addresses',
    description: 'Track Bitcoin network activity through transaction count, active addresses, and on-chain participation signals over time.',
    keywords: ['bitcoin network activity', 'active bitcoin addresses', 'bitcoin transactions chart', 'btc on chain activity'],
  },
  'bitcoin-log-regression-channel': {
    title: 'Bitcoin Log Regression Channel - Long-Term Support',
    description: 'Use the Bitcoin log regression channel to study long-term price support, resistance, and cycle extremes on a logarithmic scale.',
    keywords: ['bitcoin log regression', 'bitcoin support resistance', 'btc regression channel', 'bitcoin long term model'],
  },
  'bitcoin-mvrv-score': {
    title: 'Bitcoin MVRV Score - Market Cycle Valuation',
    description: 'Measure Bitcoin market cycle valuation with the MVRV score to identify historical undervaluation zones and overheated tops.',
    keywords: ['bitcoin mvrv score', 'btc valuation', 'market value realized value', 'bitcoin cycle tops'],
  },
  'bitcoin-google-trends': {
    title: 'Bitcoin Google Trends - Search Interest Over Time',
    description: 'Compare Bitcoin search interest over time with Google Trends to spot attention spikes, retail hype, and broader public demand.',
    keywords: ['bitcoin google trends', 'bitcoin search interest', 'btc trends', 'google trends bitcoin'],
  },
  'bitcoin-dominance-chart': {
    title: 'Bitcoin Dominance Chart - BTC Share of Crypto Market',
    description: 'Track Bitcoin dominance to see how much of the total crypto market cap belongs to BTC during risk-on and risk-off periods.',
    keywords: ['bitcoin dominance chart', 'btc dominance', 'bitcoin market share', 'crypto market dominance'],
  },
  'bitcoin-utxo-distribution': {
    title: 'Bitcoin UTXO Distribution - HODLer Age Analysis',
    description: 'Analyze Bitcoin UTXO age distribution to understand HODL behavior, coin dormancy, and changing conviction across the network.',
    keywords: ['bitcoin utxo distribution', 'bitcoin hodler age', 'btc utxo age', 'coin dormancy bitcoin'],
  },
  'us-national-debt-live-counter': {
    title: 'U.S. National Debt Live Counter - Real-Time Tracker',
    description: 'Monitor the U.S. national debt with a real-time counter, debt-per-person estimate, and rate-of-increase cards powered by public data.',
    keywords: ['us national debt live counter', 'national debt tracker', 'debt per person', 'real time debt counter'],
  },
  'satoshi-nakamoto-bitcoin-whitepaper': {
    title: 'Satoshi Nakamoto & Bitcoin Whitepaper - Tribute Page',
    description: 'Visit a tribute page to Satoshi Nakamoto with context on the Bitcoin whitepaper, the project mission, and the roots of the dashboard.',
    keywords: ['satoshi nakamoto', 'bitcoin whitepaper', 'thank you satoshi', 'bitcoin origins'],
  },
};

const DEFAULT_SEO = {
  title: 'Bitcoin Dashboard & Live BTC Price | Satoshi Dashboard',
  description: 'Free Bitcoin dashboard with live BTC price, mempool, nodes, on-chain metrics, Lightning stats, merchant maps, and 31 analytics modules.',
  keywords: ['bitcoin dashboard', 'live btc price', 'bitcoin analytics', 'free bitcoin tools'],
};

export function getModuleSEO(slugBase) {
  return MODULE_SEO[slugBase] || DEFAULT_SEO;
}

export { DEFAULT_SEO };
