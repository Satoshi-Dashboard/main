# S24 — Network Activity

## Overview
Displays Bitcoin network activity and market dominance metrics: three stat cards (BTC market cap, total crypto market cap, BTC dominance) with sparklines, a dominance progress bar, and a 90-day BTC dominance area chart.

## Key Features
- Three stat cards with mini sparkline area charts (Recharts)
- Bitcoin dominance horizontal progress bar showing BTC vs. rest of market
- 90-day Bitcoin dominance history chart with interpolated data
- Color-coded stat cards: orange (BTC), blue (total market), green (dominance)
- Uses Recharts AreaChart with custom gradients

## Data Flow
- Current values are static constants (BTC_CAP_T, TOTAL_CAP_T)
- 90-day history generated via linear interpolation between waypoints with slight noise
- Sparklines generated via sine wave approximation
- Intended to connect to `/api/s24/network-activity` for live data

## Dependencies
- recharts (AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer)

## Status
- category: under-construction
- status: in-development
