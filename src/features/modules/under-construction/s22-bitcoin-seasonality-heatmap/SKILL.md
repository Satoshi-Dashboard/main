# S22 — Bitcoin Seasonality Heatmap

## Overview
Monthly returns heatmap for Bitcoin from 2013 to present. Each cell represents a month's percentage return with color intensity encoding magnitude (green = positive, red = negative).

## Key Features
- Full historical data 2013–2025 (13 years)
- Color scale: green for positive months, red for negative, intensity proportional to magnitude (capped at 60%)
- Summary rows: monthly average and median across all years
- Null cells for future/unknown months rendered as empty
- Static data (no API call required)

## Data Structure
- `DATA` object: year → array of 12 monthly return percentages (null for unknown)
- `COL_STATS`: computed average and median per month column
- Color formula caps saturation at 60% magnitude for readability

## Status
- category: under-construction
- status: in-development
