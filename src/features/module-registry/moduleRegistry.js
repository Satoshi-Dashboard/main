import { lazy } from 'react';

/**
 * Module Discovery and Registry System (Transitional)
 *
 * Supports both:
 * 1. NEW: Structured folders (module.json + SKILL.md + index.jsx)
 * 2. OLD: Direct files (S02_PriceChart.jsx, etc) - via hardcoded imports below
 *
 * This allows gradual migration of modules to the new structure.
 */

// Helper: Create lazy component with preload
function lazyWithPreload(loader) {
  const Component = lazy(loader);
  Component.preload = loader;
  return Component;
}

// ────────────────────────────────────────────────────────────
// NEW STRUCTURE: Dynamic discovery
// ────────────────────────────────────────────────────────────

const moduleMetadataFiles = import.meta.glob(
  '/src/features/modules/*/*/module.json',
  { query: '?raw', import: 'default', eager: false }
);

async function loadAllModuleMetadata() {
  const metadata = {};

  for (const [path, loader] of Object.entries(moduleMetadataFiles)) {
    try {
      const content = await loader();
      const data = JSON.parse(content);

      const match = path.match(/\/modules\/([^/]+)\/([^/]+)\/module\.json/);
      if (match && data.code && data.slugBase) {
        const [, category, folderName] = match;
        metadata[folderName] = {
          ...data,
          category,
          folderName,
          path: `/src/features/modules/${category}/${folderName}`
        };
      }
    } catch (error) {
      console.error(`Failed to load metadata from ${path}:`, error);
    }
  }

  return metadata;
}

// ────────────────────────────────────────────────────────────
// OLD STRUCTURE: Hardcoded imports (for backward compatibility)
// ────────────────────────────────────────────────────────────

const S02_PriceChart = lazyWithPreload(() => import('@/features/modules/live/S02_PriceChart'));
const S03_MultiCurrencyBoard = lazyWithPreload(() => import('@/features/modules/live/S03_MultiCurrencyBoard'));
const S04_MempoolGauge = lazyWithPreload(() => import('@/features/modules/live/S04_MempoolGauge'));
const S05_LongTermTrend = lazyWithPreload(() => import('@/features/modules/live/S05_LongTermTrend'));
const S06_NodesMap = lazyWithPreload(() => import('@/features/modules/live/S06_NodesMap'));
const S07_LightningNodesMap = lazyWithPreload(() => import('@/features/modules/live/S07_LightningNodesMap'));
const S08_BtcMapBusinessesMap = lazyWithPreload(() => import('@/features/modules/live/S08_BtcMapBusinessesMap'));
const S09_LightningNetwork = lazyWithPreload(() => import('@/features/modules/live/S09_LightningNetwork'));
const S10_StablecoinPegHealth = lazyWithPreload(() => import('@/features/modules/live/S10_StablecoinPegHealth'));
const S11_FearGreedIndex = lazyWithPreload(() => import('@/features/modules/live/S11_FearGreedIndex'));
const S12_AddressDistribution = lazyWithPreload(() => import('@/features/modules/live/S12_AddressDistribution'));
const S13_WealthPyramid = lazyWithPreload(() => import('@/features/modules/live/S13_WealthPyramid'));
const S14_GlobalAssetsTreemap = lazyWithPreload(() => import('@/features/modules/live/S14_GlobalAssetsTreemap'));
const S15_BTCvsGold = lazyWithPreload(() => import('@/features/modules/live/S15_BTCvsGold'));
const S16_MayerMultiple = lazyWithPreload(() => import('@/features/modules/live/S16_MayerMultiple'));
const S17_PricePerformance = lazyWithPreload(() => import('@/features/modules/live/S17_PricePerformance'));
const S18_CycleSpiral = lazyWithPreload(() => import('@/features/modules/live/S18_CycleSpiral'));
const S19_PowerLawModel = lazyWithPreload(() => import('@/features/modules/under-construction/S19_PowerLawModel'));
const S20_StockToFlow = lazyWithPreload(() => import('@/features/modules/under-construction/S20_StockToFlow'));
const S21_BigMacSatsTracker = lazyWithPreload(() => import('@/features/modules/under-construction/S21_BigMacSatsTracker'));
const S22_SeasonalityHeatmap = lazyWithPreload(() => import('@/features/modules/under-construction/S22_SeasonalityHeatmap'));
const S23_BigMacIndex = lazyWithPreload(() => import('@/features/modules/under-construction/S23_BigMacIndex'));
const S24_NetworkActivity = lazyWithPreload(() => import('@/features/modules/under-construction/S24_NetworkActivity'));
const S25_LogRegression = lazyWithPreload(() => import('@/features/modules/under-construction/S25_LogRegression'));
const S26_MVRVScore = lazyWithPreload(() => import('@/features/modules/under-construction/S26_MVRVScore'));
const S27_GoogleTrends = lazyWithPreload(() => import('@/features/modules/under-construction/S27_GoogleTrends'));
const S28_BTCDominance = lazyWithPreload(() => import('@/features/modules/under-construction/S28_BTCDominance'));
const S29_UTXODistribution = lazyWithPreload(() => import('@/features/modules/under-construction/S29_UTXODistribution'));
const S30_USNationalDebt = lazyWithPreload(() => import('@/features/modules/live/S30_USNationalDebt'));
const S31_ThankYouSatoshi = lazyWithPreload(() => import('@/features/modules/live/S31_ThankYouSatoshi'));
const S32_BtcQueue = lazyWithPreload(() => import('@/features/modules/live/S06_BtcQueue'));

