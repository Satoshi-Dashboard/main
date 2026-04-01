# S17 Component Props

## S17_PricePerformance (default export)

No external props. Self-contained module.

**Internal state:**

| State | Type | Default | Description |
|---|---|---|---|
| `hoverData` | `HoverData \| null` | `null` | Data at crosshair position |

---

## Sub-Component Props

### ChartSection (memo)

Renders the lightweight-charts dual-line chart.

| Prop | Type | Description |
|---|---|---|
| `points` | `HousePricePoint[]` | Full array of historical data points |
| `onHoverChange` | `(data: HoverData \| null) => void` | Called on crosshair move; null when cursor leaves |

**Internal behavior:**
- Creates chart on mount, destroys on unmount
- Subscribes to `chart.subscribeCrosshairMove` for hover updates
- Implements manual touch event handling for mobile scrubbing
- Uses `labelMap` (Map from Unix seconds → date string) for O(1) date lookup during hover

### LegendPill

Simple colored dot + label component.

| Prop | Type | Description |
|---|---|---|
| `color` | `string` | CSS color (hex/rgb) for the dot |
| `label` | `string` | Text label next to the dot |

### SkeletonChart

No props. Renders animated skeleton bars while `loading` is true.

Consists of 48 bars with heights following a sine wave pattern and `s17-pulse` CSS animation.

---

## lightweight-charts Configuration

```js
// USD series (left scale):
{
  color: '#F7931A',
  lineWidth: 2.5,
  lineType: 2,          // Curved/smooth
  priceScaleId: 'left',
  priceFormat: { type: 'price', precision: 0, minMove: 1 }
}

// BTC series (right scale):
{
  color: '#FFD700',
  lineWidth: 2.5,
  lineType: 2,
  priceScaleId: 'right',
  priceFormat: { type: 'price', precision: 2, minMove: 0.01 }
}
```

Right scale uses `PriceScaleMode.Logarithmic` because BTC-denominated prices span multiple orders of magnitude.

---

## Responsive Behavior

`isResponsive` is computed once: `window.innerWidth < 1024`

When `true`, `AnimatedMetric` receives `disabled={true}` to prevent animation jank on mobile.
