---
code: S20
title: Stock to Flow
description: Bitcoin Stock-to-Flow (S2F) model — log-log scatter chart by PlanB
category: under-construction
status: in-development
providers:
  - Binance
refreshSeconds: 3600
---

# Stock to Flow (S20)

## Purpose

The Bitcoin Stock-to-Flow (S2F) model by PlanB correlates Bitcoin's scarcity (measured as stock/flow ratio) with its market price. Stock = total circulating supply; Flow = annual new supply from mining. After each halving, flow halves and S2F doubles, historically preceding major price increases.

**Model formula:** `price ≈ 0.34 × SF^2.94`

This module is currently under construction — it uses embedded historical quarterly data rather than a live API feed.

## What It Displays

- **Model line** — green curve (`#00cc66`) through log-log space following `0.34 × SF^2.94`
- **Scatter dots** — historical quarterly BTC price vs S2F ratio, colored by months-to-next-halving
- **Current dot** — white circle with "NOW" label at `CURRENT_SF` / `CURRENT_P`
- **Halving lines** — 4 vertical dashed lines at S2F values where halvings occurred (8, 24, 56, 120)
- **Color gradient legend** — gradient bar from red (near halving) to blue (far from halving)
- **Deviation metric** — current price deviation from model in header (`+X% ▲` or `-X% ▼`)

## Dot Color Encoding

Dots are colored by months remaining to next halving (0–48 month range):

```js
function dotColor(mths) {
  const t = Math.max(0, Math.min(1, mths / 48));
  r = 255 * (1 - t)   // red when near halving
  b = 255 * t          // blue when far from halving
}
```

## Axes

- **X axis** — Stock-to-Flow ratio, log scale from 0.3 to 200
- **Y axis** — Price USD, log scale from $0.05 to $300K
- **Scale functions** use `Math.log10()` mapping to SVG pixel coordinates

## SVG Layout Constants

```js
const VW = 900, VH = 580;
const ML = 72, MR = 24, MT = 18, MB = 54;  // margins
const SF_MIN_LOG = log10(0.3), SF_MAX_LOG = log10(200);
const P_MIN_LOG  = log10(0.05), P_MAX_LOG  = log10(300000);
```

## Historical Data

`RAW` array contains ~80 quarterly entries: `[year, sf, price, monthsToNextHalving]`

Data covers 2010–2026.17, capturing all 4 completed halvings and early cycle 5 data.

## Static Data (Pending Live Integration)

`CURRENT_SF = 135` and `CURRENT_P = 84000` are hardcoded.

**TODO for live integration:**
- Fetch current BTC S2F ratio from `/api/s20/stock-to-flow`
- Compute S2F from on-chain supply data (total supply / annual emission)
- Replace hardcoded `CURRENT_SF` / `CURRENT_P` with live API response
- Add `useModuleData` hook and `ModuleShell` wrapper
- Consider adding interactive hover/tooltip on scatter dots

## Component Architecture

```
S20_StockToFlow (static, no hooks)
  └── div.flex.h-full (bg=#111111)
       ├── Header (S2F value + model price + deviation %)
       └── SVG chart
            ├── Grid lines (Y + X)
            ├── Halving vertical lines + labels
            ├── Model line (green S2F curve)
            ├── Scatter dots (RAW data, colored by mths)
            ├── Current dot + "NOW" label
            ├── Y axis ticks + labels
            ├── X axis ticks + labels
            ├── Axis border lines
            ├── Color gradient legend (linearGradient)
            └── Model equation legend
```

## Creating a Similar Module

1. Copy folder to `s##-bitcoin-<scarcity-model>/`
2. Replace `RAW` with live quarterly data from your API
3. Adjust `MODEL_C` and `MODEL_EXP` for variant S2F models (S2FX cross-asset, etc.)
4. `xScale(sf)` and `yScale(price)` are reusable for any log-log scatter chart
5. `dotColor(mths)` pattern is reusable for any time-based color encoding
6. Add `ModuleShell` + `useModuleData` once live data endpoint is ready

## Development Notes

- This module does NOT yet use `ModuleShell` or `useModuleData` — it is a static SVG render
- All data is embedded — no network requests at runtime
- `MODEL_NOW` and `devPct` computed at render time from static constants
- The `HALVINGS_Y` array is defined but not used in the current SVG render (future: cycle annotations)

## Related Modules

- S19 Power Law Model — complementary long-term BTC model (also under-construction)
- S18 Cycle Spiral — halving cycle visualization with live data
- S16 Mayer Multiple — live valuation indicator using SMA-200
