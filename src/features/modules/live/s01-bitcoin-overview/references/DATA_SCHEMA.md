# Data Schema - S01 Bitcoin Overview

## Input Data Structure

### From useModuleData Hook 1 (BTC Spot Price)

**Endpoint:** `/api/btc/rates`

```javascript
{
  usd: number,           // Current BTC/USD price
  source: string         // "binance" | "coingecko_fallback"
}
```

**Example:**
```json
{
  "usd": 45250.75,
  "source": "binance"
}
```

### From useModuleData Hook 2 (Mempool Overview Bundle)

**Endpoint:** `/api/public/mempool/overview`

```javascript
{
  overview: {
    block_height: number,
    difficulty: {
      currentDifficulty: number,     // in raw form (e.g., 88e12)
      remainingBlocks: number,       // blocks until next adjustment
      progressPercent: number,       // 0-100, progress to adjustment
      difficultyChange: number,      // expected % change (e.g., 2.5)
      previousRetarget: number       // % change from last adjustment
    },
    hashrate: {
      currentHashrate: number,       // in raw form (e.g., 600e18)
      currentDifficulty: number
    },
    fear_greed: {
      data: Array<{
        value: string,               // numeric string "0"-"100"
        value_classification: string // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
      }>
    }
  },
  fees: {
    normal: number       // sat/vB for normal priority
  }
}
```

**Example:**
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

## Computed Stats Object

The component transforms input data into a `stats` object used for rendering:

```javascript
{
  // Price
  price: number | null,                    // BTC/USD
  priceSource: "binance" | "coingecko_fallback" | null,
  satsPerDollar: number | null,           // 100_000_000 / price

  // Mempool/Network
  avgTxFee: number | null,                // sat/vB
  blockHeight: number | null,
  hashRateEh: number | null,              // hash rate in EH/s
  difficultyT: number | null,             // difficulty in Terahashes

  // Supply
  circulatingSupply: number | null,       // calculated from block height

  // Difficulty Adjustment
  nextDifficultyEtaBlocks: number | null, // blocks remaining
  difficultyProgress: number | null,      // 0-100 %
  diffChangeNext: number | null,          // predicted % change
  diffChangePrev: number | null,          // previous % change

  // Fear & Greed
  fearGreedValue: number | null,          // 0-100
  fearGreedClass: string | null,          // "Extreme Fear", etc
  fearGreedHistory: Array<{ v: number }>  // 7+ days of daily values
}
```

## Data Transformations

### Bitcoin Supply Calculation

```javascript
function calculateBitcoinSupply(blockHeight) {
  const BLOCKS_PER_HALVING = 210_000;
  let reward = 50;           // Initial reward: 50 BTC per block
  let supply = 0;
  let remaining = blockHeight;

  while (remaining > 0) {
    const era = Math.min(remaining, BLOCKS_PER_HALVING);
    supply += era * reward;
    remaining -= era;
    reward /= 2;              // Halve reward every 210k blocks
    if (reward < 1e-8) break; // Stop at satoshi precision
  }

  return Math.floor(supply);
}
```

**Examples:**
- Block 0: ~0 BTC
- Block 210,000: 10,500,000 BTC
- Block 420,000: 15,750,000 BTC
- Block 840,000: 20,999,999 BTC
- Block 850,000: ~21,000,000 BTC (current)

### Sats Per Dollar

```javascript
satsPerDollar = Math.round(100_000_000 / price)

// Example: If price = $45,000
// satsPerDollar = 100,000,000 / 45,000 ≈ 2,222 sats
```

### Hash Rate Conversion

```javascript
// API provides raw hash rate (e.g., 620e18)
// Component shows in EH/s (exahashes per second)
hashRateEh = hashrate / 1e18

// Example: 620000000000000000 / 1e18 = 620 EH/s
```

### Difficulty Conversion

```javascript
// API provides raw difficulty (e.g., 88271e12)
// Component shows in Terahashes (T)
difficultyT = difficulty / 1e12

// Example: 88271000000000 / 1e12 = 88.271 T
```

### Fear & Greed Sparkline

```javascript
// Convert API data to sparkline format
fearGreedHistory = fng.data
  .map(d => ({ v: Number(d.value) }))
  .reverse()  // Oldest first

// Result: [
//   { v: 35 },  // 7 days ago
//   { v: 38 },  // 6 days ago
//   ...
//   { v: 42 }   // Today
// ]
```

## Null Handling

All metrics start as `null` and populate when data arrives:

```javascript
const defaultStats = {
  price: null,
  satsPerDollar: null,
  avgTxFee: null,
  blockHeight: null,
  hashRateEh: null,
  difficultyT: null,
  circulatingSupply: null,
  nextDifficultyEtaBlocks: null,
  difficultyProgress: null,
  diffChangeNext: null,
  diffChangePrev: null,
  fearGreedValue: null,
  fearGreedClass: null,
  fearGreedHistory: [],
};
```

When value is `null`, the Tile component shows a skeleton loader instead of the value.

## Error Recovery

- `keepPreviousOnError: true` - Component retains previous value if fetch fails
- Failed fetch attempts don't clear the display; last known value persists
- User sees stale data rather than empty/null state

## Refresh Strategy

- **Spot price:** Refreshes every 30 seconds (30,000 ms)
- **Mempool data:** Refreshes every 30 seconds (30,000 ms)
- Both fetch independently; UI updates when either resolves
- Uses `AbortController` to cancel stale requests before component unmounts
