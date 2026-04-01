# S17 API Endpoints

## GET /api/s17/house-price

Returns US median home price time series in both USD and Bitcoin denomination.

### Response

```json
{
  "data": {
    "points": [
      {
        "ts": 1000000000000,
        "usd": 172000,
        "homeInBtc": 14500.5,
        "date": "Q1 2001"
      }
    ],
    "latest_value": 420000,
    "quarter_label": "Q4 2024"
  }
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `data.points` | `array` | Historical quarterly data points |
| `data.points[].ts` | `number` | Unix milliseconds (quarter start) |
| `data.points[].usd` | `number` | US median home price in USD (FRED MSPUS) |
| `data.points[].homeInBtc` | `number` | Home price denominated in BTC at the time |
| `data.points[].date` | `string` | Quarter label (e.g., "Q1 2024") |
| `data.latest_value` | `number` | Most recent FRED median home price in USD |
| `data.quarter_label` | `string` | Quarter label for latest value |

### Data Source

- **FRED Series:** MSPUS (Median Sales Price of Houses Sold for the United States)
- **Frequency:** Quarterly
- **BTC conversion:** Each point's USD value divided by contemporaneous BTC price from Binance
- **Refresh:** 300 seconds (5 minutes, but FRED data updates quarterly)

---

## Shared Endpoints Used

### fetchBtcSpot()

Live BTC spot price from Binance used to compute real-time `homeInBtc` for latest value.

```json
{ "usd": 87423.15, "timestamp": 1711000123456 }
```

The component computes: `liveHomeInBtc = latest_value / btcSpot`

This makes the BTC denomination update live while FRED data remains quarterly.
