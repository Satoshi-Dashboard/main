---
code: S10
title: Stablecoin Peg
description: Stablecoin price tracking, peg health monitoring, and deviation analysis
category: live
status: published
providers:
  - CoinGecko
  - Chainlink
  - Binance
refreshSeconds: 60
---

# Stablecoin Peg (S10)

## Description

The Stablecoin Peg module monitors the price and peg health of major stablecoins (USDC, USDT, DAI, USDP, etc.) across multiple blockchains. It displays:

- **Stablecoin Prices:** Real-time prices across multiple chains (Ethereum, Polygon, Arbitrum, Optimism, etc.)
- **Peg Deviation Tracking:** How far each stablecoin deviates from $1.00 USD peg
- **Blockchain Distribution:** Stablecoin balance across different networks
- **Collateralization Metrics:** Reserve composition and adequacy for backed stablecoins
- **Historical Peg Data:** Charts showing peg stability over time
- **Risk Indicators:** Warnings when stablecoins deviate significantly from peg
- **Volume Analysis:** 24h trading volume by stablecoin and chain
- **Issuer Information:** Backing entity, type (algorithmic, collateralized, etc.)

## Data Sources

### Stablecoin Price Data
- **Source:** CoinGecko API (multi-chain price aggregation)
- **Endpoint:** `/api/public/stablecoins/prices`
- **Includes:** Current prices across all major blockchains
- **Granularity:** Per-chain prices (Ethereum, Polygon, etc.)
- **Refresh Rate:** 60 seconds

### Peg Deviation History
- **Source:** CoinGecko API with historical snapshots
- **Endpoint:** `/api/public/stablecoins/peg-history`
- **Query Params:** `timeframe` (1h, 24h, 7d, 30d)
- **Returns:** Historical deviation percentages
- **Granularity:** Minute-level for 24h, hourly for 7d+
- **Refresh Rate:** 300 seconds (5 minutes)

### Stablecoin Metadata
- **Source:** Issuer APIs + CoinGecko database
- **Contains:** Stablecoin name, issuer, chain support, collateralization
- **Categories:** Fiat-backed (USDC), Collateralized (DAI), Algorithmic (UST/USDD)
- **Refresh Rate:** Static (cached)

### Supply & Reserve Data
- **Source:** On-chain data + issuer APIs
- **Endpoint:** `/api/public/stablecoins/reserves`
- **Includes:** Total supply per blockchain, reserve composition
- **For:** USDC, USDT, DAI, USDP
- **Refresh Rate:** 3600 seconds (1 hour)

## Component Structure

### Main Component: S10_StablecoinPeg()

The module manages:
1. **Stablecoin Data State** - Prices, supplies, metadata
2. **Peg History State** - Deviation data for selected timeframe
3. **Timeframe State** - 1h/24h/7d/30d selection
4. **Selected Stablecoin State** - Detail view for clicked coin
5. **Risk State** - Deviation thresholds and warnings
6. **Blockchain Filter State** - Which chains to display

### Sub-Components

#### StablecoinCards({ stablecoins, selectedChain })

Card grid showing each stablecoin with current price and peg status.

**Props:**
- `stablecoins` (array): Array of stablecoin objects with prices
- `selectedChain` (string): Filter by blockchain or "all"

**Per-Card Information:**
- Stablecoin name (USDC, USDT, DAI, etc.)
- Current price (e.g., $0.9998)
- Peg deviation percentage (e.g., -0.02%)
- 24h price range (high/low)
- 24h volume
- Color-coded status: Green (on peg), Yellow (small deviation), Red (large deviation)

**Card Styling:**
- Background: #1a1a1a
- Border: 1px solid #2a2a2a
- Accent bar left: Color based on peg health
- Click to expand details

**Color Coding:**
- On Peg (±0.1%): Green #00D897
- Small Deviation (±0.1-0.5%): Yellow #FFA500
- Large Deviation (±0.5-1%): Orange #FF8C00
- Extreme Deviation (>±1%): Red #FF4757

#### PegDeviation({ stablecoin, deviation, timeframe })

Large display showing peg deviation for selected stablecoin.

**Props:**
- `stablecoin` (string): Coin name (USDC, USDT, etc.)
- `deviation` (number): Percentage deviation from $1.00 (can be negative)
- `timeframe` (string): Current timeframe being displayed

**Display:**
- Large number: Deviation percentage (e.g., "-0.05%")
- Color: Based on magnitude
- Status text: "On Peg", "Slight Deviation", "At Risk", etc.
- Trend: Up/down arrow with change from previous period
- Warning badge: If deviation exceeds thresholds

#### PegHistoryChart({ data, timeframe })

Line chart showing stablecoin price and deviation over selected timeframe.

**Props:**
- `data` (array): Historical price/deviation points
- `timeframe` (string): 1h, 24h, 7d, 30d

**Features:**
- lightweight-charts library
- Dual Y-axes: Price (left, 0.95-1.05), Deviation (right, -2% to +2%)
- Reference line: $1.00 (horizontal)
- Line color: Green (on peg), shifts to yellow/red (deviation)
- Area fill: Light shade of line color
- Interactive crosshair for hover

