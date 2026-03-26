---
aliases:
  - Module Registry Policy
  - Module Registry Rules
tags:
  - claude/policy
  - claude/modules
  - claude/rag-source
note_type: policy
domain: module-registry
agent_priority: high
source_status: canonical-local
---

## Addendum Skills-First de Autoridad Tecnica

Las skills instaladas en `.claude/skills/` mandan primero para guidance tecnico general. Este archivo sigue siendo la capa local no negociable para identidad, orden, slugs y verificacion del registro de modulos, porque esa informacion depende del producto real y no de heuristicas genericas.

## Obsidian Context

- Home: [[VAULT_HOME]]
- Retrieval: [[RAG_OPERATING_SYSTEM]]
- Policy cluster: [[POLICY_INDEX]]
- Related: [[BACKEND_API_RULES]], [[DATA_SOURCE_INTEGRITY_RULES]], [[FRONTEND_COLOR_UX_UI_RULES]]

## Module Registry Rules (Strict)

These rules apply to any change in:
- `src/features/module-registry/modules.js`
- module slugs/codes/titles
- module ordering/pagination behavior (`src/features/module-player/ModulePage.jsx`)

## Non-negotiable

1. Do not remove a module entry unless the owner explicitly requests deletion.
2. Do not swap module order unless the owner explicitly requests reordering.
3. Module codes/slugs are auto-generated from list order in `src/features/module-registry/modules.js`.
4. After any add/remove/reorder, numbering must be contiguous with no gaps:
   - `S01, S02, S03, ... SNN`
   - slugs must follow `sNN-...`
5. If any module order/identity changes, ensure footer/pagination still shows unambiguous module identity.
6. Footer page indicator must reflect module code numbering (derived from `code`/`slug`), not array index.
7. Do not trust legacy component filenames/constants as live module identity; `src/features/module-registry/modules.js` is authoritative.

## Required verification

After changing module registry/order:

1. Run `npm run build`.
2. Confirm navigation works for previous and next controls.
3. Confirm footer shows module identity clearly (`module.code` + position).
4. Re-check `src/features/module-registry/moduleSEO.js` keys/titles/descriptions for affected modules.
5. Re-check `src/features/module-registry/moduleDataMeta.js` keys and module-specific strip/overlay behavior for affected modules.
6. Re-check any under-construction shell sets and module-specific player logic in `src/features/module-player/ModulePage.jsx` (for example `NOINDEX_PREVIEW_SLUGS`, blocking overlay sets, or similar preview/live distinctions).
7. Confirm no unintended module reindexing changed unrelated slugs/codes.

## Cross-domain guardrail (mandatory)

Even when changes are not directly editing `src/features/module-registry/modules.js`, agents must re-check module index mapping before any backend/API or frontend UX work that names modules by number/slug/title.

- Source of truth: `src/features/module-registry/modules.js` (`MODULE_DEFS`, generated `code`, generated `slug`).
- Never assume module index from chat history in multi-agent sessions.
- Never assume live module identity from legacy file names like `S08_*`, `S09b_*`, or similar historical numbering.

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/MODULE_REGISTRY_RULES.md`
- **Tipo de Evento/Contexto:** Configuración de automejora
- **Descripción del Evento Original:** Las reglas del registro de módulos carecían de un historial obligatorio para documentar lecciones sobre indexación, slugs y orden.
- **Acción Realizada/Corrección:** Se creó el registro histórico al final del documento para preservar conocimiento compartido.
- **Nueva/Modificada Regla o Directriz:** Cualquier corrección futura sobre identidad, secuencia o validación de módulos debe reflejarse también en este historial.
- **Justificación:** Hace persistente el aprendizaje relacionado con reindexaciones y evita que agentes futuros repitan errores de mapeo o numeración.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/MODULE_REGISTRY_RULES.md`
- **Tipo de Evento/Contexto:** Alineación del registro con nueva jerarquía frontend
- **Descripción del Evento Original:** La política del registro de módulos seguía apuntando a las rutas antiguas del registry y del player shell tras la reorganización del frontend.
- **Acción Realizada/Corrección:** Se actualizaron todas las referencias al nuevo layout `src/features/module-registry/` y `src/features/module-player/`.
- **Nueva/Modificada Regla o Directriz:** Las comprobaciones de identidad, slugs, SEO y shell del player deben ejecutarse sobre las rutas actuales dentro de `src/features/`.
- **Justificación:** Evita errores de navegación o reindexación provocados por inspeccionar ubicaciones heredadas.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/MODULE_REGISTRY_RULES.md`
- **Tipo de Evento/Contexto:** Separación entre preview noindex y overlay bloqueante
- **Descripción del Evento Original:** La verificación del shell del player asumía un único set `UNDER_CONSTRUCTION_SLUGS`, pero algunos módulos preview necesitan seguir en `noindex` sin conservar necesariamente el overlay bloqueante para revisión local o QA.
- **Acción Realizada/Corrección:** Se amplió la regla de verificación para exigir revisar cualquier set de preview/overlay/noindex vigente en `ModulePage.jsx`, no solo un nombre histórico de constante.
- **Nueva/Modificada Regla o Directriz:** Las reglas del registro deben contemplar que el estado de preview SEO y el bloqueo UX pueden separarse; al tocar módulos preview, agentes deben validar ambas capas del shell y mantener la documentación alineada.
- **Justificación:** Evita que futuros agentes vuelvan a acoplar overlay y noindex por inercia, lo que podría romper revisiones internas o publicar previews antes de tiempo.


- **Fecha de la Actualizacion:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/MODULE_REGISTRY_RULES.md`
- **Tipo de Evento/Contexto:** Adaptacion de politica a vault Obsidian y flujo RAG
- **Descripcion del Evento Original:** La politica del registro era fuerte como restriccion local, pero no estaba conectada explicitamente al home del vault ni al flujo de recuperacion compartido entre Obsidian y el agente.
- **Accion Realizada/Correccion:** Se añadió frontmatter compatible con Obsidian y un bloque de contexto con enlaces hacia las notas de entrada y las politicas vecinas del grafo.
- **Nueva/Modificada Regla o Directriz:** El registro de modulos debe permanecer como nota canonica enlazada dentro del vault `.claude/` para que la identidad de modulos sea recuperable por backlinks, tags y navegacion jerarquica.
- **Justificacion:** Reduce errores de identidad cuando la tarea arranca desde el grafo visual o desde una consulta RAG en lugar de una ruta directa.

