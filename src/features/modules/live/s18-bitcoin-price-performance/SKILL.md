---
code: S17
title: US Median Home Price in BTC
description: Tracks the US median home price in USD and Bitcoin over time using FRED data
category: live
status: published
providers:
  - Binance
  - FRED
refreshSeconds: 300
---

# US Median Home Price in BTC (S17)

## Purpose

This module demonstrates Bitcoin's purchasing power growth relative to real estate. It displays the US median home price in two units simultaneously:
- **USD** — from the Federal Reserve FRED quarterly series (MSPUS)
- **BTC** — computed as `latestFredValue / liveBtcSpot`

The BTC denomination reveals that while home prices have risen in USD terms, they have collapsed dramatically in BTC terms — a key Bitcoin adoption narrative.

## What It Displays

- **Dual metric header** — USD price (left) and BTC price (right) with % change since first data point
- **Dual-axis chart** — lightweight-charts library with two LineSeries (left=USD, right=BTC log scale)
- **Live BTC price dot** — green pulsing indicator when Binance feed is healthy, red when errored
- **Legend pills** — color-coded labels for each series
- **Touch scrubbing** — mobile-friendly crosshair via manual touch event handling

## Data Sources

- **FRED quarterly data** — `GET /api/s17/house-price` returns `{ data: { points: [...], latest_value, quarter_label } }`
- **Live BTC spot** — `fetchBtcSpot()` via `@/shared/services/priceApi.js`
- **Point shape**: `{ ts: number (ms), usd: number, homeInBtc: number, date: string }`

## Component Architecture

```
S17_PricePerformance
  └── ModuleShell
       ├── <style> — s17-pulse keyframe animation
       ├── Header
       │    ├── USD metric (AnimatedMetric, left)
       │    └── BTC metric (AnimatedMetric, right) + live dot
       ├── ChartSection (memo)
       │    ├── lightweight-charts instance (createDarkChart)
       │    ├── usdSeries (LineSeries, priceScaleId="left")
       │    ├── btcSeries (LineSeries, priceScaleId="right", log scale)
       │    └── touch event handlers (touchstart/move/end)
       └── Legend (LegendPill × 2)
```

## Chart Configuration

- Library: `lightweight-charts` (not Recharts)
- USD series: left price scale, linear, orange `#F7931A`
- BTC series: right price scale, `PriceScaleMode.Logarithmic`, gold `#FFD700`
- Both series: `lineType: 2` (curved), `lineWidth: 2.5`
- Chart created via `createDarkChart()` from `@/shared/lib/lightweightChartConfig.js`

## Creating a Similar Module

1. Copy folder to `s##-bitcoin-<asset>-in-btc/`
2. Update `module.json` — add FRED or equivalent macro data provider
3. Replace `/api/s17/house-price` endpoint with your data source
4. Adjust left/right price scale formats (`precision`, `minMove`)
5. For linear assets keep `PriceScaleMode.Normal`; for Bitcoin-denominated keep Logarithmic
6. Touch handling pattern is reusable for any lightweight-charts module

## Styling

- Background: `#0a0a0a`
- USD: `#F7931A` (Bitcoin orange)
- BTC denomination: `#FFD700` (gold)
- Live indicator pulse: `s17-pulse` CSS keyframe (1.6s ease-in-out)
- `CHART_FONT` from `@/shared/lib/lightweightChartConfig.js`

## Related Modules

- S01 Bitcoin Overview — BTC spot price source
- S14 Global Assets Treemap — macro asset comparison context
- S15 BTC vs Gold — similar dual-denomination approach
