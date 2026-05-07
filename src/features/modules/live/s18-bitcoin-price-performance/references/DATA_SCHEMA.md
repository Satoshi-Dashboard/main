# S17 Data Schema

## House Price Payload

Full response from `GET /api/s17/house-price`

```ts
interface HousePricePayload {
  data: {
    points: HousePricePoint[];
    latest_value: number;    // Most recent FRED USD value
    quarter_label: string;   // E.g., "Q4 2024"
  };
}
```

## House Price Point

Individual time series data point

```ts
interface HousePricePoint {
  ts: number;         // Unix milliseconds (quarter start)
  usd: number;        // Median home price in USD
  homeInBtc: number;  // Median home price in BTC (historical conversion)
  date: string | null; // Quarter label, e.g., "Q1 2001"
}
```

## Hover Data

State set by chart crosshair interaction

```ts
interface HoverData {
  usd: number | null;        // USD price at hovered point
  homeInBtc: number | null;  // BTC price at hovered point
  date: string | null;       // Quarter label at hovered point
}
```

## Display Logic

```ts
// What is shown in the header:
displayUsd  = hoverData?.usd ?? payload?.data?.latest_value ?? null
displayBtc  = hoverData ? hoverData.homeInBtc : (liveHomeInBtc ?? latestPoint?.homeInBtc ?? null)

// Live BTC conversion (overrides historical for latest point only):
liveHomeInBtc = (btcSpot && payload?.data?.latest_value)
  ? payload.data.latest_value / btcSpot
  : null
```

## Delta Computation

```ts
// % change from first to last data point:
usdDeltaPct = ((latestPoint.usd - firstPt.usd) / firstPt.usd) * 100
btcDeltaPct = ((latestPoint.homeInBtc - firstPt.homeInBtc) / firstPt.homeInBtc) * 100
```

Note: `btcDeltaPct` is shown as positive (green) when the value falls (fewer BTC per home = Bitcoin appreciated).

## lightweight-charts Series Data

```ts
// USD series (left scale):
{ time: Math.floor(ts / 1000), value: usd }

// BTC series (right scale, log):
{ time: Math.floor(ts / 1000), value: homeInBtc }
```

`time` must be Unix seconds (not milliseconds) for lightweight-charts.
