# Regla Universal de Automejora y Actualización Continua de Documentos de Reglas

**Objetivo Primordial:** Este documento y **todos los demás archivos `.md` que contienen reglas, directrices o conocimientos operativos** deben ser actualizados proactivamente por el Agente de IA. La actualización se activará cada vez que se identifique y corrija un error (en código generado, recomendaciones, datos procesados, o en la aplicación de las propias reglas), o cuando se detecte una oportunidad significativa de mejora en la eficacia o el conocimiento del Agente. El propósito central es que el Agente de IA aprenda continuamente de sus experiencias, optimizando sus directrices internas, su coherencia y su relevancia a través de todos los documentos de conocimiento.

**Proceso de Actualización Automática de Documentos (`.md`):**
1. **Detección y Corrección de Eventos:** Cuando el Agente de IA (o un observador externo) identifique un error, un fallo en la aplicación de una regla, o una clara oportunidad de optimización/mejora, y este evento sea corregido o abordado.
2. **Análisis de Impacto:** El Agente de IA debe analizar la causa raíz del evento y determinar si su resolución requiere una mejora, adición o modificación en las reglas, directrices o conocimientos contenidos en **este documento** o en **cualquier otro archivo `.md` de reglas/conocimiento relacionado**.
3. **Ejecución de la Actualización del Archivo (`.md`):**
   * **Identificación del Cambio:** El Agente identificará la sección o regla que necesita ser actualizada, o si se debe añadir una nueva entrada de conocimiento.
   * **Formato del Registro (Anexo Histórico):** **Todas las actualizaciones deben ser registradas al final del documento afectado**, en una sección específicamente titulada `## Registro Histórico de Automejoras y Lecciones Aprendidas`. Cada entrada en este registro debe incluir los siguientes campos:
     * **Fecha de la Actualización:** `AAAA-MM-DD`
     * **Archivo(s) Afectado(s):** El nombre(s) del archivo(s) `.md` de reglas/conocimiento que se ha(n) modificado.
     * **Tipo de Evento/Contexto:** (Ej. Error de Lógica en módulo X, Aplicación Incorrecta de Regla Y, Oportunidad de Optimización en Z, Fallo de Seguridad).
     * **Descripción del Evento Original:** Breve explicación del problema detectado o la oportunidad de mejora identificada.
     * **Acción Realizada/Corrección:** Descripción de cómo se resolvió el problema o cómo se implementó la mejora.
     * **Nueva/Modificada Regla o Directriz:** La regla, directriz o entrada de conocimiento específica que se ha añadido, ajustado o resaltado en el documento para prevenir futuros problemas similares o mejorar la operación.
     * **Justificación:** Explicación concisa de por qué esta actualización es importante para el aprendizaje y la mejora del Agente de IA.
   * **Prioridad Recursiva:** Si una actualización afecta directamente la forma en que esta "Regla Universal de Automejora" debe aplicarse o describirse, entonces **esta misma regla debe ser ajustada** para reflejar la mejora en el proceso de automejora del Agente.

## Satoshi Dashboard

Satoshi Dashboard is an open-source Bitcoin dashboard built to make complex market, macro, network, and adoption data easier to explore in one place.

It is designed for people who want more than a price ticker: Bitcoin builders, curious newcomers, macro watchers, and anyone who prefers context over noise. The product combines live modules, honest source attribution, and a simple one-module-at-a-time reading experience.

## What Satoshi Dashboard aims to do

- Turn scattered Bitcoin data into a cleaner, guided dashboard experience
- Show what each module is actually measuring and where the data comes from
- Preserve source transparency instead of hiding scrapers, fallbacks, or refresh limits
- Mix live modules with clearly labeled experimental modules that are still being built

## What you can explore today

- Live Bitcoin market modules such as spot price, chart ranges, multi-currency quotes, mempool metrics, Lightning, Bitnodes, BTC Map, and macro comparisons
- A single-module player flow that lets each topic breathe instead of compressing everything into one overloaded page
- SEO landing and blog pages that explain the project and route readers into the live dashboard
- A public-facing API layer that powers the dashboard with cache-aware upstream fetches and stale-safe fallbacks

## Current project state

- Frontend module registry: **31 modules** generated from `src/features/module-registry/modules.js`
- Live and indexable module routes: **17** (`S01-S15`, `S30`, `S31`)
- Under-construction module routes: **14** (`S16-S29`) remain `noindex, follow`; **13** (`S17-S29`) still use the blocking overlay while `S16` is now an interactive preview route
- Primary routes:
  - `/` -> first live module (`S01`)
  - `/module/:slug` -> module player route
  - `/landingpage` -> SEO hub
  - `/landingpage/blog` and `/landingpage/blog/:slug` -> blog index and blog posts
- Legacy `/bitcoin-dashboard/*` routes still redirect to the current structure
- Runtime entrypoints:
  - local API: `server/index.js`
  - shared Express app: `server/app.js`
  - Vercel serverless entry: `api/index.js`

## Tech stack

- React 19
- React Router 7
- Vite 7
- Vercel Web Analytics
- Vercel Speed Insights
- Tailwind CSS 4
- Express 4
- TanStack React Query
- Recharts
- Framer Motion
- Leaflet / React Leaflet
- D3

