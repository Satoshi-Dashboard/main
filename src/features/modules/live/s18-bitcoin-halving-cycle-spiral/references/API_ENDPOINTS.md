# S18 API Endpoints

## GET /api/s18/cycle-data

Returns historical Bitcoin price waypoints organized for cycle spiral visualization.

### Response

```json
{
  "waypoints": [
    {
      "ts": 1325376000000,
      "price": 5.5
    },
    {
      "ts": 1711000000000,
      "price": 72000
    }
  ],
  "latestPrice": 87400,
  "dataPoints": 1842,
  "timestamp": 1711000123456
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `waypoints` | `array` | Monthly BTC price snapshots from genesis to present |
| `waypoints[].ts` | `number` | Unix milliseconds |
| `waypoints[].price` | `number` | BTC price in USD at this timestamp |
| `latestPrice` | `number` | Most recent BTC spot price |
| `dataPoints` | `number` | Total count of historical data points processed |
| `timestamp` | `number` | Unix ms of last update |

### Notes

- Refresh: 3600 seconds (1 hour) — cycle data changes slowly
- Waypoints are monthly resolution (not daily) to keep dot count manageable for SVG rendering
- The component currently uses `useBinanceHistoricalBTC(300000)` hook directly (no REST call)
- This endpoint is the intended server-side cache for the hook's data

---

## Shared Hook Used

### useBinanceHistoricalBTC(pollingInterval)

Custom hook from `@/shared/hooks/useBinanceHistoricalBTC`

**Returns:**
```ts
{
  waypoints: Array<{ ts: number, price: number }>;
  loading: boolean;
  error: Error | null;
  dataPoints: number;      // Total candles fetched
  latestPrice: number | null;
}
```

`pollingInterval`: `300000` ms (5 minutes for live refresh).
