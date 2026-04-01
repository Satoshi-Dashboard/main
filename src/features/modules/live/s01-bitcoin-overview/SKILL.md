---
code: S01
title: Bitcoin Overview
description: Current Bitcoin price, market cap, network stats, and fear & greed index
category: live
status: published
providers:
  - Binance
  - mempool.space
  - Alternative.me
refreshSeconds: 30
---

# Bitcoin Overview (S01)

## Description

The Bitcoin Overview module displays essential Bitcoin network metrics and market data in a comprehensive dashboard layout. It shows:

- **BTC/USD Price** - Current Bitcoin price from Binance or CoinGecko (fallback)
- **Sats Per Dollar** - Satoshi equivalent of 1 USD
- **Average TX Fee** - Current network transaction fee in sat/vB
- **Block Height** - Latest block number
- **Hash Rate** - Current network hash rate in EH/s
- **Network Difficulty** - Current difficulty with progress to next adjustment
- **Circulating Supply** - Calculated Bitcoin supply based on protocol
- **Fear & Greed Index** - Fear & Greed Index value with 7-day sparkline
- **Difficulty Adjustment** - Progress toward next difficulty retargeting with predicted % change

## Data Sources

### Price Data (BTC/USD)
- **Primary:** Binance API
- **Fallback:** CoinGecko API
- **Refresh Rate:** 30 seconds
- **Endpoint:** `/api/btc/rates`

### Network Data
- **Source:** mempool.space API
- **Includes:** Block height, hash rate, difficulty, transaction fees
- **Refresh Rate:** 30 seconds
- **Endpoint:** `/api/public/mempool/overview`

### Fear & Greed Index
- **Source:** Alternative.me API
- **Refresh Rate:** 30 seconds (included in mempool overview bundle)
- **History:** 7-day sparkline of daily values

## Component Structure

### Main Component: S01_BitcoinOverview()

The module uses a responsive grid layout that adapts to screen size:
- **Mobile (1 col):** Single column with 9 tiles stacked vertically
- **Tablet (2 cols):** Two-column grid
- **Desktop (3 cols):** Three-column grid (max)

### Sub-Components

#### Tile({ label, value, variant, decimals, suffix, accent, source })
Generic stat tile for displaying metrics.

**Props:**
- `label` (string): Metric name (e.g., "BTC/USD", "SATS PER DOLLAR")
- `value` (number|null): Numeric value to display
- `variant` (string): Display format - "number", "usd", "hashrate", "percent"
- `decimals` (number): Number of decimal places
- `suffix` (string): Text appended to value
- `accent` (string): Small supplementary text (e.g., "∞/21M")
- `source` (string): Data source label (e.g., "BINANCE", "COINGECKO")

**Styling:**
- Background: #111111
- Text color: white
- Brand accent: UI_COLORS.brand
- Height: 108px (responsive)
- Uses AnimatedMetric for smooth number transitions

#### FearGreedTile({ value, classification, history })
Specialized tile for Fear & Greed Index with sparkline chart.

**Props:**
- `value` (number|null): Current fear & greed value (0-100)
- `classification` (string): e.g., "Extreme Fear", "Greed"
- `history` (array): Array of daily values for sparkline `[{v: number}, ...]`

**Color Mapping:**
- 75+: UI_COLORS.positive (green)
- 56-74: UI_COLORS.positive (green)
- 45-55: UI_COLORS.warning (orange)
- 25-44: #FF6B35 (orange-red)
- <25: UI_COLORS.negative (red)

#### DifficultyTile({ pct, etaBlocks, changeNext, changePrev })
Specialized tile for difficulty adjustment with mini donut chart.

**Props:**
- `pct` (number|null): Progress to next difficulty adjustment (0-100)
- `etaBlocks` (number|null): Blocks remaining until adjustment
- `changeNext` (number|null): Predicted % change for next adjustment
- `changePrev` (number|null): % change from previous adjustment

**Responsive Layout:**
- Desktop: Side-by-side (donut + stats)
- Mobile: Stacked (donut center, stats below)