## Architecture at a glance

### Frontend

- App shell and routing: `src/App.jsx`, `src/main.jsx`
- Module player shell: `src/features/module-player/ModulePage.jsx`
- Registry and generated slugs/codes: `src/features/module-registry/modules.js`
- Live modules: `src/features/modules/live/`
- Under-construction modules: `src/features/modules/under-construction/`
- SEO pages and editorial content: `src/features/seo/`
- Shared UI, hooks, data clients, and utilities: `src/shared/`

### Backend / API

- Route surface: `server/app.js`
- Shared cache/lock primitives: `server/core/runtimeCache.js`
- Shared provider pipelines: `server/services/`
- Module/domain-specific backend logic: `server/features/`

### Cache model

- Local in-process memory cache first
- Optional shared KV / Upstash Redis second
- Single-flight refresh locking for expensive upstream refreshes
- Stale payload fallback when a provider fails or a refresh is already in progress
- Frontend modules usually preserve last good UI state during transient failures

For contributor-facing placement rules and folder ownership, see `PROJECT_STRUCTURE.md`.

## Module registry (source of truth)

The module list is generated from array order in `src/features/module-registry/modules.js`. Codes and slugs are derived from that order, which means component filenames are not the final source of truth.

| Code | Title | Route |
| --- | --- | --- |
| S01 | Bitcoin Overview | `/` |
| S02 | Price Chart | `/module/s02-bitcoin-price-chart-live` |
| S03 | Multi-Currency | `/module/s03-bitcoin-price-multi-currency` |
| S04 | Mempool Gauge | `/module/s04-bitcoin-mempool-fees` |
| S05 | Long-Term Trend | `/module/s05-bitcoin-mempool-trend` |
| S06 | Nodes Map | `/module/s06-bitcoin-nodes-world-map` |
| S07 | Lightning Nodes Map | `/module/s07-lightning-nodes-world-map` |
| S08 | BTC Map Business Density | `/module/s08-bitcoin-merchant-map` |
| S09 | Lightning Network | `/module/s09-lightning-network-stats` |
| S10 | Stablecoin Peg Health | `/module/s10-stablecoin-peg-tracker` |
| S11 | Fear & Greed | `/module/s11-bitcoin-fear-greed-index` |
| S12 | Address Distribution | `/module/s12-bitcoin-address-distribution` |
| S13 | Wealth Pyramid | `/module/s13-bitcoin-wealth-pyramid` |
| S14 | Global Assets | `/module/s14-bitcoin-vs-global-assets` |
| S15 | BTC vs Gold | `/module/s15-bitcoin-vs-gold-chart` |
| S16 | Mayer Multiple | `/module/s16-bitcoin-mayer-multiple` |
| S17 | Price Performance | `/module/s17-bitcoin-price-performance` |
| S18 | Cycle Spiral | `/module/s18-bitcoin-halving-cycle-spiral` |
| S19 | Power Law Model | `/module/s19-bitcoin-power-law-model` |
| S20 | Stock to Flow | `/module/s20-bitcoin-stock-to-flow-model` |
| S21 | Big Mac Sats Tracker | `/module/s21-bitcoin-big-mac-sats-tracker` |
| S22 | Seasonality | `/module/s22-bitcoin-seasonality-heatmap` |
| S23 | Big Mac Index | `/module/s23-bitcoin-big-mac-index` |
| S24 | Network Activity | `/module/s24-bitcoin-network-activity` |
| S25 | Log Regression | `/module/s25-bitcoin-log-regression-channel` |
| S26 | MVRV Score | `/module/s26-bitcoin-mvrv-score` |
| S27 | Google Trends | `/module/s27-bitcoin-google-trends` |
| S28 | BTC Dominance | `/module/s28-bitcoin-dominance-chart` |
| S29 | UTXO Distribution | `/module/s29-bitcoin-utxo-distribution` |
| S30 | U.S. National Debt | `/module/s30-us-national-debt-live-counter` |
| S31 | Thank You Satoshi | `/module/s31-satoshi-nakamoto-bitcoin-whitepaper` |

## Real module data/source table

This section exists on purpose: public readers and contributors should be able to see which modules are truly live, which depend on static/local data, and which providers power the experience.

### Live and indexable modules

