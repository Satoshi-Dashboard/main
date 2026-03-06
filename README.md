<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Unlicense License][license-shield]][license-url]

<br />
<div align="center">
  <h3 align="center">Satoshi Dashboard</h3>

  <p align="center">
    Bitcoin analytics platform with 29 interactive modules, built with React + Vite.
    <br />
    <a href="https://github.com/Satoshi-Dashboard/main"><strong>Explore the repo</strong></a>
    <br />
    <br />
    <a href="https://github.com/Satoshi-Dashboard/main/issues/new?labels=bug&template=bug_report.md">Report Bug</a>
    &middot;
    <a href="https://github.com/Satoshi-Dashboard/main/issues/new?labels=enhancement&template=feature_request.md">Request Feature</a>
  </p>
</div>

## About The Project

[![Satoshi Dashboard Screenshot][product-screenshot]](public/modulos-referencia/001-main-dashboard.png)

Satoshi Dashboard is a frontend-focused Bitcoin intelligence dashboard that groups market, network, valuation, and sentiment metrics into a single UI.

It includes 29 ready-to-use modules such as price trends, stablecoin peg health, MVRV, Stock-to-Flow, Fear & Greed, dominance, node versions, UTXO distribution, and more.

### Project Name and Metadata

- Official project name: `Satoshi Dashboard`
- Global SEO metadata is defined in `index.html` (description, keywords, Open Graph, Twitter cards, robots, and structured data).
- Favicon and home-screen icons are configured in `index.html` and `public/` (`favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`).
- PWA metadata is defined in `public/site.webmanifest` with app colors aligned to the dashboard theme (`#0A0A0F`).

### Distribution Data API (BitInfoCharts scraper)

- The backend now scrapes `https://bitinfocharts.com/top-100-richest-bitcoin-addresses.html` directly (HTML source, no r.jina.ai dependency).
- It extracts only the `Bitcoin distribution` table, normalizes values, and caches results server-side.
- Refresh is handled in request-time mode (stale TTL + on-demand refresh), with frontend polling every **60 seconds**.
- Available endpoints:
  - `GET /api/s10/btc-distribution` -> normalized JSON payload
  - `GET /api/s10/btc-distribution.js` -> generated JS module (`BTC_DISTRIBUTION`, `BTC_DISTRIBUTION_META`)
  - `GET /api/s10/btc-distribution/status` -> source, updatedAt, nextUpdateAt, rows
  - `GET /api/s10/btc-distribution/refresh` -> force refresh
- `S11 Address Distribution` consumes this API and shows grouped tiers (`<0.1`, `0.1-1`, `1-10`, etc.) with a visible `Auto update: 60s` indicator.

### Addresses Richer API (BitInfoCharts scraper)

- Module `S14` uses a dedicated scraper for the `Addresses richer than` table from the same BitInfoCharts source page.
- It reads the USD thresholds (`$1`, `$100`, `$1,000`, `$10,000`, `$100,000`, `$1,000,000`, `$10,000,000`) and the matching address counts.
- Refresh is handled in request-time mode (stale TTL + on-demand refresh), with frontend polling every **60 seconds**.
- Available endpoints:
  - `GET /api/s14/addresses-richer` -> normalized JSON payload
  - `GET /api/s14/addresses-richer.js` -> generated JS module (`BTC_ADDRESSES_RICHER`, `BTC_ADDRESSES_RICHER_META`)
  - `GET /api/s14/addresses-richer/status` -> source, updatedAt, nextUpdateAt, rows
  - `GET /api/s14/addresses-richer/refresh` -> force refresh

### Backend Architecture (Refactored)

- API app is now centralized in `server/app.js` (route registration + endpoint contracts).
- Local runtime entrypoint is `server/index.js` (starts Express listener only).
- Vercel serverless entrypoint is `api/index.js` (exports Express app directly).
- Runtime cache writes are now safe in read-only/serverless contexts (write failures do not break API responses).
- Refresh strategy is now request-time (`stale-if-error` fallback), replacing long-lived scheduler dependency for production.
- Phase 2 cache layer is active in `server/runtimeCache.js`: shared KV support + anti-thundering lock + endpoint TTL strategy.
- `REFRESH` endpoints can be protected in production via `REFRESH_API_TOKEN`.

### Agent Backend Rules

- Strict backend/API rules live at `.claude/BACKEND_API_RULES.md`.
- All automated agents (OpenCode/Codex/Claude) must read and follow those rules before backend/API work.
- Runtime policy entrypoint for agents is `AGENTS.md`.

### Backend/API Flow (Simple)

1. Frontend asks `/api/...` for data.
2. Backend checks cached data first.
3. If cache is fresh, it responds immediately.
4. If cache is stale, backend attempts refresh under lock (one refresher at a time).
5. If source fails, backend returns last known valid cache (when available).

### Vercel Deployment Notes

- `vercel.json` is configured for:
  - API rewrite: `/api/*` -> `api/index.js`
  - SPA rewrites for `BrowserRouter` routes (`/module/*` and fallback).