const legacyModuleComponents = {
  'S02': S02_PriceChart,
  'S03': S03_MultiCurrencyBoard,
  'S04': S04_MempoolGauge,
  'S05': S05_LongTermTrend,
  'S06': S06_NodesMap,
  'S07': S07_LightningNodesMap,
  'S08': S08_BtcMapBusinessesMap,
  'S09': S09_LightningNetwork,
  'S10': S10_StablecoinPegHealth,
  'S11': S11_FearGreedIndex,
  'S12': S12_AddressDistribution,
  'S13': S13_WealthPyramid,
  'S14': S14_GlobalAssetsTreemap,
  'S15': S15_BTCvsGold,
  'S16': S16_MayerMultiple,
  'S17': S17_PricePerformance,
  'S18': S18_CycleSpiral,
  'S19': S19_PowerLawModel,
  'S20': S20_StockToFlow,
  'S21': S21_BigMacSatsTracker,
  'S22': S22_SeasonalityHeatmap,
  'S23': S23_BigMacIndex,
  'S24': S24_NetworkActivity,
  'S25': S25_LogRegression,
  'S26': S26_MVRVScore,
  'S27': S27_GoogleTrends,
  'S28': S28_BTCDominance,
  'S29': S29_UTXODistribution,
  'S30': S30_USNationalDebt,
  'S31': S31_ThankYouSatoshi,
  'S32': S32_BtcQueue,
};

const legacyModuleMetadata = {
  'S02': { slugBase: 'bitcoin-price-chart-live', title: 'Price Chart' },
  'S03': { slugBase: 'bitcoin-price-multi-currency', title: 'Multi-Currency' },
  'S04': { slugBase: 'bitcoin-mempool-fees', title: 'Mempool Gauge' },
  'S05': { slugBase: 'bitcoin-mempool-trend', title: 'Long-Term Trend' },
  'S06': { slugBase: 'bitcoin-nodes-world-map', title: 'Nodes Map' },
  'S07': { slugBase: 'lightning-nodes-world-map', title: 'Lightning Nodes Map' },
  'S08': { slugBase: 'bitcoin-merchant-map', title: 'BTC Map Business Density' },
  'S09': { slugBase: 'lightning-network-stats', title: 'Lightning Network' },
  'S10': { slugBase: 'stablecoin-peg-tracker', title: 'Stablecoin Peg Health' },
  'S11': { slugBase: 'bitcoin-fear-greed-index', title: 'Fear & Greed' },
  'S12': { slugBase: 'bitcoin-address-distribution', title: 'Address Distribution' },
  'S13': { slugBase: 'bitcoin-wealth-pyramid', title: 'Wealth Pyramid' },
  'S14': { slugBase: 'bitcoin-vs-global-assets', title: 'Global Assets' },
  'S15': { slugBase: 'bitcoin-vs-gold-chart', title: 'BTC vs Gold' },
  'S16': { slugBase: 'bitcoin-mayer-multiple', title: 'Mayer Multiple' },
  'S17': { slugBase: 'bitcoin-price-performance', title: 'US Median Home Price in ₿' },
  'S18': { slugBase: 'bitcoin-halving-cycle-spiral', title: 'Cycle Spiral' },
  'S19': { slugBase: 'bitcoin-power-law-model', title: 'Power Law Model' },
  'S20': { slugBase: 'bitcoin-stock-to-flow-model', title: 'Stock to Flow' },
  'S21': { slugBase: 'bitcoin-big-mac-sats-tracker', title: 'Big Mac Sats Tracker' },
  'S22': { slugBase: 'bitcoin-seasonality-heatmap', title: 'Seasonality' },
  'S23': { slugBase: 'bitcoin-big-mac-index', title: 'Big Mac Index' },
  'S24': { slugBase: 'bitcoin-network-activity', title: 'Network Activity' },
  'S25': { slugBase: 'bitcoin-log-regression-channel', title: 'Log Regression' },
  'S26': { slugBase: 'bitcoin-mvrv-score', title: 'MVRV Score' },
  'S27': { slugBase: 'bitcoin-google-trends', title: 'Google Trends' },
  'S28': { slugBase: 'bitcoin-dominance-chart', title: 'BTC Dominance' },
  'S29': { slugBase: 'bitcoin-utxo-distribution', title: 'UTXO Distribution' },
  'S30': { slugBase: 'us-national-debt-live-counter', title: 'U.S. National Debt' },
  'S31': { slugBase: 'satoshi-nakamoto-bitcoin-whitepaper', title: 'Thank You Satoshi' },
  'S32': { slugBase: 'bitcoin-mempool-queue-v2', title: 'BTC Queue' },
};

