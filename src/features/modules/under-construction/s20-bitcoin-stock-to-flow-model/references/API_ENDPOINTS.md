# S20 API Endpoints

## GET /api/s20/stock-to-flow

Intended endpoint for live Stock-to-Flow data. Not yet implemented.

### Planned Response

```json
{
  "currentSF": 135,
  "currentPrice": 84000,
  "modelPrice": 76800,
  "deviationPct": 9.4,
  "nextHalvingMonths": 26,
  "halvingYear": 2028.295,
  "quarterlyData": [
    {
      "year": 2024.35,
      "sf": 120,
      "price": 64000,
      "monthsToNextHalving": 47
    }
  ],
  "timestamp": 1711000123456
}
```

### Planned Fields

| Field | Type | Description |
|---|---|---|
| `currentSF` | `number` | Current Stock-to-Flow ratio |
| `currentPrice` | `number` | Latest BTC price in USD |
| `modelPrice` | `number` | `0.34 × currentSF^2.94` |
| `deviationPct` | `number` | % deviation from model price |
| `nextHalvingMonths` | `number` | Months until next halving |
| `halvingYear` | `number` | Next halving decimal year |
| `quarterlyData` | `array` | Historical quarterly scatter data |
| `timestamp` | `number` | Unix ms of last update |

### Status

This endpoint is planned but not yet implemented. The current component uses hardcoded constants:

```js
const CURRENT_SF  = 135;
const CURRENT_P   = 84000;
```

### S2F Ratio Computation

```
Stock = total BTC in circulation (approx. 19.7M as of 2025)
Flow  = annual new BTC minted (post-4th-halving: ~164,250 BTC/year)
SF    = Stock / Flow ≈ 19,700,000 / 164,250 ≈ 120

// After 4th halving (Apr 2024), subsidy = 3.125 BTC/block
// 144 blocks/day × 365 days = 52,560 blocks/year
// 52,560 × 3.125 = 164,250 BTC/year
```

### Implementation Plan

1. Create route `pages/api/s20/stock-to-flow.js`
2. Fetch current BTC price from Binance
3. Compute S2F from known supply schedule (deterministic — no external API needed)
4. Return historical quarterly data from static embedded array
5. Compute deviation from model
6. Refresh: 3600 seconds (S2F changes slowly)

---

## Formula Reference

```
modelPrice(sf) = 0.34 × sf^2.94
deviationPct = ((currentPrice - modelPrice) / modelPrice) * 100
```
