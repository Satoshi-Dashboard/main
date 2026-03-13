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

## Frontend Color UX/UI Rules (Strict)

These rules apply to any frontend change that introduces, modifies, or reviews color usage in modules, cards, charts, labels, badges, and titles.

Source basis: analysis of the first 11 active modules in `src/features/module-registry/modules.js` order:
- S01 Bitcoin Overview
- S02 Price Chart
- S03 Multi-Currency
- S04 Mempool Gauge
- S05 Long-Term Trend
- S06 Nodes Map (`S06_NodesMap.jsx`)
- S07 Lightning Nodes Map (`S07_LightningNodesMap.jsx`)
- S08 BTC Map Business Density (`S08_BtcMapBusinessesMap.jsx`)
- S09 Lightning Network (`S09_LightningNetwork.jsx`)
- S10 Stablecoin Peg Health (`S10_StablecoinPegHealth.jsx`)
- S11 Fear & Greed (`S11_FearGreedIndex.jsx`)

## Core principle

Color can be diverse by context, but semantic meaning must stay stable:
- same purpose -> same token family
- different purpose -> different color family

## Module index preflight (mandatory)

Before applying any frontend UX/UI change that references module numbers, slugs, titles, navigation order, or module-specific copy/labels:

1. Re-read `src/features/module-registry/modules.js` and confirm the live `code <-> slug <-> title` mapping.
2. Do not rely on prior chat memory for module identity/order in multi-agent workflows.
3. Verify the targeted module slug/code still match the requested module before editing.
4. Re-check mapping after edits to ensure no unintended module index/slug drift occurred.

## Source of truth rule (mandatory)

1. `src/features/module-registry/modules.js` is the only source of truth for live module identity/order.
2. Do not infer live module code/order from component filenames or variable names.
3. Some under-construction filenames/constants may still lag behind live codes; verify module identity from `src/features/module-registry/modules.js`, not from component filenames alone.
4. When frontend copy, metadata, or labels mention a module by number/title/slug, verify against generated `MODULES`, not legacy component names.

## Responsive-first policy (mandatory)

For any new module, new UI content, new element, or update to existing frontend elements:

1. Mobile + tablet support is required by default
   - Do not ship desktop-only layouts.
   - Include responsive behavior for narrow phones, standard phones, and tablet widths.

2. Fixed navigation controls must remain reachable
   - Primary navigation actions (top bar/footer controls) should remain visible without extra scrolling in responsive views.
   - Touch targets should be finger-friendly (avoid tiny controls).

3. Hierarchy must adapt per breakpoint
   - Preserve readable typography, spacing, and visual priority by device size.
   - Prevent clipping/overflow in cards, charts, labels, and controls.

4. Acceptance criteria
    - Any frontend change is incomplete if tablet/mobile behavior is not addressed.

5. One vertical scroll owner on responsive views
   - Avoid nested mobile/tablet `overflow-y-auto` regions inside modules when the player shell already provides vertical scrolling.
   - Prefer a single responsive scroll container so tall modules do not clip content, trap gestures, or create fake spacing bugs.

## Responsive typography hierarchy (mandatory)

For responsive frontend work, typography must remain readable and hierarchical across desktop, tablet, and mobile.

1. Token hierarchy usage
   - Large key values: `--fs-display`, `--fs-hero`, `--fs-title`
   - Section/value headings: `--fs-subtitle`, `--fs-section`, `--fs-heading`
   - Body/labels/metadata: `--fs-body`, `--fs-label`, `--fs-caption`, `--fs-micro`, `--fs-tag`
   - Do not bypass this hierarchy with arbitrary tiny px values unless explicitly justified.

2. Mobile minimum readability
   - Interactive controls and nav labels should stay comfortably tappable/readable.
   - Avoid tiny text that becomes hard to read on phone screens.
   - As a baseline: keep micro/meta text around ~11px+ and standard labels/body around ~12px+ in mobile contexts.

3. Breakpoint behavior
   - Preserve rank order at every breakpoint (hero > title > heading > body > label > micro/tag).
   - Prevent overlap, clipping, or visual crowding when text wraps.

4. QA requirement
   - Validate touched screens in phone + tablet widths and confirm no critical text appears too small.

## Canonical palette (do not drift)