- Recommended env vars:
  - `KV_REST_API_URL` (optional; shared cache endpoint, Upstash/Vercel KV REST URL)
  - `KV_REST_API_TOKEN` (optional; shared cache token)
  - `UPSTASH_REDIS_REST_URL` (optional alias)
  - `UPSTASH_REDIS_REST_TOKEN` (optional alias)
  - `CACHE_KEY_PREFIX` (optional namespace prefix for cache keys)
  - `REFRESH_API_TOKEN` (optional; protects refresh endpoints)
  - `VISITOR_COUNTER_SALT` (optional; hashes visitor IPs)
  - `API_PORT` (local only)

### Repository Hygiene

- Legacy and duplicate frontend modules were removed.
- Legacy backend entrypoints and temporary scaffolding files were removed.
- Runtime logs/caches are generated locally and ignored by git.

### Built With

- [![React][React.js]][React-url]
- [![Vite][Vite.dev]][Vite-url]
- [![Tailwind CSS][Tailwind.css]][Tailwind-url]
- [![Recharts][Recharts.js]][Recharts-url]
- [![Framer Motion][Framer.motion]][Framer-url]

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/Satoshi-Dashboard/main.git
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. Run development server
   ```sh
   npm run dev
   ```

## Usage

- `npm run dev`: start frontend (Vite) + backend API server concurrently
- `npm run dev:ui`: start Vite frontend only
- `npm run start:api`: start main Express API (`server/index.js`)
- `npm run start`: start main Express API (`server/index.js`)
- `npm run build`: build production bundle in `dist/`
- `npm run preview`: preview production build locally
- `npm run lint`: run ESLint checks

## Modules and API Status

The table below shows current API usage per module. Modules without live endpoints are marked as `Proximamente`.

| Module | API status | Refresh | APIs/endpoints in use |
| --- | --- | --- | --- |
| `S01` Bitcoin Overview | Active | **15 s** | `CoinGecko /simple/price` + fallback `CoinCap /assets/bitcoin` + fallback `Binance /ticker/24hr` + fallback `Kraken /Ticker?pair=XBTUSD`.<br/>Mempool: `/api/v1/difficulty-adjustment`, `/api/blocks/tip/height`, `/api/v1/fees/recommended`, `/api/v1/mining/hashrate/3d`.<br/>Fear & Greed: `alternative.me/fng/?limit=7`. |
| `S02` Price Chart | Active | on mount + range change | Spot chain from `priceApi` (CoinGecko -> CoinCap -> Binance -> Kraken).<br/>History chain: `CoinGecko /coins/bitcoin/market_chart` -> fallback `Kraken /OHLC` -> fallback `CoinCap /assets/bitcoin/history`.<br/>Historical data is cached per selected range (7d / 30d / 90d / 1y) for the duration of the session. |
| `S03` Multi-Currency | Active | **60 s** | `CoinGecko /simple/price` (multi-currency) -> fallback `Binance /ticker/price` + `jsDelivr @fawazahmed0/currency-api` -> fallback `Kraken /Ticker` + `jsDelivr @fawazahmed0/currency-api`.<br/>Extra external dataset: Natural Earth GeoJSON via CloudFront. |
| `S04` Mempool Gauge | Active | **30 s** | Mempool variants: `/api/mempool`, `/api/v1/fees/recommended`. |
| `S05` Block Visualizer | Active | **real-time** (WebSocket) | WebSocket `wss://mempool.space/api/v1/ws` (live blocks + mempool-blocks + stats).<br/>REST: `/api/v1/blocks`, `/api/v1/fees/recommended`. Double-click any block to open in mempool.space. |
| `S08` Nodes Map | Active | **60 s** (server cache) | `Bitnodes /api/v1/snapshots/latest/` via local Express cache server (`server/`).<br/>Map tiles: `basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`. |
| `S09` Lightning Network | Active | **15 s** | `CoinGecko /simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`. |
| `S09b` Stablecoin Peg Health | Active | **60 s** (list) · once/session (sparklines) | `stablecoins.llama.fi/stablecoins?includePrices=true` (price + market cap).<br/>Sparkline history: `stablecoins.llama.fi/stablecoin/{id}` (14-day supply, lazy-loaded per card via IntersectionObserver — fetched once, cached for the session).<br/>Logos: jsDelivr SVG CDN → llamao.fi PNG 4× → text fallback. Interactive crosshair tooltip. |
| `S10` Fear & Greed | Active | **60 s** | `Alternative.me /fng/?limit=31`. |
| `S11` Address Distribution | Active | **60 s** | Local scraper API (`/api/s10/btc-distribution`) built from BitInfoCharts `Bitcoin distribution` table.<br/>Also exposes JS feed: `/api/s10/btc-distribution.js` and status/refresh endpoints. |
| `S12` BTC vs Gold | Active | on mount | `CoinGecko /coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily`. |
| `S13` Global Assets | Proximamente | — | No live API connected in the current component. |
| `S14` Transaction Count | Active | **60 s** | Local scraper API (`/api/s14/addresses-richer`) built from BitInfoCharts `Addresses richer than` table (`$1` to `$10,000,000`).<br/>Also exposes JS feed: `/api/s14/addresses-richer.js` and status/refresh endpoints. |
| `S15` Wealth Pyramid | Proximamente | — | No live API connected in the current component. |
| `S16` Mayer Multiple | Proximamente | — | No live API connected in the current component. |
| `S17` Price Performance | Active | on mount | `CoinGecko /simple/price?ids=bitcoin&vs_currencies=usd`. |
| `S18` Cycle Spiral | Proximamente | — | No live API connected in the current component. |
| `S19` Power Law Model | Proximamente | — | No live API connected in the current component. |
| `S20` Stock to Flow | Proximamente | — | No live API connected in the current component. |
| `S21` Big Mac Sats Tracker | Active | **5 min** (price) · **24 h** (data) | `Alternative.me /v2/ticker/bitcoin` (spot, every 5 min) + `Binance /api/v3/klines` (historical: 7d, 30d, 1y, 3y, 5y, 10y; reloaded every 24 h) + The Economist CSV `big-mac-adjusted-index.csv` filtered by `iso_a3=USA` (daily reload, source updated bimonthly). |
| `S22` Seasonality | Proximamente | — | No live API connected in the current component. |
| `S23` Big Mac Index | Active | on mount | `CoinGecko /simple/price?ids=bitcoin&vs_currencies=usd`. |
| `S24` Network Activity | Proximamente | — | No live API connected in the current component. |
| `S25` Log Regression | Proximamente | — | No live API connected in the current component. |
| `S26` MVRV Score | Proximamente | — | No live API connected in the current component. |
| `S27` Google Trends | Proximamente | — | No live API connected in the current component. |
| `S28` BTC Dominance | Proximamente | — | No live API connected in the current component. |
| `S29` UTXO Distribution | Proximamente | — | No live API connected in the current component. |
| `S30` Thank You Satoshi | Proximamente | — | No live API connected in the current component. |

