# S18 Data Schema

## Waypoint

Raw data point from `useBinanceHistoricalBTC`

```ts
interface Waypoint {
  ts: number;     // Unix milliseconds
  price: number;  // BTC price in USD (> 0 required)
}
```

## Circle (Rendered Dot)

Computed from each waypoint for SVG rendering

```ts
interface Circle {
  idx: number;       // Index in waypoints array
  x: number;         // SVG x coordinate (Cartesian from polar)
  y: number;         // SVG y coordinate (Cartesian from polar)
  price: number;     // BTC price in USD
  ts: number;        // Unix milliseconds
  color: string;     // CSS rgb() string from cycleColor(t)
  dotSize: number;   // SVG circle radius (2–5, scales with price)
  t: number;         // Cycle progress 0.0–1.0
  angle: number;     // Polar angle in radians
  radius: number;    // Polar radius in pixels
}
```

### Dot Size Rules

| Price | dotSize |
|---|---|
| > $50,000 | 5 |
| > $1,000 | 3.5 |
| > $100 | 3 |
| else | 2 |

## Cycle Info

Output of `cycleInfo(fractionalYear)`

```ts
interface CycleInfo {
  t: number;          // Progress 0.0–1.0 within current halving cycle
  cycleStart: number; // Start year of current cycle (decimal)
  cycleEnd: number;   // End year of current cycle (decimal)
  cycleIndex: number; // 0=2012, 1=2016, 2=2020, 3=2024
}
```

## Tooltip Data (Hover State)

```ts
interface HoveredWaypoint {
  idx: number;
  price: number;
  date: string;            // Formatted: "MM/DD/YYYY"
  cycleProgress: number;   // t value (0–1)
  phaseLabel: string;      // From getCyclePhaseLabel(t)
}
```

## Today Marker

Computed from `mountTime` (Date.now() captured at component creation)

```ts
interface TodayMarker {
  todayX: number;    // SVG x coordinate
  todayY: number;    // SVG y coordinate
  todayDate: string; // Formatted: "Mon DD" (e.g., "Mar 28")
}
```

## Responsive Dimensions

```ts
interface SpiralDimensions {
  VW: number;  // SVG viewBox width
  VH: number;  // SVG viewBox height
  CX: number;  // Spiral center X
  CY: number;  // Spiral center Y
  R_MIN: number; // Minimum spiral radius (price floor)
  R_MAX: number; // Maximum spiral radius (price ceiling)
}
```