Use root tokens from `src/index.css` as source of truth:
- Brand/identity: `--accent-bitcoin` (`#F7931A`)
- Positive/up/growth: `--accent-green` (`#00D897`)
- Negative/down/risk: `--accent-red` (`#FF4757`)
- Warning/caution: `--accent-warning` (`#FFD700`)
- Base text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Base surfaces: `--bg-primary`, `--bg-card`, `--bg-elevated`

## Semantic mapping (mandatory)

1. Module main title (`h1` or equivalent primary heading)
   - Default color: `--accent-bitcoin`
   - Must not use status colors (green/red/yellow) as default title color.

2. Section headings and static labels
   - Use `--text-primary` or `--text-secondary`
   - Use `--accent-bitcoin` only when the label is a key identity anchor, not for every text node.

3. Status/state indicators (price delta, peg health, trend arrows, badges)
   - Positive/up/healthy: green family
   - Negative/down/unhealthy: red family
   - Caution/near-threshold: yellow family

4. Neutral/inactive/loading/supporting metadata
   - Use neutral grays (`--text-secondary`, `--text-tertiary`, white alpha on dark)
   - Do not use brand orange for disabled, placeholder, or skeleton states.

5. Chart palettes
   - Contextual scales are allowed (example: red->yellow->green in sentiment, warm orange ramp in BTC concentration maps).
   - Every multicolor chart must keep a deterministic semantic order and a visible legend or obvious labeling.

## Consistency rules for titles and repeated UI patterns

1. No semantic collisions
   - Do not assign two different colors to the same title purpose across modules without explicit owner approval.

2. No role mixing
   - Do not reuse the same strong color for conflicting meanings inside one view (example: orange cannot mean both "module title" and "error").

3. Stable title system
   - Main module title color is fixed (brand orange family).
   - Dynamic states must appear in chips/badges/values, not by recoloring the module title.

4. Token-first policy
   - Prefer CSS variables/tokens over raw hex in new changes.
   - If a new semantic color appears in 2+ modules, promote it to a token.

## Findings from first 11 modules (used as baseline)

1. Existing strong consistency to keep:
   - green = positive/up/healthy
   - red = negative/down/off-peg
   - orange = BTC brand emphasis and key labels

2. Existing diversity to keep:
   - fear/greed uses full sentiment spectrum
   - mempool/wealth/maps use contextual ramps
   - stablecoin health uses tri-state semantic colors

3. Inconsistency to prevent in future changes:
   - equivalent title roles drifting between orange and neutral white without semantic reason.

## Accessibility and readability (required)

1. Contrast minimums:
   - normal text: WCAG AA target (4.5:1)
   - large text: at least 3:1

2. Color is never the only cue:
   - pair color with icon, label, sign, or pattern for critical states.

3. Mobile + desktop parity:
     - semantic colors must preserve meaning in responsive states.

## Visual integrity hardening (mandatory)

For frontend modules that rely on charts, maps, heatmaps, canvas, SVG, legends, or colored overlays to communicate meaning:

1. Protect semantically critical visual surfaces from forced recolor.
   - Use explicit frontend protection for critical render surfaces (`forced-color-adjust: none`, explicit `color-scheme`, exact print color handling) instead of assuming the browser/device will preserve authored colors.

2. Apply protection selectively, not blindly to the whole app shell.
   - Prioritize map surfaces, chart containers, SVG/canvas render roots, legends, and metric overlays where recolor would invert or distort meaning.

3. Critical “no data” states must remain visually distinct from active data states.
   - Empty countries/tiles/background fills must not be allowed to drift into white/light fallback colors that visually compete with real data.

4. Dark surfaces behind critical legends and overlays must be stable.
   - Do not rely only on very soft transparency when a recolor-prone environment could wash out the contrast; use an explicit dark backing for map/chart badges when needed.

5. New visual modules must adopt the shared hardening pattern.
   - Any new chart/map/heatmap/canvas/SVG with semantic color meaning is incomplete if it omits the shared visual-integrity protection layer.

## Initial-route performance guardrail (mandatory)

For the default dashboard route (`/`) and any above-the-fold module content loaded on first visit:

1. Do not pull heavyweight charting or motion libraries just to render small decorative widgets if a light SVG/static alternative can preserve the same meaning.
2. Avoid manual chunking that forces unrelated route-level libraries into the initial HTML preload chain.
3. If the home route only needs a micro-visual (sparkline, tiny trend cue, static number), prefer a local lightweight implementation over importing a full chart or animated-counter stack.
4. Treat repeated PSI warnings about unused JS on the first route as a product bug even when desktop still scores 100.

