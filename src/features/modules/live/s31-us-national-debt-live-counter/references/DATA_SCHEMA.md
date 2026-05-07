# Data Schema - S30 U.S. National Debt

## API Response Shape

### fetchUsNationalDebtPayload() → payload

```typescript
interface DebtPayload {
  data: DebtModel;
  updated_at: string;       // ISO datetime
  is_fallback: boolean;
  fallback_note: string | null;
}

interface DebtModel {
  total_debt: number;                        // USD, e.g., 35_000_000_000_000
  rate_per_second: number;                   // USD/second, e.g., 42_000
  debt_per_person: number;                   // USD, e.g., 104_000
  debt_held_public: number;                  // USD
  intragovernmental_holdings: number;        // USD
  population: number;                        // e.g., 336_000_000
  official_record_date: string;              // "2024-12-15"
  interpolation_window_observations: number; // e.g., 90
  projection_base_at: string;                // ISO datetime
}
```

---

## Component State

```typescript
const [payload, setPayload] = useState<DebtPayload | null>(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState<string>('');
const [nowMs, setNowMs] = useState(() => Date.now());
```

---

## Derived / Computed Values

### projectedTotal

```javascript
const projectedTotal = useMemo(
  () => projectCurrencyValue(
    model.total_debt,
    model.rate_per_second,
    model.projection_base_at || payload.updated_at,
    nowMs
  ),
  [model.total_debt, model.rate_per_second, model.projection_base_at, nowMs, payload.updated_at]
);
```

- Updates every second via `nowMs` tick
- Shows in `<HeroFigure>` as the main display

### sinceOpenDelta

```javascript
const sinceOpenDelta = useMemo(
  () => projectSessionDelta(model.rate_per_second, openedAtRef.current, nowMs),
  [model.rate_per_second, nowMs]
);
```

- Running total since page open
- Used in "since you opened this page" badge

### projectedDebtPerPerson

```javascript
const projectedDebtPerPerson = useMemo(() => {
  const population = Number(model.population);
  if (!Number.isFinite(population) || population <= 0) return model.debt_per_person;
  return projectedTotal / population;
}, [model.debt_per_person, model.population, projectedTotal]);
```

- Updates every second (depends on `projectedTotal`)

### rateCards

```javascript
const rateCards = useMemo(() => buildUsDebtRateCards(model), [model]);
```

Returns array of 6 objects: per second, per minute, per hour, per day, per month, per year.

```typescript
interface RateCard {
  label: string;   // e.g., "PER SECOND"
  value: number;   // USD amount
}
```

---

## Pressure Tone System

```javascript
function getDebtPressureTone(ratePerSecond):  'pressure' | 'relief' | 'neutral'
```

| Rate           | Tone       | Color                       |
|----------------|------------|-----------------------------|
| > 0 (growing)  | pressure   | `var(--accent-red)` red      |
| < 0 (shrinking)| relief     | `var(--accent-green)` green  |
| 0 or null      | neutral    | `var(--text-secondary)`     |

---

## Format Utilities (from `@/shared/utils/usNationalDebt.js`)

| Function                      | Purpose                                      |
|-------------------------------|----------------------------------------------|
| `formatDateLabel(date)`       | Formats `official_record_date` for display   |
| `formatDateTimeLabel(dt)`     | Formats `updated_at` as relative label        |
| `formatNumberCompact(n)`      | e.g., "336M" for population display           |
| `buildUsDebtRateCards(model)` | Returns array of 6 rate card objects          |

---

## Null Handling

- All fields start `null` while `loading === true`
- `LoadingState` component renders skeleton placeholders during initial load
- `ErrorState` renders when `!model` and `!loading`
- `AnimatedMetric` handles `null`/`0` gracefully with no animation

---

## AnimatedMetric Variants Used

| Field                        | Variant        |
|------------------------------|----------------|
| `projectedTotal`             | `"usd"`        |
| `sinceOpenDelta`             | `"usdCompact"` (signed) |
| `model.rate_per_second`      | `"usd"`        |
| `projectedDebtPerPerson`     | `"usd"`        |
| `model.debt_held_public`     | `"usdCompact"` |
| `model.intragovernmental_holdings` | `"usdCompact"` |
| Rate cards                   | `"usdCompact"` (signed) |
