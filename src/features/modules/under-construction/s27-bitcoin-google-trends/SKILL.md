# S27 — Google Trends

## Overview
Bitcoin Google Trends search interest (0–100) over a 24-hour window with BTC price overlay on a secondary right axis. Shows visual correlation between search volume spikes and price movements.

## Key Features
- Orange area fill for search interest (primary left axis, 0–100)
- Light-blue line for BTC price (secondary right axis, in $K)
- Pearson correlation coefficient (R) displayed as a badge
- Smooth bezier path curves for both series
- Hover crosshair with two dots (one per axis) and tooltip: time, search interest, BTC price, signal
- Signal zones: Low Interest / Normal / Growing / High Interest / Extreme/FOMO
- Stats row: current interest, 24h change, correlation R, current BTC, 24h peak

## Signal Zones
- <20: Low Interest
- 20–40: Normal
- 40–60: Growing
- 60–80: High Interest
- >80: Extreme / FOMO

## Data Shape
- ANCHORS: [elapsed_hours, search_interest_0-100, btc_price_$K]
- 24h window from 08:10 to 08:16 next day
- Pearson correlation computed between SEARCHES and BTCPRICES arrays

## Status
- category: under-construction
- status: in-development
