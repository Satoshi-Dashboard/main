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

## Backend/API Rules (Strict)

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
5. Do not infer live module identity from legacy component filenames/constants; use generated `MODULES` only.

## Architecture baseline (current)

- API route definitions live in `server/app.js`.
- Local runtime entrypoint is `server/index.js`.
- Serverless entrypoint is `api/index.js`.
- Shared runtime cache layer is `server/shared/runtimeCache.js`.
- Endpoint refresh policy is request-time with stale fallback + lock.

## Rules for creating/changing endpoints

1. Register new routes only in `server/app.js`.
2. Use `asyncRoute(...)` wrapper for route handlers.
3. Set explicit cache headers with endpoint-specific TTL.
4. `refresh` routes must pass `requireRefreshToken`.
5. Return stable JSON shapes; add fields without removing current ones.
6. Use controlled error responses (`4xx/5xx`) with concise error messages.
7. Keep frontend callers on relative `/api/...` paths so local dev proxying and Vercel rewrites continue to work.

## Rules for data fetching and cache

1. Use timeout for all external fetches.
2. Use stale-if-error fallback whenever possible.
3. Use `withCacheLock(...)` for expensive refresh paths.
4. Use namespaced cache keys via `server/shared/runtimeCache.js`.
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

## Vercel/runtime compatibility (mandatory)

1. Keep new backend behavior compatible with `api/index.js` as the serverless entrypoint.
2. If adding new upstream origins, review `vercel.json` headers and `Content-Security-Policy` to ensure required `connect-src`, `img-src`, `font-src`, or other directives remain valid.
3. Do not convert frontend API calls to absolute production URLs unless the owner explicitly requests it.
4. Re-check `vercel.json` rewrites whenever route structure changes.

## Testing/verification checklist (required)

After backend/API changes, run:

1. `node --check server/app.js`
2. `npm run build`
3. Verify serverless compatibility assumptions still match `api/index.js` and `vercel.json`.
4. Smoke test these endpoints:
   - `/api/btc/rates`
   - `/api/s03/multi-currency/status`
   - `/api/s10/stablecoins`
   - `/api/public/fear-greed`
   - `/api/visitors/stats`
   - `/api/bitnodes/cache/status`
   - `/api/s12/btc-distribution/status`
   - `/api/s13/addresses-richer/status`

## Documentation updates (required)

When backend/API behavior changes:

1. Update `README.md` backend/API sections.
2. Update issue templates if reporting requirements changed.
3. Do not create throwaway docs; keep docs minimal and current.

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/BACKEND_API_RULES.md`
- **Tipo de Evento/Contexto:** Configuración universal de automejora
- **Descripción del Evento Original:** Las reglas backend/API no empezaban con una política universal de aprendizaje ni incluían un anexo histórico obligatorio para registrar correcciones y mejoras.
- **Acción Realizada/Corrección:** Se añadió la regla universal como apertura del documento y se creó el registro histórico al final para documentar lecciones futuras.
- **Nueva/Modificada Regla o Directriz:** Todo cambio backend/API debe heredar la regla universal de automejora y registrar en este archivo cualquier ajuste relevante de reglas o conocimiento.
- **Justificación:** Hace auditable la evolución de la política backend y ayuda a prevenir recaídas en errores de arquitectura, compatibilidad o verificación.
