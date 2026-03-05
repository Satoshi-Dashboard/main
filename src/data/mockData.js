// ─── Mock data for Phase 1 (all sections) ───────────────────────────────────

// Generate time-series price data
function generatePriceSeries(days, startPrice, volatility = 0.03) {
  const now = Date.now();
  const data = [];
  let price = startPrice;
  for (let i = days; i >= 0; i--) {
    price = price * (1 + (Math.random() - 0.48) * volatility);
    data.push({
      timestamp: now - i * 86400000,
      price: Math.round(price),
      volume: Math.round(Math.random() * 30e9 + 10e9),
    });
  }
  return data;
}

// Historical series at various scales
export const priceSeries7d = generatePriceSeries(7, 88000, 0.025);
export const priceSeries30d = generatePriceSeries(30, 75000, 0.03);
export const priceSeries365d = generatePriceSeries(365, 45000, 0.04);
export const priceSeriesMax = generatePriceSeries(4000, 100, 0.05);

// S01 – Bitcoin Overview
export const mockOverview = {
  price: 103750,
  price_change_24h: 2.34,
  price_change_7d: 6.12,
  market_cap: 2050000000000,
  volume_24h: 38400000000,
  circulating_supply: 19750000,
  total_supply: 21000000,
  ath: 109000,
  ath_date: '2025-01-20',
  atl: 67.81,
  atl_date: '2013-07-06',
  sparkline: priceSeries7d.map(d => d.price),
};

// S02 – Price Chart
export const mockPriceChart = {
  series7d: priceSeries7d,
  series30d: priceSeries30d,
  series365d: priceSeries365d,
};

// S03 – Multi-Currency Board
export const mockMultiCurrency = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar', price: 103750, change: 2.34 },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro', price: 95820, change: 2.18 },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound', price: 81920, change: 2.21 },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen', price: 15943500, change: 2.41 },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan', price: 750200, change: 2.28 },
  { code: 'BRL', flag: '🇧🇷', name: 'Brazilian Real', price: 577800, change: 2.19 },
  { code: 'ARS', flag: '🇦🇷', name: 'Argentine Peso', price: 97520000, change: 3.12 },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar', price: 142800, change: 2.31 },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar', price: 163400, change: 2.27 },
  { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc', price: 92140, change: 2.12 },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee', price: 8640000, change: 2.39 },
  { code: 'KRW', flag: '🇰🇷', name: 'South Korean Won', price: 138200000, change: 2.44 },
  { code: 'SATS', flag: '₿', name: 'Satoshis', price: 1, change: 0 },
];

// S04 – Mempool
export const mockMempool = {
  count: 87432,
  vsize: 186.4,
  total_fee: 1.24,
  fees: { fastest: 42, halfHour: 28, hour: 18, economy: 8, minimum: 2 },
  history: Array.from({ length: 24 }, (_, i) => ({
    time: `${23 - i}h`,
    size: Math.random() * 280 + 40,
  })).reverse(),
};

// S05 – Long-Term Trend (halving lines)
export const HALVING_DATES = [
  { date: '2012-11-28', label: 'Halving 1', block: 210000 },
  { date: '2016-07-09', label: 'Halving 2', block: 420000 },
  { date: '2020-05-11', label: 'Halving 3', block: 630000 },
  { date: '2024-04-20', label: 'Halving 4', block: 840000 },
];

// S06 – Block Composition
export const mockBlocks = Array.from({ length: 10 }, (_, i) => ({
  height: 895420 - i,
  txCount: Math.round(Math.random() * 2500 + 500),
  size: Math.round(Math.random() * 1.2e6 + 400000),
  weight: Math.round(Math.random() * 4e6 + 1e6),
  miner: ['Foundry USA', 'AntPool', 'F2Pool', 'ViaBTC', 'Binance Pool'][Math.floor(Math.random() * 5)],
  fees: parseFloat((Math.random() * 0.8 + 0.05).toFixed(4)),
  timestamp: Date.now() - i * 600000,
  reward: 3.125,
}));