## Metric semantics and unit integrity (mandatory)

For frontend modules that present live metrics, percentages, gauges, limits, or comparisons:

1. Do not compare incompatible units as if they were the same metric.
   - Example: virtual transaction size, memory usage, and configured memory limit must stay explicitly separated.

2. Labels must describe the exact underlying quantity.
   - If a value is virtual size/transaction volume, do not label it as generic "Mempool size" when the UI also references memory usage.

3. Percent-of-limit visuals must use the metric that the limit actually governs.
   - Example: a Bitcoin Core `maxmempool` percentage must be computed from mempool memory usage, not transaction virtual size.

4. Do not over-round live fee metrics when sub-unit precision matters.
   - If a fee can be meaningfully below 1 or include useful decimals, preserve at least one decimal place instead of forcing integer display.

5. If the approved payload does not expose the exact metric required for a fair comparison, omit that comparison UI instead of faking it with a proxy, a default cap, or a related metric.
    - Example: if virtual size is available but memory usage is not, do not render a `% of 300 MB` limit gauge.

6. Reused live metric labels must keep the same underlying source/derivation across modules.
   - Example: if two modules both show `AVG TX FEE`, they must resolve to the same fee band / fallback logic; otherwise rename one label so the UI does not imply a false equivalence.

## Live numeric motion (mandatory for live-data UX)

When a frontend view shows live or periodically refreshed numeric data, avoid hard swaps that make the interface feel frozen or abrupt.

1. Animate numeric updates with subtle, context-appropriate motion.
   - Prefer short fade/slide/count transitions over flashy effects.
   - Motion should reinforce directionality when meaningful (up vs down), without changing core semantic colors.

2. Keep motion lightweight and readable.
   - Fast-updating counters should use gentle transitions that do not distract from the value.
   - Do not cause layout jumps, clipped digits, or reduced legibility on mobile.

3. Motion must match the data context.
   - High-frequency prices/counters: restrained pulse/slide/count cues.
   - Slower dashboard refreshes: slightly more noticeable value transitions are acceptable.

4. Prefer the shared animated counter primitive for DOM-rendered numeric updates.
   - Use `src/shared/components/common/AnimatedMetric.jsx` as the project wrapper.
   - For numeric transitions, prefer the `react-animated-counter`-based wrapper over ad-hoc text swaps.
   - If a number is rendered in canvas, SVG text, or third-party map tooltips, use the closest equivalent motion that fits the rendering constraint.

5. Idle live numerals must stay visually stable.
   - Default resting state for live numeric DOM values should remain neutral/white unless the metric itself is explicitly a semantic delta badge.
   - Up/down colors should appear as transient animation feedback, not as a permanently stuck post-update color on main values.

6. Do not break third-party counter layout assumptions.
     - Do not override a counter library's digit line-height/height model with inherited values if it computes digit travel from `font-size`.
     - If using responsive font tokens (`clamp(...)`, CSS vars), resolve them to a concrete computed pixel font size before passing them to the counter engine.
     - If that computed size can change with viewport width or responsive emulation, re-measure it on resize so live digits do not overflow, stack, or keep stale dimensions.
     - If a third-party digit roller remains unstable on narrow phones, prefer a stable non-animated numeric fallback on that breakpoint over shipping broken motion.

7. Protect animated metrics with responsive layout slack.
    - In dense tablet/mobile headers or cards, let rows with live numerals wrap or stack before squeezing the counter into clipped inline space.
    - Surrounding responsive flex/grid containers must give animated values `min-w-0` and a non-clipping path; if the available width becomes too tight, degrade the numeral to a stable static render.

8. Keep loading, fallback, and live numerals footprint-stable.
    - Skeletons, fallback text, and final animated values should reserve similar vertical space so cards do not jump when data arrives.
    - In dense responsive cards, prefer explicit min-height shells around key numerals instead of letting each state define its own height.

## Required verification for frontend color changes

After any color UX/UI modification:

