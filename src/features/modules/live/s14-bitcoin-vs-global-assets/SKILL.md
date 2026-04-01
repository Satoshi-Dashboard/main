---
code: S14
title: Global Assets
description: Comparative visualization of total global asset market capitalizations including Bitcoin, Gold, Equities, Bonds, Real Estate, and Money
category: live
status: published
providers:
  - CoinGecko
refreshSeconds: 300
---

# Global Assets Treemap (S14)

## Description

The Global Assets module contextualizes Bitcoin's market capitalization against the world's largest asset classes. It displays:

- **Proportional Stacked Bar:** A horizontal bar divided into color-coded segments proportional to each asset's share of total tracked assets. Hovering/touching a segment shows a tooltip with the asset name and exact percentage.
- **Asset Card Grid:** 8 cards (2×4 on mobile, 4×2 on desktop) — one per asset class. Each card shows:
  - Asset name with a top color stripe
  - Market cap in trillions (e.g., `$14.23T`)
  - Full asset name (dimmed)
  - Percentage of total and rank badge

## Asset Classes Tracked

| ID           | Display Name | Color     |
|--------------|--------------|-----------|
| `real_estate`| Real Estate  | `#c4a882` |
| `bonds`      | Bonds        | `#c8c8c0` |
| `money`      | Money        | `#9fca84` |
| `equities`   | Equities     | `#6f95df` |
| `gold`       | Gold         | `#e8cc4b` |
| `collectibles`| Collectibles| `#b28be3` |
| `sp500`      | S&P 500      | `#FF4757` |
| `bitcoin`    | Bitcoin      | `#F7931A` |

## Data Sources

### Global Assets API
- **Provider:** CoinGecko (aggregated)
- **Internal Endpoint:** `/api/s14/global-assets`
- **Returns:** `{ data: { assets: [{ id, value_trillions, pct_total, rank, name }] } }`
- **Refresh Rate:** 300 seconds; data itself is relatively slow-moving (hourly upstream)

## Component Structure

### Main Component: `S14_GlobalAssetsTreemap()`

Uses `useModuleData` with `keepPreviousOnError: true` to retain last valid data on API failure. A module-level `lastGlobalAssetsPayload` variable caches across re-mounts.

### `StackedBar({ data })`
Renders the proportional bar. Uses a 2.4% visual minimum per segment (so tiny assets are still visible) then re-normalizes all widths to sum to 100%. Tooltip appears below the bar on hover/touch.

### `AssetCard({ asset })`
Card component with top color stripe, market cap value, percentage, and rank badge. Bitcoin card shows `₿ Bitcoin` with the Unicode symbol.

### `normalizeAssetData(payload)`
Transforms raw API rows: filters invalid entries, applies display names and colors from `ASSET_STYLE_BY_ID`, sorts by `pct_total` descending, and adds a `displaySize` with a minimum floor (3% of total).

## Error Handling

- Shows full skeleton during initial load
- Shows error message card if fetch fails and no cached data is available
- Keeps previous data visible when a refresh fails (`keepPreviousOnError: true`)

## Creating a Similar Module

To create a comparison module for a different set of assets (e.g., crypto market caps):

1. Copy this folder to `s##-crypto-market-caps/`
2. Update `module.json` — new code, slugBase, apiEndpoints
3. In `index.jsx`, update `ASSET_STYLE_BY_ID` with the new asset IDs and colors
4. Update the fetch URL in `fetchAssets`
5. Adjust `normalizeAssetData` if the API response shape differs

## Styling

- Module shell: `p-2 sm:p-3 lg:p-4` padding
- Cards: `bg-[#111111]`, hover: `bg-[#161616]`
- Card borders: `1px solid {color}33` (asset color at 20% opacity)
- Top stripe: 3px solid asset color
- Stacked bar: `h-8 sm:h-9`, `rounded-lg`, `border border-white/10`
- Tooltip: `bg rgba(15,15,15,0.95)`, monospace font, 11px

## Related Modules

- S11 Fear & Greed — market sentiment context
- S15 BTC vs Gold — direct Bitcoin vs Gold comparison
- S13 Wealth Pyramid — Bitcoin holder wealth distribution