| Code | Title | Data path in app | Upstream/source priority | Fallback | Reload |
| --- | --- | --- | --- | --- | --- |
| S01 | Bitcoin Overview | `fetchBtcSpot()` + `/api/public/mempool/overview` | Spot: Binance -> Binance.US -> cached spot; overview: mempool.space + Alternative.me | Backend stale cache; UI keeps previous values | UI 30s; spot API 5s; overview API 30s |
| S02 | Price Chart | `fetchBtcSpot()` + `/api/public/binance/btc-history?days=1\|7\|30\|90\|365\|1825&interval=5m\|15m\|1h\|1d` | Spot: Binance -> Binance.US -> cached spot; history: Binance -> Binance.US (paginated for >1000 candles) | Backend stale cache; per-range frontend session cache | Spot 10s poll; history on mount/range change; history API refresh 5m (1825d: 60m) |
| S03 | Multi-Currency | `/api/s03/multi-currency` + `/api/public/geo/land` | BTC anchor from `/api/btc/rates`; FX: Investing scraper proxy -> direct Investing HTML scrape; land: Natural Earth | Stale shared FX payload; UI keeps previous globe/map state | UI 30s; S03 API 30s; land geo monthly |
| S04 | Mempool Gauge | `/api/public/mempool/overview` + `/api/public/mempool/official-usage` + `/api/public/mempool/node` | mempool.space overview + Zatobox official memory-usage scrape (fallback: mempool.space `/api/v1/init-data`) + Zatobox node mempool scrape (fallback: local Tor RPC `getmempoolinfo`) | Stale cache per feed; UI keeps previous values and separates official vs node views | UI 30s official / 5s node; API 30s official / 5s node |
| S05 | Long-Term Trend | `/api/public/mempool/live` | mempool.space blocks + mempool blocks + fees | Stale cache; UI shows reconnecting state and last good payload | UI 10s; API 10s |
| S06 | Nodes Map | `/api/bitnodes/cache` + `/api/public/geo/countries` | Bitnodes scraper proxy API -> direct Bitnodes API + snapshot -> Bitnodes HTML modal scrape; countries: Natural Earth | HTML modal fallback and stale cache reuse | UI polls 10m; Bitnodes refresh follows next snapshot / fallback scrape throttle; geo monthly |
| S07 | Lightning Nodes Map | `/api/public/lightning/world` + `/api/public/geo/countries` | mempool.space -> stale shared cache; countries: Natural Earth | Stale cache; UI keeps last payload | UI 60s; API 60s; geo monthly |
| S08 | BTC Map Business Density | `/api/public/btcmap/businesses-by-country` + `/api/public/geo/countries` | BTC Map places API + Natural Earth country matching | Stale aggregate cache | UI 10m; API 6h; geo monthly |
| S09 | Lightning Network | `fetchBtcSpot()` | Binance -> Binance.US -> cached spot | Previous UI value / null state if all fail | UI 15s; spot API 5s |
| S10 | Stablecoin Peg Health | `/api/s10/stablecoins`, `/api/s10/stablecoins/live-prices`, `/api/s10/stablecoin/:id` | CoinGecko markets list -> live prices derived from list -> CoinGecko market chart detail | Stale list/live/detail payloads from memory or KV | UI 2m; list/live API 2m; detail API ~5m |
| S11 | Fear & Greed | `/api/public/fear-greed?limit=31` | Alternative.me | Stale cache; UI keeps previous local state | UI on mount; API 6h |
| S12 | Address Distribution | `/api/s12/btc-distribution` | BitInfoCharts scraper proxy/direct HTML via shared parser | Stale shared cache | UI 30m; API 30m |
| S13 | Wealth Pyramid | `/api/s13/addresses-richer` | BitInfoCharts scraper proxy/direct HTML via shared parser | Stale shared cache | UI 30m; API 30m |
| S14 | Global Assets | `/api/s14/global-assets` | Scraper proxy -> `r.jina.ai` mirror of Newhedge snapshot | Stale shared cache | UI 60m; API 60m |
| S15 | BTC vs Gold | `/api/s15/btc-vs-gold-market-cap` | Binance BTC price/history transformed by backend with protocol-issued BTC supply estimates + Zatobox `companiesmarketcap-gold` snapshot | Backend serves cached/stale comparison payload with the latest gold market-cap reference line | UI on mount; BTC API 5m; gold API 15m |
| S30 | U.S. National Debt | `/api/public/us-national-debt` | U.S. Treasury Debt to the Penny + latest available U.S. Census ACS year (currentYear-1 down to 2020) | Stale debt/population cache; UI keeps last payload and keeps 1s local interpolation | UI 60s + 1s local tick; debt API 15m; population API 30d |
| S31 | Thank You Satoshi | Local component copy, QR, whitepaper quote | Local static content only | No remote dependency | Static |

## Under-construction modules (routable previews and noindex)

These modules are intentionally visible in the product because they communicate the roadmap and future direction of the dashboard. They remain routable and keep `noindex, follow` metadata until they are ready to be treated as fully live public pages. Most still ship with a blocking overlay; `S16` is now an interactive preview without the overlay so the module can be reviewed locally before final signoff.