### Data Transformations

#### calculateBitcoinSupply(blockHeight)
Calculates circulating Bitcoin supply based on protocol:
- Assumes block reward halving every 210,000 blocks
- Initial reward: 50 BTC
- Returns floor value (whole satoshis)

#### buildSparklinePaths(values, width, height, padding)
Generates SVG path data for Fear & Greed sparkline chart:
- Normalizes values to canvas height
- Returns `{ line, area, width, height }`
- Used in `<path>` elements for both line and filled area

#### fngColor(v)
Maps fear & greed value to color hex code based on classification ranges.

## Usage for Agents

### Creating a Similar Module

To create a new module based on this pattern:

1. **Copy folder structure:**
   ```
   src/features/modules/live/s##-slug-name/
   ├── module.json
   ├── SKILL.md (this file)
   ├── index.jsx
   └── references/
       ├── DATA_SCHEMA.md
       ├── API_ENDPOINTS.md
       ├── PROPS.md
       └── EXAMPLES.md
   ```

2. **Create module.json** with your metadata (code, title, providers, refresh rate)

3. **Create SKILL.md** documenting data sources and component structure

4. **Implement index.jsx** exporting default component

5. **Create references/** documentation for AI agents

### Key Patterns Used

**Data Fetching with useModuleData Hook:**
```javascript
const { data, loading, error, refetch } = useModuleData(fetchFn, {
  refreshMs: 30000,
  initialData: null,
  keepPreviousOnError: true,
  transform: (raw) => processData(raw)
});
```

**Responsive Grid Layout:**
```jsx
<ModuleShell layout="none" className="lg:overflow-y-auto">
  <div className="grid h-full w-full grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 divide-x divide-y">
    {/* Tiles */}
  </div>
</ModuleShell>
```

**Animated Metrics:**
```jsx
<AnimatedMetric
  value={value}
  variant="usd"
  decimals={2}
  inline
/>
```

## Styling & Theming

- **Container background:** #111111 (dark gray)
- **Text color:** white (#ffffff)
- **Brand accent:** UI_COLORS.brand (cyan/blue)
- **Positive:** UI_COLORS.positive (green)
- **Negative:** UI_COLORS.negative (red)
- **Warning:** UI_COLORS.warning (orange)
- **Dividers:** #2a2a2a (1px)

**CSS Classes Used:**
- `grid` - Main layout grid
- `divide-x divide-y` - Grid dividers
- `select-none` - Prevent text selection on tiles
- `skeleton` - Loading placeholders
- `visual-svg-surface` - SVG styling
- `visual-chart-surface` - Chart container styling
- `tabular-nums` - Monospace font for numbers
- `tracking-widest` - Letter spacing for labels

## Related Modules

- **S02:** Bitcoin Price Chart (Live)
- **S03:** Multi-Currency
- **S08:** Lightning Network Stats
- **S15:** Global Assets Comparison

## API Contracts

### GET /api/btc/rates
```json
{
  "usd": 45000.50,
  "source": "binance"
}
```

### GET /api/public/mempool/overview
```json
{
  "overview": {
    "block_height": 850000,
    "difficulty": {
      "currentDifficulty": 88000000000000,
      "remainingBlocks": 15000,
      "progressPercent": 75.5,
      "difficultyChange": 2.5,
      "previousRetarget": 1.2
    },
    "hashrate": {
      "currentHashrate": 600000000000000000,
      "currentDifficulty": 88000000000000
    },
    "fear_greed": {
      "data": [
        { "value": "42", "value_classification": "Fear" },
        { "value": "45", "value_classification": "Fear" }
      ]
    }
  },
  "fees": {
    "normal": 25.5
  }
}
```

## Notes

- All price values are in USD
- Hash rate is in EH/s (Exahashes per second)
- Difficulty is in Terahashes (T)
- Sats per dollar uses standard 100,000,000 sats = 1 BTC
- Fear & Greed values are 0-100 scale
- Difficulty adjustment progress shown as 0-100%
