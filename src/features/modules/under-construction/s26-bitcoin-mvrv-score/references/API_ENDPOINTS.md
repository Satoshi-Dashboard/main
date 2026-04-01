# S26 — API Endpoints

## Current Status
This module uses **static anchor data** with interpolation — no live API calls.

## Planned Production Endpoint
### GET /api/s26/mvrv
Expected to return current MVRV Z-Score percentile and recent history.

**Expected response shape:**
```json
{
  "current_percentile": 45.64,
  "change_24h_pct": 1.13,
  "history": [
    { "year_decimal": 2010.0, "percentile": 4 },
    { "year_decimal": 2026.17, "percentile": 45.64 }
  ]
}
```

**Refresh interval:** 3600 seconds (1 hour)
**Provider:** Glassnode
