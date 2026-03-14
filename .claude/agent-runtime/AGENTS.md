---
aliases:
  - Agent Runtime Canonical
  - OpenCode Runtime Policy
tags:
  - claude/agent
  - claude/policy
  - claude/rag-source
note_type: policy
domain: agent-runtime
agent_priority: critical
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

1. Las skills instaladas bajo `.claude/skills/*/SKILL.md` son la autoridad tecnica primaria para patrones de implementacion, refactors, React/Vercel performance, auditoria UI/UX y workflows de despliegue.
2. La regla universal y los demas `.md` locales pasan a ser una capa de adaptacion, trazabilidad y restricciones especificas del proyecto; deben complementar y aterrizar las skills, no sustituirlas como base tecnica.
3. Si una regla local entra en conflicto tecnico con una skill instalada, debe actualizarse la regla local y seguir la skill, salvo cuando el owner haya fijado una restriccion mas fuerte de seguridad, integridad de fuentes, compatibilidad Vercel o contrato publico.
4. Los `SKILL.md` instalados por tooling upstream quedan exentos de la insercion automatica de esta cabecera universal; deben mantenerse gestionables por `skills` mientras los documentos locales registran como se aplican en este repo.

## Obsidian Context

- Home: [[VAULT_HOME]]
- Retrieval: [[RAG_OPERATING_SYSTEM]]
- Policy cluster: [[POLICY_INDEX]]
- Agent docs: [[AGENT_DOCS_INDEX]]
- Related: [[repo/PROJECT_STRUCTURE]], [[operations/CLOCK_ALIGNMENT_TODO]]

## Workflow Paso 0: Ciclo Pre-Entrega de Revisión y Automejora (Universal para Agentes de IA)

1. **Activación por Solicitud:** Cada vez que el Agente de IA reciba una solicitud, un prompt o inicie una tarea que culminará en una salida para el usuario/sistema.
2. **Pre-Procesamiento de Reglas y Adhesión a Directrices (CRÍTICO):** Antes de generar cualquier respuesta, modificar datos o **especialmente antes de generar, modificar o eliminar código**, el Agente de IA debe:
   * **Revisar Activamente Todas las Reglas:** Consultar y comprender **todas las reglas y directrices generales** presentes en sus archivos `.md` de conocimiento, incluyendo la "Regla Universal de Automejora y Actualización Continua".
   * **Adhesión Estricta:** Asegurarse de que cualquier acción planificada (especialmente aquellas relacionadas con la manipulación de código: adición, modificación, eliminación o creación) se alinea **perfectamente** con las directrices, estándares y restricciones establecidas en estas reglas. **Cualquier desviación debe ser justificada explícitamente y, si es necesario, llevar a una actualización de las reglas.**
   * **Verificar Documentos de Reglas:** Asegurarse de que cualquier archivo `.md` de reglas relevante para la tarea (existente o recién creado) comienza con esta "Regla Universal". Si el documento usa frontmatter YAML de Obsidian al inicio, ese bloque se considera metadata permitida y la regla universal debe seguir siendo la primera seccion real del contenido. Si no es asi, insertarla o corregirla proactivamente.
   * **Excepción Protegida para `patch note.md`:** El archivo `patch note.md` puede leerse libremente, pero está **prohibido** agregar, editar, borrar, reescribir o sobrescribir cualquier parte de su contenido sin permiso explícito y directo del usuario. Esta excepción prevalece sobre la inserción automática de la regla universal y sobre cualquier automejora automática.
   * **Excepción Protegida para `README.md`:** `README.md` es un documento publico orientado a GitHub y visitantes externos. Ningun agente puede editarlo, ampliarlo, reformatearlo, ni insertar reglas internas, historiales o boilerplate operativo sin una instruccion explicita del owner para modificar ese archivo en esa tarea concreta.
