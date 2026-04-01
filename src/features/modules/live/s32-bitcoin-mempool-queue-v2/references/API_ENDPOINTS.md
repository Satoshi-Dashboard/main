# API Endpoints - S32 BTC Queue

## Endpoints Used

### 1. GET /api/public/mempool/live

**Purpose:** Get 24h historical mempool queue time-series data for charting

**Response:**
```json
{
  "history": [
    {
      "time": 1704067200,
      "count": 185432,
      "fee": 45000000000,
      "weight": 8200000
    }
  ],
  "updated_at": "2024-01-01T12:00:00Z"
}
```

**Response Fields:**

#### history[]
- `time` (number): Unix timestamp in seconds (or milliseconds — component normalizes both)
- `count` (number): Pending transaction count at this point in time
- `fee` (number): Total pending transaction fees in satoshis
- `weight` (number): Mempool weight in virtual bytes (vbytes)

**Component Usage:**
```javascript
const { data } = useModuleData(fetchJohoeHistory, {
  refreshMs: 15_000,
  initialData: null,
  keepPreviousOnError: true,
});
// data is used to populate the lightweight-charts LineSeries
```

**Refresh Rate:** 15 seconds

**Error Behavior:**
- Retains previous chart data on fetch failure
- `keepPreviousOnError: true`

---

### 2. GET /api/public/mempool/overview

**Purpose:** Get current mempool snapshot for the hero metric display

**Response:**
```json
{
  "overview": {
    "block_height": 850234,
    "mempool_size": 185432,
    "mempool_bytes": 124500000,
    "total_fee": 45000000000
  },
  "fees": {
    "fastestFee": 45,
    "halfHourFee": 30,
    "hourFee": 20,
    "normal": 25.5
  }
}
```

**Refresh Rate:** 15 seconds

**Used For:** Current snapshot displayed as hero metric value above the chart

---

## Data Flow Diagram

```
Component Mounts
     ↓
├─ fetchJohoeHistory()
│  └─ → /api/public/mempool/live
│     └─ returns { history: [{time, count, fee, weight}] }
│        └─ transformed to chart-ready points:
│           { time: seconds, value: selectedMetric[key] }
│           → lineSeries.setData(points)
│
└─ (optional) fetchMempoolOverviewBundle()
   └─ → /api/public/mempool/overview
      └─ returns { overview, fees }
         └─ used for hero metric display

Every 15 seconds: Re-fetch both endpoints
On metric switch: Re-map same data to new metric key
On error: Keep previous chart data
```

---

## Timestamp Normalization

The component handles both ms and second timestamps:

```javascript
function toTimestampMs(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric > 1e12 ? numeric : numeric * 1000;  // if > 1e12 = already ms
}

function toTimestampSeconds(value) {
  const timestampMs = toTimestampMs(value);
  return Number.isFinite(timestampMs) ? Math.floor(timestampMs / 1000) : null;
}
```

---

## Caching Strategy

- **Refresh:** Every 15 seconds (fastest refresh in the dashboard)
- **Chart library:** `lightweight-charts` manages its own rendering cache
- **keepPreviousOnError:** Previous time-series data retained on fetch failure