**Time Ranges:**
- 1H: Minute-level data (60 points)
- 24H: Hour-level data (24 points)
- 7D: Daily data (7 points)
- 30D: Daily data (30 points)

#### BlockchainDistribution({ supplies, stablecoin })

Bar chart showing stablecoin supply across blockchains.

**Props:**
- `supplies` (object): Supply by blockchain `{ ethereum: 1000000, polygon: 500000, ... }`
- `stablecoin` (string): Which stablecoin to display

**Features:**
- Horizontal bar chart (SVG)
- Each bar: Blockchain name and supply amount
- Color: Different color per blockchain (Ethereum purple, Polygon teal, etc.)
- Labels: Absolute amount and percentage of total supply
- Sorted by supply (largest first)

**Blockchains Shown:**
- Ethereum
- Polygon
- Arbitrum
- Optimism
- Avalanche
- Base
- Solana (if applicable)
- Other (if <5% supply)

#### CollateralizationMetrics({ stablecoin, collateral })

Cards showing reserve composition for collateralized stablecoins.

**Props:**
- `stablecoin` (string): Coin name
- `collateral` (object): Composition `{ cash: 0.45, treasuries: 0.35, crypto: 0.15, other: 0.05 }`

**Metrics (for USDC, USDT, USDP):**
- **Cash:** Percentage in cash reserves
- **Short-Term Treasuries:** Percentage in T-Bills/equivalent
- **Crypto Holdings:** Percentage in crypto collateral
- **Other Assets:** Percentage in other assets
- **Adequacy:** Over-collateralization ratio (if available)

**Card Styling:**
- Stacked bar chart showing composition
- Color-coded by asset type
- Labels with percentages
- Legend with asset types

#### PegComparisonChart({ stablecoins, timeframe })

Multi-line chart comparing peg deviations across stablecoins.

**Props:**
- `stablecoins` (array): Which coins to compare
- `timeframe` (string): 1h, 24h, 7d, 30d

**Features:**
- Multiple lines (one per stablecoin)
- Different colors per stablecoin
- Reference line at 0% deviation
- Y-axis: Deviation percentage (-2% to +2%)
- Legend to toggle stablecoins
- Interactive hover to compare at specific time

#### VolumeChart({ volumes, selectedChain })

Bar chart showing 24h trading volume by stablecoin.

**Props:**
- `volumes` (array): Volume data by stablecoin
- `selectedChain` (string): Filter by blockchain

**Features:**
- Horizontal bar chart
- Bar size: Proportional to volume
- Color: Matched to stablecoin brand colors
- Labels: Stablecoin name, volume in USD millions
- Sorted by volume (highest first)

#### TimeframeSelector({ activeTimeframe, onTimeframeChange })

Button group to select peg history timeframe.

**Props:**
- `activeTimeframe` (string): Current selection
- `onTimeframeChange` (function): Callback on change

**Buttons:**
- `1H` - Last hour (minute-level)
- `24H` - Last 24 hours (hourly)
- `7D` - Last 7 days (daily)
- `30D` - Last 30 days (daily)

**Styling:**
- Active: white, fontWeight 700, UI_COLORS.brand underline
- Inactive: 32% opacity white

#### RiskAlerts({ deviations })

Alert badges showing stablecoins with significant peg deviations.

**Props:**
- `deviations` (array): Stablecoins with deviations > threshold

**Shows:**
- Stablecoin name
- Current deviation
- Severity: Warning (orange), Critical (red)
- Trend: Direction arrow
- Time duration: How long deviation has persisted

**Alerts Triggered at:**
- ±0.5% deviation: Warning
- ±1% deviation: Critical
- ±2% deviation: Extreme (red flashing)

#### IssuersTable({ stablecoins })

Information table about stablecoin issuers.

**Props:**
- `stablecoins` (array): Stablecoin data with issuer info

**Columns:**
- **Stablecoin:** Name and ticker
- **Issuer:** Company/DAO issuing the stablecoin
- **Type:** Fiat-backed, Collateralized, Algorithmic
- **Supported Chains:** Count of blockchains
- **Market Cap:** Total supply * $1.00 (approximate)
- **Website:** Link to issuer website

## Data Transformations

### Stablecoin Price Object
```javascript
{
  symbol: "USDC",
  name: "USD Coin",
  issuer: "Circle",
  price: 0.9998,
  deviation: -0.02,           // Percentage
  change24h: 0.001,
  volume24h: 1200000000,      // USD
  marketCap: 34000000000,     // USD
  chains: {
    ethereum: { price: 0.9998, supply: 28000000000 },
    polygon: { price: 0.9999, supply: 3500000000 },
    arbitrum: { price: 0.9997, supply: 1200000000 }
  }
}
```

### Peg Deviation Calculation
```javascript
// Price as percentage of $1.00
deviation = ((price - 1.0) / 1.0) * 100

// Example: $0.9998 = -0.02% deviation
```

