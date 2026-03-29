# S21 — Big Mac Sats Tracker

## Overview
Tracks the satoshi cost of a McDonald's Big Mac using live Bitcoin price data, comparing purchasing power across multiple historical periods (7d, 30d, 1y, 3y, 5y, 10y).

## Key Features
- Live BTC/USD spot price with 24h change
- Current Big Mac cost in satoshis with direction indicator
- Six historical comparison cards showing sats cost at prior BTC prices
- Auto-polling every 5 minutes via `/api/public/s21/big-mac-sats-data`
- Skeleton loading states while data loads

## Data Flow
1. Fetches from `/api/public/s21/big-mac-sats-data` on mount and every 300s
2. Payload: `{ spot_btc_usd, spot_change_24h_pct, big_mac_usd, history_btc: { 1y, 30d, 7d, 10y, 5y, 3y } }`
3. Calculates sats = floor((bigMacUsd / btcPrice) * 100_000_000)
4. Percentage change derived from 24h BTC price movement

## Status
- category: under-construction
- status: in-development
