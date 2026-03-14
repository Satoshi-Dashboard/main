---
aliases:
  - Clock Alignment Plan
  - Polling Alignment TODO
tags:
  - claude/operations
  - claude/todo
  - claude/rag-source
note_type: log
domain: operations
agent_priority: medium
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

## Clock Alignment — Plan de Alineación de Relojes del Sistema
> Satoshi Dashboard · Auditoría y corrección de polling, TTL, scrapers y UX
> Fecha: 2026-03-07

## Obsidian Context

- Home: [[VAULT_HOME]]
- Retrieval: [[RAG_OPERATING_SYSTEM]]
- Agent docs: [[AGENT_DOCS_INDEX]]
- Related: [[agent-runtime/AGENTS]], [[BACKEND_API_RULES]], [[DATA_SOURCE_INTEGRITY_RULES]]

---

## FASE 1 — UX: Etiquetas de refresco visibles al usuario

Corregir textos que implican "tiempo real" cuando la fuente no lo es.

- [ ] **S11 Fear & Greed** — cambiar indicador de `60s` → `"Actualización diaria · alternative.me"` y mostrar timestamp de última actualización real de la fuente
- [ ] **S13 Wealth Pyramid (BitInfoCharts)** — cambiar `"Auto update: 60s"` → `"Datos on-chain · actualización diaria"`
- [ ] **S12 Address Distribution (BitInfoCharts)** — mismo patrón que S13: `"Datos on-chain · actualización diaria"`
- [ ] **S08 Bitnodes (NodesMap)** — verificar que el texto `"Next update: in X min"` refleje los snapshots reales de bitnodes (6h UTC 6:05 / 18:05) y no el intervalo del scraper Docker
- [ ] **S21 Big Mac Sats** — eliminar `"(live 5m)"` del precio BTC/USD mostrado en esa sección; reemplazar por `"Índice anual · The Economist"` como badge secundario
- [ ] **S14 Global Assets** — verificar que muestre `"Newhedge API · update: 1h"` (ya parece correcto — confirmar y dejar)
- [ ] **S01 + S04 Mempool** — S01 usa 15s internamente; ajustar el texto UX a `"~30s"` una vez que se unifique el polling en Fase 2
- [ ] **S03 Multi-Currency** — confirmar que `"Auto update: 30s"` ya está correcto (dinámico con `REFRESH_MS`) — sin cambios si ya es así
- [ ] **S10 Stablecoin Peg Health** — cambiar footer `"↻ list 60s · peg 60s"` → `"↻ list 2min · peg 2min"` una vez ajustado el polling en Fase 2

---

## FASE 2 — FRONTEND: Intervalos de polling en componentes

| Componente | Endpoint | Antes | Después |
|---|---|---|---|
| S11 FearGreedIndex | `/api/public/fear-greed` | 60s | fetch-once-on-mount (sin setInterval) |
| S01 BitcoinOverview | `/api/public/mempool/overview` | 15s | 30s (unificar con S04) |
| S13 WealthPyramid | `/api/s13/addresses-richer` | 60s | 1h (3 600 000ms) |
| S08 NodesMap | `/api/bitnodes/cache` | 60s | 10min (600 000ms) |
| S10 Stablecoins (list) | `/api/s10/stablecoins` | 60s | 2min (120 000ms) |
| S10 Stablecoins (peg) | `/api/s10/stablecoins/live-prices` | 60s | 2min (120 000ms) |

- [ ] **S11** — reemplazar `setInterval(load, 60_000)` por llamada única en mount; no re-polling (dato diario)
- [ ] **S01** — cambiar `setInterval(load, 15_000)` → `setInterval(load, 30_000)`
- [ ] **S13** — cambiar `setInterval(load, 60_000)` → `setInterval(load, 3_600_000)`
- [ ] **S08** — cambiar `setInterval(load, 60_000)` → `setInterval(load, 600_000)`
- [ ] **S10 (list)** — cambiar `setInterval(load, LIST_REFRESH_MS)` donde `LIST_REFRESH_MS = 60_000` → `120_000`
- [ ] **S10 (peg)** — cambiar `setInterval(loadLivePegPrices, LIVE_PEG_REFRESH_MS)` donde `LIVE_PEG_REFRESH_MS = 60_000` → `120_000`
- [ ] **Eliminar `{ cache: 'no-store' }`** en estos endpoints estables para que el CDN Vercel pueda servir desde el edge:
  - `S11` → `/api/public/fear-greed`
  - `S12/S13` → `/api/s12/btc-distribution`, `/api/s13/addresses-richer`
  - `S08` → `/api/bitnodes/cache`
  - `S21` → `/api/public/s21/big-mac-sats-data`
  - `S03` → `/api/public/geo/land` (fetch inicial, no polling)
  - `S08` → `/api/public/geo/countries` (fetch inicial, no polling)