3. **Monitoreo y Detección Proactiva (Ciclo de Aprendizaje en Tiempo Real):** Mientras el Agente de IA procesa la solicitud, genera resultados y evalúa internamente:
   * **Monitorear activamente** cualquier posible error (lógico, sintáctico, de datos, de aplicación de reglas, de seguridad) en su propia operación, en los artefactos generados (código, texto, análisis) o en cómo interpreta y aplica sus propias directrices.
   * **Identificar Oportunidades de Mejora:** Reconocer también momentos donde una optimización, una clarificación o una nueva pieza de conocimiento podría mejorar futuros rendimientos.
   * **Corrección Interna:** Si se detecta un error o una oportunidad de mejora, el Agente debe corregir o integrar la mejora *internamente* de inmediato para la tarea actual.
4. **Actualización Formal de Conocimiento:** **Inmediatamente después de cualquier corrección o implementación de mejora interna**, el Agente de IA debe:
   * **Identificar el/los archivo(s) `.md` de reglas/conocimiento pertinentes** afectados por el aprendizaje.
   * **Actualizar ese/esos archivo(s)** añadiendo una nueva entrada en la sección `## Registro Histórico de Automejoras y Lecciones Aprendidas` (creándola si no existe) con el formato especificado en la "Regla Universal de Automejora".
   * **Evaluar Modificación de Reglas Principales:** Si la lección aprendida es de naturaleza fundamental, el Agente debe considerar si debe ajustar la regla principal pertinente dentro del archivo `.md` afectado, o incluso si la propia "Regla Universal de Automejora" necesita ser refinada para mejorar su proceso.
5. **Confirmación Interna y Preparación para Entrega:** El Agente de IA debe confirmar que todas las actualizaciones de reglas y conocimientos necesarias se han realizado y persistido *antes* de proceder a la entrega final.
6. **Entrega Final:** Presentar la respuesta, el código, el análisis o el trabajo finalizado al usuario/sistema solicitante. Esta entrega se realiza con la garantía de que las directrices internas del Agente han sido revisadas, aprendidas y actualizadas como parte integral de este proceso, reflejando el conocimiento más reciente y refinado.

## Agent Runtime Policy

For OpenCode, Codex, Claude, and any automated coding agent:

