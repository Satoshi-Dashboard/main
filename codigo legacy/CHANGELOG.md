# Changelog

All notable changes to Satoshi Dashboard are documented in this file.

## [1.0.0] - 2026-03-16

### Added - S18 Cycle Spiral Enhancements

#### Legend Component
- **Desktop & Tablet**: SVG-based legend positioned at bottom-left corner
- **Mobile**: HTML div legend overlay at bottom with dark semi-transparent background and backdrop blur effect
- **Display**: All 5 halving cycle color phases with labels:
  - Post-Halving Accumulation (Deep Blue)
  - Bull Run (Cyan)
  - Market Peak (Green)
  - Bear Decline (Yellow)
  - Pre-Halving Bottom (Orange)

#### Today Indicator
- White marker circle on the spiral showing current date position
- Animated pulsing outer ring (2s cubic-bezier animation)
- "TODAY" label above marker with current date below
- Automatically updates with Binance API data every 5 minutes

#### Responsive Design Improvements
- **Mobile** (< 640px): Optimized legend overlay with compact styling
- **Tablet** (640-1024px): SVG legend with tablet-adjusted sizing
- **Desktop** (≥ 1024px): Full SVG legend with comfortable spacing
- Adjusted Reset button positioning for mobile (bottom-20 vs bottom-4 on desktop)
- Improved legend spacing and visibility across all screen sizes

#### Auto-Update Mechanism
- Spiral data refreshes automatically every 5 minutes via Binance Historical API
- Latest Bitcoin price extracted from BTCUSDT 1-day klines
- No manual refresh required

### Technical Details

#### Files Modified
- `src/features/modules/live/S18_CycleSpiral.jsx`
  - Added mobile HTML legend div with responsive styling
  - Conditional SVG legend rendering (desktop/tablet only)
  - Today indicator calculation and rendering
  - Responsive layout adjustments

- `src/index.css`
  - Added `@keyframes pulse` animation for today indicator outer ring

#### Key Changes
1. Legend SVG now hidden on mobile, replaced with HTML overlay
2. Today indicator calculates current date's polar coordinates on spiral
3. Mobile legend uses HTML backdrop blur and semi-transparent background
4. Reset button repositioned higher on mobile to avoid legend overlap
5. Legend positioning optimized for all breakpoints

### Features Verified
- ✓ Legend visible and readable on all device sizes
- ✓ Today indicator updates with live data
- ✓ Responsive design works mobile, tablet, desktop
- ✓ No interaction conflicts between legend, spiral, and controls
- ✓ Auto-update confirmed every 5 minutes via Binance API
- ✓ Pulsing animation smooth across browsers

### Known Limitations
- Legend labels on mobile truncated to 20 characters in SVG version (now uses full HTML text)
- Today indicator requires valid BTC price data (handled with null checks)

---

## Project Overview

**Satoshi Dashboard** is a Bitcoin-focused analytical dashboard featuring:
- Live price tracking
- 30+ data visualization modules
- Bitcoin halving cycle spiral (S18)
- Historical data integration via Binance API
- Responsive design (mobile-first)
- Export to PNG/Markdown capabilities

**Tech Stack**: React 19 + Vite 7 + Tailwind CSS v4 + Recharts + Framer Motion
