<div align="center">
  <h1>Satoshi Dashboard</h1>
</div>
public/modulos-referencia/foto-metadata.png
</div>
  
  <p>
    <strong>An open-source Bitcoin dashboard focused on market context, network data, macro comparison, and honest source attribution.</strong>
  </p>
  <p>
    <img src="https://img.shields.io/badge/status-actively%20developed-2ea44f?style=for-the-badge" alt="Status">
    <img src="https://img.shields.io/badge/license-MIT-0b57d0?style=for-the-badge" alt="License">
    <img src="https://img.shields.io/badge/react-19-149eca?style=for-the-badge" alt="React 19">
    <img src="https://img.shields.io/badge/vercel-ready-black?style=for-the-badge" alt="Vercel Ready">
  </p>
  <p>
    Satoshi Dashboard turns scattered Bitcoin metrics into a calmer, one-module-at-a-time experience. It combines live market and network modules, public editorial routes, a cache-aware API layer, and explicit source transparency instead of hiding refresh limits or fallback behavior.
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#general-description">General Description</a></li>
    <li><a href="#system-architecture">System Architecture</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#product-surface">Product Surface</a></li>
    <li><a href="#module-status">Module Status</a></li>
    <li><a href="#data-and-api-philosophy">Data and API Philosophy</a></li>
    <li><a href="#local-development">Local Development</a></li>
    <li><a href="#environment-variables">Environment Variables</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#maintainer-docs">Maintainer Docs</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## General Description

Satoshi Dashboard is a React + Vite application with an Express API layer built for people who want more than a price ticker. The project presents Bitcoin price action, mempool activity, Lightning, macro comparisons, and educational modules in a guided interface where each module can stand on its own.

The product is designed around three principles:

- Honest source attribution
- Resilient cached delivery with stale-safe fallbacks
- A readable UI that favors context over noise

## System Architecture

```text
┌──────────────────────┐
│      Frontend        │
│  React 19 + Vite 7   │
│  Module player + SEO │
└──────────┬───────────┘
           │ /api/*
           ▼
┌──────────────────────┐
│    Express API       │
│ server/app.js        │
│ cache-first routing  │
└──────────┬───────────┘
           │
           ├───────────── Binance / Binance.US
           ├───────────── mempool.space
           ├───────────── Alternative.me
           ├───────────── Bitnodes / BitInfoCharts
           ├───────────── BTC Map / Natural Earth
           └───────────── Internal API endpoints
```

Runtime targets:

- Frontend bundle: Vercel-friendly SPA
- API runtime: local Node server or `api/index.js` on Vercel
- Cache model: in-memory first, optional shared KV second, stale fallback when upstream refreshes fail

## Tech Stack

- React 19
- React Router 7
- Vite 7
- Express 4
- Tailwind CSS 4
- TanStack React Query
- Recharts
- Leaflet / React Leaflet
- Vercel Analytics
- Vercel Speed Insights

## Product Surface

Primary routes:

- `/` - first live module
- `/module/:slug` - module player
- `/landingpage` - public landing route
- `/landingpage/blog` - blog index
- `/landingpage/blog/:slug` - blog article route

What you can explore today:

- Live price and chart modules
- Mempool, Bitnodes, and Lightning views
- BTC Map adoption density
- Stablecoin, Fear and Greed, and macro comparison modules
- Experimental preview modules clearly separated from fully live ones

## Module Status

- Total registry modules: `31`
- Live and indexable modules: `17`
- Under-construction modules: `14`
- Interactive preview modules: `S16`
- Legacy `/bitcoin-dashboard/*` routes still redirect to the current player structure

Current live/indexable set:

- `S01-S15`
- `S30`
- `S31`

Under-construction set:

- `S16-S29`

The source of truth for module identity, order, code, and slug generation is `src/features/module-registry/modules.js`.

## Data and API Philosophy

Satoshi Dashboard treats the API layer as part of the product, not just glue code.

- Upstream providers are wrapped behind cache-aware endpoints
- Expensive refreshes use single-flight locking
- Stale payloads can be served when upstreams fail or another refresh is already in progress
- Frontend modules usually keep the last good UI state during transient failures
- Public responses include `x-request-id` so incidents can be traced across logs and client sessions

Examples of real upstream dependencies used across the dashboard:

- Binance / Binance.US for BTC spot and price history
- mempool.space for Bitcoin network and Lightning data
- Alternative.me for Fear and Greed
- Bitnodes and BitInfoCharts for network and address distribution views
- BTC Map and Natural Earth for geographic modules
- Internal API endpoints for selected comparative and macro feeds

## Local Development

Requirements:

- Node.js 20+
- npm 10+

Install and run:

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run dev
npm run dev:ui
npm run dev:api
npm run build
npm run preview
npm run start:api
npm run check:security
npm run lint
```

Notes:

- `npm run dev` starts UI and API together
- `npm run preview` serves the built frontend only, so use `npm run start:api` in another terminal if you need live `/api/*` responses
- Local `/api` proxy behavior depends on `API_PROXY_TARGET`

## Environment Variables

Core runtime variables:

```env
API_PORT=8787
API_HOST=0.0.0.0
API_PROXY_TARGET=http://127.0.0.1:8787
REFRESH_API_TOKEN=your_refresh_token
PUBLIC_API_RATE_LIMIT_MAX=60
REFRESH_API_RATE_LIMIT_MAX=10
SCRAPER_BASE_URL=https://your-internal-api.example.com
KV_REST_API_URL=
KV_REST_API_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Copy `.env.example` to `.env` when needed.

For a reference scraper implementation, see `https://github.com/Satoshi-Dashboard/api-scraper`.

## Deployment

The repository is designed to stay compatible with Vercel.

- SPA routes rewrite to `index.html`
- API traffic resolves through `api/index.js`
- The same Express app used locally is reused for the deployed API surface
- Built assets under `/assets/*` are served with immutable cache headers
- HTML and API responses remain on rewrite-driven delivery so deploys propagate cleanly

Recommended validation before shipping:

```bash
npm run build
npm run check:security
```

## Maintainer Docs

Internal repo policy and agent-facing docs live in `.claude/`.

- `.claude/agent-runtime/AGENTS.md`
- `.claude/repo/PROJECT_STRUCTURE.md`
- `.claude/BACKEND_API_RULES.md`
- `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- `.claude/MODULE_REGISTRY_RULES.md`
- `.claude/FRONTEND_COLOR_UX_UI_RULES.md`

## Contributing

If you want to contribute:

1. Fork the repository
2. Create a feature branch
3. Keep data sourcing and refresh semantics honest
4. Validate the change locally
5. Open a pull request with clear rationale and impact

## License

This project is licensed under the MIT License. See `LICENSE.txt`.
