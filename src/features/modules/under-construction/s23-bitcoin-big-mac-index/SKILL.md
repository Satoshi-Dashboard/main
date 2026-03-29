# S23 — Big Mac Index

## Overview
Displays the current Big Mac price in satoshis using live BTC spot price, with a 2x3 grid of comparison cards showing historical satoshi costs at key past BTC prices.

## Key Features
- Live BTC spot price fetched via `fetchBtcSpot()` from shared price API
- Current Big Mac cost in sats with 24h direction indicator (derived from 1.66% price delta approximation)
- Six historical comparison cards: 1y, 30d, 7d, 10y, 5y, 3y ago
- Green indicator when fewer sats needed (BTC has appreciated), red otherwise
- Falls back to $84,000 BTC price if API unavailable

## Data Flow
1. Calls `fetchBtcSpot()` from `@/shared/services/priceApi.js` on mount
2. Fixed Big Mac USD price: $5.69 (global average approximation)
3. Historical BTC prices hardcoded in `HISTORY` array
4. sats = round((BIG_MAC_USD / btcPrice) * 1e8)

## Status
- category: under-construction
- status: in-development