1. Confirm title color semantics remain consistent with this file.
2. Confirm green/red/yellow semantics still map to positive/negative/warning.
3. Confirm charts with multiple colors include clear semantic interpretation.
4. Run `npm run build` and verify no visual regressions in touched modules.
5. Clear React Hooks dependency warnings (`react-hooks/exhaustive-deps`) in touched frontend files before delivery.
6. For maps/charts/heatmaps/canvas/SVG touched by the change, verify at least one normal-browser check and one recolor-resistance check (`forced colors`, high contrast, or dark-mode extension disabled/enabled as applicable).

## Dual-metric hero section (mandatory pattern)

When a module compares two assets or values side by side (e.g., BTC vs Gold, asset A vs asset B):

1. Use a `flex` row to display both metrics as equally prominent hero numbers.
   - Each metric gets its own labeled column (`min-w-0 flex-1`).
   - Separate columns with a thin vertical divider (`w-px opacity-20`).
   - Do not bury one asset's value inside a secondary metadata row when it is a primary data point.

2. Label each column explicitly above its number (e.g., "Bitcoin" / "Gold") using a micro-caps label at `0.58rem`.
   - BTC column label: `--accent-bitcoin`
   - Counterpart column label: contextually appropriate neutral (e.g., silver/gray for gold)

3. Delta / change rows belong below the flex block, scoped to the primary asset (BTC), not inside the flex columns.

4. Skeleton loading states must mirror the flex structure: two side-by-side skeleton blocks.

5. Apply `min-h-[2.8rem]` to each number container for footprint stability across loading / live states.

## Equal-width metric rows (mandatory for repeated stat triplets)

When a module renders repeated metric rows beneath a chart/gauge (example: three KPI cards in one row, followed by three fee tiles):

1. Desktop columns must use a stable equal-width grid instead of content-sized flex distribution.
   - Long values, short values, and unit suffixes must not push sibling metrics out of alignment.

2. Repeated separators must belong to the shared grid/container, not depend on per-value content width.
   - Vertical dividers should stay fixed even when one metric has more digits or a wrapped label.

3. Loading, fallback, and live states must preserve the same column footprint.
   - A metric row is non-compliant if the columns visibly jump or drift between sources on desktop.

## New module example rules (mandatory)

When creating any new frontend module, agents must follow the project example pattern used in active modules.

1. Reuse semantic color roles from this file (do not invent new meaning-color mappings).
2. Keep a consistent module information strip using subtle metadata styling for refresh/source hints.
3. Include loading skeleton states before data is available (no hardcoded fake final values).
4. Use token-first colors (`var(--...)`) for repeated UI roles; avoid raw hex unless strongly justified.
5. Preserve title/status hierarchy:
    - title uses brand role
    - status uses semantic colors (green/red/yellow)
    - metadata uses neutral gray role
6. New modules must integrate with the current player shell behavior:
   - confirm metadata strip behavior in `src/features/module-registry/moduleDataMeta.js`
   - confirm SEO metadata in `src/features/module-registry/moduleSEO.js`
   - confirm responsive/top/bottom overlay behavior in `src/features/module-player/ModulePage.jsx`
7. New modules are non-compliant if they skip this example baseline.
8. If the owner asks to clone or match an existing module's UX/UI, preserve the source module's structural treatment unless they explicitly ask to change it.
   - Example: if the reference chart is full-bleed and not wrapped in a card, do not add a card wrapper.
   - Do not add extra charts, legends, metadata rows, or layout sections that the reference module does not use unless requested.

## Frontend language rule (mandatory)

