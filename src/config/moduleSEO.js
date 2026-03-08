/**
 * moduleSEO.js
 * Per-module SEO metadata: title suffix and meta description.
 * Used by ModulePage.jsx to update document.title and the meta description tag
 * on every module navigation, improving crawlability for JS-capable bots.
 *
 * Keys must match the module's `slugBase` in modules.js.
 */

const MODULE_SEO = {
  'bitcoin-overview': {
    title: 'Bitcoin Overview — Live Price, Market Cap & Network Stats',
    description: 'Real-time Bitcoin price, market cap, 24h volume, block height, hashrate, and Fear & Greed Index in a single view. Data from Binance, mempool.space, and Alternative.me.',
  },
  'price-chart': {
    title: 'Bitcoin Price Chart — BTC/USD OHLC Candlestick',
    description: 'Interactive Bitcoin price chart with OHLC candlesticks for 7-day, 30-day, 90-day, and 1-year timeframes. Powered by Binance historical data.',
  },
  'multi-currency': {
    title: 'Bitcoin Price in 30+ Currencies — Multi-Currency Board',
    description: 'Live Bitcoin price converted into 30+ world currencies updated every 30 seconds. EUR, GBP, JPY, BRL, ARS, and more.',
  },
  'mempool-gauge': {
    title: 'Bitcoin Mempool Gauge — Congestion & Fee Rates',
    description: 'Real-time Bitcoin mempool congestion gauge with pending transaction count, recommended fee rates (sat/vB), and estimated confirmation times from mempool.space.',
  },
  'long-term-trend': {
    title: 'Bitcoin Long-Term Mempool Trend — Fee & Size History',
    description: 'Long-term trend chart of Bitcoin mempool size and fee rates. Track network congestion patterns over weeks and months with live data from mempool.space.',
  },
  'nodes-map': {
    title: 'Bitcoin Full Nodes World Map — Network Distribution',
    description: 'Geographic world map of reachable Bitcoin full nodes by country. Tracks network decentralization across 100+ countries using Bitnodes data.',
  },
  'lightning-nodes-map': {
    title: 'Lightning Network Nodes World Map',
    description: 'Interactive world map showing the geographic distribution of Bitcoin Lightning Network routing nodes. Data sourced from mempool.space.',
  },
  'btcmap-business-density': {
    title: 'BTC Map Business Density — Bitcoin Merchants by Country',
    description: 'World map of Bitcoin-friendly businesses by country using BTC Map place data. Compare merchant density, country coverage, and verified business counts.',
  },
  'lightning-network': {
    title: 'Lightning Network Stats — Channels, Capacity & Nodes',
    description: 'Live Bitcoin Lightning Network statistics: total channels, network capacity in BTC, active node count, and growth trends from mempool.space.',
  },
  'stablecoin-peg': {
    title: 'Stablecoin Peg Health — USDT, USDC, DAI Tracker',
    description: 'Real-time peg deviation tracker for major stablecoins (USDT, USDC, DAI, BUSD, and more). Monitor de-peg risk with live CoinGecko market data.',
  },
  'fear-greed': {
    title: 'Bitcoin Fear & Greed Index — Daily Sentiment Tracker',
    description: 'Current Bitcoin Fear & Greed Index (0–100) with 7-day and 30-day historical chart. Extreme Fear signals potential buying opportunity; Extreme Greed signals risk.',
  },
  'address-distribution': {
    title: 'Bitcoin Address Distribution by Balance',
    description: 'How many Bitcoin addresses hold specific BTC balance ranges? On-chain distribution chart from micro-holders to whales, sourced from BitInfoCharts.',
  },
  'wealth-pyramid': {
    title: 'Bitcoin Wealth Pyramid — Holder Distribution',
    description: 'Visual wealth pyramid showing how many Bitcoin addresses hold each tier of BTC — from micro-holders to whales. BitInfoCharts on-chain data.',
  },
  'global-assets': {
    title: 'Global Assets Treemap — Bitcoin vs Gold, Equities & More',
    description: 'Interactive treemap comparing Bitcoin\'s market cap against global assets: gold, S&P 500, real estate, and leading companies. Powered by Newhedge data.',
  },
  'btc-vs-gold': {
    title: 'Bitcoin vs Gold — 1-Year Performance Comparison',
    description: 'Normalized price performance chart of Bitcoin versus gold over the last 12 months. See how BTC compares to the traditional store of value.',
  },
  'mayer-multiple': {
    title: 'Mayer Multiple — Bitcoin Price vs 200-Day Moving Average',
    description: 'Current Bitcoin Mayer Multiple (price ÷ 200-day MA) with overbought and oversold thresholds. A key cycle indicator for long-term Bitcoin investors.',
  },
  'price-performance': {
    title: 'Bitcoin Price Performance — YTD & Multi-Year Returns',
    description: 'Bitcoin\'s year-to-date and multi-year price performance expressed in multiple currencies. Track BTC returns against fiat depreciation.',
  },
  'cycle-spiral': {
    title: 'Bitcoin Cycle Spiral — 4-Year Halving Cycles',
    description: 'Polar spiral chart visualizing Bitcoin\'s 4-year halving market cycles. Compare current cycle progression to all previous cycles.',
  },
  'power-law-model': {
    title: 'Bitcoin Power Law Model — Fair Value Corridor',
    description: 'Bitcoin price plotted against the Power Law long-term fair-value corridor. Identify when BTC is trading cheap or expensive on a logarithmic scale.',
  },
  'stock-to-flow': {
    title: 'Bitcoin Stock-to-Flow Model — S2F Chart',
    description: 'Bitcoin Stock-to-Flow (S2F) model chart with actual price overlay. S2F measures Bitcoin\'s scarcity — the ratio doubles after every halving.',
  },
  'node-versions': {
    title: 'Big Mac Sats Tracker — Bitcoin Purchasing Power',
    description: 'How many satoshis does a Big Mac cost today vs historically? Track Bitcoin\'s real-world purchasing power over time using The Economist\'s Big Mac Index.',
  },
  'seasonality': {
    title: 'Bitcoin Seasonality Heatmap — Monthly Returns',
    description: 'Bitcoin monthly return heatmap showing historical seasonal patterns by month and year. Identify recurring bullish and bearish months in BTC market cycles.',
  },
  'big-mac-index': {
    title: 'Big Mac Index — Bitcoin Purchasing Power by Country',
    description: 'How many Big Macs can one Bitcoin buy in each country? An intuitive comparison of Bitcoin\'s purchasing power using The Economist\'s Big Mac Index.',
  },
  'network-activity': {
    title: 'Bitcoin Network Activity — Transactions & Active Addresses',
    description: 'Daily on-chain Bitcoin transaction count, active addresses, and block size chart. Monitor the health and adoption of the Bitcoin network over time.',
  },
  'log-regression': {
    title: 'Bitcoin Log Regression Channel — Support & Resistance',
    description: 'Bitcoin price plotted against a logarithmic regression channel. The channel\'s upper and lower bands act as dynamic overbought and oversold zones.',
  },
  'mvrv-score': {
    title: 'Bitcoin MVRV Score — Market Value vs Realized Value',
    description: 'MVRV ratio compares Bitcoin\'s market cap to its realized cap. MVRV above 3.5 has historically marked cycle tops; below 1 has marked cycle bottoms.',
  },
  'google-trends': {
    title: 'Bitcoin Google Trends — Search Interest Over Time',
    description: 'Google Trends data for "Bitcoin" search interest worldwide. High search interest historically correlates with Bitcoin price peaks and public attention spikes.',
  },
  'btc-dominance': {
    title: 'Bitcoin Dominance — BTC Share of Crypto Market Cap',
    description: 'Bitcoin\'s percentage share of the total cryptocurrency market capitalization over time. Rising dominance often signals a Bitcoin-led market; declining may indicate altcoin season.',
  },
  'utxo-distribution': {
    title: 'Bitcoin UTXO Distribution — HODLer Age Analysis',
    description: 'Age distribution of unspent Bitcoin transaction outputs (UTXOs). Long-held UTXOs indicate HODLing behavior; short-held indicate active spending and trading.',
  },
  'us-national-debt': {
    title: 'U.S. National Debt — Real-Time Counter, Per Person & Rate of Increase',
    description: 'Track the United States national debt with a projected real-time counter, debt-per-person metric, and rate-of-increase cards powered by U.S. Treasury FiscalData and U.S. Census population estimates.',
  },
  'thank-you-satoshi': {
    title: 'Thank You Satoshi — Bitcoin Whitepaper & Origins',
    description: 'A tribute to Satoshi Nakamoto, the pseudonymous creator of Bitcoin. Includes a link to the original Bitcoin whitepaper published on October 31, 2008.',
  },
};

const DEFAULT_SEO = {
  title: 'Satoshi Dashboard — Real-Time Bitcoin Analytics & On-Chain Metrics',
  description: 'Free Bitcoin analytics dashboard with live price, mempool, on-chain metrics, Fear & Greed, MVRV, Stock-to-Flow, Lightning Network, BTC Map merchant density, and 31 interactive modules.',
};

/**
 * Returns the SEO metadata for a given module slugBase.
 * Falls back to default site-wide metadata if not found.
 *
 * @param {string} slugBase - The module's slugBase (e.g. 'bitcoin-overview')
 * @returns {{ title: string, description: string }}
 */
export function getModuleSEO(slugBase) {
  return MODULE_SEO[slugBase] || DEFAULT_SEO;
}

export { DEFAULT_SEO };
