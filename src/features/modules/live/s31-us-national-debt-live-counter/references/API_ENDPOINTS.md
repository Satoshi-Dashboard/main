# API Endpoints - S30 U.S. National Debt

## Endpoints Used

### 1. GET /api/s30/national-debt

**Purpose:** Get the current U.S. national debt payload with projection data for real-time counter interpolation

**Response:**
```json
{
  "data": {
    "total_debt": 35000000000000,
    "rate_per_second": 42000,
    "debt_per_person": 104000,
    "debt_held_public": 27000000000000,
    "intragovernmental_holdings": 8000000000000,
    "population": 336000000,
    "official_record_date": "2024-12-15",
    "interpolation_window_observations": 90,
    "projection_base_at": "2024-12-15T20:00:00Z"
  },
  "updated_at": "2024-12-15T20:05:00Z",
  "is_fallback": false,
  "fallback_note": null
}
```

**Response Fields:**

#### data.total_debt
- **Type:** number
- **Description:** Latest official total national debt in USD (not live — used as base for projection)

#### data.rate_per_second
- **Type:** number
- **Description:** Interpolated rate of debt change per second in USD (positive = increasing, negative = decreasing)
- **Used For:** `projectCurrencyValue()` and `projectSessionDelta()` live counter

#### data.debt_per_person
- **Type:** number
- **Description:** Static official debt per U.S. resident (used as baseline; projected version computed live)

#### data.debt_held_public
- **Type:** number
- **Description:** U.S. Treasury obligations held externally (outside federal accounts)

#### data.intragovernmental_holdings
- **Type:** number
- **Description:** Treasury securities held within federal trust funds and government accounts

#### data.population
- **Type:** number
- **Description:** Current U.S. population estimate used for per-person calculation

#### data.official_record_date
- **Type:** string (ISO date)
- **Description:** Date of the most recent official Treasury print

#### data.interpolation_window_observations
- **Type:** number
- **Description:** Number of data points used to compute the interpolated `rate_per_second`

#### data.projection_base_at
- **Type:** string (ISO datetime)
- **Description:** Timestamp at which `total_debt` was accurate — used as the base for real-time projection

#### updated_at
- **Type:** string (ISO datetime)
- **Description:** When this cache was last synced from the Treasury API

#### is_fallback
- **Type:** boolean
- **Description:** `true` if the data is from a cached fallback (Treasury API unavailable)

#### fallback_note
- **Type:** string | null
- **Description:** Human-readable message explaining fallback state

**Refresh:** 60 seconds

**Error Behavior:**
- Shows `LoadingState` on first load while fetching
- Shows `ErrorState` with retry button if fetch fails and no prior payload exists
- On background re-fetch error: silently retains previous payload

---

## Data Flow Diagram

```
Component Mounts
     ↓
load() → fetchUsNationalDebtPayload({ force: false })
  └─ → /api/s30/national-debt
     └─ returns payload { data, updated_at, is_fallback }
        ├─ payload.data.total_debt → base for projectedTotal
        ├─ payload.data.rate_per_second → live tick projection
        ├─ payload.data.debt_held_public → StatCard
        ├─ payload.data.intragovernmental_holdings → StatCard
        ├─ payload.data.population → debt-per-person divisor
        └─ buildUsDebtRateCards(model) → 6 RateCards

Every 60 seconds: Re-fetch silently (setRefreshing)
Every 1 second: setNowMs(Date.now()) → re-compute projectedTotal
On error (first load): ErrorState
On error (background): Keep previous payload
```

---

## Projection Functions (from `@/shared/utils/usNationalDebt.js`)

### projectCurrencyValue(totalDebt, ratePerSecond, projectionBaseAt, nowMs)

```javascript
// Interpolates current debt value from base + elapsed time
const elapsed = (nowMs - Date.parse(projectionBaseAt)) / 1000; // seconds
return totalDebt + (ratePerSecond * elapsed);
```

### projectSessionDelta(ratePerSecond, openedAt, nowMs)

```javascript
// Calculates delta since page was opened
const elapsed = (nowMs - openedAt) / 1000;
return ratePerSecond * elapsed;
```

---

## Caching Strategy

- **Refresh:** Every 60 seconds (DATA_REFRESH_MS = 60_000)
- **Live tick:** Every 1 second (LIVE_TICK_MS = 1_000) — client-side interpolation only
- **Force refresh:** Pass `{ force: true }` to bypass server cache
- **Fallback:** Previous payload retained on error; `is_fallback: true` shows warning banner