1. All new user-facing text added to frontend must be in English.
2. Do not introduce new Spanish (or other language) labels unless the owner explicitly requests multilingual/localized behavior.
3. If updating an existing mixed-language area, new copy must still default to English unless instructed otherwise.
4. Owner-approved exception: `src/features/modules/live/S31_ThankYouSatoshi.jsx` may rotate the single phrase "Thank you, Satoshi Nakamoto" in major world languages; do not expand that area with any other multilingual copy unless the owner explicitly asks.

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Configuración universal de automejora
- **Descripción del Evento Original:** La política frontend no empezaba con una regla universal de aprendizaje ni ofrecía un registro obligatorio para capturar correcciones de semántica visual, UX o responsive.
- **Acción Realizada/Corrección:** Se añadió la regla universal como apertura del documento y se creó el historial de automejoras al final.
- **Nueva/Modificada Regla o Directriz:** Las mejoras o correcciones futuras de color, UX, responsive y copy frontend deben reflejarse también en este registro histórico.
- **Justificación:** Refuerza la memoria operativa del agente en cambios visuales sensibles y facilita que futuras iteraciones respeten semántica, legibilidad y consistencia.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Advertencia de calidad en frontend
- **Descripción del Evento Original:** Durante la verificación de calidad apareció una advertencia `react-hooks/exhaustive-deps` en `S02_PriceChart.jsx` por una dependencia faltante en un `useEffect`.
- **Acción Realizada/Corrección:** Se corrigió la dependencia del efecto y se reforzó la checklist frontend para exigir la eliminación de advertencias de hooks en archivos tocados.
- **Nueva/Modificada Regla o Directriz:** La verificación frontend ahora incluye limpiar advertencias `react-hooks/exhaustive-deps` antes de la entrega.
- **Justificación:** Reduce riesgos de estados desincronizados y evita entregar cambios que compilan pero dejan advertencias de calidad evitables.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Oportunidad de mejora en UX de datos vivos
- **Descripción del Evento Original:** Los cambios de precio y métricas vivas podían sentirse demasiado estáticos porque varios números se sustituían sin transición visual.
- **Acción Realizada/Corrección:** Se añadió una regla explícita para animar actualizaciones numéricas con motion sutil y contextual en vistas de datos vivos.
- **Nueva/Modificada Regla o Directriz:** Las cifras que cambian por polling o actualización en tiempo real deben usar transiciones ligeras, legibles y acordes a su frecuencia de cambio.
- **Justificación:** Mejora la percepción de actividad del producto sin sacrificar claridad, rendimiento ni consistencia semántica.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Estandarización de animación numérica
- **Descripción del Evento Original:** La primera implementación de motion numérica usaba una transición personalizada de swap, pero el proyecto necesitaba alinearse con un patrón más consistente de contador animado solicitado por el owner.
- **Acción Realizada/Corrección:** Se definió el wrapper compartido `src/shared/components/common/AnimatedMetric.jsx` sobre `react-animated-counter` y se añadió la preferencia explícita en la política frontend.
- **Nueva/Modificada Regla o Directriz:** Las cifras DOM que cambian en tiempo real o por polling deben usar el wrapper compartido basado en `react-animated-counter`, salvo limitaciones de canvas/SVG/tooltips externos.
- **Justificación:** Centraliza el comportamiento visual de métricas vivas, facilita su reutilización y evita soluciones inconsistentes entre módulos.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Corrección de regresión visual en contadores animados
- **Descripción del Evento Original:** Tras integrar `react-animated-counter`, varios números vivos quedaron cortados o congelados a mitad de movimiento y algunos valores principales se quedaban en color de subida/bajada en reposo.
- **Acción Realizada/Corrección:** Se ajustó el wrapper compartido para respetar el modelo de altura/line-height del contador, resolver el font-size real en px y forzar un estado visual neutro en reposo para valores principales.
- **Nueva/Modificada Regla o Directriz:** Los contadores DOM deben permanecer blancos/estables cuando no hay actualización y no deben recibir overrides de line-height heredado que rompan la animación interna de dígitos.
- **Justificación:** Evita regresiones visuales masivas en módulos live y mantiene la animación como señal breve de actualización en lugar de dejar la UI rota o permanentemente tintada.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Corrección responsive en contadores live
- **Descripción del Evento Original:** En `S30` los contadores podían conservar un `font-size` medido antes del cambio de viewport, lo que en modo responsive/emulación del navegador provocaba dígitos apilados, separación vertical y mala alineación en tarjetas y hero values.
- **Acción Realizada/Corrección:** Se actualizó el wrapper compartido para re-medir el `font-size` en resize/ResizeObserver y se reforzó el alineado izquierdo de tarjetas donde el layout lo requiere.
- **Nueva/Modificada Regla o Directriz:** Los contadores animados con tipografías responsive deben recalcular su tamaño real cuando cambia el viewport para mantener una sola línea estable y sin bugs visuales en desktop, tablet, móvil y emulación responsive.
- **Justificación:** Evita falsos positivos o regresiones reales de responsive en módulos con cifras grandes y mantiene consistencia visual al validar layouts con herramientas de desarrollo y dispositivos reales.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Corrección de scroll responsive en módulos altos
- **Descripción del Evento Original:** `S30` combinaba un scroll vertical interno con el scroll responsive del player shell, lo que hacía más evidente cortes, espacios muertos y lectura incómoda en tablet y móvil.
- **Acción Realizada/Corrección:** Se reforzó la política frontend para mantener un solo contenedor vertical de scroll en responsive y se ajustó el módulo para dejar al shell como dueño del scroll en pantallas estrechas.
- **Nueva/Modificada Regla o Directriz:** Los módulos altos deben evitar scroll vertical anidado en móvil/tablet cuando el contenedor principal ya gestiona el desplazamiento de la página.
- **Justificación:** Reduce bugs visuales difíciles de diagnosticar, mejora la interacción táctil y evita que el responsive parezca roto aunque el contenido sea correcto.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Fallback responsive para contadores animados
- **Descripción del Evento Original:** En `S30`, la animación por dígitos seguía viéndose inestable en teléfonos aunque el mismo contador funcionaba bien en desktop, lo que degradaba la legibilidad del módulo live en móvil.
- **Acción Realizada/Corrección:** Se añadió soporte para fallback numérico estable sin animación en breakpoints de teléfono cuando el digit roller no ofrece una experiencia fiable.
- **Nueva/Modificada Regla o Directriz:** En teléfonos estrechos, los contadores live pueden degradar de animación por dígitos a render estático estable si eso mejora claramente legibilidad y robustez visual.
- **Justificación:** Prioriza lectura correcta y estabilidad del producto en móvil frente a una animación rota que transmite baja calidad o datos defectuosos.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Alineación de paths frontend tras reorganización
- **Descripción del Evento Original:** La política frontend seguía referenciando rutas antiguas para módulos, registry, player shell y componentes compartidos después del split `features/shared`.
- **Acción Realizada/Corrección:** Se actualizaron las referencias obligatorias al nuevo layout `src/features/*` y `src/shared/*` sin alterar las reglas semánticas existentes.
- **Nueva/Modificada Regla o Directriz:** Las validaciones frontend deben apuntar siempre a la jerarquía actual de features y shared, incluyendo el wrapper compartido `src/shared/components/common/AnimatedMetric.jsx`.
- **Justificación:** Mantiene útiles las reglas de UX/UI y evita que futuras revisiones busquen componentes en rutas heredadas.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Corrección responsive en métricas animadas dentro de cards densas
- **Descripción del Evento Original:** Varios módulos con contadores animados seguían viéndose correctos en desktop, pero en tablet y móvil algunas cifras quedaban apretadas dentro de headers/cards, provocando clipping, mala alineación o una percepción de animación rota cuando el layout no cedía espacio suficiente.
- **Acción Realizada/Corrección:** Se reforzó la política para exigir slack responsive alrededor de métricas animadas, permitiendo wrap/stack en filas estrechas y degradación a render estático cuando el ancho disponible no soporta el digit roller con fiabilidad.
- **Nueva/Modificada Regla o Directriz:** Los numerales animados en layouts responsivos deben contar con contenedores que puedan reacomodarse y nunca depender de filas rígidas o clipping; si el espacio se vuelve insuficiente en tablet/móvil, la prioridad es una lectura estable antes que mantener la animación.
- **Justificación:** Evita repetir regresiones donde la librería del contador es correcta en desktop pero el layout responsive la rompe visualmente en tarjetas compactas y estados de actualización.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Retiro de política ligada a feature descartada
- **Descripción del Evento Original:** Se había añadido una nota específica sobre reutilización de datos para tooling/export frontend durante una implementación que luego fue eliminada por no aportar suficiente valor al producto.
- **Acción Realizada/Corrección:** Se retiró esa nota específica para no dejar reglas accesorias derivadas de una feature descartada.
- **Nueva/Modificada Regla o Directriz:** Las reglas frontend deben conservar solo restricciones duraderas y relevantes para el producto vigente, evitando acumular políticas circunstanciales de features eliminadas.
- **Justificación:** Mantiene el archivo de reglas más limpio, más estable y mejor enfocado en decisiones de UI/UX que siguen vivas en el proyecto.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Estabilidad responsive en métricas animadas
- **Descripción del Evento Original:** Varias cards y headers con `AnimatedMetric` seguían mostrando saltos visuales en móvil/tablet cuando el loading, el fallback y el valor final no reservaban una huella similar y cuando las filas estrechas no cedían espacio a cifras largas.
- **Acción Realizada/Corrección:** Se reforzó la política frontend para exigir shells con altura mínima consistente alrededor de numerales críticos y layouts responsivos que permitan wrap/stack antes de comprimir o recortar el contador.
- **Nueva/Modificada Regla o Directriz:** Los estados loading/fallback/live de métricas animadas deben compartir una huella visual estable y los contenedores responsivos deben priorizar reflow legible frente a filas rígidas en tablet/móvil.
- **Justificación:** Reduce clipping, saltos bruscos y sensación de UI rota en módulos live con cifras variables sin degradar el comportamiento de escritorio.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Corrección de clon UX/UI demasiado libre
- **Descripción del Evento Original:** Al implementar `S16` como referencia de `S02`, la primera versión añadió tarjetas, una segunda gráfica y metadata extra que no respetaban suficientemente la estructura visual del módulo origen pedida por el owner.
- **Acción Realizada/Corrección:** Se reforzó la política para exigir que las tareas de clon/match preserven la estructura del módulo de referencia salvo instrucción explícita en contra.
- **Nueva/Modificada Regla o Directriz:** Cuando el owner pide replicar el estilo de un módulo existente, se debe mantener su tratamiento estructural principal (cantidad de gráficas, framing, ubicación de controles y densidad de metadata) y evitar adornos o secciones nuevas no solicitadas.
- **Justificación:** Reduce iteraciones evitables y ayuda a que futuros cambios respeten con mayor fidelidad la intención visual del owner desde la primera entrega.