## Roadmap

- [x] Build complete dashboard shell with 29 modules
- [x] Add reusable card, toast, and export interactions
- [x] Integrate live Bitcoin and blockchain APIs (S01–S05, S08–S10, S12, S14, S17, S21, S23)
- [x] Real-time WebSocket block visualizer (S05) with responsive layout
- [x] Stablecoin Peg Health module (S09b) with interactive sparklines and DeFiLlama live data
- [x] Local Express backend for Bitnodes cache (avoids rate-limiting on S08 nodes map)
- [x] Live Address Distribution pipeline (BitInfoCharts scraper + JSON/JS API + 60s refresh)
- [x] Live Addresses Richer pipeline for S14 (BitInfoCharts scraper + JSON/JS API + 60s refresh)
- [ ] Add user preferences persistence
- [ ] Add alerts/watchlists and custom module filtering

See the [open issues][issues-url] for planned improvements.

## Contributing

Contributions are welcome. If you want to improve modules, docs, or UI quality:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-improvement`)
3. Commit your Changes (`git commit -m 'feat: improve module X'`)
4. Push to the Branch (`git push origin feature/amazing-improvement`)
5. Open a Pull Request

## License

Distributed under the Unlicense. See `LICENSE.txt` for details.

## Acknowledgments

- [Best-README-Template](https://github.com/othneildrew/Best-README-Template)
- [Bitcoin whitepaper](https://bitcoin.org/bitcoin.pdf)
- [Recharts documentation](https://recharts.org/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
[contributors-shield]: https://img.shields.io/github/contributors/Satoshi-Dashboard/main.svg?style=for-the-badge
[contributors-url]: https://github.com/Satoshi-Dashboard/main/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Satoshi-Dashboard/main.svg?style=for-the-badge
[forks-url]: https://github.com/Satoshi-Dashboard/main/network/members
[stars-shield]: https://img.shields.io/github/stars/Satoshi-Dashboard/main.svg?style=for-the-badge
[stars-url]: https://github.com/Satoshi-Dashboard/main/stargazers
[issues-shield]: https://img.shields.io/github/issues/Satoshi-Dashboard/main.svg?style=for-the-badge
[issues-url]: https://github.com/Satoshi-Dashboard/main/issues
[license-shield]: https://img.shields.io/github/license/Satoshi-Dashboard/main.svg?style=for-the-badge
[license-url]: https://github.com/Satoshi-Dashboard/main/blob/main/LICENSE.txt
[product-screenshot]: public/modulos-referencia/001-main-dashboard.png
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://react.dev/
[Vite.dev]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[Vite-url]: https://vite.dev/
[Tailwind.css]: https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Recharts.js]: https://img.shields.io/badge/Recharts-FF6B6B?style=for-the-badge
[Recharts-url]: https://recharts.org/
[Framer.motion]: https://img.shields.io/badge/Framer%20Motion-black?style=for-the-badge&logo=framer
[Framer-url]: https://www.framer.com/motion/
