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
6. Re-check `UNDER_CONSTRUCTION_SLUGS` and any module-specific shell logic in `src/features/module-player/ModulePage.jsx`.
7. Confirm no unintended module reindexing changed unrelated slugs/codes.

## Cross-domain guardrail (mandatory)

Even when changes are not directly editing `src/features/module-registry/modules.js`, agents must re-check module index mapping before any backend/API or frontend UX work that names modules by number/slug/title.

- Source of truth: `src/features/module-registry/modules.js` (`MODULE_DEFS`, generated `code`, generated `slug`).
- Never assume module index from chat history in multi-agent sessions.
- Never assume live module identity from legacy file names like `S08_*`, `S09b_*`, or similar historical numbering.

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/MODULE_REGISTRY_RULES.md`
- **Tipo de Evento/Contexto:** Configuración universal de automejora
- **Descripción del Evento Original:** Las reglas del registro de módulos carecían de una política inicial común de automejora y de un historial obligatorio para documentar lecciones sobre indexación, slugs y orden.
- **Acción Realizada/Corrección:** Se añadió la regla universal como primera sección y se creó el registro histórico al final del documento.
- **Nueva/Modificada Regla o Directriz:** Cualquier corrección futura sobre identidad, secuencia o validación de módulos debe reflejarse también en este historial para preservar conocimiento compartido.
- **Justificación:** Hace persistente el aprendizaje relacionado con reindexaciones y evita que agentes futuros repitan errores de mapeo o numeración.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/MODULE_REGISTRY_RULES.md`
- **Tipo de Evento/Contexto:** Alineación del registro con nueva jerarquía frontend
- **Descripción del Evento Original:** La política del registro de módulos seguía apuntando a las rutas antiguas del registry y del player shell tras la reorganización del frontend.
- **Acción Realizada/Corrección:** Se actualizaron todas las referencias al nuevo layout `src/features/module-registry/` y `src/features/module-player/`.
- **Nueva/Modificada Regla o Directriz:** Las comprobaciones de identidad, slugs, SEO y shell del player deben ejecutarse sobre las rutas actuales dentro de `src/features/`.
- **Justificación:** Evita errores de navegación o reindexación provocados por inspeccionar ubicaciones heredadas.
