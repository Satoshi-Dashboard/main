---
aliases:
  - Project Structure Canonical
  - Repo Structure Guide
tags:
  - claude/repo
  - claude/policy
  - claude/rag-source
note_type: reference
domain: repo-structure
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

## Project Structure

This document defines the current source layout, explains where new code belongs, and keeps future contributions aligned with the feature/shared split introduced in the repository reorganization.

## Obsidian Context

- Home: [[VAULT_HOME]]
- Retrieval: [[RAG_OPERATING_SYSTEM]]
- Repo docs: [[REPO_DOCS_INDEX]]
- Related: [[agent-runtime/AGENTS]], [[POLICY_INDEX]]

## High-level layout

```text
satoshi-dashboard/
|- api/
|  `- index.js
|- public/
|- server/
|  |- app.js
|  |- core/
|  |- features/
|  |- index.js
|  `- services/
|- src/
|  |- App.jsx
|  |- features/
|  |- index.css
|  |- main.jsx
|  `- shared/
|- .claude/
|  |- agent-runtime/
|  |  `- AGENTS.md
|  `- repo/
|     `- PROJECT_STRUCTURE.md
|- AGENTS.md (bridge)
|- PROJECT_STRUCTURE.md (bridge)
|- README.md
|- jsconfig.json
|- package.json
|- vercel.json
`- vite.config.js
```

## Frontend

- `src/App.jsx`: top-level React route shell.
- `src/main.jsx`: browser entrypoint; mounts router and query client.
- `src/index.css`: global design tokens and base styles.
- `src/features/module-player/`: the module shell page and navigation logic.
- `src/features/module-registry/`: the source of truth for module identity, metadata, and SEO.
- `src/features/modules/live/`: production/live module implementations.
- `src/features/modules/under-construction/`: routable placeholder modules that still participate in the player.
- `src/features/seo/components/`: SEO-only chrome shared by landing/blog pages.
- `src/features/seo/content/`: editorial content, blog metadata, FAQ content, and SEO route constants.
- `src/features/seo/pages/`: landing page, blog index, and blog article pages.
- `src/shared/components/common/`: reusable UI primitives not owned by a single feature.
- `src/shared/hooks/`: cross-feature React hooks like SEO helpers.
- `src/shared/lib/`: low-level shared frontend infrastructure such as `fetchJson(...)` and the React Query client.
- `src/shared/services/`: frontend data-access helpers that call relative `/api/*` routes.
- `src/shared/utils/`: pure formatting and calculation helpers reused across modules.

## Backend

- `server/app.js`: Express composition root; register routes here.
- `server/index.js`: local API runtime entry.
- `server/core/`: backend runtime primitives shared by many services, currently cache/lock infrastructure.
- `server/services/`: shared backend data pipelines and parsers used by multiple endpoints or features.
- `server/features/<domain>/`: module-specific or domain-specific cache, scrape, and transform logic.
- `api/index.js`: Vercel serverless entrypoint; keep compatible with `server/app.js`.

## Static and runtime assets

- `public/`: static assets copied into the Vite build output.
- `dist/`: generated output only; do not hand-edit.
- Root `*_cache.json`: local runtime fallback files for backend caches.

## Placement rules

1. Keep module order changes isolated to `src/features/module-registry/modules.js`.
2. Put new module UI in `src/features/modules/live/` or `src/features/modules/under-construction/`, not in `src/shared/`.
3. Put reusable UI primitives in `src/shared/components/common/` only if at least two features can reasonably share them.
4. Put cross-feature frontend utilities in `src/shared/lib/`, `src/shared/services/`, `src/shared/hooks/`, or `src/shared/utils/` based on responsibility.
5. Put editorial copy, FAQ content, and blog datasets in `src/features/seo/content/` instead of generic config folders.
6. Register backend routes only in `server/app.js`; keep service/cache logic out of route definitions when practical.
7. Put shared backend fetch/cache pipelines in `server/services/` and low-level runtime helpers in `server/core/`.
8. Put backend code that belongs to one module or domain in `server/features/<domain>/`.
9. Do not add new business logic at the repository root unless it is a top-level runtime/config file.
10. Keep frontend API calls on relative `/api/*` paths for local proxy + Vercel rewrite compatibility.

## Import conventions

- Use the `@/*` alias for frontend imports that cross feature/shared boundaries.
- Prefer short relative imports only for files inside the same small feature subtree.
- Keep backend imports relative and Node/Vercel-compatible.
- Do not introduce absolute production API URLs unless explicitly required.

## Common contribution examples

### New live module

1. Add the component to `src/features/modules/live/`.
2. Register it in `src/features/module-registry/modules.js`.
3. Add SEO metadata in `src/features/module-registry/moduleSEO.js`.
4. Add strip/provider metadata in `src/features/module-registry/moduleDataMeta.js`.
5. Update backend services/routes only if the module needs new data.

### New shared frontend helper

1. Put HTTP/client primitives in `src/shared/lib/`.
2. Put API-facing convenience wrappers in `src/shared/services/`.
3. Put pure formatting/math helpers in `src/shared/utils/`.
4. If the helper mutates page metadata or React lifecycle state, consider `src/shared/hooks/`.

### New backend integration

1. Put shared provider logic in `server/services/`.
2. Put module/domain-specific orchestration in `server/features/<domain>/`.
3. Expose the route in `server/app.js`.
4. Preserve cache headers, fallback behavior, and serverless compatibility.
5. Update `.claude/DATA_SOURCE_INTEGRITY_RULES.md` if source/fallback/cadence changes, and update `README.md` only when the owner explicitly requested a public README edit in the current task.

### New SEO article or landing content

1. Add content objects to `src/features/seo/content/seoContent.js`.
2. Keep page components generic inside `src/features/seo/pages/`.
3. Reuse `src/features/seo/components/SeoChrome.jsx` for editorial navigation/chrome.

## Contribution checklist

- Confirm the target file belongs to the correct feature/shared/backend area before adding code.
- Reuse the current directory names instead of creating parallel folders with similar responsibilities.
- Update path aliases/imports if a move changes ownership boundaries.
- Run `npm run build` after frontend-impacting changes.
- Run `node --check server/app.js` after backend-impacting changes.
- Keep this file and the relevant `.claude/*.md` policy files aligned when architecture or data flow changes; touch `README.md` only under explicit owner instruction.

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `PROJECT_STRUCTURE.md`
- **Tipo de Evento/Contexto:** Creación de guía estructural del proyecto
- **Descripción del Evento Original:** El repositorio no tenía una guía dedicada que explicara la nueva jerarquía frontend/backend ni dónde ubicar futuras contribuciones tras la reorganización.
- **Acción Realizada/Corrección:** Se creó `PROJECT_STRUCTURE.md` con el árbol principal, reglas de ubicación, convenciones de importación y ejemplos de contribución.
- **Nueva/Modificada Regla o Directriz:** Las futuras contribuciones deben seguir la separación `src/features`, `src/shared`, `server/core`, `server/services` y `server/features/<domain>` documentada aquí.
- **Justificación:** Reduce ambiguedad al añadir código nuevo y ayuda a mantener la coherencia conseguida con la reestructuración.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `PROJECT_STRUCTURE.md`
- **Tipo de Evento/Contexto:** Retiro de runtime local del contador de visitantes
- **Descripción del Evento Original:** La guía estructural seguía mencionando `visitor_counter.json` como archivo runtime válido aunque el feature de conteo de visitantes fue eliminado del backend.
- **Acción Realizada/Corrección:** Se ajustó la sección de assets runtime para dejar solo los archivos `*_cache.json` que siguen activos.
- **Nueva/Modificada Regla o Directriz:** Cuando se elimine un feature backend con persistencia local, `.claude/repo/PROJECT_STRUCTURE.md` debe retirar de inmediato cualquier archivo runtime obsoleto de la descripción estructural.
- **Justificación:** Evita que futuros agentes asuman que todavía existe un contador de visitantes persistido en disco o intenten reutilizar una ruta ya retirada.

- **Fecha de la Actualización:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/repo/PROJECT_STRUCTURE.md`
- **Tipo de Evento/Contexto:** Reubicacion canonica de estructura del repo al vault Obsidian
- **Descripción del Evento Original:** La guia estructural del repo seguia fuera de `.claude/`, lo que la dejaba fuera del mapa visual principal de Obsidian aunque es conocimiento operativo del agente.
- **Acción Realizada/Corrección:** Se movió la version canonica a `.claude/repo/PROJECT_STRUCTURE.md`, se añadieron metadatos/links de vault y la raiz queda con un bridge de compatibilidad.
- **Nueva/Modificada Regla o Directriz:** La documentacion estructural operativa del repo debe vivir canonicamente dentro de `.claude/` y exponer puentes externos solo cuando otra superficie del repo la espere por ruta historica.
- **Justificación:** Mejora la navegacion jerarquica en Obsidian y alinea la arquitectura del repo con el sistema RAG compartido.
