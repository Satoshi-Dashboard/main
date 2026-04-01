# Component Props & Interfaces - S28 BTC Dominance

## Main Component

### S28_BTCDominance(props)

**Props:**
```typescript
interface S28Props {
  // No external props — fully self-contained with static data
}
```

**Usage:**
```jsx
<S28_BTCDominance />
```

**Notes:**
- Component is rendered within `ModuleShell` by ModulePage
- All state is internal: hover tracking, SVG mouse position
- No `onOpenDonate` prop (not present in this module)
- Static data only — no async data fetching in current implementation

---

## Internal State

```typescript
const [hover, setHover] = useState<AnnualReturn | null>(null);
const svgRef = useRef<SVGSVGElement>(null);
```

Where `AnnualReturn`:
```typescript
interface AnnualReturn {
  year: number;
  pct: number;
  live?: boolean;
}
```

---

## Event Handlers

### handleMouseMove(e: MouseEvent)

Converts SVG-space X coordinate to bar index:
```javascript
const svgX = (e.clientX - rect.left) * (VW / rect.width);
const idx  = Math.floor((svgX - ML) / BAR_SLOT);
```
Sets `hover` to the corresponding `ANNUAL_RETURNS[idx]` entry, or `null` if out of range.

### handleMouseLeave()

Clears `hover` to `null`.

---

## Layout Constants

```typescript
// SVG dimensions
const VW = 900, VH = 500;        // viewBox
const ML = 62, MR = 16, MT = 38, MB = 38; // margins

// Bar geometry
const BAR_COUNT = ANNUAL_RETURNS.length;   // 15
const BAR_SLOT  = CW / BAR_COUNT;          // pixels per year slot
const BAR_W     = BAR_SLOT * 0.60;         // bar fill within slot
```

---

## Right Panel Components (inline JSX)

### Best Months Panel

```typescript
interface MonthEntry {
  label: string;  // e.g., "November 2013"
  pct: number;    // positive value e.g., 450.0
}
```

Renders each month as:
- Label text (dimmed)
- Percentage formatted as `+{pct.toFixed(1)}%` in green (#00D897)

### Worst Months Panel

Same shape as Best Months but `pct` is negative; renders in red (#FF4757).

### Key Statistics Panel

```typescript
interface KeyStat {
  label: string;  // e.g., "Max Drawdown"
  value: string;  // e.g., "-84.2%"
  color: string;  // hex color for value text
}
```

---

## Shared Components/Hooks Used

None — this module is fully self-contained (no shared hooks or AnimatedMetric).

## CSS Variables Used

- `var(--fs-micro)`: Smallest font size token
- `var(--fs-caption)`: Caption/small text font size
- `var(--fs-title)`: Large heading font size

## Color Reference

| Usage              | Value     |
|--------------------|-----------|
| Positive bar       | `#00D897` |
| Negative bar       | `#FF4757` |
| Hover positive     | `#00ffb0` |
| Hover negative     | `#ff6b7a` |
| Bitcoin orange     | `#F7931A` |
| Axis / grid lines  | `#2a2a2a` |
| Label text         | `#444`    |
| Dimmed label       | `#555`    |
| Box background     | `#161616` |
| Zero line          | `#3a3a3a` |
