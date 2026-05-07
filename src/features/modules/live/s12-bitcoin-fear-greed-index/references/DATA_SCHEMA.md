# S11 — Fear & Greed Index: Data Schema

## API Response Schema

### Raw API Response (`/api/public/fear-greed?limit=31`)

```typescript
interface FearGreedResponse {
  data: {
    name: string;                  // "Fear and Greed Index"
    data: FearGreedEntry[];        // Array of daily entries, newest first
    metadata: {
      error: string | null;
    };
  };
}

interface FearGreedEntry {
  value: string;                   // "0"–"100" as string
  value_classification: string;    // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: string;               // Unix timestamp as string (seconds)
  time_until_update?: string;      // Seconds until next update (only on latest entry)
}
```

## Component State Schema

### `EMPTY_DATA` / `data` state

```typescript
interface FearGreedData {
  value: number | null;             // Current index value (0–100)
  yesterday: number | null;         // Value 1 day ago
  sevenDaysAgo: number | null;      // Value 7 days ago
  thirtyDaysAgo: number | null;     // Value 30 days ago
  classification: string | null;    // Current zone label
}
```

## Segment Definitions

```typescript
interface Segment {
  from: number;     // Inclusive lower bound (0, 25, 45, 55, 75)
  to: number;       // Exclusive upper bound (25, 45, 55, 75, 100)
  color: string;    // CSS color value or CSS variable
  label: string;    // "EXTREME FEAR" | "FEAR" | "NEUTRAL" | "GREED" | "EXTREME GREED"
}

const SEGMENTS: Segment[] = [
  { from: 0,  to: 25,  color: 'var(--accent-red)',     label: 'EXTREME FEAR'  },
  { from: 25, to: 45,  color: '#e05600',               label: 'FEAR'          },
  { from: 45, to: 55,  color: 'var(--accent-warning)', label: 'NEUTRAL'       },
  { from: 55, to: 75,  color: '#56c45a',               label: 'GREED'         },
  { from: 75, to: 100, color: 'var(--accent-green)',   label: 'EXTREME GREED' },
];
```

## Derived Values

| Variable     | Formula                                           | Type             |
|--------------|---------------------------------------------------|------------------|
| `hasMain`    | `Number.isFinite(value)`                          | boolean          |
| `cls`        | `classify(value)` → matching Segment              | Segment          |
| `pct`        | `((value - yesterday) / yesterday) * 100`         | number or null   |
| `pctLabel`   | Formatted string: `"+2.94%"` or `"-1.23%"`       | string or null   |
| `needleRad`  | `Math.PI - (value / 100) * Math.PI`               | number (radians) |

## SVG Coordinate System

The gauge is a top-half semicircle. Value 0 is at angle `Math.PI` (left), value 100 is at angle `0` (right).

```typescript
// Convert 0–100 scale value to SVG angle (radians)
const toRad = (v: number) => Math.PI - (v / 100) * Math.PI;

// Convert angle to SVG x,y coordinates on the arc
const x = cx + r * Math.cos(rad);
const y = cy - r * Math.sin(rad);  // SVG Y-axis is inverted
```
