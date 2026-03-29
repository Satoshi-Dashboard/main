# API Endpoints - S29 UTXO Distribution

## Endpoints Used

### 1. GET /api/s29/utxo-distribution

**Purpose:** Get Bitcoin UTXO distribution broken down by age band

**Status:** Planned — current implementation uses static hardcoded data

**Planned Response:**
```json
{
  "age_bands": [
    { "range": "0–1d",  "utxos": 12340000,  "value": 5600000000  },
    { "range": "1d–1w", "utxos": 23450000,  "value": 8900000000  },
    { "range": "1w–1m", "utxos": 34560000,  "value": 12300000000 },
    { "range": "1m–6m", "utxos": 45670000,  "value": 18700000000 },
    { "range": "6m–1y", "utxos": 23456000,  "value": 14200000000 },
    { "range": "1y–2y", "utxos": 19234000,  "value": 12800000000 },
    { "range": "2y–5y", "utxos": 18765000,  "value": 14500000000 },
    { "range": "5y+",   "utxos": 7890000,   "value": 8500000000  }
  ],
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Response Fields:**

#### age_bands
- `range` (string): Human-readable age range label (e.g., "0–1d", "1y–2y", "5y+")
- `utxos` (number): Count of UTXOs in this age band
- `value` (number): Total satoshi value of UTXOs in this band

**Refresh:** 300 seconds (5 minutes)

**Source:** mempool.space UTXO age endpoint (aggregated server-side)

**Error Behavior:**
- Falls back to static hardcoded data if API is unavailable
- No visual error state — chart renders with last known data

---

## Data Flow Diagram

```
Component Mounts
     ↓
fetchUtxoDistribution()
  └─ → /api/s29/utxo-distribution
     └─ returns { age_bands: [{range, utxos, value}] }
        ├─ totalUTXOs  = sum of all utxos
        ├─ totalValue  = sum of all value
        ├─ avgUTXOValue = totalValue / totalUTXOs
        ├─ maxUTXOs    = max UTXO count (for color scaling)
        ├─ Bar chart   ← ageData mapped to Recharts BarChart
        └─ Breakdown   ← per-band progress rows

Every 300 seconds: Re-fetch
On error: Keep previous (or static) data
```

---

## Caching Strategy

- **Refresh:** Every 5 minutes (300 seconds)
- **Fallback:** Static hardcoded `ageData` array when API unavailable
- **Current state:** Module uses fully static data (no live API calls yet)

---

## Integration Notes

### Upgrading to Live Data

When the API endpoint is ready, replace the static `ageData` constant with:

```javascript
const { data } = useModuleData(fetchUtxoDistribution, {
  refreshMs: 300_000,
  initialData: null,
  keepPreviousOnError: true,
});

const ageData = data?.age_bands ?? STATIC_AGE_DATA;
```

Recompute totals from `ageData` inside `useMemo`.
