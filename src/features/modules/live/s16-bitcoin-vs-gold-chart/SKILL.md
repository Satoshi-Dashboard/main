---
code: S15
title: BTC vs Gold
description: Dual-series market capitalization chart comparing Bitcoin and Gold over multiple time ranges
category: live
status: published
providers:
  - Binance
  - TradingEconomics
refreshSeconds: 60
---

# BTC vs Gold Chart (S15)

## Description

The BTC vs Gold module charts the market capitalization of Bitcoin against Gold over time using the `lightweight-charts` library. Key features:

- **Dual Area Series:** Bitcoin (orange, `#F7931A`) and Gold (silver, `rgba(214,214,214,0.92)`) rendered as overlapping area charts on a shared price scale
- **Time Range Selector:** Tabs for 3M, 6M, 1Y, and MAX (all available history)
- **Gold Toggle:** Button to show/hide the Gold series independently
- **Interactive Header:** Displays current or hovered Bitcoin and Gold market caps, plus the BTC/Gold ratio and day-over-day delta for the selected range
- **Touch Scrubbing:** Horizontal finger swipe scrubs the crosshair across the chart (same pattern as S02)
- **Stat Cards:** 3-column row showing BTC High, Gold Reference, and BTC/Gold ratio for the active range
- **Unavailability State:** Honest error message when Gold reference data is missing (no fake fallback)

## Data Sources

### BTC vs Gold Market Cap API
- **Providers:** Binance (BTC price history), TradingEconomics (Gold market cap reference)
- **Internal Endpoint:** `/api/s15/btc-vs-gold` (component fetches `/api/s15/btc-vs-gold-market-cap`)
- **Returns:** `{ data: { points: [{ ts, bitcoin, gold, date, ratio }], latest }, updated_at }`
- **Refresh Rate:** 60 seconds

## Chart Configuration (`lightweight-charts`)

- `autoSize: true` — fills container
- Grid lines: transparent (clean look)
- Both price scales hidden (`visible: false`)
- Time scale hidden (dates shown in header/tooltip instead)
- Scroll and scale disabled (static chart, range-tab driven)
- Gold series added first (renders below BTC visually)

## Component Structure

### `ChartSection` (memo)
Manages the `lightweight-charts` instance. Separated into two `useEffect` hooks:
1. **Init effect** (runs once): Creates chart, adds both series, subscribes to crosshair and touch events. Returns cleanup.
2. **Data effect** (runs on data/visibility change): Calls `setData` on both series, toggles Gold visibility, fits content.

### Main Component: `S15_BTCvsGold()`

State:
- `activeLabel` — selected range tab (`'3M' | '6M' | '1Y' | 'MAX'`)
- `hoverData` — crosshair hover point `{ bitcoin, gold, date }` or `null`
- `showGold` — boolean toggle for Gold series visibility

Computed values:
- `chartData` — filtered subset of `points` for the active range
- `btcDelta` / `btcDeltaPct` — change from start to end of active range
- `btcHigh` — maximum BTC value in active range

### `MetricBox` / `MetricPlaceholder`
Small stat card components for the 3-column row at the bottom.

## Touch Scrubbing Pattern

Touch events on the chart container:
1. `touchstart` — records starting position
2. `touchmove` — if horizontal movement exceeds vertical, enters scrub mode. Converts touch X to chart logical index, fetches bar data, fires `onHoverChange`.
3. `touchend` / `touchcancel` — clears crosshair, fires `onHoverChange(null)`

This prevents vertical scroll interference while enabling chart scrubbing.

## Error & Loading States

| State       | Display                                              |
|-------------|------------------------------------------------------|
| Loading     | Skeleton bars (simulated chart shape) + skeleton header |
| No data     | "Live comparison unavailable" message + Retry button |
| No gold ref | "Waiting for gold market-cap snapshot" panel in chart area |
| Stale data  | Previous data shown silently (keepPreviousOnError)   |

## Creating a Similar Module

To create a dual-asset market cap comparison for other assets:

1. Copy this folder to `s##-{asset1}-vs-{asset2}-chart/`
2. Update `module.json` — new code, slugBase, providers, apiEndpoints
3. In `index.jsx`, change `BTC_COLOR`, `GOLD_COLOR`, series labels, and fetch URL
4. Update header labels ("Bitcoin" / "Gold") to the new asset names
5. Adjust `RANGE_TEXT` labels if different time periods apply
6. Keep the `ChartSection` memo pattern — it handles all chart lifecycle cleanly

## Styling

- Module padding: `px-3.5 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4 lg:px-[22px]`
- Chart container: `rounded-[6px] sm:rounded-[10px]`
- Chart background: `#111111` (`PANEL_BG`)
- Range tab active: white, fontWeight 700, 2px white underline
- Stat cards: `rounded-lg border border-white/10`
- Font: `JetBrains Mono` throughout (chart + UI)

## Related Modules

- S11 Fear & Greed — Bitcoin sentiment companion
- S14 Global Assets — includes Gold and Bitcoin in context of all major asset classes
- S02 Price Chart — similar lightweight-charts pattern for BTC price
