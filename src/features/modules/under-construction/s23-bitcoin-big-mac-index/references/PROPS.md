# S23 — Props

## Component: S23_BigMacIndex

No external props. Data fetched internally via shared service.

## Internal State
| State | Type | Description |
|---|---|---|
| btcPrice | number or null | Live BTC/USD price from fetchBtcSpot() |

## Derived (computed inline)
| Variable | Description |
|---|---|
| currentSats | Big Mac cost in sats at current BTC price |
| prevSats | Previous day approximate sats (btcPrice * 0.9834) |
| pct | % change in sats vs previous approximation |
| up | boolean — whether pct >= 0 |