---

## FASE 3 — BACKEND: Alinear TTL y refresh intervals del servidor

### `publicDataFeeds.js` (feeds de datos públicos)

- [ ] **fear-greed** — cambiar `refreshMs: 60_000` → `refreshMs: 21_600_000` (6h); TTL de respuesta pasará de ~180s a ~21 720s
- [ ] **big-mac-sats** — cambiar `refreshMs: 60_000` → `refreshMs: 604_800_000` (7 días); TTL de respuesta pasa a ~7 días
- [ ] **geo/countries + geo/land** — cambiar `refreshMs` a `2_592_000_000` (30 días) o cargar una sola vez en memoria al arrancar el servidor (datos estáticos GeoJSON)

### Endpoints de cache de scrapers

- [ ] **`s03` multi-currency** — alinear TTL de respuesta HTTP de `10s` → `30s` para coincidir exactamente con el intervalo del scraper Docker
- [ ] **`s10` stablecoins** — aumentar TTL de respuesta HTTP de `30s` → `120s` para alinear con el refresh real de CoinGecko (~60s + margen)
- [ ] **`s12` btc-distribution (BitInfoCharts)** — aumentar TTL de respuesta HTTP de `60s` → `3 600s` (1h); datos on-chain cambian cada ~24h
- [ ] **`s13` addresses-richer (BitInfoCharts)** — aumentar TTL de respuesta HTTP de `60s` → `3 600s` (1h); misma lógica que S12
- [ ] **`bitnodes`** — aumentar TTL de respuesta HTTP de `300s` → `21 600s` (6h); alineado con frecuencia real de snapshots de bitnodes.io
- [ ] **`s14` global-assets** — aumentar TTL de respuesta HTTP de `60s` → `3 600s` (1h); alineado con intervalo del scraper Docker

### Tabla resumen de TTLs backend

| Endpoint | TTL actual | TTL propuesto | Razón |
|---|---|---|---|
| `/api/public/fear-greed` | refresh 60s | refresh 6h | Fuente cambia 1 vez/día |
| `/api/public/s21/big-mac-sats-data` | refresh 60s | refresh 7 días | Fuente cambia 1 vez/año |
| `/api/public/geo/*` | 3 600s | 30 días | Datos estáticos GeoJSON |
| `/api/s03/multi-currency` | 10s HTTP | 30s HTTP | Alinear con scraper 30s |
| `/api/s10/stablecoins` | 30s HTTP | 120s HTTP | CoinGecko rate limit ~60s |
| `/api/s12/btc-distribution` | 60s HTTP | 3 600s HTTP | On-chain: cambios cada 24h |
| `/api/s13/addresses-richer` | 60s HTTP | 3 600s HTTP | On-chain: cambios cada 24h |
| `/api/bitnodes/cache` | 300s HTTP | 21 600s HTTP | Snapshots bitnodes cada 6h |
| `/api/s14/global-assets` | 60s HTTP | 3 600s HTTP | Scraper corre cada 1h |

---

## FASE 4 — DOCKER SCRAPER: Corregir intervalos en `satoshi-scraper`

**Path:** `C:\Users\liber\Downloads\satoshi-scraper`

### Intervalos de cron a corregir

- [ ] **`bitinfocharts-richlist`** — cambiar cron `*/30 * * * *` (cada 30min) → `0 2 * * *` (1 vez/día a las 2:00 AM UTC); datos on-chain cambian cada ~24h
- [ ] **`bitnodes-nodes`** — cambiar cron `*/10 * * * *` (cada 10min) → `5 6,18 * * *` (2 veces/día: 6:05h y 18:05h UTC, 5 min después del snapshot de bitnodes.io)
- [ ] **`newhedge-global-assets`** — mantener `0 * * * *` (1 vez/hora) — ✅ ya alineado con la fuente
- [ ] **`investing-currencies`** — cambiar de cada 30s → cada 60s; fuente FX actualiza ~15–30s, 60s es suficiente con el margen del backend (TTL backend será 30s)

### Tabla resumen de scrapers Docker

| Scraper | Fuente | Cron actual | Cron propuesto | Ahorro |
|---|---|---|---|---|
| `bitinfocharts-richlist` | bitinfocharts.com | `*/30 * * * *` | `0 2 * * *` | −96% ejecuciones |
| `bitnodes-nodes` | bitnodes.io | `*/10 * * * *` | `5 6,18 * * *` | −97% ejecuciones |
| `newhedge-global-assets` | newhedge.io (Jina) | `0 * * * *` | sin cambio ✅ | — |
| `investing-currencies` | investing.com | cada 30s | cada 60s | −50% ejecuciones |

