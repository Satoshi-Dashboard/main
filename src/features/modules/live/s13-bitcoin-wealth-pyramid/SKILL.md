---
code: S13
title: Wealth Pyramid
description: SVG pyramid visualization of Bitcoin wealth distribution by USD threshold tiers
category: live
status: published
providers:
  - mempool.space
  - BitInfoCharts
refreshSeconds: 300
---

# Wealth Pyramid (S13)

## Description

The Wealth Pyramid module shows how many Bitcoin addresses hold more than specific USD value thresholds, rendered as:

- **Desktop:** An SVG trapezoid pyramid where each layer represents a wealth tier. The pyramid narrows toward the top (fewer, richer addresses). Each layer displays the number of addresses (left) and the USD threshold (right) via connector lines.
- **Mobile:** A list of horizontal progress bar cards, one per tier, showing the address count and relative bar width proportional to the tier with the most addresses.

## Data Sources

### Addresses Richer API
- **Provider:** mempool.space / BitInfoCharts (via internal cache)
- **Internal Endpoint:** `/api/s12/address-distribution` (shared with S12)
- **Returns:** `{ richerThan: [{ usdThreshold, addresses }], updatedAt, fetchedAt }`
- **Refresh Rate:** 300 seconds; upstream data updates every 30 minutes

## SVG Pyramid Layout

Constants defining the pyramid geometry:
- `VW=1000, VH=700` — viewBox dimensions
- `CX=500` — horizontal center
- `PY_TOP=40, PY_BOT=590` — vertical span of pyramid
- `MIN_HW=55` — half-width at the top (narrowest point)
- `MAX_HW=330` — half-width at the bottom (widest point)

Each tier is a trapezoid polygon. Width at any Y position is computed by `hw(y)` which linearly interpolates between `MIN_HW` and `MAX_HW`.

## Component Structure

### Main Component: `S13_WealthPyramid()`

Manages:
1. `tiers` state — array built from `WEALTH_TIERS` constant with live `addresses` values
2. `meta` state — source snapshot and last sync timestamps
3. `viewportWidth` — toggles between compact (mobile) and SVG (desktop) views
4. `useModuleData(fetchAddressesRicher, ...)` — data fetch

### `buildTiers(payload, prevTiers)`

Maps API `richerThan` array (keyed by `usdThreshold`) to `WEALTH_TIERS` template. Preserves previous values when API data is missing for a tier.

## Responsive Behavior

- `viewportWidth < 768` → compact card list view
- `viewportWidth >= 768` → SVG pyramid with `preserveAspectRatio="xMidYMid meet"`

## Color & Theming

Tier colors come from the shared `WEALTH_TIERS` constant in `@/shared/constants/colors.js`. Each tier has its own gradient-like color stepping from top to bottom of the pyramid.

- USD threshold labels: `UI_COLORS.brand` (orange/bitcoin accent)
- Address count labels: `UI_COLORS.textPrimary`
- Connector lines: `UI_COLORS.textTertiary`
- Polygon strokes: `#111111`

## Creating a Similar Module

To create a wealth pyramid for another asset or metric:

1. Copy this folder to `s##-{asset}-wealth-pyramid/`
2. Update `module.json` — new code, slugBase, providers, apiEndpoints
3. Replace `WEALTH_TIERS` import with your own tier definitions (or define inline)
4. Update the fetch function (`fetchAddressesRicher`) and data mapping in `buildTiers`
5. Adjust SVG constants (`MIN_HW`, `MAX_HW`, `N`) based on number of tiers

## Related Modules

- S12 Address Distribution — tabular version of similar holder data
- S14 Global Assets — another wealth/size comparison visualization
