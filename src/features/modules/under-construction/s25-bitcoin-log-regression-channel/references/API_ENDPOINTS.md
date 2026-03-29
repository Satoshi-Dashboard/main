# S25 — API Endpoints

## Current Status
This module uses **fully static computed data** — no API calls at runtime.

## Planned Production Endpoint
### GET /api/s25/log-regression
Expected to return updated model parameters and current BTC 4yr MA price.

**Expected response shape:**
```json
{
  "days_since_genesis": 6269,
  "btc_4yr_ma": 47000,
  "model_slope": 5.729,
  "model_intercept": -17.05,
  "r_squared": 98.89
}
```

**Refresh interval:** 3600 seconds (1 hour)