// ────────────────────────────────────────────────────────────
// Build Registry
// ────────────────────────────────────────────────────────────

export async function buildModuleRegistry() {
  const newMetadata = await loadAllModuleMetadata();
  const allModulesMap = new Map();

  // Add newly discovered modules (new structure)
  Object.entries(newMetadata).forEach(([, metadata]) => {
    allModulesMap.set(metadata.code, {
      ...metadata,
      component: lazyWithPreload(() => import(/* @vite-ignore */ `${metadata.path}/index.jsx`)),
    });
  });

  // Fill gaps with legacy modules (old structure)
  Object.entries(legacyModuleComponents).forEach(([code, component]) => {
    if (!allModulesMap.has(code)) {
      const meta = legacyModuleMetadata[code];
      allModulesMap.set(code, {
        code,
        slugBase: meta.slugBase,
        title: meta.title,
        description: '',
        category: code <= 'S18' ? 'live' : 'under-construction',
        status: code <= 'S18' ? 'published' : 'in-development',
        component,
        meta,
        providers: [],
        tags: [],
        __legacy: true,
      });
    }
  });

  // Sort by code
  const sorted = Array.from(allModulesMap.entries())
    .sort(([codeA], [codeB]) => {
      const numA = parseInt(codeA.slice(1));
      const numB = parseInt(codeB.slice(1));
      return numA - numB;
    });

  const modules = sorted.map(([code, data]) => ({
    ...data,
    slug: `${code.toLowerCase()}-${data.slugBase}`,
  }));

  validateModuleRegistry(modules);
  return modules;
}

function validateModuleRegistry(modules) {
  const seenCodes = new Set();
  const seenSlugs = new Set();
  const errors = [];

  modules.forEach((module, index) => {
    const code = String(module.code || '');
    const slug = String(module.slug || '');
    const expectedCode = `S${String(index + 1).padStart(2, '0')}`;
    const expectedPrefix = `${expectedCode.toLowerCase()}-`;

    if (seenCodes.has(code)) {
      errors.push(`Duplicate code: ${code}`);
    }
    seenCodes.add(code);

    if (seenSlugs.has(slug)) {
      errors.push(`Duplicate slug: ${slug}`);
    }
    seenSlugs.add(slug);

    if (code !== expectedCode) {
      errors.push(`Code mismatch at index ${index}: got "${code}", expected "${expectedCode}"`);
    }

    if (!slug.startsWith(expectedPrefix)) {
      errors.push(`Slug prefix mismatch: "${slug}" should start with "${expectedPrefix}"`);
    }
  });

  if (errors.length > 0) {
    console.error('❌ Module Registry Validation Errors:');
    errors.forEach(err => console.error(`   - ${err}`));
    throw new Error('Module registry validation failed');
  }

  console.log(`✅ Module registry validated: ${modules.length} modules OK`);
}

// ────────────────────────────────────────────────────────────
// Exports
// ────────────────────────────────────────────────────────────

let modulesPromise = null;

export async function getModules() {
  if (!modulesPromise) {
    modulesPromise = buildModuleRegistry();
  }
  return modulesPromise;
}

export let MODULES = null;

// Initialize immediately
getModules().then(m => {
  MODULES = m;
  window.__MODULES_READY__ = true;
}).catch(err => {
  console.error('❌ Failed to build module registry:', err);
  window.__MODULES_READY__ = false;
});

export async function getModuleBySlug(slug) {
  const modules = await getModules();
  return modules.find(m => m.slug === slug);
}

export async function getModuleByCode(code) {
  const modules = await getModules();
  return modules.find(m => m.code === code);
}

export async function getFirstModule() {
  const modules = await getModules();
  return modules[0] || null;
}
