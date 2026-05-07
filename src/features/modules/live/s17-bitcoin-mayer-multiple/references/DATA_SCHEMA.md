# S16 Data Schema

## BTC Daily Candle

Source: `fetchBtcHistory` / Binance OHLCV API

```ts
interface BtcCandle {
  ts: number;       // Unix milliseconds (open time)
  open: number;     // Opening price in USD
  high: number;     // High price in USD
  low: number;      // Low price in USD
  close: number;    // Closing price in USD (used as "price")
  volume: number;   // 24h volume in BTC
}
```

## Mayer Series Point

Output of `calcularMayerMultiple(candles)` from `@/shared/utils/mayerMultiple.js`

```ts
interface MayerPoint {
  ts: number;           // Unix milliseconds
  price: number;        // BTC closing price
  sma200: number;       // 200-day SMA at this timestamp
  mayerMultiple: number; // price / sma200
  tooltipLabel: string;  // Formatted date string for tooltip display
}
```

Only points with index >= 199 (enough history for SMA-200) have valid `mayerMultiple`.

## Current Snapshot

Output of `buildCurrentMayerSnapshot(mayerSeries, liveSpot)`

```ts
interface MayerSnapshot {
  currentMayerMultiple: number | null;  // Latest computed value
  currentPrice: number | null;          // Live BTC spot or latest close
  sma200: number | null;                // Latest SMA-200
  state: MayerState;                    // Derived valuation state
}
```

## Mayer State

Output of `getMayerState(mayerMultiple)`

```ts
interface MayerState {
  key: 'overvalued' | 'neutral' | 'undervalued';
  color: string;   // CSS color string
  label: string;   // Human-readable label
}
```

| Multiple | Key | Color |
|---|---|---|
| > 2.40 | `overvalued` | `var(--accent-red)` |
| 1.00–2.40 | `neutral` | `var(--accent-warning)` |
| < 1.00 | `undervalued` | `var(--accent-green)` |

## Range Change

Output of `buildRangeChange(currentMultiple, chartData)`

```ts
interface RangeChange {
  absolute: number;  // End - start Mayer Multiple value
  percent: number;   // % change over the selected range
}
```

## Chart Data Point (Recharts)

```ts
interface ChartPoint extends MayerPoint {
  // Same fields as MayerPoint, filtered by selected range (3M/1Y/5Y)
  // Only points with valid mayerMultiple are included
}
```
