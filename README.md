# Satoshi Dashboard

Bitcoin analytics dashboard built with React + Vite, backed by an Express/serverless API layer that caches market, macro, and on-chain data for a single-module player experience.

## Current project state

- Active frontend module registry: **31 modules**.
- Primary navigation: `BrowserRouter` + `/module/:slug`.
- Frontend shell behavior: single-module player with previous/next controls, autoplay, keyboard navigation, fullscreen toggle, donation modal, and per-module SEO metadata.
- Backend/API model: Express app in `server/app.js`, local entry in `server/index.js`, serverless entry in `api/index.js`.
- Cache strategy: request-time refresh + stale fallback + lock protection, with local memory cache and optional shared KV/Upstash Redis.
- Deployment target: Vercel (`vercel.json` rewrites SPA routes and `/api/*` to the serverless entry).

## Tech stack

- React 19
- React Router 7
- Vite 7
- Tailwind CSS 4
- Recharts
- Framer Motion
- Express 4
- Leaflet / React Leaflet
- D3

## Project architecture

### Frontend

- App shell and routing: `src/App.jsx`, `src/main.jsx`
- Single-module player page: `src/pages/ModulePage.jsx`
- Module registry and generated codes/slugs: `src/config/modules.js`
- Module data-provider metadata: `src/config/moduleDataMeta.js`
- Module SEO metadata: `src/config/moduleSEO.js`
- Shared BTC and history helpers: `src/services/priceApi.js`
- Global styles and tokens: `src/index.css`

### Backend / API

- API routes: `server/app.js`
- Local API runtime: `server/index.js`
- Vercel serverless entry: `api/index.js`
- Shared/local cache and lock layer: `server/runtimeCache.js`
- BTC spot + fiat conversion pipeline: `btcRates.js`
- Public cached feeds: `server/publicDataFeeds.js`
- S03 multi-currency scraper: `server/s03MultiCurrencyScraper.js`
- S08 stablecoin cache: `server/s08StablecoinPegCache.js`
- BitInfoCharts-backed pipelines: `server/btcDistribution.js`, `server/btcAddressesRicher.js`, `server/bitinfochartsShared.js`
- Bitnodes cache pipeline: `server/bitnodesCache.js`
- S13 global assets scraper: `server/s13GlobalAssetsCache.js`
- Visitor counter: `server/visitorCounter.js`

## Frontend module registry (S01-S31)

Module codes and slugs are generated from array order in `src/config/modules.js`. Component filenames still contain some legacy numbering and do not always match generated module codes one-to-one.

| Code | Title |
| --- | --- |
| S01 | Bitcoin Overview |
| S02 | Price Chart |
| S03 | Multi-Currency |
| S04 | Mempool Gauge |
| S05 | Long-Term Trend |
| S06 | Nodes Map |
| S07 | Lightning Nodes Map |
| S08 | BTC Map Business Density |
| S09 | Lightning Network |
| S10 | Stablecoin Peg Health |
| S11 | Fear & Greed |
| S12 | Address Distribution |
| S13 | Wealth Pyramid |
| S14 | Global Assets |
| S15 | BTC vs Gold |
| S16 | Mayer Multiple |
| S17 | Price Performance |
| S18 | Cycle Spiral |
| S19 | Power Law Model |
| S20 | Stock to Flow |
| S21 | Big Mac Sats Tracker |
| S22 | Seasonality |
| S23 | Big Mac Index |
| S24 | Network Activity |
| S25 | Log Regression |
| S26 | MVRV Score |
| S27 | Google Trends |
| S28 | BTC Dominance |
| S29 | UTXO Distribution |
| S30 | U.S. National Debt |
| S31 | Thank You Satoshi |

## Module implementation note

- The registry contains 31 navigable modules.
- In the current player UI, the under-construction overlay is now tied to a slug allowlist in `src/pages/ModulePage.jsx` so adding/reordering modules does not accidentally hide the wrong screens.
- `S31` remains reachable as the closing tribute screen.

## Live / external data coverage

Currently wired live or scraped data modules:

- `S01` Bitcoin Overview: `/api/btc/rates` + `/api/public/mempool/overview` + `/api/public/fear-greed`
- `S02` Price Chart: `/api/public/binance/btc-history`
- `S03` Multi-Currency: `/api/s03/multi-currency` + `/api/public/geo/land`
- `S04` Mempool Gauge: `/api/public/mempool/overview`
- `S05` Long-Term Trend: `/api/public/mempool/live`
- `S06` Nodes Map: `/api/bitnodes/cache` + `/api/public/geo/countries`
- `S07` Lightning Nodes Map: `/api/public/lightning/world`
- `S08` BTC Map Business Density: `/api/public/btcmap/businesses-by-country` + `/api/public/geo/countries`
- `S09` Lightning Network: BTC spot feed via `src/services/priceApi.js`
- `S10` Stablecoin Peg Health: `/api/s08/stablecoins`, `/api/s08/stablecoins/live-prices`, `/api/s08/stablecoin/:id`
- `S11` Fear & Greed: `/api/public/fear-greed`
- `S12` Address Distribution: `/api/s10/btc-distribution`
- `S13` Wealth Pyramid: `/api/s14/addresses-richer`
- `S14` Global Assets: `/api/s13/global-assets`
- `S15` BTC vs Gold: `/api/public/coingecko/bitcoin-market-chart`
- `S17` Price Performance: `/api/btc/rates`
- `S21` Big Mac Sats Tracker: `/api/public/s21/big-mac-sats-data`
- `S23` Big Mac Index: `/api/btc/rates`
- `S30` U.S. National Debt: `/api/public/us-national-debt`

