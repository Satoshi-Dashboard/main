---
code: S16
title: Mayer Multiple
description: Bitcoin Mayer Multiple indicator — ratio of current price to 200-day SMA
category: live
status: published
providers:
  - Binance
refreshSeconds: 60
---

# Mayer Multiple (S16)

## Purpose

The Mayer Multiple is a Bitcoin-specific valuation indicator that compares the current BTC price to its 200-day Simple Moving Average (SMA). A value above 1.0 means price is above the long-term trend; below 1.0 means it is below. The historical average is approximately 1.47.

## What It Displays

- **Current Mayer Multiple** — live value as large animated metric
- **Valuation zones** — Overvalued (>2.40), Neutral (1.00–2.40), Undervalued (<1.00)
- **Dual-axis chart** — BTC price (area) overlaid with Mayer Multiple line (Recharts ComposedChart)
- **Range toggles** — 3M / 1Y / 5Y time windows
- **Show Zones button** — toggles ReferenceArea bands and reference lines for key thresholds
- **Range delta** — change in Mayer Multiple value and % over selected period

## Data Sources

- **BTC daily OHLCV history** — `fetchBtcHistory(2025, '1d')` from `@/shared/services/priceApi.js`
- **Live BTC spot price** — `fetchBtcSpot()` polled every 10 seconds
- **Computation** — `calcularMayerMultiple()` from `@/shared/utils/mayerMultiple.js` — requires at least 200 candles to compute valid SMA-200

## Key Constants (from mayerMultiple.js)

| Constant | Value | Meaning |
|---|---|---|
| `MAYER_SMA_WINDOW` | 200 | Days for SMA |
| `MAYER_EXTREME_UNDERVALUE` | ~0.6 | Bottom of historical distribution |
| `MAYER_FAIR_VALUE` | 1.0 | Price = SMA-200 |
| `MAYER_HISTORICAL_AVERAGE` | ~1.47 | Historical mean |
| `MAYER_OVERVALUED` | 2.4 | Top zone threshold |

## Component Architecture

```
S16_MayerMultiple
  └── ModuleShell
       ├── Header (AnimatedMetric + range delta)
       ├── Show/Hide Zones button
       ├── ComposedChart (Recharts)
       │    ├── Area — BTC price (yAxisId="price")
       │    ├── Line — Mayer Multiple (yAxisId="mayer")
       │    ├── ReferenceArea × 3 (zones, conditional)
       │    ├── ReferenceLine × 4 (thresholds, conditional)
       │    ├── MayerTooltip (custom)
       │    └── MayerCursor (custom crosshair)
       ├── Range selector (3M / 1Y / 5Y)
       └── StatusCards × 3 (Overvalued / Neutral / Undervalued)
```

## Creating a Similar Module

1. Copy this folder to `s##-bitcoin-<indicator>/`
2. Update `module.json` with new code, slugBase, title, description, apiEndpoints
3. Replace `calcularMayerMultiple` with your indicator computation utility
4. Adjust `RANGES` array and `STATUS_CARDS` to match your indicator's interpretation zones
5. Update chart colors via CSS variables (`--accent-bitcoin`, `--accent-green`, `--accent-red`)
6. All data fetching follows the `useModuleData` hook pattern — keep the `refreshMs` in `module.json`

## Styling

- Background: `#0a0a0a` (from ModuleShell)
- Price line: `var(--accent-bitcoin)` (#F7931A)
- Mayer line: `#7fc4ff` (light blue)
- Status cards use `--accent-green`, `--accent-warning`, `--accent-red` for zone colors
- Font: monospace throughout, `var(--fs-subtitle)` / `var(--fs-label)` / `var(--fs-caption)`

## Related Modules

- S02 Price Chart — BTC price visualization patterns
- S05 Long-Term Trend — similar SMA-based trend analysis
- S15 BTC vs Gold — valuation comparison