### Persistencia en disco (anti-calentamiento)

- [ ] **`docker-compose.yml`** — agregar volumen de persistencia:
  ```yaml
  volumes:
    - ./cache:/app/cache
  ```
- [ ] **`server.js`** — para `bitinfocharts` y `bitnodes`: al arrancar, leer datos previos de `/app/cache/{scraper}.json`; tras cada scrape exitoso, escribir a disco
- [ ] **Formato de archivo de cache:** `{ data: {...}, scrapedAt: "ISO string", nextRunAt: "ISO string" }`
- [ ] **Manejo de error en lectura:** si el archivo no existe o es inválido, continuar normalmente (primer arranque); no bloquear el inicio del servidor

---

## FASE 5 — REGLAS: Crear `SCRAPER_RULES.md`

**Path de salida:** `C:\Users\liber\Downloads\satoshi-scraper\SCRAPER_RULES.md`

- [ ] **Tabla canónica de decisión** — `frecuencia_fuente → intervalo_scraper → TTL_backend → TTL_CDN → polling_frontend → label_UX`
- [ ] **Categorías de fuentes por Tier:**
  - Tier 1 `< 30s` → Binance tick, mempool blocks
  - Tier 2 `30s – 5min` → Mempool overview, FX investing.com
  - Tier 3 `5min – 1h` → CoinGecko, Lightning topology, Newhedge
  - Tier 4 `1h – 24h` → Bitnodes snapshots (6h)
  - Tier 5 `> 24h` → BitInfoCharts (24h), Fear & Greed (24h), Big Mac (1 año), GeoJSON (estático)
- [ ] **Regla de cache headers** — NO usar `{ cache: 'no-store' }` en endpoints con TTL > 60s; configurar `s-maxage` correctamente en el backend
- [ ] **Checklist de incorporación de nuevo scraper** — al crear un nuevo endpoint:
  1. Definir frecuencia real de actualización de la fuente
  2. Calcular TTL backend = `max(intervalo_scraper, frecuencia_fuente) + margen 10%`
  3. Definir cron Docker alineado con frecuencia fuente
  4. Definir polling frontend = `max(TTL_CDN, 30s)`
  5. Definir label UX honesto con la frecuencia real
  6. Si intervalo > 1h → activar persistencia en disco
- [ ] **Regla de persistencia Docker** — todo scraper con intervalo > 1h DEBE persistir su cache en volumen Docker para sobrevivir reinicios sin período de calentamiento (503)
- [ ] **Regla de deduplicación de polling** — si dos componentes consultan el mismo endpoint, centralizar el fetch en un hook compartido o en el store de Zustand

---

## FASE 6 — VERIFICACIÓN

- [ ] Levantar `satoshi-scraper` con Docker y confirmar en logs que `bitinfocharts` y `bitnodes` solo ejecutan en sus nuevos intervalos
- [ ] Abrir DevTools (Network tab) en el dashboard y verificar que ningún endpoint recibe peticiones más frecuentes que su TTL configurado
- [ ] Verificar que las etiquetas UX en cada sección muestran el tiempo real de actualización de la fuente (no el intervalo de polling interno)
- [ ] Confirmar que los endpoints sin `{ cache: 'no-store' }` reciben el header `X-Vercel-Cache: HIT` desde el CDN edge en llamadas subsiguientes
- [ ] Tomar screenshot del dashboard completo y confirmar que todas las secciones cargan correctamente con los nuevos TTLs
- [ ] Revisar consola del browser: sin errores nuevos por cambios de TTL o polling

---

## Resumen de ahorro estimado de invocaciones (por usuario activo, por día)

| Endpoint / Módulo | Invocaciones/día antes | Invocaciones/día después | Ahorro |
|---|---|---|---|
| Fear & Greed (frontend) | 1 440 | 1 (fetch-once) | −99.9% |
| BitInfoCharts S12 (scraper) | 48 | 1 | −97.9% |
| BitInfoCharts S13 (scraper) | 48 | 1 | −97.9% |
| Bitnodes (scraper) | 144 | 2 | −98.6% |
| Bitnodes (frontend) | 1 440 | 144 | −90.0% |
| S13 Wealth Pyramid (frontend) | 1 440 | 24 | −98.3% |
| Visitor counter frontend consumer | n/a | n/a | No hay consumidor montado actualmente |
| S10 Stablecoins (frontend) | 2 880 | 720 | −75.0% |
| S01 Mempool (frontend) | 5 760 | 2 880 | −50.0% |
| Investing.com (scraper) | 2 880 | 1 440 | −50.0% |

> **Total estimado: ~70–80% reducción de invocaciones Vercel y ~90% reducción de ejecuciones de scrapers Docker**

---

