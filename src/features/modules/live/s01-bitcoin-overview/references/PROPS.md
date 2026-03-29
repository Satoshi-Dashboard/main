# Component Props & Interfaces - S01 Bitcoin Overview

## Main Component

### S01_BitcoinOverview(props)

**Props:**
```typescript
interface S01Props {
  onOpenDonate?: () => void;
}
```

**Usage:**
```jsx
<S01_BitcoinOverview onOpenDonate={() => setDonateOpen(true)} />
```

**Notes:**
- Component is rendered within `ModuleShell` by ModulePage
- `onOpenDonate` is optional; component functions without it
- Component receives no other props; all state is internal

---

## Sub-Component Props

### Tile

**Props:**
```typescript
interface TileProps {
  label: string;              // Metric name: "BTC/USD", "SATS PER DOLLAR", etc
  value: number | null;       // Numeric value to display
  variant?: string;           // Display format: "number" | "usd" | "hashrate" | "percent"
  decimals?: number;          // Decimal places to show
  suffix?: string;            // Text appended to value (e.g., " T", " blocks remaining")
  accent?: string;            // Small supplementary text (e.g., "∞/21M")
  source?: string;            // Data source label (e.g., "BINANCE", "COINGECKO")
}
```

**Variants:**
- `"number"` - Default, just numbers with AnimatedMetric formatting
- `"usd"` - Currency format with $ prefix
- `"hashrate"` - Shows in EH/s with hash symbol
- `"percent"` - Shows with % suffix and decimals

**Example Usage:**
```jsx
<Tile
  label="BTC/USD"
  value={45250.75}
  variant="usd"
  source="BINANCE"
/>

<Tile
  label="CIRCULATING SUPPLY"
  value={21000000}
  accent="∞/21M"
/>

<Tile
  label="AVG TX FEE (sat/vB)"
  value={25.5}
  decimals={2}
/>
```

**Rendering Logic:**
- If `value === null` → shows skeleton loader
- If `value !== null` → shows `<AnimatedMetric>` with props
- Suffix and accent are displayed with smaller font sizes
- Source label appears at bottom with dimmed text

**Styling:**
- Height: `min-h-[108px]`
- Background: `bg-[#111111]`
- Text: white, monospace font for values
- Responsive padding: `px-3 sm:px-4` vertical

---

### FearGreedTile

**Props:**
```typescript
interface FearGreedTileProps {
  value: number | null;           // 0-100 fear & greed value
  classification: string | null;  // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  history: Array<{v: number}>;   // Array of daily values for sparkline
}
```

**Example Usage:**
```jsx
<FearGreedTile
  value={42}
  classification="Fear"
  history={[
    { v: 35 },
    { v: 38 },
    { v: 40 },
    { v: 42 }
  ]}
/>
```

**Rendering:**
- Main value displayed as large number with dynamic color based on classification
- Classification text (e.g., "Fear") displayed below value
- Sparkline chart shows 7+ days of historical values
- Sparkline colors match current value classification

**Sparkline Details:**
- Width: 220px, Height: 44px (with padding)
- Shows area fill under line
- Line color matches current fear & greed classification
- Gradient fill (color to transparent)

**Color Mapping:**
```javascript
function fngColor(v) {
  if (v >= 75) return UI_COLORS.positive;      // Green
  if (v >= 56) return UI_COLORS.positive;      // Green
  if (v >= 45) return UI_COLORS.warning;       // Orange
  if (v >= 25) return '#FF6B35';               // Orange-red
  return UI_COLORS.negative;                    // Red
}
```

---

### DifficultyTile

**Props:**
```typescript
interface DifficultyTileProps {
  pct: number | null;            // 0-100 progress to next adjustment
  etaBlocks: number | null;      // Blocks remaining until adjustment
  changeNext: number | null;     // Predicted % change for next adjustment
  changePrev: number | null;     // % change from previous adjustment
}
```

