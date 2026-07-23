# Satoshi Dashboard — Module Architecture

## Module Structure (S01–S32)

All modules live under `src/features/modules/` and are registered in `src/features/module-registry/modules.js`.

| Code | File | Category | Slug Base |
|------|------|----------|-----------|
| S01 | `live/S01_BitcoinOverview.jsx` | live | `bitcoin-price-market-overview` |
| S02 | `live/S02_PriceChart.jsx` | live | `bitcoin-price-chart-live` |
| S03 | `live/S03_MultiCurrencyBoard.jsx` | live | `bitcoin-price-multi-currency` |
| S04 | `live/S04_MempoolGauge.jsx` | live | `bitcoin-mempool-fees` |
| S05 | `live/S05_LongTermTrend.jsx` | live | `bitcoin-mempool-trend` |
| S06 | `live/S06_NodesMap.jsx` | live | `bitcoin-nodes-world-map` |
| S07 | `live/S07_LightningNodesMap.jsx` | live | `lightning-nodes-world-map` |
| S08 | `live/S08_BtcMapBusinessesMap.jsx` | live | `bitcoin-merchant-map` |
| S09 | `live/S09_LightningNetwork.jsx` | live | `lightning-network-stats` |
| S10 | `live/S10_StablecoinPegHealth.jsx` | live | `stablecoin-peg-tracker` |
| S11 | `live/S11_FearGreedIndex.jsx` | live | `bitcoin-fear-greed-index` |
| S12 | `live/S12_AddressDistribution.jsx` | live | `bitcoin-address-distribution` |
| S13 | `live/S13_WealthPyramid.jsx` | live | `bitcoin-wealth-pyramid` |
| S14 | `live/S14_GlobalAssetsTreemap.jsx` | live | `bitcoin-vs-global-assets` |
| S15 | `live/S15_BTCvsGold.jsx` | live | `bitcoin-vs-gold-chart` |
| S16 | `live/S16_MayerMultiple.jsx` | live | `bitcoin-mayer-multiple` |
| S17 | `live/S17_PricePerformance.jsx` | live | `bitcoin-price-performance` |
| S18 | `live/S18_CycleSpiral.jsx` | live | `bitcoin-halving-cycle-spiral` |
| S19 | `under-construction/S19_PowerLawModel.jsx` | under-construction | `bitcoin-power-law-model` |
| S20 | `under-construction/S20_StockToFlow.jsx` | under-construction | `bitcoin-stock-to-flow-model` |
| S21 | `under-construction/S21_BigMacSatsTracker.jsx` | under-construction | `bitcoin-big-mac-sats-tracker` |
| S22 | `under-construction/S22_SeasonalityHeatmap.jsx` | under-construction | `bitcoin-seasonality-heatmap` |
| S23 | `under-construction/S23_BigMacIndex.jsx` | under-construction | `bitcoin-big-mac-index` |
| S24 | `under-construction/S24_NetworkActivity.jsx` | under-construction | `bitcoin-network-activity` |
| S25 | `under-construction/S25_LogRegression.jsx` | under-construction | `bitcoin-log-regression-channel` |
| S26 | `under-construction/S26_MVRVScore.jsx` | under-construction | `bitcoin-mvrv-score` |
| S27 | `under-construction/S27_GoogleTrends.jsx` | under-construction | `bitcoin-google-trends` |
| S28 | `under-construction/S28_BTCDominance.jsx` | under-construction | `bitcoin-dominance-chart` |
| S29 | `under-construction/S29_UTXODistribution.jsx` | under-construction | `bitcoin-utxo-distribution` |
| S30 | `live/S30_USNationalDebt.jsx` | live | `us-national-debt-live-counter` |
| S31 | `live/S31_ThankYouSatoshi.jsx` | live | `satoshi-nakamoto-bitcoin-whitepaper` |
| S32 | `live/S32_BtcQueue.jsx` | live | `bitcoin-mempool-queue-v2` |

## Naming Convention

- **Files**: `S##_PascalCaseComponentName.jsx`
- **Component export**: `export default function S##_PascalCaseComponentName() { ... }`
- **Codes**: Sequential, zero-padded (`S01` … `S32`). No gaps allowed.
- **Slugs**: Auto-generated as `${code.toLowerCase()}-${slugBase}`.

## Data Flow

1. **Module definition** → `modules.js` array (`MODULE_DEFS`)
2. **Lazy loading** → `lazyWithPreload(() => import('@/features/modules/…'))`
3. **Registry validation** → `assertModuleRegistry(MODULES)` enforces:
   - No duplicate codes or slugs
   - Sequential codes (S01, S02, …)
   - Slug prefix matches code
4. **Metadata** → `moduleDataMeta.js` keyed by `slugBase`
5. **Legacy redirects** → `legacyModuleRedirects.js` maps old slugs to current `slugBase`

## Shared Assets

- `src/shared/map/` — MapLibre base components (`MapLibreBase.jsx`, `mapDarkStyle.js`, `choroplethUtils.js`)
- `src/shared/data/` — Geo/data utilities (`currencyCountryCoords.js`)

## Cleanup Notes (2026-05-09)

- Removed 7 `.legacy.jsx` orphan files.
- Removed all kebab-case module directories (`s01-bitcoin-overview/`, etc.) in favor of flat `S##_*.jsx` files.
- Renamed `S06_BtcQueue.jsx` → `S32_BtcQueue.jsx` to resolve S06 ambiguity.
- Added `src/shared/{map,data}/` to version control.
