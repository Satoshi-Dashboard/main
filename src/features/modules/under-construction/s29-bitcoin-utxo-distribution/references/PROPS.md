# Component Props & Interfaces - S29 UTXO Distribution

## Main Component

### S29_UTXODistribution(props)

**Props:**
```typescript
interface S29Props {
  onOpenDonate?: () => void;
}
```

**Usage:**
```jsx
<S29_UTXODistribution onOpenDonate={() => setDonateOpen(true)} />
```

**Notes:**
- `onOpenDonate` is optional; component renders without it
- All data is statically defined — no async fetch currently

---

## Sub-Component Props

### CustomTooltip (internal, Recharts)

```typescript
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;   // age range label matching ageData[].range
}
```

**Renders:**
- Orange range label heading
- UTXO count via `fmt.compactNum()`
- Satoshi value via `fmt.compact()` (if band found)

**Example output:**
```
1m–6m
UTXOs: 45.7M
Value: 18.7B
```

---

## Breakdown Panel Row (inline, no named component)

Each row renders:

```typescript
interface BreakdownRow {
  range: string;   // Age band label
  utxos: number;   // UTXO count
  value: number;   // Satoshi value
  pct: number;     // Percentage of total UTXOs (computed)
  color: string;   // barColor(utxos) result
}
```

---

## Shared Components/Hooks Used

### useModuleData (not yet wired — static data only)

When live data is connected:
```typescript
interface UseModuleDataOptions {
  refreshMs: number;
  initialData: any;
  keepPreviousOnError: boolean;
}
```

### Recharts Components

```typescript
// All from 'recharts'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
```

### Lucide Icons

- `Layers` — header icon (orange)
- `QrCode` — donate button icon

---

## Layout Breakpoints

| Breakpoint | Chart Panel          | Breakdown Panel      |
|------------|----------------------|----------------------|
| Mobile     | Full width, 208px h  | Full width, below    |
| Tablet     | Full width, 256px h  | Full width, below    |
| Desktop    | `flex-1` (fills)     | `lg:w-[300px]` fixed |

---

## Color Constants

| Usage                  | Value      |
|------------------------|------------|
| Header icon / value    | `#F7931A`  |
| High density bars      | `#F7931A`  |
| Mid-high density       | `#E07A10`  |
| Mid-low density        | `#C86808`  |
| Low density            | `#A05000`  |
| Border dividers        | `white/7%` |
| Row background         | `white/2%` |
| Tooltip border         | `#F7931A/30%` |
| Tooltip background     | `#12121A`  |
