# S23 — API Endpoints

## Primary Dependency
### fetchBtcSpot() — @/shared/services/priceApi.js
Shared internal service that fetches live BTC/USD spot price.

**Returns:** `{ usd: number }`
**Fallback:** `84000` if call fails

## Planned Production Endpoint
### GET /api/s23/big-mac-index
Expected to return current Big Mac USD price, live BTC price, and historical data.

**Expected response shape:**
```json
{
  "big_mac_usd": 5.69,
  "btc_usd": 84000,
  "history": [
    { "label": "1 Year Ago", "subLabel": "Mar 2025", "btcPrice": 85000 },
    { "label": "30 Days Ago", "subLabel": "Feb 2026", "btcPrice": 78000 }
  ]
}
```
