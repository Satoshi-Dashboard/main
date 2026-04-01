# S23 — Data Schema

## Constants
| Constant | Value | Description |
|---|---|---|
| BIG_MAC_USD | 5.69 | Big Mac price in USD (global average) |

## HISTORY Array
```ts
{
  label: string;      // e.g. "1 Year Ago"
  subLabel: string;   // e.g. "Mar 2025"
  btcPrice: number;   // BTC/USD at that time
}[]
```

## Derived Values
| Variable | Formula |
|---|---|
| currentSats | round((BIG_MAC_USD / btcPrice) * 1e8) |
| prevSats | round((BIG_MAC_USD / (btcPrice * 0.9834)) * 1e8) |
| pct | (currentSats - prevSats) / prevSats * 100 |
| hSats | round((BIG_MAC_USD / h.btcPrice) * 1e8) |
| diffPct | (curr - hSats) / hSats * 100 |
| improved | diff < 0 (fewer sats = BTC appreciated) |
