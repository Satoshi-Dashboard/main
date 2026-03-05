const fetchJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const apiHandlers = {
  S01: async () => fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true'),
  S02: async () => fetchJson('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30'),
  S03: async () => fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,gbp,jpy,cny,brl,ars,cad,aud,chf,inr,krw'),
  S04: async () => fetchJson('https://mempool.space/api/mempool'),
  S05: async () => fetchJson('https://mempool.space/api/v1/difficulty-adjustment'),
  S06: async () => fetchJson('https://mempool.space/api/v1/blocks'),
  S07: async () => fetchJson('https://api.blockchain.info/charts/n-unique-addresses?timespan=30days&format=json'),
  S08: async () => fetchJson('https://bitnodes.io/api/v1/snapshots/latest/'),
  S09: async () => fetchJson('https://mempool.space/api/v1/lightning/statistics/latest'),
  S10: async () => fetchJson('https://api.alternative.me/fng/?limit=30&format=json'),
  S11: async () => fetchJson('https://api.blockchain.info/charts/n-unique-addresses?timespan=5weeks&format=json'),
  S12: async () => fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,pax-gold&vs_currencies=usd'),
  S13: async () => fetchJson('https://api.coingecko.com/api/v3/global'),
  S14: async () => fetchJson('https://api.blockchain.info/charts/n-transactions?timespan=365days&format=json'),
  S15: async () => fetchJson('https://api.blockchain.info/charts/address-rate?timespan=365days&format=json'),
  S16: async () => fetchJson('https://api.blockchain.info/charts/market-price?timespan=200days&format=json'),
  S17: async () => fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_7d_change=true&include_30d_change=true&include_1y_change=true'),
  S18: async () => fetchJson('https://api.blockchain.info/charts/market-price?timespan=10years&format=json'),
  S19: async () => fetchJson('https://api.blockchain.info/charts/market-price?timespan=all&format=json'),
  S20: async () => fetchJson('https://api.blockchain.info/charts/total-bitcoins?timespan=10years&format=json'),
  S21: async () => fetchJson('https://bitnodes.io/api/v1/snapshots/latest/'),
  S22: async () => fetchJson('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=max'),
  S23: async () => fetchJson('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
  S24: async () => fetchJson('https://api.blockchain.info/charts/hash-rate?timespan=30days&format=json'),
  S25: async () => fetchJson('https://api.blockchain.info/charts/market-price?timespan=all&format=json'),
  S26: null,
  S27: null,
  S28: async () => fetchJson('https://api.coingecko.com/api/v3/global'),
  S29: async () => fetchJson('https://api.blockchain.info/charts/utxo-count?timespan=1year&format=json'),
  S30: null,
};

const normalizeData = (moduleCode, raw) => {
  if (moduleCode === 'S01') {
    return {
      priceUsd: safeNumber(raw?.bitcoin?.usd),
      change24h: safeNumber(raw?.bitcoin?.usd_24h_change),
      marketCap: safeNumber(raw?.bitcoin?.usd_market_cap),
    };
  }

  if (moduleCode === 'S03') {
    return raw?.bitcoin || raw;
  }

  if (moduleCode === 'S05') {
    return {
      remainingBlocks: safeNumber(raw?.remainingBlocks),
      progressPercent: safeNumber(raw?.progressPercent),
      difficultyChange: safeNumber(raw?.difficultyChange),
      estimatedRetargetDate: raw?.estimatedRetargetDate || null,
    };
  }

  if (moduleCode === 'S08') {
    return {
      totalNodes: safeNumber(raw?.total_nodes),
      timestamp: raw?.timestamp || null,
    };
  }

  return raw;
};

export const moduleHasApi = (moduleCode) => Boolean(apiHandlers[moduleCode]);

export const getApiCoverage = (modules) => {
  const withApi = modules.filter((module) => moduleHasApi(module.code));
  const missingApi = modules.filter((module) => !moduleHasApi(module.code));

  return {
    total: modules.length,
    withApi: withApi.length,
    missingApi: missingApi.length,
    missingModules: missingApi,
  };
};

export const fetchModuleApiData = async (moduleCode) => {
  const handler = apiHandlers[moduleCode];
  if (!handler) {
    return {
      status: 'missing',
      message: 'No API assigned to this module yet.',
      data: null,
    };
  }

  try {
    const raw = await handler();
    const data = normalizeData(moduleCode, raw);
    return {
      status: 'ok',
      message: 'Live API connected',
      data,
      raw,
    };
  } catch (error) {
    return {
      status: 'error',
      message: `API unavailable (${error.message})`,
      data: null,
    };
  }
};
