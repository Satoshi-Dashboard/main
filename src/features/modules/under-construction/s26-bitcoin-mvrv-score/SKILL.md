# S26 — MVRV Score

## Overview
MVRV Z-Score displayed as a 0–100 percentile chart spanning 2010 to present. Each line segment is colored dynamically based on its percentile value using a blue-to-red gradient scale.

## Key Features
- Dynamic gradient-colored line: blue (oversold <20%) → cyan → green → yellow → orange → red (overbought >80%)
- Vertical color bar legend on the right showing full gradient scale
- Hover crosshair with tooltip: date, MVRV %, signal zone, percentile range
- Current level reference dashed line with label
- NOW marker at most recent data point
- Stats row: current %, 24h change, signal label, historical bull top (96%), bear bottom (5%)

## Color Scale
- 0%: deep blue rgb(0,30,255)
- 18%: cyan rgb(0,200,255)
- 38%: green rgb(0,255,100)
- 58%: yellow-green rgb(200,255,0)
- 72%: orange-yellow rgb(255,200,0)
- 86%: orange-red rgb(255,60,0)
- 100%: red rgb(255,0,0)

## Signal Zones
- <20%: Oversold
- 20–40%: Accumulate
- 40–60%: Neutral
- 60–80%: Caution
- >80%: Overbought

## Status
- category: under-construction
- status: in-development
