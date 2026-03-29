# S24 — Props

## Component: S24_NetworkActivity

No external props. All data is generated from static constants.

## Internal State
| State | Type | Description |
|---|---|---|
| data | array | DOM_DATA — 90-day dominance history (set once via useState) |

## Dependencies
- recharts: AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer
- All values currently static; planned to hydrate from `/api/s24/network-activity`
