# S25 — Props

## Component: S25_LogRegression

No external props. All data is computed from static model constants.

## Internal State
| State | Type | Description |
|---|---|---|
| hover | object or null | Hover crosshair state with x, y, logT, logP, days, price, date, dev |

## Refs
| Ref | Description |
|---|---|
| svgRef | Reference to the SVG element for getBoundingClientRect() in mouse handlers |

## Event Handlers
| Handler | Trigger | Action |
|---|---|---|
| handleMouseMove | onMouseMove on SVG | Finds nearest CURVE_DATA point, sets hover state |
| handleMouseLeave | onMouseLeave on SVG | Clears hover state |
