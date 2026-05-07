# Component Props & Interfaces - S30 U.S. National Debt

## Main Component

### S30_USNationalDebt(props)

**Props:**
```typescript
interface S30Props {
  // No external props — self-contained with internal fetch and tick logic
}
```

**Usage:**
```jsx
<S30_USNationalDebt />
```

**Notes:**
- Component manages its own fetch cycle (`setInterval` at 60s)
- Component manages its own live tick (`setInterval` at 1s for `nowMs`)
- `openedAtRef.current` is set once on mount via `useRef(Date.now())`

---

## Sub-Component Props

### HeroFigure({ value, animate })

```typescript
interface HeroFigureProps {
  value: number;       // USD total debt (projected live value)
  animate?: boolean;   // default true — false on mobile to reduce jank
}
```

**Behavior:**
- Font size auto-scales based on digit count:
  - 15+ digits: `clamp(1.05rem, 5vw, 4.4rem)`
  - 14 digits: `clamp(1.12rem, 5.4vw, 4.8rem)`
  - default: `clamp(1.2rem, 5.8vw, 5.2rem)`
- Renders `<AnimatedMetric value={value} variant="usd" decimals={0} />`

---

### StatCard({ label, value, variant, helper, accent, featured, className, animate })

```typescript
interface StatCardProps {
  label: string;
  value: number | null;
  variant?: string;         // AnimatedMetric variant, default "number"
  helper?: string;          // Optional helper text below value
  accent?: string;          // CSS color for value text
  featured?: boolean;       // If true: bitcoin orange label, larger font
  className?: string;
  animate?: boolean;
}
```

**Used for:**
- DEBT PER PERSON (featured, col-span-1 on xl)
- DEBT HELD BY THE PUBLIC
- INTRAGOVERNMENTAL HOLDINGS

---

### RateCard({ label, value, toneColor, animate })

```typescript
interface RateCardProps {
  label: string;       // e.g., "PER SECOND", "PER YEAR"
  value: number;       // USD amount
  toneColor: string;   // CSS color from pressure tone system
  animate?: boolean;
}
```

**Renders:** Color dot + uppercase label, animated USD compact value, "Projected pace" sub-label

**Six rate cards:** PER SECOND, PER MINUTE, PER HOUR, PER DAY, PER MONTH, PER YEAR

---

### LoadingState()

No props. Renders skeleton grids matching the full component layout.

---

### ErrorState({ message, onRetry })

```typescript
interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}
```

**Renders:** AlertCircle icon, error message, Retry button.

---

## Hooks Used

### useMediaQuery(query)

```typescript
// From @/shared/hooks/useMediaQuery.js
const isPhoneViewport = useMediaQuery('(max-width: 639px)');
// Controls animateMetrics: disabled on phone to prevent performance issues
```

---

## Shared Services

### fetchUsNationalDebtPayload(options)

```typescript
// From @/shared/services/usNationalDebtApi.js
interface FetchOptions {
  force?: boolean;   // Bypass server cache
}
```

---

## CSS Variables Used

| Variable               | Purpose                               |
|------------------------|---------------------------------------|
| `--bg-primary`         | Container background                  |
| `--accent-bitcoin`     | Featured card label color             |
| `--accent-red`         | Pressure tone (debt rising)           |
| `--accent-green`       | Relief tone (debt falling)            |
| `--accent-warning`     | Fallback warning banner               |
| `--text-primary`       | Default text                          |
| `--text-secondary`     | Dimmed labels, helper text            |
| `--text-tertiary`      | Very dimmed metadata                  |
| `--fs-tag`             | Smallest label font size              |
| `--fs-micro`           | Micro text (helper, metadata)         |
| `--fs-body`            | Body text size                        |
| `--fs-caption`         | Caption size                          |
| `--fs-section`         | Section heading size                  |
