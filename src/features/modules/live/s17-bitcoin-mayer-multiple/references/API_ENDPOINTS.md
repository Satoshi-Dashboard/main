# S16 API Endpoints

## GET /api/s16/mayer-multiple

Returns the current Mayer Multiple value and supporting data.

### Response

```json
{
  "mayerMultiple": 1.34,
  "price": 87400,
  "sma200": 65225,
  "state": "neutral",
  "timestamp": 1711000000000
}
```

### Fields

| Field | Type | Description |
|---|---|---|
| `mayerMultiple` | number | Current BTC price / 200-day SMA |
| `price` | number | Current BTC price in USD |
| `sma200` | number | 200-day simple moving average of BTC price |
| `state` | string | `"overvalued"` / `"neutral"` / `"undervalued"` |
| `timestamp` | number | Unix ms of last update |

### Notes

- The component primarily computes this client-side from `fetchBtcHistory` + `fetchBtcSpot`
- This endpoint is the intended server-side equivalent for caching/SSR
- Refresh: 60 seconds

---

## Shared Endpoints Used

### fetchBtcHistory(2025, '1d')

Internal shared service. Returns array of daily OHLCV candles (up to 2025 days) from Binance.

```js
[
  { ts: 1711000000000, open: 64000, high: 68000, low: 63000, close: 67000, volume: 12345 },
  ...
]
```

### fetchBtcSpot()

Internal shared service. Returns live BTC spot price from Binance.

```json
{ "usd": 87423.15, "timestamp": 1711000123456 }
```

Polled every 10 seconds inside the component.
