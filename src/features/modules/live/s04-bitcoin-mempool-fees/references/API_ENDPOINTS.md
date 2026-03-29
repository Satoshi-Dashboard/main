# API Endpoints - S04 Bitcoin Mempool Fees (Gauge)

## Endpoints Used

### 1. GET /api/public/mempool/overview

**Purpose:** Get current mempool state including fee estimates for gauge display

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

#### overview.mempool_size
- **Type:** number
- **Description:** Count of unconfirmed transactions currently in mempool

#### overview.mempool_bytes / overview.vsize
- **Type:** number
- **Description:** Mempool size in bytes / virtual bytes

#### fees.fastestFee
- **Type:** number (sat/vB)
- **Description:** Fee rate for next-block inclusion

#### fees.halfHourFee
- **Type:** number (sat/vB)
- **Description:** Fee rate for ~30-minute confirmation

#### fees.hourFee
- **Type:** number (sat/vB)
- **Description:** Fee rate for ~60-minute confirmation

#### fees.normal
- **Type:** number (sat/vB)
- **Description:** Average normal-priority fee rate

**Refresh Rate:** 10 seconds

---

### 2. GET /api/public/mempool/live

**Purpose:** Get mempool fee histogram for the treemap visualization

**Response:**
```json
{
  "feeRange": [1, 2, 5, 10, 25, 50, 100],
  "txCount": 185432,
  "blockSize": 1000000,
  "updated_at": "2024-01-01T12:00:00Z"
}
```

**Response Fields:**

#### feeRange
- **Type:** number[] (sat/vB values)
- **Description:** Distribution of fee rates in the current mempool — used to generate representative transactions for the treemap

#### txCount
- **Type:** number
- **Description:** Total pending transaction count

#### blockSize
- **Type:** number
- **Description:** Reference block size in bytes for average transaction size calculation

**Refresh Rate:** 10 seconds

---

## Data Flow Diagram

```
Component Mounts
     ↓
├─ fetchMempoolOverviewBundle()
│  └─ → /api/public/mempool/overview
│     └─ returns { overview, fees }
│        ├─ fees.fastestFee → "fastest" gauge label
│        ├─ fees.halfHourFee → "30 min" gauge label
│        ├─ fees.hourFee → "1 hour" gauge label
│        └─ overview.mempool_size → tx count in gauge center
│
└─ fetchMempoolNodeSnapshot() / fetchMempoolOfficialUsageSnapshot()
   └─ → /api/public/mempool/live (or internal)
      └─ returns { feeRange, txCount, blockSize }
         └─ genTxs(feeRange, txCount, blockSize)
            └─ → txs array for treemap canvas

Every 10 seconds: Re-fetch both endpoints
```

---

## Caching Strategy

- **Refresh:** Every 10 seconds (fastest after S32 queue module)
- **keepPreviousOnError:** true — previous gauge state retained on error
- **Timeout:** Standard (no custom timeout configured)
