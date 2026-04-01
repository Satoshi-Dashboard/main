---
code: S19
title: Power Law Model
description: Bitcoin Power Law Corridor — log-log price model by Harold Christopher Burger
category: under-construction
status: in-development
providers:
  - Binance
refreshSeconds: 3600
---

# Power Law Model (S19)

## Purpose

The Bitcoin Power Law Corridor (by Harold Christopher Burger) models Bitcoin's price growth as a power law relative to the number of days since genesis (January 3, 2009). On a log-log scale, the relationship appears as a straight line, allowing projections of fair value, top, and bottom price corridors.

**Formula:** `log10(price) = -17.02 + 5.98 * log10(daysSinceGenesis)`

This module is currently under construction — it uses static historical waypoints for the price line instead of a live API feed.

## What It Displays

- **5 corridor bands** — Extreme Top, Top, Fair Value, Bottom, Extreme Bottom (colored)
- **BTC price line** — orange line through historical waypoints
- **Current dot** — orange circle + outer ring at `CURRENT_YEAR` position
- **Today dashed line** — vertical gray dashed line at current date
- **Y axis** — log scale from $1 to $10M
- **X axis** — linear year scale from 2010 to 2028
- **Band fills** — semi-transparent fills between adjacent bands
- **Legend** — band labels with color-coded line segments

## Power Law Bands

| Offset | Color | Label |
|---|---|---|
| +0.90 | `#cc2200` | Extreme Top |
| +0.45 | `#e07800` | Top |
| 0 | `#00aa55` | Fair Value |
| -0.45 | `#0088cc` | Bottom |
| -0.90 | `#2244ff` | Extreme Bottom |

## SVG Layout Constants

```js
const VW = 900, VH = 560;
const ML = 68, MR = 24, MT = 20, MB = 52;  // margins
const YEAR_MIN = 2010, YEAR_MAX = 2028;
const LOG_MIN = 0, LOG_MAX = 7;  // log10($1) to log10($10M)
```

## Static Data (Pending Live Integration)

`CURRENT_YEAR` and `CURRENT_PRICE` are hardcoded constants. The `PRICE_WP` array contains historical waypoints used to draw the orange price line via log-linear interpolation (`interpPrice`).

**TODO for live integration:**
- Fetch BTC daily OHLCV from `/api/s19/power-law` (or reuse `fetchBtcHistory`)
- Replace `PRICE_WP` / `CURRENT_YEAR` / `CURRENT_PRICE` with live data
- Add `useModuleData` hook with `ModuleShell` wrapper
- Wrap in `ModuleShell` component for consistent shell chrome

## Component Architecture

```
S19_PowerLawModel (static, no hooks)
  └── div.flex.h-full (bg=#111111)
       ├── Header (title + deviation %)
       └── SVG chart
            ├── Grid lines (Y + X)
            ├── Band fills (polygon between adjacent bands)
            ├── Band lines (5 power law curves)
            ├── Price line (orange, historical waypoints)
            ├── Current dot + ring
            ├── Today dashed line
            ├── Y axis ticks + labels
            ├── X axis ticks + labels
            └── Legend (band colors + BTC price)
```

## Creating a Similar Module

1. Copy folder to `s##-bitcoin-<model>/`
2. Adjust the formula in `modelPrice(year, offset)` for your model
3. Update `BANDS` array with your corridor offsets and colors
4. Replace `PRICE_WP` with live data fetching via `useModuleData`
5. Add `ModuleShell` wrapper once live data is integrated
6. Scale functions `xScale(year)` and `yScale(price)` are reusable for any time-vs-price log chart

## Development Notes

- This module does NOT yet use `ModuleShell` or `useModuleData` — it is a static SVG render
- No external data dependencies at runtime (all data is embedded)
- The `DEV_PCT` deviation from fair value is computed at module load time (not reactive)
- Priority for live integration: replace static constants with Binance API data

## Related Modules

- S18 Cycle Spiral — another long-term BTC visualization
- S20 Stock to Flow — complementary valuation model (also under-construction)
- S05 Long-Term Trend — live SMA-based trend module for comparison