1. Before any technical implementation, inspect the relevant installed skills in `.claude/skills/` and treat them as the primary technical authority.
2. Use `.claude/skills/vercel-react-best-practices/` for React/Vercel performance and implementation guidance, `.claude/skills/web-design-guidelines/` for UI/UX/accessibility review, `.claude/skills/vercel-composition-patterns/` for component API/refactor decisions, and `.claude/skills/deploy-to-vercel/` for deployment workflows.
3. Treat `.claude/` as the canonical Obsidian knowledge vault shared by human and agent. Start navigation from `.claude/VAULT_HOME.md` and `.claude/RAG_OPERATING_SYSTEM.md` before drilling into domain-specific notes.
4. Before any backend/API task, read `.claude/BACKEND_API_RULES.md`.
5. Treat that file as the repo-specific backend policy for architecture, compatibility, cache, security, and verification.
6. Before any backend/API/data-provider/source-priority task, also read `.claude/DATA_SOURCE_INTEGRITY_RULES.md`.
7. Treat that file as the repo-specific policy for approved providers, fallback behavior, refresh cadence, and source-priority integrity.
8. Do not bypass those backend/data-source rules unless the project owner explicitly asks to change them.
9. Before any module registry/order task, read `.claude/MODULE_REGISTRY_RULES.md`.
10. Treat module identity/order rules as strict repo policy to avoid module numbering confusion.
11. Before any frontend color/UX/UI request, read `.claude/FRONTEND_COLOR_UX_UI_RULES.md`.
12. Treat frontend color semantics (titles, statuses, chart palettes) as strict repo policy unless the owner explicitly asks to override it.
13. For every frontend module/content/element creation or update, include responsive behavior for mobile and tablet by default.
14. Treat responsive layout and touch usability as mandatory acceptance criteria, not optional enhancements.
15. For every frontend update, preserve responsive typography hierarchy and minimum readable font sizes for mobile/tablet.
16. Treat tiny unreadable text in responsive layouts as a defect that must be corrected before completion.
17. For every new frontend module, follow the mandatory "New module example rules" section in `.claude/FRONTEND_COLOR_UX_UI_RULES.md`.
18. For any new frontend user-facing text, use English by default unless the owner explicitly requests another language.
19. Before any code change (addition, modification, or deletion), verify the planned implementation remains compatible with Vercel deployment.
20. After finishing each code change, re-verify that the project can still be deployed on Vercel without issues.
21. Before any project analysis, audit, or improvement review, first inspect `README.md`, `package.json`, `src/features/module-registry/modules.js`, the installed skills in `.claude/skills/`, `.claude/VAULT_HOME.md`, `.claude/RAG_OPERATING_SYSTEM.md`, and any relevant policy files in `.claude/`; then report findings prioritized by impact, risk, and effort.

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `AGENTS.md`
- **Tipo de Evento/Contexto:** Configuración universal de automejora
- **Descripción del Evento Original:** El punto de entrada de políticas para agentes no exigía una regla universal compartida ni un flujo formal de revisión/automejora antes de la entrega.
- **Acción Realizada/Corrección:** Se insertó la regla universal como primera sección y se añadió el workflow pre-entrega para que futuras tareas revisen, actualicen y registren aprendizaje en los documentos de políticas.
- **Nueva/Modificada Regla o Directriz:** `AGENTS.md` ahora obliga a iniciar desde la regla universal, ejecutar el ciclo pre-entrega de automejora y mantener un registro histórico persistente.
- **Justificación:** Centraliza el aprendizaje del agente en el archivo de entrada principal y reduce la probabilidad de repetir errores o saltarse actualizaciones de conocimiento.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `AGENTS.md`
- **Tipo de Evento/Contexto:** Alineación de políticas con nueva estructura
- **Descripción del Evento Original:** La política de auditoría inicial seguía señalando la antigua ruta del registro de módulos, lo que podía hacer que futuros agentes analizaran archivos obsoletos tras la reorganización.
- **Acción Realizada/Corrección:** Se actualizó la instrucción de análisis inicial para usar `src/features/module-registry/modules.js` como fuente de verdad estructural.
- **Nueva/Modificada Regla o Directriz:** Las revisiones iniciales del proyecto deben inspeccionar la ruta actual del registro de módulos en la jerarquía `src/features/module-registry/`.
- **Justificación:** Reduce errores de contexto al iniciar auditorías o cambios que dependan de identidad, slugs y orden de módulos.

- **Fecha de la Actualización:** `2026-03-13`
- **Archivo(s) Afectado(s):** `AGENTS.md`
- **Tipo de Evento/Contexto:** Protección explícita de documento de notas para usuario
- **Descripción del Evento Original:** Un agente escribió contenido no deseado en `patch note.md`, incluyendo una cabecera universal que el owner no quería en ese documento.
- **Acción Realizada/Corrección:** Se añadió una excepción protegida en la política principal para prohibir cualquier escritura o edición en `patch note.md` sin consentimiento explícito del usuario.
- **Nueva/Modificada Regla o Directriz:** `patch note.md` puede consultarse, pero ningún agente puede modificarlo, sobrescribirlo o ampliarlo sin una instrucción directa del owner autorizando esa edición.
- **Justificación:** Protege un documento sensible orientado al usuario final y evita que futuras automatizaciones alteren su tono, estructura o contenido sin permiso.

