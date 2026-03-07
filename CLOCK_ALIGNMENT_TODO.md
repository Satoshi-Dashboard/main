# Clock Alignment — Plan de Alineación de Relojes del Sistema
> Satoshi Dashboard · Auditoría y corrección de polling, TTL, scrapers y UX
> Fecha: 2026-03-07

---

## FASE 1 — UX: Etiquetas de refresco visibles al usuario

Corregir textos que implican "tiempo real" cuando la fuente no lo es.

- [ ] **S10 Fear & Greed** — cambiar indicador de `60s` → `"Actualización diaria · alternative.me"` y mostrar timestamp de última actualización real de la fuente
- [ ] **S14 BitInfoCharts (TransactionCount)** — cambiar `"Auto update: 60s"` → `"Datos on-chain · actualización diaria"`
- [ ] **S10 BitInfoCharts (BtcDistribution)** — mismo patrón que S14: `"Datos on-chain · actualización diaria"`
- [ ] **S08 Bitnodes (NodesMap)** — verificar que el texto `"Next update: in X min"` refleje los snapshots reales de bitnodes (6h UTC 6:05 / 18:05) y no el intervalo del scraper Docker
- [ ] **S21 Big Mac Sats** — eliminar `"(live 5m)"` del precio BTC/USD mostrado en esa sección; reemplazar por `"Índice anual · The Economist"` como badge secundario
- [ ] **S13 Global Assets** — verificar que muestre `"Newhedge API · update: 1h"` (ya parece correcto — confirmar y dejar)
- [ ] **S01 + S04 Mempool** — S01 usa 15s internamente; ajustar el texto UX a `"~30s"` una vez que se unifique el polling en Fase 2
- [ ] **S03 Multi-Currency** — confirmar que `"Auto update: 30s"` ya está correcto (dinámico con `REFRESH_MS`) — sin cambios si ya es así
- [ ] **S09b Stablecoins** — cambiar footer `"↻ list 60s · peg 60s"` → `"↻ list 2min · peg 2min"` una vez ajustado el polling en Fase 2

---

## FASE 2 — FRONTEND: Intervalos de polling en componentes

| Componente | Endpoint | Antes | Después |
|---|---|---|---|
| S10 FearGreedIndex | `/api/public/fear-greed` | 60s | fetch-once-on-mount (sin setInterval) |
| S01 BitcoinOverview | `/api/public/mempool/overview` | 15s | 30s (unificar con S04) |
| S14 TransactionCount | `/api/s14/addresses-richer` | 60s | 1h (3 600 000ms) |
| S08 NodesMap | `/api/bitnodes/cache` | 60s | 10min (600 000ms) |
| UniqueVisitorsCounter | `/api/visitors/stats` | 30s | 5min (300 000ms) |
| S09b Stablecoins (list) | `/api/s08/stablecoins` | 60s | 2min (120 000ms) |
| S09b Stablecoins (peg) | `/api/s08/stablecoins/live-prices` | 60s | 2min (120 000ms) |

- [ ] **S10** — reemplazar `setInterval(load, 60_000)` por llamada única en mount; no re-polling (dato diario)
- [ ] **S01** — cambiar `setInterval(load, 15_000)` → `setInterval(load, 30_000)`
- [ ] **S14** — cambiar `setInterval(load, 60_000)` → `setInterval(load, 3_600_000)`
- [ ] **S08** — cambiar `setInterval(load, 60_000)` → `setInterval(load, 600_000)`
- [ ] **UniqueVisitorsCounter** — cambiar `setInterval(refreshStats, 30_000)` → `setInterval(refreshStats, 300_000)`
- [ ] **S09b (list)** — cambiar `setInterval(load, LIST_REFRESH_MS)` donde `LIST_REFRESH_MS = 60_000` → `120_000`
- [ ] **S09b (peg)** — cambiar `setInterval(loadLivePegPrices, LIVE_PEG_REFRESH_MS)` donde `LIVE_PEG_REFRESH_MS = 60_000` → `120_000`
- [ ] **Eliminar `{ cache: 'no-store' }`** en estos endpoints estables para que el CDN Vercel pueda servir desde el edge:
  - `S10` → `/api/public/fear-greed`
  - `S10/S14` → `/api/s10/btc-distribution`, `/api/s14/addresses-richer`
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
- [ ] **`s08` stablecoins** — aumentar TTL de respuesta HTTP de `30s` → `120s` para alinear con el refresh real de CoinGecko (~60s + margen)
- [ ] **`s10` btc-distribution (BitInfoCharts)** — aumentar TTL de respuesta HTTP de `60s` → `3 600s` (1h); datos on-chain cambian cada ~24h
- [ ] **`s14` addresses-richer (BitInfoCharts)** — aumentar TTL de respuesta HTTP de `60s` → `3 600s` (1h); misma lógica que S10
- [ ] **`bitnodes`** — aumentar TTL de respuesta HTTP de `300s` → `21 600s` (6h); alineado con frecuencia real de snapshots de bitnodes.io
- [ ] **`s13` global-assets** — aumentar TTL de respuesta HTTP de `60s` → `3 600s` (1h); alineado con intervalo del scraper Docker

### Tabla resumen de TTLs backend

| Endpoint | TTL actual | TTL propuesto | Razón |
|---|---|---|---|
| `/api/public/fear-greed` | refresh 60s | refresh 6h | Fuente cambia 1 vez/día |
| `/api/public/s21/big-mac-sats-data` | refresh 60s | refresh 7 días | Fuente cambia 1 vez/año |
| `/api/public/geo/*` | 3 600s | 30 días | Datos estáticos GeoJSON |
| `/api/s03/multi-currency` | 10s HTTP | 30s HTTP | Alinear con scraper 30s |
| `/api/s08/stablecoins` | 30s HTTP | 120s HTTP | CoinGecko rate limit ~60s |
| `/api/s10/btc-distribution` | 60s HTTP | 3 600s HTTP | On-chain: cambios cada 24h |
| `/api/s14/addresses-richer` | 60s HTTP | 3 600s HTTP | On-chain: cambios cada 24h |
| `/api/bitnodes/cache` | 300s HTTP | 21 600s HTTP | Snapshots bitnodes cada 6h |
| `/api/s13/global-assets` | 60s HTTP | 3 600s HTTP | Scraper corre cada 1h |

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
| BitInfoCharts S10 (scraper) | 48 | 1 | −97.9% |
| BitInfoCharts S14 (scraper) | 48 | 1 | −97.9% |
| Bitnodes (scraper) | 144 | 2 | −98.6% |
| Bitnodes (frontend) | 1 440 | 144 | −90.0% |
| S14 TransactionCount (frontend) | 1 440 | 24 | −98.3% |
| UniqueVisitors (frontend) | 2 880 | 288 | −90.0% |
| S09b Stablecoins (frontend) | 2 880 | 720 | −75.0% |
| S01 Mempool (frontend) | 5 760 | 2 880 | −50.0% |
| Investing.com (scraper) | 2 880 | 1 440 | −50.0% |

> **Total estimado: ~70–80% reducción de invocaciones Vercel y ~90% reducción de ejecuciones de scrapers Docker**

---

*Generado por auditoría de alineación de relojes — Satoshi Dashboard · 2026-03-07*
