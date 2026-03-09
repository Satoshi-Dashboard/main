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

## Workflow Paso 0: Ciclo Pre-Entrega de Revisión y Automejora (Universal para Agentes de IA)

1. **Activación por Solicitud:** Cada vez que el Agente de IA reciba una solicitud, un prompt o inicie una tarea que culminará en una salida para el usuario/sistema.
2. **Pre-Procesamiento de Reglas y Adhesión a Directrices (CRÍTICO):** Antes de generar cualquier respuesta, modificar datos o **especialmente antes de generar, modificar o eliminar código**, el Agente de IA debe:
   * **Revisar Activamente Todas las Reglas:** Consultar y comprender **todas las reglas y directrices generales** presentes en sus archivos `.md` de conocimiento, incluyendo la "Regla Universal de Automejora y Actualización Continua".
   * **Adhesión Estricta:** Asegurarse de que cualquier acción planificada (especialmente aquellas relacionadas con la manipulación de código: adición, modificación, eliminación o creación) se alinea **perfectamente** con las directrices, estándares y restricciones establecidas en estas reglas. **Cualquier desviación debe ser justificada explícitamente y, si es necesario, llevar a una actualización de las reglas.**
   * **Verificar Documentos de Reglas:** Asegurarse de que cualquier archivo `.md` de reglas relevante para la tarea (existente o recién creado) comienza con esta "Regla Universal". Si no es así, insertarla proactivamente.
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

1. Before any backend/API task, read `.claude/BACKEND_API_RULES.md`.
2. Treat that file as strict policy for architecture, compatibility, cache, security, and verification.
3. Before any backend/API/data-provider/source-priority task, also read `.claude/DATA_SOURCE_INTEGRITY_RULES.md`.
4. Treat that file as strict policy for approved providers, fallback behavior, refresh cadence, and source-priority integrity.
5. Do not bypass those backend/data-source rules unless the project owner explicitly asks to change them.
6. Before any module registry/order task, read `.claude/MODULE_REGISTRY_RULES.md`.
7. Treat module identity/order rules as strict policy to avoid module numbering confusion.
8. Before any frontend color/UX/UI request, read `.claude/FRONTEND_COLOR_UX_UI_RULES.md`.
9. Treat frontend color semantics (titles, statuses, chart palettes) as strict policy unless the owner explicitly asks to override it.
10. For every frontend module/content/element creation or update, include responsive behavior for mobile and tablet by default.
11. Treat responsive layout and touch usability as mandatory acceptance criteria, not optional enhancements.
12. For every frontend update, preserve responsive typography hierarchy and minimum readable font sizes for mobile/tablet.
13. Treat tiny unreadable text in responsive layouts as a defect that must be corrected before completion.
14. For every new frontend module, follow the mandatory "New module example rules" section in `.claude/FRONTEND_COLOR_UX_UI_RULES.md`.
15. For any new frontend user-facing text, use English by default unless the owner explicitly requests another language.
16. Before any code change (addition, modification, or deletion), verify the planned implementation remains compatible with Vercel deployment.
17. After finishing each code change, re-verify that the project can still be deployed on Vercel without issues.
18. Before any project analysis, audit, or improvement review, first inspect `README.md`, `package.json`, `src/config/modules.js`, and any relevant policy files in `.claude/`; then report findings prioritized by impact, risk, and effort.

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `AGENTS.md`
- **Tipo de Evento/Contexto:** Configuración universal de automejora
- **Descripción del Evento Original:** El punto de entrada de políticas para agentes no exigía una regla universal compartida ni un flujo formal de revisión/automejora antes de la entrega.
- **Acción Realizada/Corrección:** Se insertó la regla universal como primera sección y se añadió el workflow pre-entrega para que futuras tareas revisen, actualicen y registren aprendizaje en los documentos de políticas.
- **Nueva/Modificada Regla o Directriz:** `AGENTS.md` ahora obliga a iniciar desde la regla universal, ejecutar el ciclo pre-entrega de automejora y mantener un registro histórico persistente.
- **Justificación:** Centraliza el aprendizaje del agente en el archivo de entrada principal y reduce la probabilidad de repetir errores o saltarse actualizaciones de conocimiento.
