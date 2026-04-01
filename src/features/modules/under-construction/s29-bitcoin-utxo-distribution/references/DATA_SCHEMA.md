# Data Schema - S29 UTXO Distribution

## Static Data (Current Implementation)

### ageData Array

```javascript
const ageData = [
  { range: string, utxos: number, value: number }
]
```

**Example:**
```json
[
  { "range": "0–1d",  "utxos": 12340000,  "value": 5600000000  },
  { "range": "1d–1w", "utxos": 23450000,  "value": 8900000000  },
  { "range": "1w–1m", "utxos": 34560000,  "value": 12300000000 },
  { "range": "1m–6m", "utxos": 45670000,  "value": 18700000000 },
  { "range": "6m–1y", "utxos": 23456000,  "value": 14200000000 },
  { "range": "1y–2y", "utxos": 19234000,  "value": 12800000000 },
  { "range": "2y–5y", "utxos": 18765000,  "value": 14500000000 },
  { "range": "5y+",   "utxos": 7890000,   "value": 8500000000  }
]
```

- `range`: Age band label string
- `utxos`: Count of UTXOs in this age band
- `value`: Total satoshi value (in sats) of UTXOs in this band

---

## Computed Statistics

These are computed at module initialization from `ageData`:

```javascript
const totalUTXOs   = ageData.reduce((sum, d) => sum + d.utxos, 0);
const totalValue   = ageData.reduce((sum, d) => sum + d.value, 0);
const avgUTXOValue = totalValue / totalUTXOs;
const maxUTXOs     = Math.max(...ageData.map(d => d.utxos));
```

| Variable       | Type   | Example Value   | Description                              |
|----------------|--------|-----------------|------------------------------------------|
| `totalUTXOs`   | number | ~185,315,000    | Sum of all UTXO counts                   |
| `totalValue`   | number | ~95,500,000,000 | Sum of all UTXO values (sats)            |
| `avgUTXOValue` | number | ~515            | Average USD value per UTXO               |
| `maxUTXOs`     | number | ~45,670,000     | Maximum count (for bar color scaling)    |

---

## Color Mapping: barColor(utxos)

```javascript
function barColor(utxos) {
  const ratio = utxos / maxUTXOs;
  if (ratio > 0.8)  return '#F7931A';  // Bitcoin orange (highest density)
  if (ratio > 0.5)  return '#E07A10';
  if (ratio > 0.25) return '#C86808';
  return '#A05000';                    // Darkest (lowest density)
}
```

Applied to both chart bars (`<Cell>`) and breakdown panel swatches.

---

## Recharts Data Format

The Recharts `BarChart` consumes `ageData` directly:

```javascript
<BarChart data={ageData}>
  <XAxis dataKey="range" />
  <YAxis tickFormatter={(v) => fmt.compactNum(v)} />
  <Bar dataKey="utxos">
    {ageData.map((entry) => (
      <Cell key={entry.range} fill={barColor(entry.utxos)} />
    ))}
  </Bar>
</BarChart>
```

---

## Custom Tooltip Data

```typescript
interface TooltipPayload {
  active: boolean;
  payload: Array<{ value: number }>;  // payload[0].value = utxos count
  label: string;                      // age range e.g., "1m–6m"
}
```

Tooltip also looks up the full band entry from `ageData` by matching `label` to `d.range`.

---

## Breakdown Panel Computation

Per-band percentage:
```javascript
const pct = (d.utxos / totalUTXOs) * 100;
```

Used to set the progress bar background width: `style={{ width: \`${pct}%\` }}`.

---

## Formatter Functions (from `@/shared/utils/formatters.js`)

- `fmt.compactNum(n)`: Compact number format — e.g., `45.7M`, `8B`
- `fmt.compact(n)`: Compact with currency hint for large satoshi values
