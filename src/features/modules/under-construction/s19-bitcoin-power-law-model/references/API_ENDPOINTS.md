# S19 API Endpoints

## GET /api/s19/power-law

Intended endpoint for live Power Law Model data. Not yet implemented.

### Planned Response

```json
{
  "currentYear": 2026.17,
  "currentPrice": 84000,
  "fairValue": 92500,
  "deviationPct": -9.2,
  "bandPosition": "bottom",
  "priceSeries": [
    { "year": 2010.5, "price": 0.08 },
    { "year": 2011.4, "price": 30 }
  ],
  "timestamp": 1711000123456
}
```

### Planned Fields

| Field | Type | Description |
|---|---|---|
| `currentYear` | `number` | Current date as decimal year (e.g., 2026.17) |
| `currentPrice` | `number` | Latest BTC price in USD |
| `fairValue` | `number` | Model fair value at currentYear (offset=0) |
| `deviationPct` | `number` | % deviation of current price from fair value |
| `bandPosition` | `string` | Which band current price falls in |
| `priceSeries` | `array` | Historical price waypoints for orange line |
| `timestamp` | `number` | Unix ms of last update |

### Status

This endpoint is planned but not yet implemented. The current component (`index.jsx`) uses hardcoded static data:

```js
const CURRENT_YEAR = 2026.17;
const CURRENT_PRICE = 84000;
```

### Implementation Plan

1. Create `pages/api/s19/power-law.js` (or equivalent route)
2. Fetch latest BTC price from Binance spot API
3. Compute `CURRENT_YEAR` from `Date.now()`
4. Compute `fairValue` using the Power Law formula
5. Return static `PRICE_WP` waypoints (or fetch from Binance historical)
6. Refresh: 3600 seconds (hourly)

---

## Formula Reference

```
daysFromGenesis = (currentDateMs - GENESIS_MS) / 86400000
fairValue = 10^(-17.02 + 5.98 * log10(daysFromGenesis))
```

Where `GENESIS = 2009-01-03` (Bitcoin genesis block date).