Other modules currently render from local/generated frontend data.

## API endpoints

Global behavior:

- Upstream providers are accessed through cache-first single-flight refresh logic.
- When an upstream call fails, the API can serve stale cached data with fallback metadata.
- Refresh endpoints require `REFRESH_API_TOKEN` in production and accept the token via `x-refresh-token` header (or `Authorization: Bearer ...`).

### BTC rates

- `GET /api/btc/rates`
- `GET /api/btc/rates/:currency`
- `GET /api/btc/refresh`

Notes:

- Near-live refresh window around 5 seconds.
- Spot source priority: Binance -> CoinGecko fallback.
- Fiat conversion source is cached separately and merged into the BTC spot payload.

### S03 multi-currency

- `GET /api/s03/multi-currency`
- `GET /api/s03/multi-currency/status`
- `GET /api/s03/multi-currency/refresh`

### S08 stablecoin peg cache

- `GET /api/s08/stablecoins`
- `GET /api/s08/stablecoins/live-prices`
- `GET /api/s08/stablecoin/:id`

### S13 global assets

- `GET /api/s13/global-assets`
- `GET /api/s13/global-assets/status`
- `GET /api/s13/global-assets/refresh`

### Bitnodes cache

- `GET /api/bitnodes/cache`
- `GET /api/bitnodes/cache/status`
- `GET /api/bitnodes/cache/refresh`

Notes:

- Primary source: Bitnodes snapshot API.
- Fallback source: Bitnodes `/nodes/` scraping.

### BitInfoCharts-backed data

- `GET /api/s10/btc-distribution`
- `GET /api/s10/btc-distribution.js`
- `GET /api/s10/btc-distribution/status`
- `GET /api/s10/btc-distribution/refresh`
- `GET /api/s14/addresses-richer`
- `GET /api/s14/addresses-richer.js`
- `GET /api/s14/addresses-richer/status`
- `GET /api/s14/addresses-richer/refresh`

### Public shared feeds

- `GET /api/public/mempool/overview`
- `GET /api/public/mempool/live`
- `GET /api/public/fear-greed?limit=7|31`
- `GET /api/public/geo/countries`
- `GET /api/public/geo/land`
- `GET /api/public/lightning/world`
- `GET /api/public/btcmap/businesses-by-country`
- `GET /api/public/coingecko/bitcoin-market-chart?days=365`
- `GET /api/public/binance/btc-history?days=7|30|90|365`
- `GET /api/public/s21/big-mac-sats-data`
- `GET /api/public/us-national-debt`

### Visitors

- `GET /api/visitors/stats`
- `POST /api/visitors/track`

Notes:

- Visitor tracking uses an anonymous browser-generated visitor ID instead of raw IP-based uniqueness.
- The frontend sends the identifier once per session and the backend stores only a salted hash.

## Environment variables

- `API_PORT` (default `8787`)
- `API_HOST` (default `0.0.0.0`)
- `API_PROXY_TARGET` (optional, Vite dev proxy target; default `http://127.0.0.1:8787`)
- `REFRESH_API_TOKEN` (required in production if refresh endpoints should stay enabled)
- `VISITOR_COUNTER_SALT` (optional, salts anonymous visitor ID hashes)
- `CACHE_KEY_PREFIX` (optional shared-cache key namespace)
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (optional shared KV)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (optional shared KV aliases)
- `SCRAPER_BASE_URL` (optional scraper proxy base URL, defaults to `https://api.zatobox.io`)

Copy `.env.example` to a local `.env` file when needed.

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
- `npm run start:api` -> API only
- `npm run build` -> production build
- `npm run preview` -> preview build
- `npm run lint` -> ESLint

Notes:

- Vite proxies `/api` requests from the frontend dev server to the API server using `API_PROXY_TARGET` (defaults to `http://127.0.0.1:8787`).
- `vite.config.js` ignores generated cache JSON files to reduce unnecessary reload noise during development.
- Shared KV is strongly recommended on Vercel to avoid per-instance cache drift.

## SEO / PWA assets

- Base metadata lives in `index.html` and is refined per module via `src/config/moduleSEO.js`.
- Public assets include `robots.txt`, `sitemap.xml`, `llm.txt`, `site.webmanifest`, icons, and Open Graph preview images.

## Deployment (Vercel)

`vercel.json` rewrites:

- `/api/*` -> `api/index.js`
- `/module/*` -> `index.html`
- non-file routes -> `index.html`

Notes:

- The Vercel function is pinned to region `fra1`.
- This keeps serverless API routes and SPA routing compatible in one deployment.

## Agent policy files

- Runtime policy entrypoint: `AGENTS.md`
- Backend/API strict rules: `.claude/BACKEND_API_RULES.md`
- Module registry/order strict rules: `.claude/MODULE_REGISTRY_RULES.md`
- Frontend color/UX/UI strict rules: `.claude/FRONTEND_COLOR_UX_UI_RULES.md`

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit with clear messages.
4. Push and open a pull request.

## License

Distributed under the Unlicense. See `LICENSE.txt`.