- **Fecha de la Actualización:** `2026-03-10`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Corrección de semántica métrica en módulos live
- **Descripción del Evento Original:** Un ajuste de feedback detectó que un módulo podía mezclar `virtual size` con `memory usage` bajo una misma etiqueta de mempool y que una fee live podía mostrarse sin decimales aunque eso ocultara precisión útil.
- **Acción Realizada/Corrección:** Se añadió una regla explícita para separar cantidades con unidades distintas en labels, porcentajes y gauges, y para preservar al menos una decimal en fees cuando la precisión sub-entera importe.
- **Nueva/Modificada Regla o Directriz:** Los módulos live deben mantener integridad estricta entre nombre, unidad, fórmula comparativa y formato numérico; no se permite comparar métricas incompatibles ni redondear fees hasta borrar información material.
- **Justificación:** Evita visualizaciones técnicamente engañosas en módulos de datos y reduce la probabilidad de repetir comparaciones injustas o nomenclatura ambigua.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Fallback UX cuando falta la métrica exacta
- **Descripción del Evento Original:** Un ajuste del módulo de mempool mostró una comparación visual de límite usando un valor por defecto aunque la carga real de `memory usage` no venía en el payload consumido, lo que generaba un panel roto y una semántica engañosa.
- **Acción Realizada/Corrección:** Se añadió una regla para ocultar comparaciones y gauges dependientes de métricas ausentes, reemplazándolos por una presentación honesta de los datos realmente disponibles.
- **Nueva/Modificada Regla o Directriz:** Si el payload aprobado no trae la métrica exacta para una comparación justa, el frontend debe omitir esa comparación en vez de inventarla con proxies, caps por defecto o placeholders ambiguos.
- **Justificación:** Previene UIs engañosas, evita repetir límites estáticos sin contexto y mejora la legibilidad cuando la fuente no expone todos los campos deseados.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Consistencia semántica entre módulos live
- **Descripción del Evento Original:** `S01` mostraba `AVG TX FEE` con una derivación distinta a la usada por `S04` para la fee `ECONOMY`, lo que hacía que dos labels equivalentes del producto enseñaran valores distintos sin explicarlo al usuario.
- **Acción Realizada/Corrección:** Se reforzó la política frontend para exigir que labels live reutilizados entre módulos compartan exactamente la misma fuente/derivación o, en caso contrario, se renombren para reflejar la diferencia.
- **Nueva/Modificada Regla o Directriz:** Las métricas live repetidas en distintos módulos no pueden cambiar silenciosamente de banda de fee, fallback o fórmula manteniendo el mismo label visible.
- **Justificación:** Evita inconsistencias de producto difíciles de detectar, mejora la confianza del usuario en métricas repetidas y reduce regresiones de semántica cuando varios módulos consumen el mismo dominio de datos.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Corrección de alineación desktop en filas métricas
- **Descripción del Evento Original:** En el módulo de mempool, las filas de métricas bajo el gauge podían desalinearse en pantallas de PC porque el layout dependía del ancho variable de cada cifra y de sus unidades.
- **Acción Realizada/Corrección:** Se añadió una regla para exigir grids de columnas iguales y separadores estables en filas repetidas de KPIs/fees bajo charts o gauges.
- **Nueva/Modificada Regla o Directriz:** Las filas repetidas de métricas en desktop deben usar columnas de ancho estable para que cambios de longitud en valores, labels o unidades no desplacen visualmente a los bloques hermanos.
- **Justificación:** Evita paneles descuadrados cuando los datos live cambian entre fuentes o magnitudes distintas y mejora la percepción de orden en vistas analíticas.

