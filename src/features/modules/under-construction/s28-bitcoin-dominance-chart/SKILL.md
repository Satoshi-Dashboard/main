---
code: S28
title: BTC Dominance
description: Historical annual returns bar chart for Bitcoin with CAGR, Sharpe ratio, standard deviation, and best/worst month breakdowns
category: under-construction
status: in-development
providers:
  - CoinGecko
refreshSeconds: 300
---

# BTC Dominance (S28)

## Description

The BTC Dominance module renders a historical annual returns bar chart for Bitcoin (2011–present). It shows:

- **Annual Returns Bar Chart:** SVG bar chart with positive (green) and negative (red) bars per year
- **CAGR:** Compound Annual Growth Rate since 2010 (~136%)
- **Standard Deviation:** Annual volatility (~85.85%)
- **Sharpe Ratio:** Risk-adjusted return metric (~0.66)
- **Best Months Panel:** Top 3 best-performing months with percentage gains
- **Worst Months Panel:** Top 3 worst-performing months with percentage losses
- **Key Statistics:** Max drawdown, positive years ratio, best year

## Data Sources

### Historical Returns Data
- **Source:** CoinGecko (planned — currently uses static data)
- **Endpoint:** `/api/s28/btc-dominance`
- **Refresh Rate:** 300 seconds (5 minutes)
- **Note:** Current implementation uses hardcoded annual return data (2011–2025)

## Component Structure

### Main Component: S28_BTCDominance()

The module uses an SVG-based chart with interactive hover tooltips:
- **Left panel (flex-1):** Auto-scaled SVG bar chart with Y-axis labels and zero line
- **Right panel (220px):** Best months, worst months, key statistics panels

### Sub-Components

#### Stat Boxes (top row)
- CAGR, Standard Deviation, Sharpe Ratio — monospace grid with colored values

#### SVG Bar Chart
- `VW=900, VH=500` viewBox, responsive via `width/height: 100%`
- Positive zone: green bars (#00D897), negative zone: red bars (#FF4757) with red-tinted background
- Y-axis auto-scales: positive max rounded up to nearest 1000%, negative zone fixed 100px
- Hover tooltip shows year, annual return %, bull/bear year classification

#### Right Side Panels
- Best Months panel (green border)
- Worst Months panel (red border)
- Key Statistics panel (orange border)

### Interaction
- `onMouseMove` over SVG: hover state for bar highlight and tooltip
- `onMouseLeave`: clears hover state

## Usage for Agents

### Adding Live Data

To connect this module to live BTC dominance / annual returns data:

1. Create endpoint `/api/s28/btc-dominance` returning `{ annual_returns: [{year, pct}], cagr, std_dev, sharpe }`
2. Replace `ANNUAL_RETURNS`, `CAGR`, `STD_DEV`, `SHARPE` constants with `useModuleData` hook
3. Update `references/API_ENDPOINTS.md` with live endpoint schema

### Chart Customization

- `Y_POS_MAX` auto-computed from data max — rounded to nearest 1000
- `TICK_STEP` = 1000 if max > 2000, else 500
- `CH_NEG = 100` (fixed pixel height for negative zone)
- Bar color logic: `isPos ? '#00D897' : '#FF4757'`

## Styling

- Container: `bg-[#111111]`, full height flex-col
- Stat boxes: `background: #161616`, `border: 1px solid #262626`
- Positive values: `#00D897` (green)
- Negative values: `#FF4757` (red)
- Accent/highlight: `#F7931A` (bitcoin orange)
- Font: monospace throughout
