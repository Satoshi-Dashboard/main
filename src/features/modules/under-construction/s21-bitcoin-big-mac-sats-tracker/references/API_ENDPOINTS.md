# S21 — API Endpoints

## Primary Endpoint

### GET /api/public/s21/big-mac-sats-data
Fetches live BTC price, 24h change, Big Mac USD price, and historical BTC prices.

**Response shape:**
```json
{
  "data": {
    "spot_btc_usd": 84000,
    "spot_change_24h_pct": 1.25,
    "big_mac_usd": 5.69,
    "history_btc": {
      "1y": 35000,
      "30d": 78000,
      "7d": 82000,
      "10y": 420,
      "5y": 58200,
      "3y": 28000
    }
  }
}
```

**Poll interval:** 300,000ms (5 minutes)
**Timeout:** 10,000ms

## Planned Production Endpoint
- `/api/s21/big-mac-sats` — production route (not yet active)