**Example Usage:**
```jsx
<DifficultyTile
  pct={73.21}
  etaBlocks={14678}
  changeNext={2.34}
  changePrev={1.12}
/>
```

**Rendering (Desktop Layout):**
- Left side: Previous/Next adjustment % changes
- Right side: Mini donut chart showing pct progress
- Center: Large percentage display
- Bottom: Label "DIFFICULTY ADJ." and blocks remaining

**Rendering (Mobile Layout):**
- Donut chart centered at top with percentage overlay
- Previous/Next changes displayed as small badges below
- Label and blocks remaining at bottom

**Mini Donut Chart:**
- Radius: 38px
- SVG 96x96 viewBox
- Background stroke: #2a2a2a
- Progress stroke: UI_COLORS.brand (cyan)
- Stroke width: 9px
- Rotated -90° to start at top

**Color Indicators:**
- Change ≥ 0: UI_COLORS.positive (green) + "▲"
- Change < 0: UI_COLORS.negative (red) + "▼"

---

## Helper Components

### MiniDonut

**Props:**
```typescript
interface MiniDonutProps {
  pct: number | null;        // 0-100 progress
  className?: string;        // Additional CSS classes
}
```

**Internal SVG:**
- 96x96 viewBox
- Circles at center (48, 48), radius 38
- Background (unfilled gray stroke)
- Progress (colored stroke with stroke-dasharray)
- Rotated -90° to start at top

**Example:**
```jsx
<MiniDonut pct={73.21} className="h-24 w-24" />
```

---

## Shared Components/Hooks Used

### AnimatedMetric

**From:** `src/shared/components/common/AnimatedMetric.jsx`

**Props:**
```typescript
interface AnimatedMetricProps {
  value: number;
  variant?: "number" | "usd" | "hashrate" | "percent";
  decimals?: number;
  suffix?: string;
  signed?: boolean;
  inline?: boolean;
  className?: string;
  style?: CSSProperties;
}
```

**Behavior:**
- Smoothly animates from previous value to new value
- Handles number formatting based on variant
- Applies locale formatting for readability

---

### useModuleData Hook

**From:** `src/shared/hooks/useModuleData.js`

**Props:**
```typescript
interface UseModuleDataOptions {
  refreshMs?: number;           // 30000 = 30 seconds
  initialData?: any;            // null or default value
  keepPreviousOnError?: boolean; // true = show stale data on error
  transform?: (raw: any) => any; // Optional data transformation
}
```

**Return:**
```typescript
interface ModuleDataResult {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}
```

---

### ModuleShell

**From:** `src/shared/components/module/ModuleShell.jsx`

**Props:**
```typescript
interface ModuleShellProps {
  layout?: "flex-col" | "flex-row" | "none";
  bg?: string;                  // Background color hex
  overflow?: "visible" | "hidden" | "auto";
  className?: string;
  children?: ReactNode;
}
```

**In S01:** Used without layout specified (maintains full height)

---

## Constants & Utilities

### UI_COLORS

**From:** `src/shared/constants/colors.js`

**Used in S01:**
- `UI_COLORS.brand` - Cyan/blue accent color for labels
- `UI_COLORS.positive` - Green for positive indicators
- `UI_COLORS.negative` - Red for negative indicators
- `UI_COLORS.warning` - Orange for warning states
- `UI_COLORS.textPrimary` - Primary text color
- `UI_COLORS.textTertiary` - Dimmed secondary text

---

## Type Definitions for Agents

When creating a new module based on this pattern:

```typescript
// Standard module props (all modules receive these)
interface ModuleBaseProps {
  onOpenDonate?: () => void;
}

// Data structure from API
interface APIResponse<T> {
  // Your API shape
}

// Internal state/stats
interface ModuleStats {
  // Your derived stats
}

// Tile configuration for grid rendering
interface TileConfig {
  label: string;
  value: number | null;
  variant?: string;
  decimals?: number;
  suffix?: string;
  accent?: string;
  source?: string;
}
```