| Code | Title | Status | Data path in app | Real source priority | Fallback | Reload |
| --- | --- | --- | --- | --- | --- | --- |
| S16 | Mayer Multiple | Interactive preview | `fetchBtcSpot()` + `/api/public/binance/btc-history?days=2025&interval=1d` with client-side SMA200 / MM derivation and a 200-day warmup for full 5Y coverage | Spot: Binance -> Binance.US -> cached spot; daily history: Binance -> Binance.US | Frontend memory cache + backend stale history cache; UI keeps last good spot | UI spot 10s; history on mount; history API refresh 60m |
| S17 | Price Performance | Under construction | `/api/btc/rates` + local historical constants | BTC spot: Binance -> Binance.US -> cached spot; house-price history is local | Static `84000` BTC fallback in component | UI on mount only |
| S18 | Cycle Spiral | Under construction | Local halving dates + waypoint price table | Local-only handcrafted cycle data | n/a | Static |
| S19 | Power Law Model | Under construction | Local regression/model data in component | Local-only model data | n/a | Static |
| S20 | Stock to Flow | Under construction | Local S2F model data in component | Local-only model data | n/a | Static |
| S21 | Big Mac Sats Tracker | Under construction | `/api/public/s21/big-mac-sats-data` | Combined feed: `/api/btc/rates` spot (Binance -> Binance.US -> cached spot) + Economist CSV + Binance/Binance.US historical closes | Stale combined cache; UI keeps last payload | UI 5m; combined API 7d; subfeeds 12h-24h |
| S22 | Seasonality | Under construction | Local monthly heatmap dataset in component | Local-only static dataset | n/a | Static |
| S23 | Big Mac Index | Under construction | `/api/btc/rates` + local `BIG_MAC_USD` constant | BTC spot: Binance -> Binance.US -> cached spot; burger price is local | Static `84000` BTC fallback in component | UI on mount only |
| S24 | Network Activity | Under construction | Local market-cap/dominance mock data in component | Local-only synthetic dataset | n/a | Static |
| S25 | Log Regression | Under construction | Local regression channel dataset in component | Local-only model data | n/a | Static |
| S26 | MVRV Score | Under construction | Local MVRV-style cycle data in component | Local-only model data | n/a | Static |
| S27 | Google Trends | Under construction | Local trend dataset in component | Local-only synthetic dataset | n/a | Static |
| S28 | BTC Dominance | Under construction | Local dominance dataset in component | Local-only dataset | n/a | Static |
| S29 | UTXO Distribution | Under construction | Local age-bucket dataset in component | Local-only static dataset | n/a | Static |

## API summary

The API layer is part of the product, not an afterthought. It exists to keep the dashboard fast, resilient, and transparent about source behavior.

Global behavior:

- Upstream providers are wrapped by cache-first single-flight refresh logic
- Stale payloads may be served when an upstream refresh fails or another runtime is already refreshing
- Every API response includes `x-request-id` so logs and client-side incidents can be correlated quickly
- Refresh endpoints require `REFRESH_API_TOKEN` outside explicit localhost traffic and accept either `x-refresh-token` or `Authorization: Bearer ...`
- `/api/public/*` is rate-limited to 60 requests per minute per IP and `/api/*/refresh` is rate-limited to 10 requests per minute per IP
- Frontend callers stay on relative `/api/...` routes for local development and Vercel rewrite compatibility

### BTC rates

- `GET /api/btc/rates`
- `GET /api/btc/rates/:currency`
- `GET /api/btc/refresh`

Notes:

- Near-live BTC spot cadence: about 5 seconds
- Spot priority: **Binance -> Binance.US -> cached BTC spot**
- Fiat conversion factors: **api.zatobox.io scraping Investing USD crosses** first, then direct Investing HTML scrape, then cached shared fiat data, then factors derived from the last BTC-rates payload when needed

### S03 multi-currency

- `GET /api/s03/multi-currency`
- `GET /api/s03/multi-currency/status`
- `GET /api/s03/multi-currency/refresh`

Notes:

- Uses `/api/btc/rates` as the BTC/USD anchor
- FX factors come from Investing USD crosses via scraper proxy first, direct HTML scrape second

### S10 stablecoin cache

- `GET /api/s10/stablecoins`
- `GET /api/s10/stablecoins/live-prices`
- `GET /api/s10/stablecoin/:id`

### S14 global assets

- `GET /api/s14/global-assets`
- `GET /api/s14/global-assets/status`
- `GET /api/s14/global-assets/refresh`

### Bitnodes cache

- `GET /api/bitnodes/cache`
- `GET /api/bitnodes/cache/status`
- `GET /api/bitnodes/cache/refresh`

Notes:

- Priority: scraper proxy API -> direct Bitnodes API snapshot -> Bitnodes HTML modal scrape
- Fallback payloads can switch `source_provider` to `bitnodes_scrape`

### BitInfoCharts-backed data

- `GET /api/s12/btc-distribution`
- `GET /api/s12/btc-distribution.js`
- `GET /api/s12/btc-distribution/status`
- `GET /api/s12/btc-distribution/refresh`
- `GET /api/s13/addresses-richer`
- `GET /api/s13/addresses-richer.js`
- `GET /api/s13/addresses-richer/status`
- `GET /api/s13/addresses-richer/refresh`

Notes:

- BitInfoCharts-backed payloads expose the upstream snapshot time separately from the backend check time so frontend metadata can distinguish stale source data from normal refresh polling.

### Public shared feeds

- `GET /api/public/mempool/overview`
- `GET /api/public/mempool/official-usage`
- `GET /api/public/mempool/live`
- `GET /api/public/fear-greed?limit=7|31`
- `GET /api/public/geo/countries`
- `GET /api/public/geo/land`
- `GET /api/public/lightning/world`
- `GET /api/public/btcmap/businesses-by-country`
- `GET /api/public/coingecko/bitcoin-market-chart?days=365`
- `GET /api/s15/btc-vs-gold-market-cap`
- `GET /api/public/binance/btc-history?days=1|7|30|90|365|1825|2025&interval=5m|15m|30m|1h|1d`
- `GET /api/public/s21/big-mac-sats-data`
- `GET /api/public/us-national-debt`

