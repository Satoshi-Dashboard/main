# S11 — Fear & Greed Index: API Endpoints

## Internal Endpoints

### GET /api/s11/fear-greed
Proxied endpoint that returns the Bitcoin Fear & Greed Index data.

**Query Parameters:**
- `limit` (number, optional): Number of daily data points to return. Component uses `limit=31` to get today + 30 days of history.

**Response Shape:**
```json
{
  "data": {
    "name": "Fear and Greed Index",
    "data": [
      {
        "value": "72",
        "value_classification": "Greed",
        "timestamp": "1711497600",
        "time_until_update": "86400"
      },
      {
        "value": "68",
        "value_classification": "Greed",
        "timestamp": "1711411200"
      }
    ],
    "metadata": {
      "error": null
    }
  }
}
```

**Index mapping in component:**
- `data[0]` → today's value (current)
- `data[1]` → yesterday
- `data[7]` → 7 days ago
- `data[30]` → 30 days ago

## Upstream Source

| Field       | Value                                             |
|-------------|---------------------------------------------------|
| Provider    | Alternative.me                                    |
| External URL| `https://api.alternative.me/fng/?limit=31`        |
| Format      | JSON                                              |
| Update freq | Daily (once per day at midnight UTC)             |
| Auth        | None (public API)                                 |

## Notes

- `value` is a string in the upstream API — the component converts it with `Number()`
- `value_classification` is the human-readable zone label (e.g., "Extreme Fear", "Greed")
- The component uses `refreshMs: 0` (no auto-polling) since the data updates at most once per day
- The public route `/api/public/fear-greed` is the actual internal path fetched by the component
