---
aliases:
  - Backend API Policy
  - Backend Rules
tags:
  - claude/policy
  - claude/backend
  - claude/rag-source
note_type: policy
domain: backend
agent_priority: high
source_status: canonical-local
---

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

## Addendum Skills-First de Autoridad Tecnica

Las skills instaladas en `.claude/skills/` son la base tecnica primaria del repo. Este archivo no las reemplaza: las adapta al backend real del proyecto y agrega guardrails locales sobre contratos publicos, seguridad operativa, cache, compatibilidad Vercel e integridad de rutas.

## Obsidian Context

- Home: [[VAULT_HOME]]
- Retrieval: [[RAG_OPERATING_SYSTEM]]
- Policy cluster: [[POLICY_INDEX]]
- Related: [[DATA_SOURCE_INTEGRITY_RULES]], [[MODULE_REGISTRY_RULES]], [[SKILLS_INDEX]]

## Backend/API Rules (Strict)

This file is mandatory for any backend or API change in this repository.

## Scope

Apply these rules when editing anything under:
- `server/**`
- `api/**`
- `server/services/btcRates.js`
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

1. Re-read `src/features/module-registry/modules.js` and confirm the current `code <-> slug <-> title` mapping.
2. Do not trust prior chat memory for module identity/order; always use current registry as source of truth.
3. If touching frontend calls to `/api/*` for a specific module, verify that module slug/code still match the intended target.
4. In final verification, re-check that no unintended module reindexing happened.
5. Do not infer live module identity from legacy component filenames/constants; use generated `MODULES` only.

## Architecture baseline (current)

- API route definitions live in `server/app.js`.
- Local runtime entrypoint is `server/index.js`.
- Serverless entrypoint is `api/index.js`.
- Shared runtime cache layer is `server/core/runtimeCache.js`.
- Runtime disk snapshot files live under `server/.runtime-cache/`.
- Shared backend pipelines live in `server/services/` and module-specific backends live in `server/features/<domain>/`.
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
4. Use namespaced cache keys via `server/core/runtimeCache.js`.
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
3. Keep any user/IP handling minimal and privacy-conscious.
4. Uncaught backend errors must return generic 5xx payloads while detailed diagnostics stay in internal logs with a request correlation ID.
5. Public and refresh API surfaces must use explicit rate limiting that remains compatible with local dev and Vercel serverless execution.

## Vercel/runtime compatibility (mandatory)

1. Keep new backend behavior compatible with `api/index.js` as the serverless entrypoint.
2. If adding new upstream origins, review `vercel.json` headers and `Content-Security-Policy` to ensure required `connect-src`, `img-src`, `font-src`, or other directives remain valid.
3. Do not convert frontend API calls to absolute production URLs unless the owner explicitly requests it.
4. Re-check `vercel.json` rewrites whenever route structure changes.
5. Preserve immutable cache headers only for hashed static assets (for example `/assets/*`); do not apply long-lived cache headers to HTML entry routes or `/api/*` responses.

## Testing/verification checklist (required)

After backend/API changes, run:

1. `node --check server/app.js`
2. `npm run check:security`
3. `npm run build`
4. Verify serverless compatibility assumptions still match `api/index.js` and `vercel.json`.
5. Smoke test these endpoints:
   - `/api/btc/rates`
   - `/api/s03/multi-currency/status`
   - `/api/s10/stablecoins`
   - `/api/public/fear-greed`
   - `/api/bitnodes/cache/status`
   - `/api/s12/btc-distribution/status`
   - `/api/s13/addresses-richer/status`

## Documentation updates (required)

When backend/API behavior changes:

