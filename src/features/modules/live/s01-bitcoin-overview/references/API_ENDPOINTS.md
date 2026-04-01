# API Endpoints - S01 Bitcoin Overview

## Endpoints Used

### 1. GET /api/btc/rates

**Purpose:** Get current Bitcoin/USD spot price

**Response:**
```json
{
  "usd": 45250.75,
  "source": "binance"
}
```

**Response Fields:**
- `usd` (number): BTC/USD price in dollars
- `source` (string): Data source - "binance" or "coingecko_fallback"

**Error Behavior:**
- Returns last known value if fetch fails
- Retries automatically on next refresh cycle (30s)

**Component Usage:**
```javascript
const fetchSpot = useCallback(() => fetchBtcSpot(), []);

const { data: spotData } = useModuleData(fetchSpot, {
  refreshMs: 30_000,
  initialData: null,
  keepPreviousOnError: true,
});
```

**Source Implementation:**
- Located in: `src/shared/services/priceApi.js`
- Function: `fetchBtcSpot()`
- Primary: Binance API
- Fallback: CoinGecko API
- Error handling: Attempts fallback before failure

---

### 2. GET /api/public/mempool/overview

**Purpose:** Get comprehensive Bitcoin network and market data bundle

**Response:**
```json
{
  "overview": {
    "block_height": 850234,
    "difficulty": {
      "currentDifficulty": 88271000000000,
      "remainingBlocks": 14678,
      "progressPercent": 73.21,
      "difficultyChange": 2.34,
      "previousRetarget": 1.12
    },
    "hashrate": {
      "currentHashrate": 620000000000000000,
      "currentDifficulty": 88271000000000
    },
    "fear_greed": {
      "data": [
        { "value": "42", "value_classification": "Fear" },
        { "value": "40", "value_classification": "Fear" },
        { "value": "38", "value_classification": "Fear" }
      ]
    }
  },
  "fees": {
    "normal": 25.5
  }
}
```

**Response Fields:**

#### overview.block_height
- **Type:** number
- **Description:** Latest confirmed block number
- **Example:** 850234
- **Used For:** Circulating supply calculation

#### overview.difficulty
- **currentDifficulty** (number): Raw difficulty value (divide by 1e12 for Terahashes)
- **remainingBlocks** (number): Blocks until next adjustment (every 2016 blocks)
- **progressPercent** (number): 0-100, progress to adjustment
- **difficultyChange** (number): Predicted % change for next adjustment
- **previousRetarget** (number): % change from previous adjustment

#### overview.hashrate
- **currentHashrate** (number): Raw hash rate value (divide by 1e18 for EH/s)
- **currentDifficulty** (number): Redundant with overview.difficulty

#### overview.fear_greed
- **data** (array): Array of objects with daily values and classifications
  - **value** (string): "0" to "100" (Fear & Greed Index value)
  - **value_classification** (string): "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
- **Length:** 7+ days of historical data (newest last)

#### fees
- **normal** (number): Average transaction fee in sat/vB for normal priority

**Error Behavior:**
- Returns last known value if fetch fails
- 8-second timeout configured (`timeout: 8000`)
- Retries automatically on next refresh cycle (30s)

**Component Usage:**
```javascript
const fetchOverview = useCallback(
  () => fetchMempoolOverviewBundle({ timeout: 8000, cache: 'no-store' }),
  [],
);

const { data: overviewData } = useModuleData(fetchOverview, {
  refreshMs: 30_000,
  initialData: null,
  keepPreviousOnError: true,
});
```

**Source Implementation:**
- Located in: `src/shared/services/mempoolApi.js`
- Function: `fetchMempoolOverviewBundle(options)`
- Source: mempool.space public API + internal aggregation
- Response combines multiple mempool.space endpoints:
  - `/blocks` - Block height
  - `/difficulty-adjustment` - Difficulty data
  - `/api/v1/fees/recommended` - Fee estimates
  - Fear & Greed Index from Alternative.me

---

## Data Flow Diagram

```
Component Mounts
     ↓
├─ fetchSpot()
│  └─ → /api/btc/rates
│     └─ returns { usd, source }
│        └─ used for price, satsPerDollar
│
└─ fetchMempoolOverviewBundle()
   └─ → /api/public/mempool/overview
      └─ returns { overview, fees }
         ├─ blockHeight → circulatingSupply calculation
         ├─ difficulty → difficultyProgress, diffChangeNext, etc
         ├─ hashrate → hashRateEh
         ├─ fear_greed → fearGreedValue, fearGreedClass, fearGreedHistory
         └─ fees.normal → avgTxFee

Every 30 seconds: Re-fetch both endpoints (independent)
On unmount: Abort pending requests
On error: Keep previous value, retry next cycle
```

---

## Caching Strategy

### Spot Price (/api/btc/rates)
- **Cache Control:** Default (typically no-cache for realtime data)
- **Refresh:** 30 seconds
- **Fallback:** Previous value on error

### Mempool Overview (/api/public/mempool/overview)
- **Cache Control:** `'no-store'` (always fresh from server)
- **Refresh:** 30 seconds
- **Timeout:** 8 seconds (returns previous value if exceeded)
- **Fallback:** Previous value on error

---

## Integration Notes

### For Agents Creating Similar Modules

1. **Identify data sources** - What external APIs does your module need?
2. **Create fetch functions** in `src/shared/services/` (if reusable)
3. **Define data shape** in module's `references/DATA_SCHEMA.md`
4. **Document endpoints** in module's `references/API_ENDPOINTS.md`
5. **Use useModuleData hook** for polling:
   ```javascript
   const { data, loading, error } = useModuleData(fetchFn, {
     refreshMs: 30000,
     initialData: null,
     keepPreviousOnError: true
   });
   ```

### Error Scenarios

| Scenario | Behavior | User Impact |
|----------|----------|-------------|
| API timeout | Uses previous value | Stale data displayed, no visual error |
| API 500 error | Uses previous value | Stale data displayed, no visual error |
| No data (cold start) | Shows skeleton loaders | Loading placeholders while fetching |
| Persistent error (>1 min) | Continues showing skeleton | UI appears to be loading indefinitely |
| Network offline | Uses previous value + retries | Stale data with no indication of offline |

### Performance Considerations

- Both endpoints fetch independently → UI updates asynchronously
- If price updates before mempool data: Only price updates, rest stays as-is
- If mempool updates before price: Only mempool metrics update, price stays as-is
- This prevents "janky" updates where everything changes at once

### Adding New Data Points

To add a new metric to S01:

1. Add field to `defaultStats` object
2. Extract from API response in `useMemo`
3. Add to `tiles` array with Tile component config
4. Document in `DATA_SCHEMA.md` and `API_ENDPOINTS.md`
5. Update SKILL.md description and API contracts

Example:
```javascript
// 1. In defaultStats
nextHalvingBlock: null,

// 2. In useMemo transformation
if (overviewData) {
  const nextHalving = 840000 * Math.ceil(h / 210000);
  base.nextHalvingBlock = nextHalving;
}

// 3. In tiles array
{ label: 'BLOCKS TO NEXT HALVING', value: stats.nextHalvingBlock - stats.blockHeight }
```
