---
code: S29
title: UTXO Distribution
description: Bitcoin UTXO age band distribution bar chart with breakdown panel showing count, value, and percentage per age range
category: under-construction
status: in-development
providers:
  - mempool.space
refreshSeconds: 300
---

# UTXO Distribution (S29)

## Description

The UTXO Distribution module displays how Bitcoin's unspent transaction outputs (UTXOs) are distributed across age bands. It shows:

- **Total UTXOs:** Aggregate count across all age bands
- **Total Value (sats):** Aggregate satoshi value of all UTXOs
- **Average UTXO Value:** Mean USD value per UTXO
- **Bar Chart:** Recharts BarChart showing UTXO count by age band (0–1d to 5y+)
- **Breakdown Panel:** Per-band progress bars with UTXO count and total value
- **Donate Button:** QR code donate support button in footer

## Data Sources

### UTXO Distribution Data
- **Source:** mempool.space (planned — currently uses static data)
- **Endpoint:** `/api/s29/utxo-distribution`
- **Refresh Rate:** 300 seconds (5 minutes)
- **Note:** Current implementation uses hardcoded age band data

## Component Structure

### Main Component: S29_UTXODistribution({ onOpenDonate })

Two-panel layout: chart on left/top, breakdown list on right/bottom.

### Sub-Components

#### Stats Row (top, 3-column grid)
- Total UTXOs, Total Value, Avg Value

#### Recharts BarChart (left panel)
- `ResponsiveContainer` with `BarChart`, `XAxis`, `YAxis`, `Tooltip`, `Bar` + `Cell`
- Custom `CustomTooltip` showing age range, UTXO count, value
- Bar colors mapped by UTXO density ratio via `barColor()` function
- X-axis labels angled -35° for readability

#### Breakdown Panel (right panel, lg:w-[300px])
- Per-band row: color swatch, age range label, UTXO count, satoshi value
- Progress bar background: proportional to total UTXOs percentage
- Scrollable with `overflow-y-auto`

#### Footer
- Age band count label + donate QR button

### Color Mapping: barColor(utxos)
```javascript
ratio > 0.8  → '#F7931A'   // full bitcoin orange
ratio > 0.5  → '#E07A10'
ratio > 0.25 → '#C86808'
else         → '#A05000'   // darkest
```

## Usage for Agents

### Connecting Live Data

To connect this module to live UTXO data from mempool.space:

1. Create endpoint `/api/s29/utxo-distribution` returning `{ age_bands: [{range, utxos, value}] }`
2. Replace `ageData` constant with `useModuleData` hook call
3. Recompute `totalUTXOs`, `totalValue`, `avgUTXOValue`, `maxUTXOs` from live data

### Props

- `onOpenDonate` (function, optional): callback to open the donation modal

## Styling

- Container: `bg-[#111111]` full height flex-col
- Header border: `border-white/[0.07]`
- Stats dividers: `divide-white/[0.06]`
- Breakdown rows: `bg-white/[0.02]`, `border-white/[0.06]`
- Bitcoin orange accent: `#F7931A`
- Font: monospace throughout
