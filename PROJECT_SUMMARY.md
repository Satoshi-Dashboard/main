# Satoshi Dashboard - Phase 1: UI Shell with Mock Data

## Project Overview
A comprehensive Bitcoin analytics dashboard built with React 18, Vite, Tailwind CSS, Recharts, and Framer Motion. All 30 sections are fully implemented with rich mock data and interactive visualizations.

## Technology Stack
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **Recharts** - Charts and visualizations
- **Lucide React** - SVG icons
- **Framer Motion** - Animations (integrated)
- **html2canvas** - Screenshot functionality

## File Structure

### Root Files
```
src/
├── main.jsx              # Vite entry point
├── App.jsx              # Main application component
├── index.css            # Global styles with design tokens
└── App.css             # Additional app styles
```

### Layout Components (`src/components/layout/`)
- **TopBar.jsx** - Fixed header with live BTC price ($97,234.56), 24h change (+3.42%), and export controls
- **SideNav.jsx** - Collapsible left sidebar with navigation to all 30 sections
- **Footer.jsx** - Footer with credits, data sources, and metadata

### Common Components (`src/components/common/`)
- **DashboardCard.jsx** - Reusable card wrapper with header, footer, copy/screenshot/expand buttons
- **StatBox.jsx** - Stat tile component with label, value, change percentage, color-coded
- **SkeletonLoader.jsx** - Shimmer loading placeholder
- **Toast.jsx** - Toast notification system with context provider and useToast hook

### Utilities (`src/utils/`)
- **formatters.js** - Number formatting functions (USD, BTC, compact, percentages, etc.)

### All 30 Section Components (`src/components/sections/`)

#### Core Market Data
1. **S01_BitcoinOverview.jsx** - Hero card with price, market cap, volume, supply, ATH, 7-day sparkline
2. **S02_PriceChart.jsx** - Full area chart with 7D/30D/90D/1Y range selector
3. **S03_MultiCurrencyBoard.jsx** - BTC price in 15 currencies (USD, EUR, GBP, JPY, BRL, ARS, etc.)

#### Network & Blockchain
4. **S04_MempoolGauge.jsx** - Mempool stats with radial gauge, pending TXs, recommended fees
5. **S06_BlockComposition.jsx** - Latest 5 blocks with TX count, size, miner, fees
6. **S08_NodesMap.jsx** - Node distribution by country, version breakdown (v28.1, v27.2, etc.)
7. **S09_LightningNetwork.jsx** - LN capacity (5,642 BTC), nodes (14,832), channels (62,445)
8. **S24_NetworkActivity.jsx** - 4 mini panels: Mempool, Daily TXs, Avg Fee, Hash Rate sparklines

#### Long-Term Analysis
5. **S05_LongTermTrend.jsx** - Price history 2013-2024 with halving reference lines
6. **S14_TransactionCount.jsx** - Daily TX count over 2 years with averages
7. **S18_CycleSpiral.jsx** - Overlaid price cycles after each halving (2012-2024)

#### Valuation Models
9. **S16_MayerMultiple.jsx** - Price vs 200-day MA with colored zones (undervalued/neutral/overvalued)
10. **S19_PowerLawModel.jsx** - Log-log regression with fair value bands (+8.7% current deviation)
11. **S20_StockToFlow.jsx** - S2F model with scatter chart, current S2F: 120
12. **S25_LogRegression.jsx** - Logarithmic regression line with trend analysis
13. **S26_MVRVScore.jsx** - Market/Realized Value ratio (2.8) with Z-Score (1.9)

#### Comparative Analysis
11. **S07_TopAddresses.jsx** - Top 10 richest addresses, horizontal bar chart
12. **S11_AddressDistribution.jsx** - Addresses by balance range (Dust to 100+ BTC)
13. **S12_BTCvsGold.jsx** - Market cap comparison, flippening progress (13.8%)
14. **S13_GlobalAssetsTreemap.jsx** - All assets treemap (BTC $1.92T → Real Estate $326T)
15. **S15_WealthPyramid.jsx** - Whale tiers visualization (🦐 Shrimp → 🐋 Whale)

#### Market Sentiment & Trends
16. **S10_FearGreedIndex.jsx** - Gauge (current: 72 Greed), 30-day history line chart
17. **S22_SeasonalityHeatmap.jsx** - Monthly returns heatmap 2017-2024 (green/red intensity)
18. **S23_BigMacIndex.jsx** - BTC cost in Big Macs (17,679), PPP by country
19. **S27_GoogleTrends.jsx** - Search interest vs BTC price (82% correlation)
20. **S28_BTCDominance.jsx** - BTC dominance (54.3%), donut chart, historical trend

#### Price Performance & Metrics
17. **S17_PricePerformance.jsx** - ROI by timeframe (7D: +12.3%, 1Y: +312%)
18. **S21_NodeVersions.jsx** - Core versions: v28.1 (38%), v27.2 (24%), pie + bar charts
19. **S29_UTXODistribution.jsx** - Age distribution, total UTXOs: 178.4M, avg value: $543

#### Special Section
20. **S30_ThankYouSatoshi.jsx** - Tribute with genesis hash, whitepaper quote, legacy

## Design System
All components use CSS variables for consistent theming:
- `--bg-primary: #0A0A0F` (deep black)
- `--bg-card: #12121A` (card background)
- `--accent-bitcoin: #F7931A` (Bitcoin orange)
- `--accent-green: #00D897` (positive)
- `--accent-red: #FF4757` (negative)
- `--text-primary: #E8E6E3` (light gray)
- `--font-mono: 'JetBrains Mono'` (monospace)

## Key Features

### Interactive Components
- Copy to clipboard (Markdown export)
- Screenshot capture using html2canvas
- Expand/collapse cards
- Toast notifications
- Scroll-to-section navigation
- Active section highlighting in sidebar

### Data Visualization
- AreaChart (sparklines, trends)
- LineChart (price history, multi-axis)
- BarChart (horizontal/vertical)
- PieChart (donut charts)
- ScatterChart (S2F model)
- Custom SVG gauges (fear/greed, mempool)

### Mock Data
- Realistic 30-day to 2-year historical datasets
- Randomized variations for dynamic feel
- Proper scale and correlation
- 8+ years of data for long-term analysis

## Build & Deployment

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
```

### Output
- Built files in `dist/`
- Optimized for production
- CSS/JS minification
- Code splitting enabled

## Component Import Patterns

All components follow clean import structure:
```jsx
import { TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import DashboardCard from '../common/DashboardCard';
import { fmt } from '../../utils/formatters';
```

## Responsive Design
- Mobile-first approach
- Tailwind responsive classes
- Fixed sidebar collapses on mobile
- Grid layout adapts from 1→2→3 columns

## Phase 1 Completion
✅ All 30 sections created with working components
✅ Mock data implemented for all visualizations
✅ Full UI/UX with consistent design language
✅ Toast notification system
✅ Screenshot and export functionality
✅ Navigation and section scrolling
✅ Responsive layout

## Next Steps (Phase 2)
- Live data integration (Blockchain.com API)
- Real-time price updates
- Database persistence
- User authentication
- Interactive map for nodes (Leaflet)
- Advanced filtering and search
- Historical data export