- **Fecha de la Actualización:** `2026-03-12`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Optimización del bundle inicial del dashboard
- **Descripción del Evento Original:** El chequeo de PageSpeed mostraba JavaScript no usado en móvil/escritorio porque la ruta inicial seguía arrastrando librerías pesadas de charts y motion para microcomponentes del primer módulo, además de preloads innecesarios inducidos por chunking manual.
- **Acción Realizada/Corrección:** Se añadió una guardrail explícita para la ruta inicial: preferir micro-SVGs o render estático en widgets above-the-fold y evitar manual chunking que vuelva críticas librerías pertenecientes a otras rutas o módulos.
- **Nueva/Modificada Regla o Directriz:** La home del dashboard no debe importar ni preloadear librerías pesadas de charting/animación solo para widgets pequeños cuando exista una alternativa ligera equivalente en semántica y UX.
- **Justificación:** Reduce bytes críticos, mejora LCP/TBT móvil sin degradar el desktop y evita repetir optimizaciones que parecen correctas en bundle analysis pero empeoran la ruta real más visitada.

- **Fecha de la ActualizaciÃ³n:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** CorrecciÃ³n UX en controles de audio del footer
- **DescripciÃ³n del Evento Original:** El reproductor del footer reiniciaba la pista al pausar y reanudar, y el umbral de activaciÃ³n para la pista alcista era demasiado sensible respecto a la intenciÃ³n del owner.
- **AcciÃ³n Realizada/CorrecciÃ³n:** Se ajustÃ³ la clasificaciÃ³n para activar el mood alcista solo desde `+4%` en 24h y se corrigiÃ³ el control de pausa para que el audio local reanude desde la posiciÃ³n actual en vez de volver al inicio.
- **Nueva/Modificada Regla o Directriz:** Los controles media de frontend deben respetar la semÃ¡ntica esperada de pausa/reanudaciÃ³n y no reiniciar reproducciÃ³n salvo que el usuario o un cambio real de pista lo requiera explÃ­citamente.
- **JustificaciÃ³n:** Evita una UX frustrante en controles bÃ¡sicos, alinea el reproductor con el comportamiento esperado por el usuario y reduce regresiones futuras en audio/vÃ­deo del producto.

