# S27 — Props

## Component: S27_GoogleTrends

No external props. All data is computed from static ANCHORS array.

## Internal State
| State | Type | Description |
|---|---|---|
| hover | object or null | Crosshair hover state |

## Hover State Shape
```ts
{
  x: number;     // SVG x coordinate
  yS: number;    // SVG y for search interest
  yB: number;    // SVG y for BTC price
  s: number;     // search interest value (0–100)
  p: number;     // BTC price in $K
  time: string;  // "HH:MM" format
} | null
```

## Refs
| Ref | Description |
|---|---|
| svgRef | SVG element reference for mouse coordinate calculation |

## Event Handlers
| Handler | Trigger | Action |
|---|---|---|
| handleMouseMove | onMouseMove | Finds nearest ANCHOR, sets hover |
| handleMouseLeave | onMouseLeave | Clears hover state |

## Derived (inline)
| Variable | Description |
|---|---|
| up | CHANGE_PCT >= 0 |
| lastTrend | TREND_PTS last point (used for NOW marker) |
| tx, ty | Tooltip box position with boundary clamping |