*Generado por auditoría de alineación de relojes — Satoshi Dashboard · 2026-03-07*

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `CLOCK_ALIGNMENT_TODO.md`
- **Tipo de Evento/Contexto:** Configuración universal de automejora
- **Descripción del Evento Original:** El plan operativo de alineación de relojes no estaba cubierto por la regla universal ni contemplaba un historial de aprendizajes para futuras correcciones.
- **Acción Realizada/Corrección:** Se añadió la regla universal al inicio del plan y se creó el registro histórico al final para documentar mejoras posteriores.
- **Nueva/Modificada Regla o Directriz:** `CLOCK_ALIGNMENT_TODO.md` queda formalizado como documento de conocimiento operativo sujeto al ciclo de automejora y trazabilidad histórica.
- **Justificación:** Evita que decisiones operativas relevantes queden fuera del aprendizaje del agente y permite mantener continuidad en auditorías posteriores.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `CLOCK_ALIGNMENT_TODO.md`
- **Tipo de Evento/Contexto:** Corrección documental de consumidor inexistente
- **Descripción del Evento Original:** El plan seguía incluyendo tareas para `UniqueVisitorsCounter`, pero actualmente no existe ningún consumidor frontend montado para esos endpoints en `src/`.
- **Acción Realizada/Corrección:** Se marcaron como no aplicables las filas y tareas de polling frontend asociadas al visitor counter hasta que exista un componente real.
- **Nueva/Modificada Regla o Directriz:** Los planes operativos deben diferenciar entre endpoints backend disponibles y consumidores frontend efectivamente montados antes de proponer cambios de polling o UX.
- **Justificación:** Evita ejecutar trabajo sobre componentes inexistentes y mantiene el TODO alineado con el estado real del código.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `CLOCK_ALIGNMENT_TODO.md`
- **Tipo de Evento/Contexto:** Limpieza de plan tras retiro del visitor counter
- **Descripción del Evento Original:** El plan de polling todavía conservaba una fila histórica del visitor counter aunque el feature fue eliminado del proyecto.
- **Acción Realizada/Corrección:** Se retiraron la fila y la tarea asociadas al visitor counter del plan operativo actual.
- **Nueva/Modificada Regla o Directriz:** Si un endpoint o feature deja de existir, los TODOs operativos deben eliminarlo del plan activo en lugar de mantenerlo como pendiente condicional.
- **Justificación:** Evita ruido en auditorías de polling y deja el documento enfocado en superficies que realmente siguen formando parte del producto.

- **Fecha de la Actualizacion:** `2026-03-13`
- **Archivo(s) Afectado(s):** `CLOCK_ALIGNMENT_TODO.md`
- **Tipo de Evento/Contexto:** Correccion de drift de modulos en plan historico
- **Descripcion del Evento Original:** El documento seguia usando nombres/codigos obsoletos como `S10 Fear & Greed`, `S14 TransactionCount` y `S09b Stablecoins`, ya desalineados con el registro actual de modulos.
- **Accion Realizada/Correccion:** Se actualizaron referencias del plan para que apunten a `S11 Fear & Greed`, `S12 Address Distribution`, `S13 Wealth Pyramid`, `S14 Global Assets` y `S10 Stablecoin Peg Health`.
- **Nueva/Modificada Regla o Directriz:** Los TODOs historicos que nombren modulos deben revalidarse contra `src/features/module-registry/modules.js` antes de seguir usandose como base de auditoria o refactor.
- **Justificacion:** Evita planes de limpieza o performance sobre identidades de modulo ya obsoletas y reduce confusiones entre auditorias viejas y la estructura viva del repo.

- **Fecha de la Actualizacion:** `2026-03-13`
- **Archivo(s) Afectado(s):** `.claude/operations/CLOCK_ALIGNMENT_TODO.md`
- **Tipo de Evento/Contexto:** Reubicacion canonica de TODO operativo al vault Obsidian
- **Descripcion del Evento Original:** El plan de alineacion de relojes seguia en la raiz del repo, fuera de la boveda `.claude/`, aunque es conocimiento operativo principalmente para humanos y agentes de mantenimiento.
- **Accion Realizada/Correccion:** Se movio la version canonica a `.claude/operations/CLOCK_ALIGNMENT_TODO.md`, se añadieron metadatos/links de Obsidian y el vault pasa a indexarlo desde `AGENT_DOCS_INDEX`.
- **Nueva/Modificada Regla o Directriz:** Los TODOs operativos agenticos deben residir canonicamente dentro de `.claude/` para quedar incluidos en navegacion, backlinks y flujo RAG compartido.
- **Justificacion:** Evita perder backlog operativo fuera del grafo del vault y unifica la memoria de mantenimiento en una sola superficie visual.
