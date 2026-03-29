# S15 — BTC vs Gold Chart: API Endpoints

## Internal Endpoints

### GET /api/s15/btc-vs-gold
Primary endpoint for this module (registered in module.json).

### GET /api/s15/btc-vs-gold-market-cap
Actual endpoint called by the component (the component uses this specific path).

**Response Shape:**
```json
{
  "data": {
    "points": [
      {
        "ts": 1680307200000,
        "date": "Apr 1, 2023",
        "bitcoin": 0.59,
        "gold": 12.3,
        "ratio": 4.80
      }
    ],
    "latest": {
      "ts": 1711929600000,
      "date": "Apr 1, 2024",
      "bitcoin": 1.32,
      "gold": 14.6,
      "ratio": 9.04
    }
  },
  "updated_at": "2024-04-01T00:00:00Z"
}
```

**Point fields:**
- `ts` — Unix timestamp in **milliseconds**
- `date` — Human-readable date string (e.g., `"Apr 1, 2024"`)
- `bitcoin` — Bitcoin market cap in trillions USD
- `gold` — Gold market cap in trillions USD
- `ratio` — `(bitcoin / gold) * 100` as a percentage

## Upstream Sources

| Asset   | Provider         | Data Type                  |
|---------|------------------|----------------------------|
| Bitcoin | Binance          | Daily close prices → market cap |
| Gold    | TradingEconomics | Gold market cap reference  |

## Refresh Strategy

- Component refresh: none specified (uses default from `useModuleData`)
- Module-level `lastBtcVsGoldPayload` caches data across component unmount/remount
- `keepPreviousOnError: true` — stale data shown during failures
- Fetch timeout: `8000ms`

## Range Filtering (Client-Side)

Time range filtering is done entirely on the client from the full `points` array:

| Label | Days   | Cutoff Formula                          |
|-------|--------|-----------------------------------------|
| `3M`  | 90     | `lastTs - 90 * 86_400_000`             |
| `6M`  | 180    | `lastTs - 180 * 86_400_000`            |
| `1Y`  | 365    | `lastTs - 365 * 86_400_000`            |
| `MAX` | ∞      | No cutoff — full `points` array used    |

## Error States

- No data at all → "Live comparison unavailable" header + Retry button
- No gold data specifically → "Waiting for gold market-cap snapshot" panel in chart area
- Partial error with cached data → previous data shown silently
