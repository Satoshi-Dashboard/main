# Backend/API Rules (Strict)

This file is mandatory for any backend or API change in this repository.

## Scope

Apply these rules when editing anything under:
- `server/**`
- `api/**`
- `btcRates.js`
- `vercel.json`
- any frontend call to `/api/*`

## Non-negotiable constraints

1. Do not change UI/UX structure, layout, typography, spacing, or visual behavior while doing backend work.
2. Do not change external data sources unless explicitly requested by the project owner.
3. Keep existing endpoint contracts backward-compatible.
4. Keep relative API paths used by frontend (`/api/...`).
5. Keep serverless compatibility (Vercel-first runtime behavior).

## Architecture baseline (current)

- API route definitions live in `server/app.js`.
- Local runtime entrypoint is `server/index.js`.
- Serverless entrypoint is `api/index.js`.
- Shared runtime cache layer is `server/runtimeCache.js`.
- Endpoint refresh policy is request-time with stale fallback + lock.

## Rules for creating/changing endpoints

1. Register new routes only in `server/app.js`.
2. Use `asyncRoute(...)` wrapper for route handlers.
3. Set explicit cache headers with endpoint-specific TTL.
4. `refresh` routes must pass `requireRefreshToken`.
5. Return stable JSON shapes; add fields without removing current ones.
6. Use controlled error responses (`4xx/5xx`) with concise error messages.

## Rules for data fetching and cache

1. Use timeout for all external fetches.
2. Use stale-if-error fallback whenever possible.
3. Use `withCacheLock(...)` for expensive refresh paths.
4. Use namespaced cache keys via `server/runtimeCache.js`.
5. If KV is unavailable, local fallback must still work.

## Performance and reliability

1. Prevent thundering herd on stale refresh.
2. Avoid long blocking operations in request path unless cached.
3. Keep payload shape lean when possible; avoid unnecessary oversized data.

## Security

1. Protect mutation/refresh endpoints in production with `REFRESH_API_TOKEN`.
2. Never log secrets or tokens.
3. Keep visitor/IP handling hashed and minimal.

## Testing/verification checklist (required)

After backend/API changes, run:

1. `node --check server/app.js`
2. `npm run build`
3. Smoke test these endpoints:
   - `/api/btc/rates`
   - `/api/bitnodes/cache/status`
   - `/api/s10/btc-distribution/status`
   - `/api/s14/addresses-richer/status`

## Documentation updates (required)

When backend/API behavior changes:

1. Update `README.md` backend/API sections.
2. Update issue templates if reporting requirements changed.
3. Do not create throwaway docs; keep docs minimal and current.
