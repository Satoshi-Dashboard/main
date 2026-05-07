---
code: S18
title: Cycle Spiral
description: Interactive polar coordinate spiral visualization of Bitcoin halving cycles
category: live
status: published
providers:
  - Binance
refreshSeconds: 3600
---

# Cycle Spiral (S18)

## Purpose

A polar coordinate spiral visualization of Bitcoin's entire price history organized by halving cycles. Each halving cycle occupies one full revolution (0–2π), with Bitcoin price mapped to radius (log scale) and cycle progress mapped to angle. Colors transition from blue (post-halving accumulation) to red (pre-halving bottom) revealing cycle patterns.

Original concept by giocaizzi; implemented with live Binance data via `useBinanceHistoricalBTC`.

## What It Displays

- **Spiral dots** — each waypoint plotted as a colored circle; size scales with price magnitude
- **Today marker** — white pulsing dot at the current position in the cycle
- **Cycle phase legend** — 5 phases with color swatches (SVG on tablet/desktop, HTML div on mobile)
- **Price rings** — concentric reference circles at $1, $100, $10K, $100K
- **Halving markers** — 4 vertical dashed lines from center
- **Zoom + pan** — mouse wheel zoom (0.5x–3x) with pinpoint mouse-centered scaling; Reset button
- **Click tooltip** — shows price, date, cycle phase, and % progress through cycle

## Halving Cycle Boundaries

```js
const HALVINGS_Y = [2012.907, 2016.524, 2020.356, 2024.300, 2028.295];
```

## Cycle Phases

| Range | Label | Color |
|---|---|---|
| 0–15% | Post-Halving Accumulation | `#1E50FF` |
| 15–40% | Bull Run | `#00B4FF` |
| 40–65% | Market Peak | `#00DC78` |
| 65–85% | Bear Decline | `#DCDC00` |
| 85–100% | Pre-Halving Bottom | `#FF8C00` |

## Coordinate Math

```
angle = (year - halvingStart) / cycleDuration * 2π
radius = R_MIN + (log10(price) - LOG_MIN) / (LOG_MAX - LOG_MIN) * (R_MAX - R_MIN)
x = CX + radius * cos(angle - π/2)
y = CY + radius * sin(angle - π/2)
```

## Data Source

- `useBinanceHistoricalBTC(300000)` — custom hook returning `{ waypoints, loading, error, dataPoints, latestPrice }`
- Waypoints are monthly snapshots of historical BTC price
- `latestPrice` used for Today marker radius

## Component Architecture

```
S18_CycleSpiral
  └── ModuleShell (bg=#111111, overflow=hidden)
       └── container div (ref, wheel handler)
            ├── Loading spinner
            ├── Error state + Retry button
            ├── SVG visualization (zoom/pan wrapper)
            │    ├── Background rect
            │    ├── Price rings (4 circles)
            │    ├── Halving lines + labels (4)
            │    ├── Cycle phase legend (SVG, tablet+)
            │    ├── Data point circles (colored by cycleColor)
            │    └── Today indicator (pulsing circle + text)
            ├── Mobile legend (HTML div)
            ├── Controls (Reset + zoom level)
            └── SpiralTooltip (fixed position on click)
```

## Responsive Dimensions

| Breakpoint | VW | VH | R_MAX |
|---|---|---|---|
| < 640px | 360 | 320 | 130 |
| 640–1023px | 600 | 500 | 210 |
| >= 1024px | 900 | 700 | 300 |

## Creating a Similar Module

1. Copy folder to `s##-bitcoin-<cycle-viz>/`
2. Update `HALVINGS_Y` if projecting future halvings
3. Replace `useBinanceHistoricalBTC` with any hook returning `{ waypoints: [{ ts, price }] }`
4. Adjust `CYCLE_PHASES` colors and ranges for different interpretations
5. The `priceToRadius` + `polarToCartesian` functions are reusable for any polar chart
6. Zoom/pan logic is self-contained in `handleWheel` + pan state

## Styling

- Background: `#111111`
- Text: monospace, white with varying opacity
- Cycle colors: gradient from `#1E50FF` (blue) through `#00DC78` (green) to `#FF8C00` (orange)
- Recharts NOT used — this is pure SVG rendering

## Related Modules

- S05 Long-Term Trend — similar macro BTC cycle analysis
- S11 Fear & Greed Index — cycle sentiment correlation
- S19 Power Law Model (under-construction) — another long-term BTC model
