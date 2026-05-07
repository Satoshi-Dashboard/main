---
code: S12
title: Address Distribution
description: Bitcoin address distribution table across 8 wealth tiers from Plankton to 100K+ holders
category: live
status: published
providers:
  - mempool.space
  - BitInfoCharts
refreshSeconds: 300
---

# Address Distribution (S12)

## Description

The Address Distribution module displays how Bitcoin is distributed across 8 holder tiers (inspired by marine life metaphors). It shows:

- **Tier Table (Desktop):** Full-width table with emoji, tier name, BTC balance range, number of addresses, total BTC held, and BTC percentage (with cumulative %)
- **Tier Cards (Mobile):** Compact article cards per tier with the same data in a 2-column grid
- **Source Footer:** Provider attribution, data snapshot timestamp, and last sync time

## Data Sources

### Address Distribution API
- **Provider:** mempool.space / BitInfoCharts (via internal cache)
- **Internal Endpoint:** `/api/s12/address-distribution`
- **Returns:** `{ distribution: [...], updatedAt, fetchedAt }`
- **Distribution Row:** `{ range, addresses, totalBTC, btcPercent }`
- **Refresh Rate:** 300 seconds (5 minutes); data updates every 30 minutes upstream

## Tier Definitions

| Tier      | Emoji | BTC Range         | CSS Background         |
|-----------|-------|-------------------|------------------------|
| PLANKTON  | 🦠   | < 0.1 BTC         | `var(--tier-plankton)` |
| SHRIMP    | 🦐   | 0.1 – 1           | `var(--tier-shrimp)`   |
| CRAB      | 🦀   | 1 – 10            | `var(--tier-crab)`     |
| FISH      | 🐟   | 10 – 100          | `var(--tier-fish)`     |
| SHARK     | 🦈   | 100 – 1,000       | `var(--tier-shark)`    |
| WHALE     | 🐋   | 1,000 – 10,000    | `var(--tier-whale)`    |
| HUMPBACK  | 🐋   | 10,000 – 100,000  | `var(--tier-humpback)` |
| 100K+     | 💰   | 100,000+          | `var(--tier-100k)`     |

Tier background colors progress from near-black (#1A1A1A) to dark amber (#8B4A0F), creating a visual heat gradient from smallest to largest holders.

## Component Structure

### Main Component: `S12_AddressDistribution()`

Manages:
1. `tiers` state — array of 8 tier objects with addresses, totalBtc, pct, cum
2. `meta` state — `{ updatedAt, updatedAtLocal, fetchedAt, fetchedAtLocal }`
3. `useModuleData(fetchAddressDistribution, ...)` — fetches and transforms data
4. `sourceFooter` — `<ModuleSourceFooter>` with provider and timestamp info

### Data Transformation: `mapDistributionToTiers(distribution)`

Maps raw API distribution rows (by `range` string) to the 8 tier definitions. Multiple raw ranges are aggregated into PLANKTON (5 sub-ranges merged). Cumulative BTC percentage is calculated top-down starting at 100%.

## Responsive Layout

- **Desktop (`lg:`):** Full table with 6 columns, flex rows growing to fill height
- **Mobile:** Scrollable list of article cards, each showing tier name, range, address count, total BTC, and share

## Creating a Similar Module

To build a token distribution module for another asset:

1. Copy this folder to `s##-{asset}-address-distribution/`
2. Update `module.json` with the new code, provider URL, and API endpoint
3. In `index.jsx`, replace `TIER_SPECS`/`FALLBACK_TIERS` with the new asset's tier definitions
4. Update the fetch function import or replace with a direct `fetchJson` call
5. Adjust `MODULE_COLORS` CSS variables if a different color scheme is desired

## Styling

- Main background: `#111111`
- Table header background: `#161616`
- Header accent color: `var(--accent-bitcoin)` (orange)
- Tier rows: Dark gradient backgrounds from near-black to amber
- Border color: `#2A2A2A`
- Font: monospace throughout

## Related Modules

- S13 Wealth Pyramid — visual pyramid form of similar holder data
- S09 Lightning Network — another on-chain statistics module
