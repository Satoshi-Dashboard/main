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
- `S02` Price Chart: `/api/public/binance/btc-history` (cache-first Binance daily history)
- `S03` Multi-Currency: `/api/s03/multi-currency` Investing single-currency-crosses (USD) scrape + BTC anchor from `/api/btc/rates` + `/api/public/geo/land`
- `S04` Mempool Gauge: `/api/public/mempool/overview`
- `S05` Long-Term Trend: `/api/public/mempool/live` (cache-first polling snapshot)
- `S06` Nodes Map: `/api/bitnodes/cache` + `/api/public/geo/countries` (Bitnodes primary, scrape fallback)
- `S07` Lightning Network: spot feed via `priceApi`
- `S08` Stablecoin Peg Health: CoinGecko stablecoins market API
- `S09` Fear & Greed: `/api/public/fear-greed`
- `S10` Address Distribution: `/api/s10/btc-distribution`
- `S11` Wealth Pyramid: `/api/s14/addresses-richer`
- `S13` Global Assets: `/api/s13/global-assets` Newhedge global asset values scrape
- `S14` BTC vs Gold: `/api/public/coingecko/bitcoin-market-chart`
- `S15` Price Performance: `/api/btc/rates`
- `S19` Big Mac Sats Tracker: `/api/public/s21/big-mac-sats-data` (BTC spot cache + Binance history + Economist CSV)
- `S21` Big Mac Index: `/api/btc/rates`

Browser clients use internal `/api/*` routes for upstream reads so provider request budgets are enforced server-side via shared cache + single-flight refresh.

Other modules currently render from local/generated data in frontend code.

## API endpoints

Global refresh governance:

- External providers are accessed with cache-first single-flight refresh policy (many readers, minimal upstream calls).
- Per-provider refresh windows must respect provider cadence and safe request budgets, not only hard limits.
- Effective refresh time uses the stricter boundary between local safe interval and provider freshness window.

### BTC rates

- `GET /api/btc/rates`
- `GET /api/btc/rates/:currency`
- `GET /api/btc/refresh` (token-protectable)

Behavior notes:

- Near-live spot cadence (target): ~5 seconds per shared refresh window.
- Spot source priority: Binance.com (`ticker/24hr`) -> CoinGecko fallback.
- CoinGecko fallback is throttled with local safety interval to avoid over-requesting.
- Fiat conversion source (Frankfurter) is cached separately with slower cadence (hours), then combined with fresh spot.

### S03 multi-currency scraper

- `GET /api/s03/multi-currency`
- `GET /api/s03/multi-currency/status`
- `GET /api/s03/multi-currency/refresh` (token-protectable)

Behavior notes:

- Scrapes Investing single-currency-crosses table (`/currencies/single-currency-crosses?currency=usd`) with a 30-second refresh window.
- Uses BTC anchor from `/api/btc/rates` (Binance primary) for USD and combines it with Investing scraped USD quote pairs for non-USD conversions.
- Applies cache-first single-flight refresh with stale fallback when upstream scrape fails.

### S08 stablecoin peg cache

- `GET /api/s08/stablecoins`
- `GET /api/s08/stablecoins/live-prices`
- `GET /api/s08/stablecoin/:id`

Behavior notes:

- Stablecoin metadata/list is cached from CoinGecko markets endpoint (stablecoins category) with cache-first single-flight and a strict 60s refresh window (1 upstream request/minute max).
- Peg deviation uses `/api/s08/stablecoins/live-prices`, derived from the same shared CoinGecko cache window (no extra upstream endpoint hit).
- Historical 14d series payload per coin id is sourced from CoinGecko `market_chart` and normalized to the existing `data.tokens` contract.
- List payload keeps backward-compatible fields and adds richer CoinGecko metrics (rank, 24h range/change, volume, FDV, ATH/ATL, supplies, image, timestamps) when available.

### S13 global assets snapshot

- `GET /api/s13/global-assets`
- `GET /api/s13/global-assets/status`
- `GET /api/s13/global-assets/refresh` (token-protectable)

Behavior notes:

- Scrapes Newhedge global asset values page (`/bitcoin/global-asset-values`) and extracts the "Latest Global Asset Values snapshot" card.
- Uses cache-first single-flight refresh with a strict 1-hour window (safe budget: 24 provider refreshes/day).
- Returns additive operational metadata (`is_fallback`, `fallback_note`, `stale_age_ms`) when stale cache is served after transient scrape errors.

### Bitnodes cache

- `GET /api/bitnodes/cache`
- `GET /api/bitnodes/cache/status`
- `GET /api/bitnodes/cache/refresh` (token-protectable)

Behavior notes:

- Primary source is Bitnodes snapshot API.
- If Bitnodes API is unavailable/rate-limited, backend falls back to Bitnodes countries modal scraping (`/nodes/`).
- Bitnodes scrape fallback enforces a minimum refresh interval of ~10 minutes.
- Fallback response adds `source_provider`, `is_fallback`, and `fallback_note` fields.
- Payload includes `data.network_breakdown` (Nodes, IPv4, IPv6, .onion, Full, Pruned with percentages).
- Breakdown is computed from Bitnodes API snapshot when available; otherwise from Bitnodes `/nodes/` scrape summary.

### BTC distribution (BitInfoCharts)

- `GET /api/s10/btc-distribution`
- `GET /api/s10/btc-distribution.js`
- `GET /api/s10/btc-distribution/status`
- `GET /api/s10/btc-distribution/refresh` (token-protectable)

Behavior notes:

- Uses shared BitInfoCharts HTML source cache with 30-minute cadence.
- Avoids duplicate upstream refreshes when S10 and S14 request the same source window.

### Addresses richer (BitInfoCharts)

- `GET /api/s14/addresses-richer`
- `GET /api/s14/addresses-richer.js`
- `GET /api/s14/addresses-richer/status`
- `GET /api/s14/addresses-richer/refresh` (token-protectable)

Behavior notes:

- Shares the same 30-minute BitInfoCharts source-refresh window used by S10.

### Visitors

- `GET /api/visitors/stats`
- `GET /api/visitors/track`

### Public shared feeds (cache-first)

- `GET /api/public/mempool/overview`
- `GET /api/public/mempool/live`
- `GET /api/public/fear-greed?limit=7|31`
- `GET /api/public/geo/countries`
- `GET /api/public/geo/land`
- `GET /api/public/lightning/world`
- `GET /api/public/coingecko/bitcoin-market-chart?days=365`
- `GET /api/public/binance/btc-history?days=7|30|90|365`
- `GET /api/public/s21/big-mac-sats-data`

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

Function runtime region:

- `api/index.js` is pinned to Vercel region `fra1` in `vercel.json` to keep Binance-backed server-side calls outside US regions.

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
