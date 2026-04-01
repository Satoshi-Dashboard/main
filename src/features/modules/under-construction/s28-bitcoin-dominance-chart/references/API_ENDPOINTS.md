# API Endpoints - S28 BTC Dominance

## Endpoints Used

### 1. GET /api/s28/btc-dominance

**Purpose:** Get Bitcoin historical annual return data and market dominance statistics

**Status:** Planned — current implementation uses static hardcoded data

**Planned Response:**
```json
{
  "annual_returns": [
    { "year": 2011, "pct": 1467 },
    { "year": 2012, "pct": 187 },
    { "year": 2013, "pct": 5870 },
    { "year": 2025, "pct": 25.85, "live": true }
  ],
  "cagr": 136.03,
  "std_dev": 85.85,
  "sharpe": 0.66,
  "best_months": [
    { "label": "November 2013", "pct": 450.0 },
    { "label": "March 2013",    "pct": 186.8 },
    { "label": "May 2017",      "pct": 70.2  }
  ],
  "worst_months": [
    { "label": "September 2011", "pct": -39.7 },
    { "label": "June 2022",      "pct": -37.3 },
    { "label": "November 2018",  "pct": -37.0 }
  ],
  "key_stats": [
    { "label": "Max Drawdown",   "value": "-84.2%" },
    { "label": "Positive Years", "value": "12/15"  },
    { "label": "Best Year",      "value": "2013"   }
  ],
  "updated_at": "2025-01-01T00:00:00Z"
}
```

**Response Fields:**

#### annual_returns
- `year` (number): Calendar year
- `pct` (number): Annual return percentage (positive = bull, negative = bear)
- `live` (boolean, optional): `true` if the current year is still in progress

#### cagr
- **Type:** number
- **Description:** Compound Annual Growth Rate since 2010

#### std_dev
- **Type:** number
- **Description:** Annualized standard deviation of returns (volatility)

#### sharpe
- **Type:** number
- **Description:** Sharpe ratio (risk-adjusted return)

**Refresh:** 300 seconds (5 minutes)

**Error Behavior:**
- Falls back to last known static data
- Component renders with hardcoded data if API is unavailable

---

## Data Flow Diagram

```
Component Mounts
     ↓
fetchBtcDominanceData()
  └─ → /api/s28/btc-dominance
     └─ returns { annual_returns, cagr, std_dev, sharpe, best_months, worst_months, key_stats }
        ├─ annual_returns → SVG bar chart rendering
        ├─ cagr, std_dev, sharpe → top stat boxes
        ├─ best_months → right panel "Best Months"
        ├─ worst_months → right panel "Worst Months"
        └─ key_stats → right panel "Key Statistics"

Every 300 seconds: Re-fetch
On error: Keep previous (or static) data
```

---

## Caching Strategy

- **Refresh:** Every 5 minutes (300 seconds)
- **Fallback:** Static hardcoded data when API unavailable
- **Current state:** Module uses fully static data (no live API calls yet)

---

## Integration Notes

### Current Static Data (in component)

The component currently hardcodes `ANNUAL_RETURNS`, `CAGR`, `STD_DEV`, `SHARPE`, `BEST_MONTHS`, `WORST_MONTHS`, `KEY_STATS` arrays. When the API is ready, replace these with a `useModuleData` hook:

```javascript
const { data } = useModuleData(fetchBtcDominanceData, {
  refreshMs: 300_000,
  initialData: null,
  keepPreviousOnError: true,
});
```
