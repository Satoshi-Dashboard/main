# API Endpoints - S05 Bitcoin Mempool Trend

## Endpoints Used

### 1. GET /api/public/mempool/overview

**Purpose:** Get comprehensive mempool state data including fees for the long-term trend treemap visualization

**Response:**
```json
{
  "overview": {
    "block_height": 850234,
    "mempool_size": 185432,
    "mempool_bytes": 124500000,
    "vsize": 124500000
  },
  "fees": {
    "fastestFee": 45,
    "halfHourFee": 30,
    "hourFee": 20,
    "normal": 25.5,
    "minimumFee": 1
  }
}
```

**Response Fields:**

#### overview.mempool_bytes / overview.vsize
- **Type:** number
- **Description:** Mempool size in bytes — used to drive the treemap block sizes

#### fees.*
- **Type:** number (sat/vB each)
- **Description:** Current fee tier estimates — used to color the treemap blocks

**Refresh Rate:** 30 seconds (based on module.json `refreshSeconds`)

**Source Implementation:**
- Located in: `src/shared/services/mempoolApi.js`
- Function: `fetchMempoolOverviewBundle(options)`

**Error Behavior:**
- Retains previous treemap data via `keepPreviousOnError: true`
- No visual error indicator — chart simply does not update

---

## Data Flow Diagram

```
Component Mounts
     ↓
fetchMempoolOverviewBundle()
  └─ → /api/public/mempool/overview
     └─ returns { overview, fees }
        ├─ overview.mempool_bytes → block sizes in treemap
        ├─ fees distribution → fee color mapping
        └─ overview.mempool_size → transaction count display

Every 30 seconds: Re-fetch
On error: Keep previous treemap state
```

---

## Caching Strategy

- **Refresh:** Every 30 seconds
- **keepPreviousOnError:** true
- The treemap visualization is canvas-based and redraws when new data arrives
