# S15 — BTC vs Gold Chart: Data Schema

## API Response Schema

```typescript
interface BtcVsGoldResponse {
  data: {
    points: ChartPoint[];    // Full history array, oldest first
    latest?: ChartPoint;     // Most recent point (may be same as points.at(-1))
  };
  updated_at?: string;       // ISO 8601 timestamp
}

interface ChartPoint {
  ts: number;         // Unix timestamp in milliseconds
  date: string;       // Human-readable date string, e.g. "Apr 1, 2024"
  bitcoin: number;    // Bitcoin market cap in trillions USD
  gold: number;       // Gold market cap in trillions USD
  ratio: number;      // (bitcoin / gold) * 100 — BTC as % of gold market cap
}
```

## Component State Schema

```typescript
// From useModuleData:
payload: BtcVsGoldResponse | null
loading: boolean
error: Error | null

// Local state:
activeLabel: '3M' | '6M' | '1Y' | 'MAX'
hoverData: HoverPoint | null
showGold: boolean
```

### HoverPoint (crosshair data)

```typescript
interface HoverPoint {
  bitcoin: number;        // BTC market cap at hovered time
  gold: number | null;    // Gold market cap at hovered time (null if missing)
  date: string | null;    // Date string from labelMap
}
```

## Derived Values Schema

| Variable       | Type             | Formula                                                    |
|----------------|------------------|------------------------------------------------------------|
| `points`       | ChartPoint[]     | `payload?.data?.points ?? []`                              |
| `activeRange`  | Range            | `RANGES.find(r => r.label === activeLabel) ?? RANGES.at(-1)` |
| `chartData`    | ChartPoint[]     | Filtered subset of `points` for active range               |
| `hasChart`     | boolean          | `chartData.length > 1`                                     |
| `latestPoint`  | ChartPoint\|null | `chartData.at(-1)` or `payload?.data?.latest`              |
| `startPoint`   | ChartPoint\|null | `chartData[0]`                                             |
| `hoveredPoint` | ChartPoint\|null | `hoverData ?? latestPoint`                                 |
| `btcDelta`     | number\|null     | `latestPoint.bitcoin - startPoint.bitcoin`                 |
| `btcDeltaPct`  | number\|null     | `(btcDelta / startPoint.bitcoin) * 100`                    |
| `btcHigh`      | number\|null     | `Math.max(...chartData.map(p => p.bitcoin))`               |

## lightweight-charts Data Format

The chart library requires data in this format (converted from ChartPoint):

```typescript
interface LightweightChartsPoint {
  time: number;    // Unix timestamp in SECONDS (ts / 1000, floored)
  value: number;   // Market cap in trillions
}
```

## Label Map

Used to convert lightweight-charts timestamps back to human-readable dates on hover:

```typescript
// Map: unix-seconds → date string
const labelMap = new Map<number, string | null>();
chartData.forEach(point => {
  const time = Math.floor(Number(point.ts) / 1000);
  labelMap.set(time, point.date ?? null);
});
```

## Range Definitions

```typescript
interface Range {
  label: '3M' | '6M' | '1Y' | 'MAX';
  days: number;  // 90 | 180 | 365 | Infinity
}
```
