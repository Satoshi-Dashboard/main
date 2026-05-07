---
code: S11
title: Fear & Greed Index
description: Bitcoin market sentiment gauge showing Fear & Greed score from 0 to 100 with historical comparison bubbles
category: live
status: published
providers:
  - Alternative.me
refreshSeconds: 30
---

# Fear & Greed Index (S11)

## Description

The Fear & Greed Index module displays the current Bitcoin market sentiment as a semicircular gauge with a score from 0 (Extreme Fear) to 100 (Extreme Greed). It provides:

- **Gauge Visualization:** SVG semicircle split into 5 colored segments (Extreme Fear, Fear, Neutral, Greed, Extreme Greed)
- **Current Score:** Large needle indicator pointing to the current value with a colored bubble
- **Classification Label:** Text label for the current sentiment zone
- **Historical Comparison:** Three bubbles showing the index value for Yesterday, 7 Days Ago, and 30 Days Ago
- **Day-over-Day Change:** Percentage change vs yesterday shown alongside the current value

## Data Sources

### Fear & Greed API
- **Provider:** Alternative.me
- **Internal Endpoint:** `/api/s11/fear-greed` (proxied from `/api/public/fear-greed?limit=31`)
- **Returns:** Array of 31 daily data points, each with `value` (0–100) and `value_classification`
- **Refresh Rate:** 30 seconds (data itself updates daily, but polling is frequent for freshness)

## Component Structure

### Main Component: `S11_FearGreedIndex()`

Manages:
1. `data` state — `{ value, yesterday, sevenDaysAgo, thirtyDaysAgo, classification }`
2. `viewportWidth` — responsive gauge sizing via `useWindowWidth`
3. `useModuleData` — fetches and transforms API response

### Sub-Components

#### `ArcSegment({ cx, cy, r, fromVal, toVal, color, sw })`
Draws one colored arc segment of the gauge using SVG `<path>` with an arc command.

#### `Tick({ cx, cy, r, v, sw })`
Draws a short tick mark across the arc at a given scale position (0–100).

#### `Label({ cx, cy, r, v, sw })`
Renders a numeric label outside the arc at a given scale position.

#### `Bubble({ label, value })`
Displays a circular bubble with a historical index value. Shows a skeleton while loading.

## Gauge Segments

| Range  | Color                   | Label          |
|--------|-------------------------|----------------|
| 0–25   | `var(--accent-red)`     | EXTREME FEAR   |
| 25–45  | `#e05600`               | FEAR           |
| 45–55  | `var(--accent-warning)` | NEUTRAL        |
| 55–75  | `#56c45a`               | GREED          |
| 75–100 | `var(--accent-green)`   | EXTREME GREED  |

## Responsive Behavior

Gauge dimensions adapt to viewport width:
- `< 480px` (mobile): `VW=420, VH=250, R=150, SW=20`
- `< 768px` (tablet): `VW=560, VH=300, R=210, SW=26`
- `≥ 768px` (desktop): `VW=700, VH=380, R=270, SW=32`

## Creating a Similar Module

To create a sentiment gauge for another asset (e.g., Ethereum Fear & Greed):

1. Copy this folder to `s##-ethereum-fear-greed-index/`
2. Update `module.json` with the new code, slugBase, title, and apiEndpoints
3. In `index.jsx`, change the fetch URL to the new endpoint
4. Optionally adjust segment labels or colors for the new asset's sentiment scale

## Styling

- Background: `#0a0a0a` (module shell)
- Gauge segments use CSS variable colors from the design token system
- Font: `JetBrains Mono, monospace` for all numeric labels
- Skeleton loaders displayed during initial data fetch

## Related Modules

- S14 Global Assets — market comparison context
- S15 BTC vs Gold — another sentiment/performance indicator
- S02 Price Chart — price action correlated with sentiment cycles
