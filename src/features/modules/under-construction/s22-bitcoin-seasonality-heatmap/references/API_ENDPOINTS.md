# S22 — API Endpoints

## Current Status
This module uses **static hardcoded data** — no API calls are made at runtime.

## Planned Production Endpoint
### GET /api/s22/seasonality
Expected to return monthly BTC return percentages by year.

**Expected response shape:**
```json
{
  "data": {
    "2025": [11.8, -21.4, -3.9, 14.0, 8.9, 3.2, null, null, null, null, null, null],
    "2024": [0.6, 43.5, 16.8, -14.8, 11.1, -7.0, 3.0, -8.6, 7.3, 10.8, 37.3, -2.9]
  }
}
```

- Values are monthly percentage returns
- `null` = future or unknown month
- Array index 0 = January, index 11 = December