1. Update `README.md` backend/API sections only if the owner explicitly requested a README change in the current task.
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

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/BACKEND_API_RULES.md`
- **Tipo de Evento/Contexto:** Optimización segura de Vercel
- **Descripción del Evento Original:** La política Vercel/runtime no dejaba explícita la diferencia entre cache largo permitido para assets hasheados y cache agresivo no deseado en HTML/API.
- **Acción Realizada/Corrección:** Se añadió una regla específica para conservar cache inmutable solo en assets estáticos versionados y evitar aplicarlo a entry HTML o respuestas API.
- **Nueva/Modificada Regla o Directriz:** Las optimizaciones de cache en `vercel.json` deben limitarse a assets hasheados; HTML y `/api/*` deben seguir con estrategias compatibles con deploys frescos y headers por endpoint.
- **Justificación:** Previene bugs de despliegue donde usuarios reciben bundles o shells obsoletos por una política de cache demasiado amplia.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/BACKEND_API_RULES.md`
- **Tipo de Evento/Contexto:** Alineación backend tras reorganización estructural
- **Descripción del Evento Original:** La política backend hacía referencia a ubicaciones previas de servicios y caché, lo que podía desalinear verificaciones y revisiones arquitectónicas.
- **Acción Realizada/Corrección:** Se actualizaron las rutas backend al nuevo esquema `server/core`, `server/services` y `server/features/<domain>` y se documentó explícitamente esa separación.
- **Nueva/Modificada Regla o Directriz:** Las verificaciones backend deben usar las rutas actuales de infraestructura compartida y respetar la separación entre primitives (`server/core`) y pipelines/feature backends (`server/services`, `server/features`).
- **Justificación:** Evita que futuros agentes editen archivos obsoletos o evalúen una arquitectura distinta a la realmente desplegada.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `.claude/BACKEND_API_RULES.md`
- **Tipo de Evento/Contexto:** Retiro de endpoint backend obsoleto
- **Descripción del Evento Original:** La checklist backend seguía exigiendo smoke tests sobre `/api/visitors/stats` y la sección de seguridad lo trataba como capacidad vigente, aunque el feature de visitor counter fue eliminado.
- **Acción Realizada/Corrección:** Se retiró ese endpoint de la verificación obligatoria y se generalizó la regla de privacidad para no anclarla a un feature ya removido.
- **Nueva/Modificada Regla o Directriz:** Cuando un endpoint backend se retire, `.claude/BACKEND_API_RULES.md` debe eliminarlo de las smoke checks y conservar solo reglas de seguridad que sigan aplicando al estado real del API.
- **Justificación:** Evita verificaciones fallidas sobre rutas inexistentes y mantiene la política backend enfocada en contratos realmente soportados.
- **Fecha de la ActualizaciÃ³n:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/BACKEND_API_RULES.md`
- **Tipo de Evento/Contexto:** Hardening operativo de errores, rate limiting y verificaciÃ³n de seguridad
- **DescripciÃ³n del Evento Original:** La polÃ­tica backend no exigÃ­a de forma explÃ­cita request IDs para correlaciÃ³n de errores, respuestas genÃ©ricas en 5xx no controlados ni una smoke check dedicada para throttling y guardas de refresh.
- **AcciÃ³n Realizada/CorrecciÃ³n:** Se reforzÃ³ la secciÃ³n de seguridad con reglas sobre request correlation y limitaciÃ³n de tasa, y se aÃ±adiÃ³ `npm run check:security` a la checklist obligatoria de verificaciÃ³n.
- **Nueva/Modificada Regla o Directriz:** Los cambios backend que afecten seguridad operacional deben verificar tanto compilaciÃ³n/deploy como request IDs, 5xx sanitizados y rate limiting mediante una smoke check dedicada.
- **JustificaciÃ³n:** Hace repetible la validaciÃ³n de hardening, reduce regresiones silenciosas y mantiene alineadas las expectativas entre entorno local y Vercel.

- **Fecha de la Actualizacion:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/BACKEND_API_RULES.md`
- **Tipo de Evento/Contexto:** Alineacion backend con jerarquia skills-first
- **Descripcion del Evento Original:** Las reglas backend seguian presentandose como autoridad tecnica primaria, aunque el owner redefinio que las skills instaladas deben liderar la guia tecnica y las politicas locales solo adaptar restricciones del repo.
- **Accion Realizada/Correccion:** Se añadio un addendum skills-first para dejar claro que este archivo especializa el guidance tecnico upstream con restricciones locales de contratos, seguridad, cache y compatibilidad Vercel.
- **Nueva/Modificada Regla o Directriz:** `.claude/BACKEND_API_RULES.md` ahora se interpreta como capa local de backend sobre la base tecnica de `.claude/skills/`, no como sustituto de esa base.
- **Justificacion:** Reduce conflictos entre futuras refactorizaciones guiadas por skills y requisitos no negociables del API real del proyecto.

- **Fecha de la Actualizacion:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/BACKEND_API_RULES.md`
- **Tipo de Evento/Contexto:** Migracion de snapshots runtime fuera de la raiz del repo
- **Descripcion del Evento Original:** Los caches backend persistidos seguian viviendo en la raiz del proyecto, lo que obligaba a excepciones de watch/ignore dispersas y mezclaba artefactos runtime con codigo fuente.
- **Accion Realizada/Correccion:** Se formalizo `server/.runtime-cache/` como ubicacion de snapshots backend y se actualizaron las rutas consumidoras para escribir ahi tras asegurar la carpeta en runtime.
- **Nueva/Modificada Regla o Directriz:** Los caches persistidos de backend deben vivir en una carpeta runtime dedicada bajo `server/`, no en la raiz del repo, y cualquier cambio de rutas debe mantener compatibilidad con Vercel/local fallback.
- **Justificacion:** Mantiene el workspace mas limpio, reduce ruido de tooling y deja mas clara la separacion entre codigo versionado y artefactos operativos.

- **Fecha de la Actualizacion:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/BACKEND_API_RULES.md`
- **Tipo de Evento/Contexto:** Adaptacion de politica a vault Obsidian y flujo RAG
- **Descripcion del Evento Original:** La politica backend era consumible por ruta directa, pero no estaba preparada para navegacion visual en Obsidian ni para ser descubierta mediante enlaces y metadata uniforme dentro de `.claude/`.
- **Accion Realizada/Correccion:** Se añadió frontmatter compatible con Obsidian y un bloque de contexto con enlaces al home del vault, al sistema RAG y al indice de politicas relacionadas.
- **Nueva/Modificada Regla o Directriz:** Esta politica backend debe mantenerse como nota canonica local enlazada dentro del vault `.claude/`, con metadata y backlinks suficientes para recuperacion humana y del agente.
- **Justificacion:** Mejora la trazabilidad en grafo, reduce perdida de contexto entre sesiones y facilita que Obsidian y el agente converjan sobre la misma fuente de verdad.