- **Fecha de la Actualización:** `2026-03-13`
- **Archivo(s) Afectado(s):** `AGENTS.md`
- **Tipo de Evento/Contexto:** Jerarquia tecnica skills-first y limpieza guiada por auditoria
- **Descripción del Evento Original:** El repositorio ya tenia politicas locales muy detalladas, pero no reconocia formalmente a las skills instaladas como autoridad tecnica primaria ni dejaba claro como debian adaptarse la regla universal y las politicas locales tras instalar `vercel-labs/agent-skills`.
- **Acción Realizada/Corrección:** Se añadió un addendum skills-first, se reordeno la politica runtime para leer primero las skills relevantes y se documento la excepcion de cabecera universal para `SKILL.md` gestionados por tooling upstream.
- **Nueva/Modificada Regla o Directriz:** Las skills instaladas en `.claude/skills/` mandan primero en lo tecnico; `AGENTS.md` y las politicas locales se reinterpretan como capa de adaptacion, negocio, seguridad, integridad y trazabilidad del proyecto.
- **Justificación:** Evita conflictos entre guidance tecnico upstream y reglas locales envejecidas, y deja explicita la nueva jerarquia pedida por el owner antes de futuras limpiezas o refactors.

- **Fecha de la Actualización:** `2026-03-13`
- **Archivo(s) Afectado(s):** `AGENTS.md`
- **Tipo de Evento/Contexto:** Integracion de Obsidian como capa canonica de navegacion y RAG
- **Descripción del Evento Original:** Las politicas apuntaban a `.claude/*.md`, pero no existia una entrada explicita que tratara `.claude/` como una boveda Obsidian canonica ni aclarara que el frontmatter YAML de Obsidian es metadata valida para documentos de reglas.
- **Acción Realizada/Corrección:** Se actualizo el workflow para permitir frontmatter YAML al inicio de documentos de reglas y se añadió a runtime policy que `.claude/VAULT_HOME.md` y `.claude/RAG_OPERATING_SYSTEM.md` son el punto de entrada compartido para navegacion humana y consumo del agente.
- **Nueva/Modificada Regla o Directriz:** La boveda `.claude/` pasa a ser la capa canonica de conocimiento navegable; los agentes deben arrancar desde sus notas de entrada Obsidian/RAG y pueden usar frontmatter YAML sin romper la obligacion de mantener la regla universal como primera seccion real del contenido.
- **Justificación:** Permite gestionar las reglas visualmente en Obsidian sin perder compatibilidad con los flujos del agente ni con la automejora historica del repositorio.

- **Fecha de la Actualización:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/agent-runtime/AGENTS.md`
- **Tipo de Evento/Contexto:** Reubicacion canonica de politica runtime al vault Obsidian
- **Descripción del Evento Original:** La politica runtime principal seguia viviendo en la raiz del repo, fuera de la boveda `.claude/`, lo que dificultaba gestionarla visualmente junto al resto de conocimiento agentico.
- **Acción Realizada/Corrección:** Se movió la version canonica de `AGENTS.md` a `.claude/agent-runtime/AGENTS.md`, se añadió frontmatter/links de Obsidian y la raiz pasa a usar un bridge minimo de compatibilidad.
- **Nueva/Modificada Regla o Directriz:** La politica runtime del agente debe residir canonicamente dentro de `.claude/`; cualquier archivo puente fuera del vault solo existe por compatibilidad con tooling y debe redirigir a esta nota.
- **Justificación:** Centraliza la gobernanza del agente en el vault compartido y evita repartir reglas criticas entre superficies distintas.

- **Fecha de la Actualización:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/agent-runtime/AGENTS.md`
- **Tipo de Evento/Contexto:** Proteccion explicita de README publico
- **Descripción del Evento Original:** El `README.md` estaba siendo tratado como documento operativo interno y recibiendo boilerplate/historiales automáticos, aunque el owner lo quiere reservado para comunicación publica y solo editable bajo orden expresa.
- **Acción Realizada/Corrección:** Se añadió una excepción protegida para `README.md` que prohíbe a cualquier agente modificarlo o inyectar contenido interno salvo instrucción explícita del owner en la tarea actual.
- **Nueva/Modificada Regla o Directriz:** `README.md` queda protegido como documento publico; leerlo está permitido, editarlo solo cuando el owner lo pida de forma específica.
- **Justificación:** Evita que agentes contaminen la portada publica del repositorio con reglas internas o cambios documentales no autorizados.
