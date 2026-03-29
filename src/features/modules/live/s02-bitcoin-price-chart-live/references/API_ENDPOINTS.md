# API Endpoints - S02 Bitcoin Price Chart

## Overview

S02 uses two main API endpoints:
1. **Live Price** - `/api/btc/spot` (10 second refresh)
2. **Historical Data** - `/api/btc/history` (loaded on range change)

---

## GET /api/btc/spot

**Purpose:** Fetch current Bitcoin spot price from Binance

**Query Parameters:** None

**Response:**
```json
{
  "usd": 45250.50,
  "timestamp": 1710000000000
}
```

**Response Fields:**
- `usd` (number) - Current BTC/USD price, with up to 2 decimal places
- `timestamp` (number) - Unix timestamp in milliseconds

**Error Handling:**
- HTTP 500 or network error: Component keeps previous price, shows stale state gracefully
- Invalid response (non-numeric `usd`): Component keeps previous price
- Component does NOT require fresh data to render — falls back to cached live price

**Caching & Refresh:**
- Module calls this endpoint every 10 seconds via `useModuleData` hook
- Binance API rate limit: 1200 requests/minute per IP (safe for 10s polling)
- Backend may implement caching to reduce Binance API calls

**Integration Notes:**
- This is a simple passthrough endpoint — can be implemented as:
  ```javascript
  app.get('/api/btc/spot', async (req, res) => {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const data = await response.json();
    res.json({ usd: parseFloat(data.price), timestamp: Date.now() });
  });
  ```
- For production: Implement caching (Redis, in-memory, etc) with 5-10s TTL to reduce load

---

## GET /api/btc/history

**Purpose:** Fetch historical Bitcoin price data for charting

**Query Parameters:**

| Param | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `days` | number | Yes | `1`, `7`, `30`, `90`, `365`, `1825` | Number of days to fetch |
| `interval` | string | Yes | `15m`, `5m`, `1h`, `1d` | Candle interval |

**Request Example:**
```
GET /api/btc/history?days=7&interval=1h
```

**Response:**
```json
[
  {
    "ts": 1709913600000,
    "price": 45000.50,
    "tooltipLabel": "3/10 12:00 AM"
  },
  {
    "ts": 1709917200000,
    "price": 45120.75,
    "tooltipLabel": "3/10 1:00 AM"
  },
  ...
]
```

**Response Fields (Array of Objects):**
- `ts` (number) - Timestamp in milliseconds (Unix * 1000)
- `price` (number) - Closing price (from OHLC candle close)
- `tooltipLabel` (string) - Formatted time label for display on hover (e.g., "3/10 12:00 AM", "12:34 PM", "2024-03-10")

**Response Constraints:**
- Array must be in **chronological order** (oldest first)
- Minimum 2 elements (otherwise chart cannot render)
- All `price` values must be positive finite numbers (>0)
- All `ts` values must be chronological (t[i] < t[i+1])

**Tooltip Label Formatting:**
- For ranges ≤1 week: Show time and day (e.g., "3/10 12:00 AM", "Mon 2:30 PM")
- For ranges >1 week: Show date and time or just date (e.g., "2024-03-10", "3/10")
- For LIVE (15m): Show time only (e.g., "12:34 PM")
- Use 12-hour format with AM/PM (not 24h)

**Error Handling:**
- HTTP 400: Invalid query params (missing days/interval) — component shows skeleton loader
- HTTP 404: No data available for range — component shows skeleton loader
- HTTP 500 or network error: Component keeps previous chart data (does not clear)
- Invalid response format (not array or empty) — component shows skeleton loader

**Caching & Performance:**
- Module caches results in `dataCache[key]` where key = `${activeLabel}_${interval}`
- Subsequent range switches to same period use cache (no API call)
- Cache persists for the session (cleared on page reload)
- No expiration — assumes historical data doesn't change

**Polling Behavior:**
- Endpoint is called only when user changes time range
- LIVE range fetches fresh data immediately on mount
- Other ranges are also fetched immediately but may be cached

**Backend Implementation Tips:**
- Fetch from Binance API endpoint: `https://api.binance.com/api/v3/klines`
- Binance rate limit: 1200 requests/minute (safe for on-demand fetching)
- Cache individual ranges with Redis TTL:
  - LIVE (15m): 1-2 minute TTL (data changes rapidly)
  - 1D, 1W, 1M (hourly): 10 minute TTL
  - 3M, 1Y, 5Y (daily): 1 hour TTL
- Example:
  ```javascript
  app.get('/api/btc/history', async (req, res) => {
    const { days, interval } = req.query;
    const cacheKey = `btc:${days}:${interval}`;

    // Check cache first
    let cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // Fetch from Binance
    const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=300`);
    const data = await response.json();

    // Transform to app format
    const transformed = data.map(([ts, open, high, low, close, volume, ...rest]) => ({
      ts: parseInt(ts),
      price: parseFloat(close),
      tooltipLabel: formatTime(ts)
    }));

    // Cache
    await redis.setex(cacheKey, getTTL(days), JSON.stringify(transformed));
    res.json(transformed);
  });
  ```

---

## Rate Limiting & Quotas

**Module Behavior:**
- Live price: 6 requests/minute (10s polling)
- Historical: 1 request per range change (user-driven)
- Typical user: ~1-2 range switches per session = ~2-3 history calls

**Binance Upstream:**
- IP rate limit: 1200 requests/minute (shared by all endpoints)
- Weight system: `/ticker/price` = 1, `/klines` = 1 (both cheap)
- Recommended backend cache TTLs above

---

## Integration Checklist

- [ ] Implement `/api/btc/spot` endpoint
- [ ] Implement `/api/btc/history` endpoint with days + interval params
- [ ] Add response validation (positive finite numbers, chronological order)
- [ ] Format `tooltipLabel` field correctly
- [ ] Test with ranges: 1D, 1W, 1M, 3M, 1Y, 5Y
- [ ] Add error handling (keep previous data on error)
- [ ] Consider caching strategy (Redis or in-memory)
- [ ] Monitor Binance API rate limits
- [ ] Add CORS headers if frontend is separate domain
