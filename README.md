# Satoshi Dashboard

Bitcoin analytics dashboard built with React + Vite, with a local/serverless API layer for cached market and on-chain data.

## Current project state

- Active frontend module registry: **28 modules** (single-module player experience).
- Frontend route model: `BrowserRouter` with `/module/:slug` as primary navigation.
- Backend/API model: Express app in `server/app.js`, local entry in `server/index.js`, serverless entry in `api/index.js`.
- Cache strategy: request-time refresh + stale fallback + lock protection (local + optional shared KV).
- Deployment target: Vercel (API rewrite + SPA rewrites via `vercel.json`).

## Tech stack

- React 19
- Vite 7
- Tailwind CSS 4
- Recharts
- Framer Motion
- Express

## Project architecture

### Frontend

- App shell and routing: `src/App.jsx`, `src/main.jsx`
- Module player page: `src/pages/ModulePage.jsx`
- Module registry and identity rules: `src/config/modules.js`
- Design tokens and global styles: `src/index.css`
- Data helpers: `src/services/priceApi.js`

### Backend/API

- API routes and contracts: `server/app.js`
- Local API runtime: `server/index.js`
- Vercel serverless entry: `api/index.js`
- Shared/local runtime cache and lock layer: `server/runtimeCache.js`
- BTC rates pipeline: `btcRates.js`
- Bitnodes cache pipeline: `server/bitnodesCache.js`
- BTC distribution scraper: `server/btcDistribution.js`
- Addresses richer scraper: `server/btcAddressesRicher.js`
- Unique visitor counter: `server/visitorCounter.js`

## Active module registry (S01-S28)

Module codes/slugs are generated from array order in `src/config/modules.js`.

| Code | Title |
| --- | --- |
| S01 | Bitcoin Overview |
| S02 | Price Chart |
| S03 | Multi-Currency |
| S04 | Mempool Gauge |
| S05 | Long-Term Trend |
| S06 | Nodes Map |
| S07 | Lightning Network |
| S08 | Stablecoin Peg Health |
| S09 | Fear & Greed |
| S10 | Address Distribution |
| S11 | Wealth Pyramid |
| S12 | Global Assets |
| S13 | BTC vs Gold |
| S14 | Mayer Multiple |
| S15 | Price Performance |
| S16 | Cycle Spiral |
| S17 | Power Law Model |
| S18 | Stock to Flow |
| S19 | Big Mac Sats Tracker |
| S20 | Seasonality |
| S21 | Big Mac Index |
| S22 | Network Activity |
| S23 | Log Regression |
| S24 | MVRV Score |
| S25 | Google Trends |
| S26 | BTC Dominance |
| S27 | UTXO Distribution |
| S28 | Thank You Satoshi |

Note: some component filenames keep legacy names and do not necessarily match generated module codes one-to-one.

## Live data coverage

Currently wired live/external data modules:

- `S01` Bitcoin Overview: Binance/CoinGecko spot + mempool.space + Alternative.me
- `S02` Price Chart: Binance spot/history via `priceApi`
- `S03` Multi-Currency: `/api/btc/rates` backend cache (fallback Binance direct) + Natural Earth GeoJSON
- `S04` Mempool Gauge: mempool.space REST
- `S05` Long-Term Trend: mempool.space REST + WebSocket
- `S06` Nodes Map: `/api/bitnodes/cache` + Natural Earth countries GeoJSON
- `S07` Lightning Network: spot feed via `priceApi`
- `S08` Stablecoin Peg Health: DeFiLlama stablecoins API
- `S09` Fear & Greed: Alternative.me index API
- `S10` Address Distribution: `/api/s10/btc-distribution`
- `S11` Wealth Pyramid: `/api/s14/addresses-richer`
- `S13` BTC vs Gold: CoinGecko market chart
- `S15` Price Performance: CoinGecko spot endpoint
- `S19` Big Mac Sats Tracker: Alternative.me + Binance + Economist CSV
- `S21` Big Mac Index: CoinGecko spot endpoint

Other modules currently render from local/generated data in frontend code.

## API endpoints

### BTC rates

- `GET /api/btc/rates`
- `GET /api/btc/rates/:currency`
- `GET /api/btc/refresh` (token-protectable)

### Bitnodes cache

- `GET /api/bitnodes/cache`
- `GET /api/bitnodes/cache/status`
- `GET /api/bitnodes/cache/refresh` (token-protectable)

### BTC distribution (BitInfoCharts)

- `GET /api/s10/btc-distribution`
- `GET /api/s10/btc-distribution.js`
- `GET /api/s10/btc-distribution/status`
- `GET /api/s10/btc-distribution/refresh` (token-protectable)

### Addresses richer (BitInfoCharts)

- `GET /api/s14/addresses-richer`
- `GET /api/s14/addresses-richer.js`
- `GET /api/s14/addresses-richer/status`
- `GET /api/s14/addresses-richer/refresh` (token-protectable)

### Visitors

- `GET /api/visitors/stats`
- `GET /api/visitors/track`

## Environment variables

- `API_PORT` (default `8787`)
- `REFRESH_API_TOKEN` (optional, protects refresh endpoints)
- `VISITOR_COUNTER_SALT` (optional, hashes visitor IPs)
- `CACHE_KEY_PREFIX` (optional shared-cache key namespace)
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (optional shared KV)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (optional shared KV aliases)

## Local development

Requirements:

- Node.js 20+
- npm 10+

Install and run:

```bash
npm install
npm run dev
```

Useful scripts:

- `npm run dev` -> UI + API
- `npm run dev:ui` -> Vite UI only
- `npm run dev:api` -> API only
- `npm run start` -> API only (production-like local)
- `npm run build` -> production build
- `npm run preview` -> preview build
- `npm run lint` -> ESLint

## Deployment (Vercel)

`vercel.json` rewrites:

- `/api/*` -> `api/index.js`
- `/module/*` -> `index.html`
- fallback `/*` -> `index.html`

This keeps serverless API and client-side routing compatible in one deployment.

## Agent policy files

- Runtime policy entrypoint: `AGENTS.md`
- Backend/API strict rules: `.claude/BACKEND_API_RULES.md`
- Module registry/order strict rules: `.claude/MODULE_REGISTRY_RULES.md`
- Frontend color/UX/UI strict rules: `.claude/FRONTEND_COLOR_UX_UI_RULES.md`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit with clear messages
4. Push and open a pull request

## License

Distributed under the Unlicense. See `LICENSE.txt`.
