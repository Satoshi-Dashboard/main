# S21 — Props

## Component: S21_BigMacSatsTracker

No external props. All data is fetched internally.

## Internal State
| State | Type | Description |
|---|---|---|
| spotBtcPrice | number or null | Live BTC/USD price |
| spotBtcChange24h | number or null | 24h % change |
| baseBtcPrice | number or null | First loaded BTC price (used for sats calc) |
| bigMacUsd | number or null | Big Mac price in USD from API |
| historyBtc | object | Map of period key to historical BTC price |
| historyReady | boolean | Whether initial fetch has completed |

## Computed (useMemo)
| Computed | Description |
|---|---|
| currentSats | Big Mac cost in sats at current BTC price |
| headerPct | 24h % change in sats cost |
| cards | Array of period card objects with sats, pct, improved |