#### S02 chart range reference

#### S15 BTC vs Gold

Notes:

- BTC market cap is derived on the backend from Binance BTC price/history multiplied by an estimated circulating supply from Bitcoin's issuance schedule
- Gold uses `SCRAPER_BASE_URL/api/scrape/companiesmarketcap-gold` as the primary current market-cap snapshot via Zatobox
- The gold line is a current market-cap reference across the chart, not a reconstructed historical gold market-cap series

The Price Chart module (`src/features/modules/live/S02_PriceChart.jsx`) exposes 7 time ranges. Each maps to a `days` + `interval` pair that determines which Binance klines are requested.

| Range label | `days` | `interval` | Candles | Cache refresh |
| --- | --- | --- | --- | --- |
| LIVE | 1 | `15m` | 96 | 5 min |
| 1D | 1 | `5m` | 288 | 5 min |
| 1W | 7 | `1h` | 168 | 5 min |
| 1M | 30 | `1h` | 720 | 5 min |
| 3M | 90 | `1d` | 90 | 5 min |
| 1Y | 365 | `1d` | 365 | 5 min |
| 5Y | 1825 | `1d` | 1825 | 60 min |

Notes:

- Binance limits a single response to 1000 candles, so 5Y uses paginated requests
- `2025d + 1d` is reserved for S16 so the visible 5Y Mayer chart still has a full 200-day SMA warmup instead of a blank opening segment
- Each `days + interval` combination gets its own backend cache key
- The frontend keeps a per-session in-memory cache keyed by `{label}_{interval}` to reduce repeated range fetches

## API security

- Uncaught backend exceptions return a generic `500` payload with `requestId`; the detailed stack stays in server logs only
- Refresh routes fail closed when `REFRESH_API_TOKEN` is missing unless the request is explicitly loopback localhost traffic
- The included `npm run check:security` smoke test verifies `x-request-id` headers, public-route throttling, refresh throttling, and the fail-closed refresh guard
- Vercel edge headers now include `Strict-Transport-Security` and a hashed CSP for the inline JSON-LD block
- `style-src 'unsafe-inline'` still remains temporarily because the React UI currently uses inline `style={...}` attributes across multiple modules

## Environment variables

- `API_PORT` (default `8787`)
- `API_HOST` (default `0.0.0.0`)
- `API_PROXY_TARGET` (default `http://127.0.0.1:8787`)
- `REFRESH_API_TOKEN` (recommended for production refresh endpoints)
- `GENERAL_API_RATE_LIMIT_MAX` (default `240`)
- `PUBLIC_API_RATE_LIMIT_MAX` (default `60`)
- `REFRESH_API_RATE_LIMIT_MAX` (default `10`)
- `CACHE_KEY_PREFIX` (optional shared-cache namespace)
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` (optional Vercel KV)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (optional shared KV aliases)
- `SCRAPER_BASE_URL` (optional scraper proxy base URL; defaults to `https://api.zatobox.io`)

Copy `.env.example` to `.env` when needed.

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
- `npm run start` -> API only
- `npm run start:api` -> API only
- `npm run build` -> production build
- `npm run check:security` -> request-id, throttling, and refresh-guard smoke test
- `npm run preview` -> preview build
- `npm run preview:vercel-local` -> preview build bound to all interfaces (used by `vercel dev`)
- `npm run lint` -> ESLint

Development notes:

- Vite proxies `/api` to the API server via `API_PROXY_TARGET`
- Frontend alias `@/*` resolves to `src/*` via `vite.config.js` and `jsconfig.json`
- `vite.config.js` ignores generated cache JSON files to reduce unnecessary reload noise
- Shared KV is recommended on Vercel to avoid per-instance cache drift

## SEO and public assets

- Base metadata starts in `index.html` and is refined by `src/shared/hooks/usePageSEO.js` and `src/features/module-registry/moduleSEO.js`
- Public SEO assets include:
  - `public/robots.txt`
  - `public/sitemap.xml`
  - `public/llm.txt`
  - `public/site.webmanifest`
- Under-construction modules are excluded from sitemap and LLM indexing and ship with `noindex, follow`

## Deployment (Vercel)

`vercel.json` handles both SPA routes and the API layer:

- `/api/*` -> `api/index.js`
- `/module/*` -> `index.html`
- `/landingpage*` -> `index.html`
- non-file routes -> `index.html`

Notes:

- The serverless function is pinned to region `fra1`
- Vercel deploys use the same Express app used locally
- Local `vercel dev` intentionally runs a production preview build instead of raw Vite HMR so SPA rewrites do not hijack Vite internal module URLs such as `/@vite/client`
- Production traffic analytics and custom events are collected through `@vercel/analytics`, and performance telemetry through `@vercel/speed-insights`; both products must be enabled in the Vercel project dashboard to populate their panels
- Built assets under `/assets/*` are served with `Cache-Control: public, max-age=31536000, immutable`
- HTML entry routes continue to resolve through rewrites rather than long-lived immutable caching so new deploys propagate cleanly
- Security headers include `Strict-Transport-Security` plus a CSP hash for the inline JSON-LD block in `index.html`
- `style-src 'unsafe-inline'` remains in the CSP until the frontend stops relying on inline React style attributes
- If you add new remote origins, update `vercel.json` CSP and related header rules

