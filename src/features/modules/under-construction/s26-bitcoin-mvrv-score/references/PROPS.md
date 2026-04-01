# S26 — Props

## Component: S26_MVRVScore

No external props. All data is derived from static constants and anchor arrays.

## Internal State
| State | Type | Description |
|---|---|---|
| hover | object or null | Crosshair hover state with x, y, pct, color, dateStr, zone |

## Refs
| Ref | Description |
|---|---|
| svgRef | SVG element reference for coordinate calculations |

## Derived (inline, no useState)
| Variable | Description |
|---|---|
| up | CHANGE_PCT >= 0 |
| currentColor | mvrvColor(CURRENT_PCT) |
| zone | signalZone(CURRENT_PCT) |
| lastPt | DATA[DATA.length - 1] (used for NOW marker) |

## Event Handlers
| Handler | Trigger | Action |
|---|---|---|
| handleMouseMove | onMouseMove | Finds nearest DATA point, sets hover |
| handleMouseLeave | onMouseLeave | Clears hover state |