### Supply Distribution
```javascript
totalSupply = ethereum.supply + polygon.supply + arbitrum.supply + ...

byChain = {
  ethereum: (ethereum.supply / totalSupply) * 100,
  polygon: (polygon.supply / totalSupply) * 100
}
```

### Risk Level Assessment
```javascript
riskLevel(deviation) {
  if (Math.abs(deviation) < 0.1) return "HEALTHY"
  if (Math.abs(deviation) < 0.5) return "CAUTION"
  if (Math.abs(deviation) < 1.0) return "WARNING"
  return "CRITICAL"
}
```

## Related Modules

- [[S01 Bitcoin Overview|/module/s01-bitcoin-overview]] - Bitcoin metrics for comparison
- [[S02 Price Chart|/module/s02-bitcoin-price-chart-live]] - Price charting patterns
- [[S03 Multi-Currency|/module/s03-bitcoin-multi-currency]] - Currency comparisons
- [[S04 Mempool Gauge|/module/s04-bitcoin-mempool-fees]] - On-chain activity correlation

## Integration for AI Agents

### Creating a Similar Module (e.g., Wrapped Asset Tracking)

1. Copy this module folder to `s##-wrapped-asset-tracker/`
2. Update `module.json`:
   ```json
   {
     "code": "S##",
     "slugBase": "wrapped-asset-tracker",
     "title": "Wrapped Asset Tracker",
     "providers": ["CoinGecko", "Bridge APIs"],
     "apiEndpoints": ["/api/public/wrapped-assets/prices"]
   }
   ```
3. Update component:
   - Change to wrapped assets (wBTC, wETH, etc.)
   - Track vs underlying asset (not vs $1.00)
   - Monitor bridge health/security
4. Reuse peg tracking architecture

### Key Extension Points

- **Detailed Charts:** Add volatility, VWAP (Volume Weighted Average Price)
- **Risk Analysis:** Model risk scores based on collateral quality, issuer stability
- **Arbitrage:** Show price differences across exchanges
- **Reserve Audit:** Link to latest audits/attestations
- **News Feed:** Integrate stablecoin news alerts
- **Blockchain Analysis:** Track on-chain flows (minting/burning)
- **Comparison Matrix:** Matrix comparing all stablecoins across metrics

## Styling & Theming

- **Container background:** #111111 (dark gray)
- **Card background:** #1a1a1a
- **Text color:** white (#ffffff)
- **Brand accent:** UI_COLORS.brand (cyan/blue)
- **On Peg (Healthy):** #00D897 (green)
- **Small Deviation:** #FFA500 (orange)
- **Large Deviation:** #FF8C00 (darker orange)
- **At Risk:** #FF4757 (red)
- **Positive change:** #00D897 (green)
- **Negative change:** #FF4757 (red)
- **Dividers:** #2a2a2a (1px)
- **Hover:** #2a2a2a background

## API Contracts

### GET /api/public/stablecoins/prices
```json
{
  "stablecoins": [
    {
      "symbol": "USDC",
      "name": "USD Coin",
      "issuer": "Circle",
      "type": "fiat-backed",
      "price": 0.9998,
      "deviation": -0.02,
      "change24h": 0.001,
      "volume24h": 1200000000,
      "marketCap": 34000000000
    },
    {
      "symbol": "USDT",
      "name": "Tether",
      "issuer": "Tether Ltd",
      "type": "fiat-backed",
      "price": 1.0002,
      "deviation": 0.02,
      "change24h": 0.003,
      "volume24h": 45000000000,
      "marketCap": 118000000000
    }
  ],
  "timestamp": 1710000000000
}
```

### GET /api/public/stablecoins/peg-history
```json
{
  "stablecoin": "USDC",
  "timeframe": "24h",
  "data": [
    { "timestamp": 1710000000, "price": 0.9998, "deviation": -0.02 },
    { "timestamp": 1710003600, "price": 0.9999, "deviation": -0.01 },
    { "timestamp": 1710007200, "price": 1.0000, "deviation": 0.00 }
  ]
}
```

### GET /api/public/stablecoins/reserves
```json
{
  "stablecoin": "USDC",
  "issuer": "Circle",
  "totalSupply": 34000000000,
  "collateral": {
    "cash": { "percentage": 45, "amount": 15300000000 },
    "treasuries": { "percentage": 35, "amount": 11900000000 },
    "crypto": { "percentage": 15, "amount": 5100000000 },
    "other": { "percentage": 5, "amount": 1700000000 }
  },
  "lastAudit": "2024-03-15",
  "timestamp": 1710000000000
}
```

## Notes

- Stablecoin prices can deviate from $1.00 due to demand/supply imbalances
- Different blockchains may have slightly different prices
- "On-chain" stablecoins (DAI) may have different peg mechanics
- Algorithmic stablecoins (UST/USDD) have different risk profiles
- Collateralization data may lag actual on-chain state
- Price aggregation from multiple exchanges (CoinGecko methodology)
- Risk thresholds (0.5%, 1%) are informational, not absolute