## Maintainer docs

- `PROJECT_STRUCTURE.md` -> folder ownership and placement rules
- `AGENTS.md` -> runtime policy entrypoint for coding agents
- `.claude/BACKEND_API_RULES.md` -> backend and API constraints
- `.claude/DATA_SOURCE_INTEGRITY_RULES.md` -> approved data sources and fallback rules
- `.claude/MODULE_REGISTRY_RULES.md` -> module order and slug rules
- `.claude/FRONTEND_COLOR_UX_UI_RULES.md` -> frontend color, responsive, and UX rules

## Contributing

Contributions are welcome. If you want to improve data quality, fix UX issues, add a new module, or help complete an under-construction module:

1. Fork the repository
2. Create a feature branch
3. Keep source attribution and refresh behavior honest
4. Run validation locally
5. Open a pull request with a clear explanation of why the change matters

## License

Satoshi Dashboard is open-source under the MIT License. See `LICENSE.txt`.

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Configuración universal de automejora
- **Descripción del Evento Original:** El principal documento de conocimiento operativo del proyecto no empezaba con la regla universal ni tenía un anexo histórico para registrar mejoras aprendidas.
- **Acción Realizada/Corrección:** Se insertó la regla universal al inicio del `README.md` y se creó el registro histórico al final para futuras actualizaciones derivadas de errores o mejoras.
- **Nueva/Modificada Regla o Directriz:** El `README.md` pasa a tratarse como documento de conocimiento operativo sujeto a la política universal de automejora y trazabilidad histórica.
- **Justificación:** Garantiza que el documento más consultado por agentes mantenga memoria persistente de cambios de conocimiento y no quede fuera del ciclo de aprendizaje continuo.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Optimización de despliegue en Vercel
- **Descripción del Evento Original:** La documentación de despliegue no dejaba explícito cómo se optimizan los assets estáticos para Vercel ni qué debía mantenerse sin cacheo agresivo.
- **Acción Realizada/Corrección:** Se documentó la política de cacheo inmutable para `/assets/*` y se aclaró que las rutas HTML siguen resolviéndose por rewrites para propagar nuevos deploys sin servir shells obsoletos.
- **Nueva/Modificada Regla o Directriz:** El `README.md` ahora exige mantener cache largo solo para assets hasheados y preservar HTML/API fuera de esa política.
- **Justificación:** Ayuda a futuros agentes a optimizar Vercel sin introducir regresiones de cacheo que dejen deploys viejos en producción.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Reorganización estructural y corrección documental
- **Descripción del Evento Original:** El `README.md` seguía apuntando a rutas frontend/backend previas a la reorganización y describía el tracking de visitantes como si ya existiera un consumidor frontend activo.
- **Acción Realizada/Corrección:** Se actualizaron las rutas de arquitectura, se documentó el alias `@/*`, se añadió la referencia a `PROJECT_STRUCTURE.md` y se corrigió la nota de visitantes para reflejar el estado real del proyecto.
- **Nueva/Modificada Regla o Directriz:** La documentación principal debe reflejar la estructura vigente y distinguir entre endpoints backend expuestos y consumidores frontend realmente montados.
- **Justificación:** Mantiene precisa la guía de onboarding y evita que agentes o desarrolladores inspeccionen archivos obsoletos o asuman integraciones inexistentes.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Optimización de rendimiento frontend
- **Descripción del Evento Original:** El chequeo de velocidad mostró trabajo alto en main thread y JavaScript no usado porque el app shell cargaba rutas/editorial SEO y utilidades opcionales desde el bundle inicial aunque no fueran necesarias en la ruta principal.
- **Acción Realizada/Corrección:** Se separaron las constantes de rutas SEO en un módulo liviano, se lazy-loadearon las páginas editoriales y el QR de donación, y se eliminó la importación global redundante de Leaflet CSS para que solo cargue en módulos de mapa.
- **Nueva/Modificada Regla o Directriz:** Las rutas o utilidades no críticas para la pantalla inicial deben mantenerse fuera del bundle principal mediante imports diferidos, y las constantes compartidas de routing no deben depender de archivos de contenido pesado.
- **Justificación:** Reduce bytes y CPU de arranque sin alterar UX, backend ni comportamiento funcional, y evita que futuras mejoras SEO/editoriales degraden la velocidad de la home.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Reescritura pública del README y alineación de licencia
- **Descripción del Evento Original:** El `README.md` era útil para mantenedores técnicos, pero no explicaba con suficiente claridad al visitante público qué es Satoshi Dashboard, y además seguía declarando una licencia distinta a la deseada por el owner.
- **Acción Realizada/Corrección:** Se reescribió el README con tono más público y equilibrado, manteniendo las secciones técnicas solicitadas (`Module registry`, `Real module data/source table`, `Under-construction modules`, `API summary`, `Environment variables`) y se alineó la referencia de licencia a MIT.
- **Nueva/Modificada Regla o Directriz:** El `README.md` debe servir a la vez como portada pública del proyecto y como documento honesto de fuentes, estado de módulos, API y licencia vigente.
- **Justificación:** Mejora la primera impresión del repositorio, reduce ambiguedad para usuarios no técnicos y evita inconsistencias legales/documentales al publicar el proyecto como open source MIT.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Retiro de feature frontend no adoptada
- **Descripción del Evento Original:** La documentación pública había empezado a mencionar un flujo de export markdown para IA que el owner decidió descartar por baja utilidad antes de consolidarlo como parte del producto.
- **Acción Realizada/Corrección:** Se eliminó la referencia pública a esa capacidad para que el `README.md` vuelva a reflejar solo funcionalidades activas y deseadas por el owner.
- **Nueva/Modificada Regla o Directriz:** El `README.md` solo debe promocionar capacidades activas que el owner considera realmente útiles y permanentes en la experiencia del dashboard.
- **Justificación:** Evita sobreprometer funciones descartadas y mantiene la portada pública alineada con el producto que realmente se quiere ofrecer.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Evolución funcional de módulo preview S16
- **Descripción del Evento Original:** `S16` seguía documentado como mock local con overlay bloqueante, aunque se convirtió en un preview interactivo derivado de la misma historia de precio BTC usada por `S02`.
- **Acción Realizada/Corrección:** Se actualizó el estado del módulo en el README para distinguir entre previews `noindex` y overlays bloqueantes, y se reemplazó la historia de datos de `S16` por su flujo real basado en spot e histórico diario de Binance con cálculo cliente de SMA200/Mayer Multiple.
- **Nueva/Modificada Regla o Directriz:** El `README.md` debe describir con honestidad cuándo un módulo preview ya es interactivo y qué flujo real de datos usa, sin seguir llamándolo mock una vez que comparte servicios productivos del dashboard.
- **Justificación:** Evita confusión entre QA local, estado SEO y veracidad de datos, y ayuda a futuros agentes a no revertir el módulo a una narrativa documental obsoleta.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Corrección de cobertura histórica para indicador derivado S16
- **Descripción del Evento Original:** La primera documentación del preview `S16` describía una carga de `1825` días, pero eso no dejaba margen suficiente para una SMA200 completa al inicio del rango visible de 5 años.
- **Acción Realizada/Corrección:** Se ajustó el README para documentar la carga real de `2025` días y se añadió la nota de warmup para explicar por qué `S16` necesita historia adicional aunque solo muestre 5 años al usuario.
- **Nueva/Modificada Regla o Directriz:** Cuando un módulo derivado necesita historial extra para construir correctamente el rango visible, el `README.md` debe documentar ese warmup explícitamente en lugar de simplificarlo hasta volverlo engañoso.
- **Justificación:** Mejora la transparencia técnica del proyecto y evita que futuros mantenedores recorten la serie base por creer que el exceso de historia es accidental o innecesario.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Sustitución de fuente comparativa en S15
- **Descripción del Evento Original:** `S15` seguía documentado como dependiente de CoinGecko y de un mapa estático local del oro, aunque el owner pidió eliminar CoinGecko de este módulo y consumir la referencia de oro desde la API de Zatobox.
- **Acción Realizada/Corrección:** Se actualizó la tabla de fuentes y la sección API para describir el nuevo flujo: precio/histórico BTC desde Binance, market cap BTC derivado por emisión protocolaria y market cap actual del oro desde `api.zatobox.io/api/scrape/companiesmarketcap-gold`.
- **Nueva/Modificada Regla o Directriz:** Cuando un módulo comparativo derive capitalización desde precio + supply en backend, el `README.md` debe explicitar la fórmula y diferenciar claramente entre una serie histórica derivada y una referencia actual fija proveniente de un scraper.
- **Justificación:** Evita volver a presentar `S15` como CoinGecko-backed, mejora la honestidad documental del gráfico y deja claro por qué la línea del oro no representa historial completo.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Integración de analítica web en despliegue Vercel
- **Descripción del Evento Original:** El proyecto incorporó `@vercel/analytics` para medir tráfico real en producción, pero la documentación pública todavía no indicaba que Vercel Web Analytics formaba parte del stack ni que debía estar habilitado en el dashboard para que aparecieran métricas.
- **Acción Realizada/Corrección:** Se añadió Vercel Web Analytics al stack documentado y se incorporó una nota explícita en la sección de despliegue para recordar el requisito de activación en Vercel.
- **Nueva/Modificada Regla o Directriz:** Cuando el proyecto adopte una capacidad operativa ligada al runtime o al panel de Vercel, el `README.md` debe reflejar tanto la dependencia instalada como cualquier prerrequisito de activación fuera del repositorio.
- **Justificación:** Reduce configuraciones incompletas donde el código ya emite eventos pero el owner no ve métricas en el panel por faltar la activación del servicio en Vercel.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Expansión de observabilidad frontend en Vercel
- **Descripción del Evento Original:** El dashboard añadió custom events para rutas clave y empezó a instrumentar Speed Insights, pero la documentación operativa no reflejaba todavía el alcance completo de la observabilidad activa en producción.
- **Acción Realizada/Corrección:** Se amplió la documentación para incluir Vercel Speed Insights en el stack y para dejar claro que el despliegue ahora emite pageviews, eventos custom de navegacion/landing y telemetría de rendimiento.
- **Nueva/Modificada Regla o Directriz:** Cuando se amplíe la observabilidad del producto con nuevas categorías de eventos o performance telemetry, el `README.md` debe describir tanto la herramienta añadida como el tipo de señal que se espera ver en Vercel.
- **Justificación:** Facilita que futuros agentes y maintainers entiendan por qué aparecen nuevas métricas en Vercel y evita diagnosticar como bug una integración que solo estaba pobremente documentada.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Retiro del visitor counter backend
- **Descripción del Evento Original:** El README seguía documentando endpoints y variables de entorno del visitor counter aunque el owner pidió eliminar el conteo de personas que entran en la app.
- **Acción Realizada/Corrección:** Se retiraron la sección API de visitantes, la variable `VISITOR_COUNTER_SALT` y la nota de KV asociada a ese feature eliminado.
- **Nueva/Modificada Regla o Directriz:** Cuando un feature operativo se retire por completo, el `README.md` debe eliminar sus endpoints, variables y notas de infraestructura en la misma tarea para que la documentación pública no prometa capacidades inexistentes.
- **Justificación:** Mantiene la documentación alineada con el comportamiento real del despliegue y evita integraciones o revisiones basadas en endpoints ya inexistentes.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Comparativa dual en S04 entre mempool oficial y nodo propio
- **Descripción del Evento Original:** `S04` solo documentaba el bundle general de mempool.space, aunque ahora debe exponer una comparativa modal entre la vista oficial de mempool.space y la vista del nodo Bitcoin Knots del owner, con un scrape dedicado para el usage oficial.
- **Acción Realizada/Corrección:** Se actualizó la fila de `S04` y la lista de feeds públicos para incluir `/api/public/mempool/official-usage` junto a `/api/public/mempool/node`, dejando explícito que la UI separa ambas vistas, sus cadencias, el fallback oficial hacia `mempool.space /api/v1/init-data` y el fallback del nodo hacia Tor RPC local.
- **Nueva/Modificada Regla o Directriz:** Cuando un módulo compare dos alcances de mempool dentro de la misma superficie, el `README.md` debe listar cada feed implicado, aclarar si la UI mantiene esas vistas separadas y documentar cualquier fallback que conserve la misma semántica oficial o node-scoped.
- **Justificación:** Evita que futuros agentes o maintainers vuelvan a asumir que `S04` representa una sola fuente o que el gauge principal sale del mismo feed que la vista del nodo propio.
- **Fecha de la ActualizaciÃ³n:** `2026-03-13`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Hardening de seguridad API y despliegue Vercel
- **DescripciÃ³n del Evento Original:** La documentaciÃ³n principal no reflejaba todavÃ­a el nuevo request ID por respuesta, los lÃ­mites por IP, el fail-closed de refresh fuera de localhost ni el endurecimiento CSP/HSTS en Vercel.
- **AcciÃ³n Realizada/CorrecciÃ³n:** Se ampliaron las secciones API, variables de entorno, scripts locales y despliegue para explicar el nuevo flujo de seguridad y la verificaciÃ³n automatizada con `npm run check:security`.
- **Nueva/Modificada Regla o Directriz:** Cuando cambie la postura de seguridad del backend o de los headers edge, el `README.md` debe documentar tanto el comportamiento runtime como la forma de verificarlo localmente sin romper Vercel.
- **JustificaciÃ³n:** Reduce errores de operaciÃ³n, facilita auditorÃ­as futuras y evita que un deploy seguro quede parcialmente documentado o se revierta por desconocimiento.

- **Fecha de la Actualizacion:** `2026-03-13`
- **Archivo(s) Afectado(s):** `README.md`
- **Tipo de Evento/Contexto:** Correccion de preview local Vercel para frontend SPA
- **Descripcion del Evento Original:** `vercel dev` estaba levantando el frontend con el servidor HMR de Vite y las rewrites SPA interceptaban rutas internas como `/@vite/client` y `/@react-refresh`, dejando la aplicacion en blanco aunque la home respondiera `200`.
- **Accion Realizada/Correccion:** Se documento que el flujo local de `vercel dev` debe arrancar un preview build en lugar del dev server HMR para mantener visibles tanto la SPA como las funciones API bajo la misma superficie local.
- **Nueva/Modificada Regla o Directriz:** Cuando `vercel dev` comparta puerto con una SPA Vite en este repositorio, la documentacion debe preferir `vite preview` sobre el dev server HMR para evitar que las rewrites de Vercel rompan los modulos internos del cliente.
- **Justificacion:** Evita diagnosticos enganiososos de pantalla en blanco, deja un flujo local reproducible y protege el deploy de Vercel sin degradar el `npm run dev` tradicional.
