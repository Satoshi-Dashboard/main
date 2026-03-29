# S27 — API Endpoints

## Current Status
This module uses **static anchor data** — no live API calls at runtime.

## Planned Production Endpoint
### GET /api/s27/google-trends
Expected to return 24h Bitcoin search interest time series with BTC price correlation.

**Expected response shape:**
```json
{
  "current_interest": 41,
  "change_24h_pct": 20.6,
  "window_start": "08:10",
  "window_end": "08:16",
  "series": [
    { "elapsed_hours": 0.0, "search_interest": 28, "btc_price_k": 84.2 }
  ],
  "pearson_r": 0.87,
  "peak_24h": 100,
  "current_btc_k": 85.0
}
```

**Refresh interval:** 3600 seconds (1 hour)
**Provider:** Google Trends