// S07 – Top Addresses
export const mockTopAddresses = Array.from({ length: 20 }, (_, i) => ({
  rank: i + 1,
  address: `1BTC${Math.random().toString(36).slice(2, 10).toUpperCase()}...${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  balance: Math.round((250000 / (i + 1)) * 100) / 100,
  usdValue: Math.round((250000 / (i + 1)) * 103750),
  pctSupply: ((250000 / (i + 1)) / 21000000 * 100).toFixed(4),
  label: ['Satoshi Nakamoto', 'Binance', 'Unknown', 'Coinbase', 'Unknown'][i % 5],
  labelType: ['creator', 'exchange', 'unknown', 'exchange', 'unknown'][i % 5],
}));

// S08 – Nodes map (sample points)
export const mockNodes = Array.from({ length: 200 }, () => ({
  lat: (Math.random() - 0.5) * 140,
  lng: (Math.random() - 0.5) * 360,
  country: ['US', 'DE', 'FR', 'GB', 'NL', 'JP', 'CA', 'AU'][Math.floor(Math.random() * 8)],
  version: `/Satoshi:${[26, 25, 24, 23][Math.floor(Math.random() * 4)]}.0.0/`,
}));

export const mockNodeStats = {
  total: 15847,
  byCountry: { US: 4120, DE: 2341, FR: 876, GB: 923, NL: 612, JP: 445, CA: 389, AU: 278, Other: 5863 },
};

// S09 – Lightning
export const mockLightning = {
  capacity: 5284.32,
  nodes: 14823,
  channels: 63940,
  avgCapacityPerNode: 0.357,
  avgCapacityPerChannel: 0.0827,
  history: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString(),
    capacity: 5000 + i * 9.5 + Math.random() * 20,
    channels: 62000 + i * 65 + Math.random() * 100,
  })),
};

// S10 – Fear & Greed
export const mockFearGreed = {
  value: 74,
  classification: 'Greed',
  history: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString(),
    value: Math.round(Math.random() * 60 + 25),
  })),
};

// S11 – Address Distribution
export const mockAddressDistribution = [
  { range: '< 0.001 BTC', count: 18420000, pct: 54.2 },
  { range: '0.001 – 0.01', count: 7380000, pct: 21.7 },
  { range: '0.01 – 0.1', count: 4920000, pct: 14.5 },
  { range: '0.1 – 1', count: 1840000, pct: 5.4 },
  { range: '1 – 10', count: 590000, pct: 1.74 },
  { range: '10 – 100', count: 143000, pct: 0.42 },
  { range: '100 – 1,000', count: 16800, pct: 0.05 },
  { range: '1,000 – 10,000', count: 2100, pct: 0.006 },
  { range: '> 10,000', count: 112, pct: 0.0003 },
];

// S12 – BTC vs Gold
export const mockBtcVsGold = {
  btcMarketCap: 2050000000000,
  goldMarketCap: 15800000000000,
  ratio: 2050 / 15800,
  flippeningNeeded: (15800000000000 - 2050000000000) / 19750000,
};

// S13 – Global Assets Treemap
export const mockGlobalAssets = [
  { name: 'Real Estate', value: 326e12, color: '#555' },
  { name: 'Equities', value: 109e12, color: '#666' },
  { name: 'Debt/Bonds', value: 133e12, color: '#555' },
  { name: 'Gold', value: 15.8e12, color: '#D4A843' },
  { name: 'Bitcoin', value: 2.05e12, color: '#F7931A' },
  { name: 'Silver', value: 1.4e12, color: '#aaa' },
  { name: 'Other Crypto', value: 1.2e12, color: '#7e57c2' },
];

// S14 – TX Count
export const mockTxCount = Array.from({ length: 730 }, (_, i) => ({
  date: new Date(Date.now() - (729 - i) * 86400000).toLocaleDateString(),
  count: Math.round(350000 + Math.sin(i / 30) * 80000 + Math.random() * 60000),
}));

// S15 – Wealth Tiers (Plankton → Humpback)
export const mockWealthTiers = [
  { tier: 'Plankton', range: '< 0.001 BTC', emoji: '🦠', addresses: 18420000, btc: 1200, pct: 0.006 },
  { tier: 'Shrimp', range: '0.001–1 BTC', emoji: '🦐', addresses: 11200000, btc: 980000, pct: 4.7 },
  { tier: 'Crab', range: '1–10 BTC', emoji: '🦀', addresses: 590000, btc: 1840000, pct: 8.8 },
  { tier: 'Octopus', range: '10–50 BTC', emoji: '🐙', addresses: 98000, btc: 2350000, pct: 11.2 },
  { tier: 'Fish', range: '50–100 BTC', emoji: '🐟', addresses: 22000, btc: 1560000, pct: 7.4 },
  { tier: 'Dolphin', range: '100–500 BTC', emoji: '🐬', addresses: 14800, btc: 3420000, pct: 16.3 },
  { tier: 'Shark', range: '500–1,000 BTC', emoji: '🦈', addresses: 2100, btc: 1480000, pct: 7.1 },
  { tier: 'Whale', range: '1K–5K BTC', emoji: '🐳', addresses: 1640, btc: 3820000, pct: 18.2 },
  { tier: 'Humpback', range: '> 5,000 BTC', emoji: '🐋', addresses: 112, btc: 5100000, pct: 24.3 },
];

// S16 – Mayer Multiple
export const mockMayerMultiple = (() => {
  const series = generatePriceSeries(400, 55000, 0.025);
  return series.slice(200).map((d, i) => {
    const slice = series.slice(i, i + 200);
    const ma200 = slice.reduce((sum, x) => sum + x.price, 0) / 200;
    return {
      date: new Date(d.timestamp).toLocaleDateString(),
      price: d.price,
      ma200: Math.round(ma200),
      mayer: parseFloat((d.price / ma200).toFixed(3)),
    };
  });
})();

// S17 – Performance Periods
export const mockPerformance = [
  { period: '7 Days', roi: 6.12 },
  { period: '30 Days', roi: 18.47 },
  { period: '90 Days', roi: 32.8 },
  { period: '180 Days', roi: 87.4 },
  { period: '365 Days', roi: 142.6 },
  { period: 'YTD', roi: 28.3 },
  { period: '2 Years', roi: 385.2 },
  { period: '4 Years', roi: 1240.0 },
];

// S18 – Halving Cycles
export const CYCLE_COLORS = ['#F7931A', '#00D897', '#D4A843', '#7e57c2'];

// S19 – Power Law (simplified mock)
export const mockPowerLaw = Array.from({ length: 150 }, (_, i) => {
  const days = 1000 + i * 30;
  const modelPrice = Math.pow(10, -17.01 + 5.84 * Math.log10(days));
  const actualPrice = modelPrice * (0.85 + Math.random() * 0.6);
  return { days, modelPrice: Math.round(modelPrice), actualPrice: Math.round(actualPrice) };
});

// S20 – Stock-to-Flow
export const mockS2F = (() => {
  const halvings = [
    { date: '2012-11-28', supply: 10500000, flow: 1312500 * 4 },
    { date: '2016-07-09', supply: 15750000, flow: 656250 * 4 },
    { date: '2020-05-11', supply: 18375000, flow: 328125 * 4 },
    { date: '2024-04-20', supply: 19687500, flow: 164062 * 4 },
  ];
  return halvings.map((h, i) => {
    const s2f = h.supply / h.flow;
    return {
      date: h.date,
      s2f: parseFloat(s2f.toFixed(1)),
      modelPrice: Math.round(Math.exp(3.31819 * Math.log(s2f) - 1.84)),
      actualPrice: [12, 650, 8700, 60000][i],
      era: `Era ${i + 1}`,
    };
  });
})();

// S21 – Node Versions
export const mockNodeVersions = [
  { version: 'Satoshi/26.0.0', count: 4821, pct: 30.4 },
  { version: 'Satoshi/25.0.0', count: 3214, pct: 20.3 },
  { version: 'Satoshi/24.0.1', count: 2198, pct: 13.9 },
  { version: 'Satoshi/23.0.0', count: 1847, pct: 11.7 },
  { version: 'Satoshi/22.0.0', count: 1124, pct: 7.1 },
  { version: 'Satoshi/0.21.1', count: 876, pct: 5.5 },
  { version: 'Other', count: 1767, pct: 11.1 },
];

// S22 – Seasonality Heatmap
export const mockSeasonality = (() => {
  const years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = {};
  years.forEach(y => {
    data[y] = months.map(() => parseFloat((Math.random() * 80 - 30).toFixed(1)));
  });
  return { years, months, data };
})();

// S23 – Big Mac Index
export const mockBigMac = {
  bigMacPrice: 5.58,
  btcPrice: 103750,
  bigMacsPerBtc: Math.round(103750 / 5.58),
  history: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(Date.now() - (11 - i) * 2592000000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    bigMacs: Math.round((103750 * (0.8 + i * 0.02)) / 5.58),
  })),
};

// S24 – Network Activity
export const mockNetworkActivity = {
  mempoolSize: 186.4,
  txCount24h: 432780,
  avgFee: 24,
  hashRate: 824e18,
  sparklines: {
    mempool: Array.from({ length: 24 }, () => Math.random() * 300),
    txCount: Array.from({ length: 24 }, () => Math.random() * 600000 + 200000),
    fees: Array.from({ length: 24 }, () => Math.random() * 80 + 5),
    hashRate: Array.from({ length: 24 }, () => Math.random() * 200e18 + 700e18),
  },
};

// S25 – Log Regression
export const mockLogRegression = Array.from({ length: 100 }, (_, i) => {
  const days = 500 + i * 38;
  const fair = Math.pow(10, -17.01 + 5.84 * Math.log10(days));
  const upper = fair * 3.5;
  const lower = fair * 0.28;
  const actual = fair * (0.7 + Math.random() * 0.9);
  return { days, fair: Math.round(fair), upper: Math.round(upper), lower: Math.round(lower), actual: Math.round(actual) };
});

// S26 – MVRV Z-Score
export const mockMVRV = Array.from({ length: 90 }, (_, i) => ({
  date: new Date(Date.now() - (89 - i) * 86400000).toLocaleDateString(),
  mvrv: parseFloat((1.2 + Math.sin(i / 20) * 2.4 + Math.random() * 0.5).toFixed(2)),
  zScore: parseFloat((1.5 + Math.sin(i / 20) * 3.2 + Math.random() * 0.3).toFixed(2)),
}));

// S27 – Google Trends
export const mockTrends = Array.from({ length: 52 }, (_, i) => ({
  week: `W${i + 1}`,
  interest: Math.round(30 + Math.sin(i / 10) * 40 + Math.random() * 20),
  btcPrice: Math.round(75000 + Math.sin(i / 8) * 20000 + Math.random() * 5000),
}));

// S28 – Dominance
export const mockDominance = {
  btcDominance: 62.4,
  totalMarketCap: 3286000000000,
  totalVolume24h: 128000000000,
  activeCryptos: 14820,
  markets: 940,
  breakdown: [
    { name: 'Bitcoin', value: 62.4, color: '#F7931A' },
    { name: 'Ethereum', value: 12.8, color: '#627EEA' },
    { name: 'BNB', value: 3.2, color: '#F3BA2F' },
    { name: 'Solana', value: 4.1, color: '#9945FF' },
    { name: 'Others', value: 17.5, color: '#555' },
  ],
  history: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString(),
    dominance: 60 + Math.sin(i / 10) * 4 + Math.random() * 1.5,
  })),
};

// S29 – UTXO Distribution
export const mockUTXO = {
  total: 184320000,
  avgValue: 0.107,
  byAge: [
    { age: '< 1 day', count: 1240000, btc: 48200 },
    { age: '1–7 days', count: 4820000, btc: 184000 },
    { age: '7–30 days', count: 12400000, btc: 920000 },
    { age: '30–90 days', count: 18700000, btc: 1840000 },
    { age: '90–180 days', count: 22100000, btc: 2240000 },
    { age: '180d–1y', count: 28400000, btc: 3100000 },
    { age: '1–2 years', count: 34200000, btc: 3840000 },
    { age: '> 2 years', count: 62460000, btc: 7572000 },
  ],
};
