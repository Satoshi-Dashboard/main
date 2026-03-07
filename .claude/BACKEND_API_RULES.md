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

## Module index preflight (mandatory)

Before applying any backend/API change that references modules by number, slug, title, route behavior, or module-specific data:

1. Re-read `src/config/modules.js` and confirm the current `code <-> slug <-> title` mapping.
2. Do not trust prior chat memory for module identity/order; always use current registry as source of truth.
3. If touching frontend calls to `/api/*` for a specific module, verify that module slug/code still match the intended target.
4. In final verification, re-check that no unintended module reindexing happened.

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

## Provider-aware refresh budget policy (mandatory)

This is a strict global rule for every external API integration (new or existing):

1. One upstream refresh window, many client readers
   - Public traffic must read cached payloads.
   - 1000 concurrent users must not trigger 1000 upstream calls.
   - Refresh attempts must be single-flight via cache lock + shared cache whenever available.

2. Always define per-provider budget profile
   - `hard_daily_limit` and `hard_minute_limit` when known.
   - `safe_daily_budget` and `safe_minute_budget` below hard limits (mandatory safety margin).
   - `min_interval_ms` derived from safe daily budget (or stricter by provider cadence).

3. Respect provider freshness signals
   - If provider returns cache/freshness timestamps (`until`, `next_update`, etc.), do not re-request before that point.
   - Effective next refresh = max(local safe interval, provider freshness boundary).

4. Throttle behavior under pressure
   - If budget window is exhausted, return last valid cached payload and move next update forward.
   - Do not fail hard if a valid stale payload exists.

5. Endpoint contract stability
   - Keep existing response fields.
   - New operational metadata can be additive only (e.g., source provider, fallback flag, refresh limits).

6. UX-facing refresh messaging
   - Surface concise refresh ETA in frontend (`min` / `h`), not only raw timestamps.
   - Keep warning/disclaimer text discreet and semantically clear.

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
