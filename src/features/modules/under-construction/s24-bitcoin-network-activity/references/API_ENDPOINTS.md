# S24 — API Endpoints

## Current Status
This module uses **static/generated data** — no live API calls at runtime.

## Planned Production Endpoint
### GET /api/s24/network-activity
Expected to return live Bitcoin and total crypto market metrics.

**Expected response shape:**
```json
{
  "btc_market_cap_usd": 2140000000000,
  "total_market_cap_usd": 3470000000000,
  "btc_dominance_pct": 61.67,
  "btc_market_cap_change_24h_pct": 2.85,
  "total_market_cap_change_24h_pct": -0.99,
  "dominance_history_90d": [
    { "date": "2025-12-04", "dominance_pct": 59.7 }
  ]
}
```

**Refresh interval:** 60 seconds