- **Fecha de la ActualizaciÃ³n:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/FRONTEND_COLOR_UX_UI_RULES.md`
- **Tipo de Evento/Contexto:** Endurecimiento visual frente a recolor externo
- **DescripciÃ³n del Evento Original:** Un usuario reportÃ³ mapas donde paÃ­ses sin datos o con menor intensidad aparecÃ­an visualmente mÃ¡s claros de lo esperado, consistente con alteraciones de color desde extensiones, modos de alto contraste o forzado dark-mode del navegador/SO.
- **AcciÃ³n Realizada/CorrecciÃ³n:** Se formalizÃ³ una polÃ­tica de hardening visual para superficies semÃ¡nticas crÃ­ticas y se aÃ±adiÃ³ una verificaciÃ³n explÃ­cita en entornos con recolor/forced colors.
- **Nueva/Modificada Regla o Directriz:** Mapas, charts, heatmaps, canvas y SVG con significado por color deben usar la capa compartida de protecciÃ³n visual contra recolor automÃ¡tico y validarse tanto en navegador normal como bajo entornos que puedan forzar colores.
- **JustificaciÃ³n:** Reduce falsos reportes de datos, mejora la fidelidad del render en dispositivos personalizados y evita que futuros mÃ³dulos semÃ¡nticos queden vulnerables a reinterpretaciones visuales externas.
