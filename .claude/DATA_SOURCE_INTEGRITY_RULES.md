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

## Data Source Integrity Rules (Strict)

This file exists to protect the owner's approved data sources, refresh logic, and fallback behavior.

Any automated agent working on this repository must treat this file as strict policy.

## Purpose

Use this file to answer, before changing any data flow:

1. What does each module actually consume?
2. Which approved upstream source is allowed?
3. How often is it expected to refresh?
4. What fallback is allowed when the upstream fails?
5. What must not be changed without explicit owner approval?

## Non-negotiable rules

1. Do not change an external data provider unless the project owner explicitly requests it.
2. Do not replace approved scrape/API sources with a different provider just because it seems simpler.
3. Do not remove a fallback path unless the owner explicitly asks for that change.
4. Do not silently change refresh cadence in a way that increases upstream pressure or changes UX expectations.
5. If a module currently uses the owner's approved source, preserve it even if a generic public API exists.
6. When adding a new data source or changing an existing one, update both tables in this file in the same task.
7. When changing any `/api/*` contract, keep frontend compatibility unless the owner explicitly asks for a breaking change.
8. If there is any conflict between agent convenience and this file, this file wins.
9. Do not present source snapshot time as if it were the same thing as frontend/backend refresh cadence; when both matter, label them separately.

## Mandatory workflow before data-source changes

Before editing any of the following:

- `server/services/btcRates.js`
- `server/**`
- `api/**`
- frontend callers under `src/shared/lib/**`, `src/shared/services/**`, `src/features/modules/**`
- any module metadata that describes providers or refresh behavior

you must:

1. Read this file.
2. Confirm the target module/code/slug in `src/features/module-registry/modules.js`.
3. Preserve the approved source priority documented here unless the owner explicitly says to change it.
4. After the change, update this file if any source/fallback/cadence/route changed.

## Human table

This table is intentionally plain-language and owner-friendly.

| Module / feature | What it is used for | Where the data really comes from | How often it refreshes for the project | If the source fails | What must not be changed silently |
| --- | --- | --- | --- | --- | --- |
| S01 Bitcoin Overview | Main BTC overview card set | BTC price from Binance; mempool and fee data from mempool.space; sentiment from Alternative.me | BTC spot about every 5s, overview about every 30s, UI refresh about every 30s | Use cached/stale backend payloads and keep last UI values | Do not swap Binance, mempool.space, or Alternative.me without owner approval |
| S02 Price Chart | BTC price chart ranges | Current BTC spot from Binance; historical candles from Binance/Binance.US | Historical cache about every 5 min; current spot about every 5s | Use cached history and existing UI cache | Do not swap Binance history source without owner approval |
| S03 Multi-Currency | BTC price in many fiat currencies | BTC/USD anchor comes from the BTC rates service; fiat cross factors come from Investing, preferably through `api.zatobox.io`, with direct Investing scrape as backup | About every 30s | Use stale shared payload if refresh fails | Do not replace Investing/Zatobox with another FX provider unless owner asks |
| S04 Mempool Gauge | Compare official mempool.space view vs owner node mempool view | mempool.space APIs for shared mempool stats, Zatobox scrape for official mempool.space memory usage with direct mempool.space `init-data` fallback, and Zatobox Bitcoin Core/Knots scrape for the owner node snapshot with local Tor RPC `getmempoolinfo` fallback | Official view about every 30s; node view about every 5s | Use stale cached payloads per source, fall back to direct mempool.space `init-data` for official usage if the scrape path fails, fall back to local Tor RPC for the node snapshot if configured, and keep each surface isolated when one side fails | Do not replace mempool.space, the approved Zatobox scrape paths, the local-node fallback, or blur official-vs-node labels silently |
| S05 Long-Term Trend | Live mempool trend / recent block state | mempool.space | About every 10s | Use stale cached payload and preserve last good UI state | Do not replace mempool.space silently |
| S06 Nodes Map | Bitcoin nodes world map | Bitnodes data, preferably through `api.zatobox.io` scraper output; otherwise direct Bitnodes API; if that fails, scrape Bitnodes HTML modal | UI polls about every 10 min; backend follows Bitnodes snapshot/fallback windows | HTML scrape fallback or stale payload | Do not replace Bitnodes with another node provider silently |
| S07 Lightning Nodes Map | Lightning nodes world distribution | mempool.space lightning world data + Natural Earth geography | About every 60s | Use stale cached payload | Do not replace mempool.space or Natural Earth silently |
| S08 BTC Map Business Density | Merchant/business map by country | BTC Map places API plus Natural Earth country geometry/matching | UI about every 10 min; backend aggregate about every 6h | Use stale cached aggregate | Do not replace BTC Map silently |
| S09 Lightning Network | Lightning stats panel using BTC price anchor | BTC price from Binance | About every 15s in UI, underlying spot about every 5s | Keep previous UI value or cached backend value | Do not replace Binance silently |
| S10 Stablecoin Peg Health | Stablecoin peg monitor | CoinGecko stablecoin list, live prices, and per-coin details | Usually every 2 min; detail payload can live longer | Use stale list/live/detail payloads | Do not replace CoinGecko silently |
| S11 Fear & Greed | Fear & Greed module | Alternative.me | About every 6h | Use stale cached payload | Do not replace Alternative.me silently |
| S12 Address Distribution | BTC address distribution | BitInfoCharts, preferably via scraper proxy, otherwise direct shared scrape/parser | About every 30 min | Use stale cached payload | Do not replace BitInfoCharts silently |
| S13 Wealth Pyramid | Richness tiers / wealth pyramid | BitInfoCharts, preferably via scraper proxy, otherwise direct shared scrape/parser | About every 30 min | Use stale cached payload | Do not replace BitInfoCharts silently |
| S14 Global Assets | BTC vs global asset values | Newhedge snapshot, preferably via `api.zatobox.io`, otherwise fetched through the `r.jina.ai` mirror | About every 60 min | Use stale cached snapshot | Do not replace Newhedge silently |
| S15 BTC vs Gold | BTC vs gold comparison | BTC price/history from Binance with backend-derived BTC market cap from protocol issuance estimates; gold current market cap from `api.zatobox.io/api/scrape/companiesmarketcap-gold` | BTC history about every 5 min; gold snapshot about every 15 min | Backend serves cached/stale Binance+Zatobox comparison payload | Do not replace Binance or Zatobox/CompaniesMarketCap silently |
| S16 Mayer Multiple | Under-construction interactive preview | BTC spot from Binance plus shared daily BTC history from Binance/Binance.US; Mayer Multiple is derived client-side from that history with a 200-day SMA warmup | Spot about every 10s in UI; daily history requested on load and effectively cached at the long-range backend cadence | Use frontend memory cache, backend stale history payload, and keep the last good spot value | Do not swap Binance spot/history or document this preview as a fully live/indexable module without owner approval |
| S17 Price Performance | Under-construction comparison page | BTC spot from Binance; rest is local/static data | On load | Component falls back to a baked BTC value if needed | Do not pretend this is fully live data |
| S18 Cycle Spiral | Under-construction cycle visual | Local handcrafted cycle data | Static | n/a | Do not document as live API data |
| S19 Power Law Model | Under-construction model page | Local model data | Static | n/a | Do not document as live API data |
| S20 Stock to Flow | Under-construction model page | Local model data | Static | n/a | Do not document as live API data |
| S21 Big Mac Sats Tracker | Under-construction purchasing-power tracker | BTC spot from Binance, Big Mac price from The Economist CSV, historical BTC closes from Binance/Binance.US | UI about every 5 min; combined backend feed is slow-moving and cached | Use stale combined cache | Do not replace Economist/Binance silently |
| S22 Seasonality | Under-construction heatmap | Local static dataset | Static | n/a | Do not document as live API data |
| S23 Big Mac Index | Under-construction quick burger/BTC comparison | BTC spot from Binance; burger price is local/static in the component | On load | Component falls back to a baked BTC value if needed | Do not document as fully live multi-source data |
| S24 Network Activity | Under-construction activity panel | Local synthetic/mock dataset | Static | n/a | Do not document as live API data |
| S25 Log Regression | Under-construction model page | Local model data | Static | n/a | Do not document as live API data |
| S26 MVRV Score | Under-construction model page | Local model data | Static | n/a | Do not document as live API data |
| S27 Google Trends | Under-construction trends page | Local synthetic/mock dataset | Static | n/a | Do not document as live API data |
| S28 BTC Dominance | Under-construction dominance page | Local dataset | Static | n/a | Do not document as live API data |
| S29 UTXO Distribution | Under-construction UTXO page | Local static dataset | Static | n/a | Do not document as live API data |
| S30 U.S. National Debt | Treasury debt module | U.S. Treasury FiscalData plus latest available U.S. Census ACS population estimate | Debt series about every 15 min; population estimate about every 30 days; UI interpolates every second | Use stale cached debt/population payloads and keep local interpolation running | Do not replace Treasury/Census silently |
| S31 Thank You Satoshi | Closing tribute module | Local static content only | Static | n/a | Do not document as API-driven |

## Technical table

This table mirrors the same intent with implementation details for agents.

| Module / feature | Frontend consumer | Internal route / service | Approved upstream priority | Effective refresh cadence | Allowed fallback path | Key files |
| --- | --- | --- | --- | --- | --- | --- |
| S01 Bitcoin Overview | `src/features/modules/live/S01_BitcoinOverview.jsx` | `fetchBtcSpot()` + `/api/public/mempool/overview` | BTC spot: Binance -> Binance.US -> cached `btcRates`; overview: mempool.space + Alternative.me via `getMempoolOverviewPayload()` | `btcRates`: 5s; mempool overview: 30s; UI poll: 30s | Shared KV/memory stale payloads; keep previous UI state | `server/services/btcRates.js`, `server/services/publicDataFeeds.js`, `server/app.js` |
| S02 Price Chart | `src/features/modules/live/S02_PriceChart.jsx` | `fetchBtcSpot()` + `/api/public/binance/btc-history` | Spot: Binance -> Binance.US -> cached `btcRates`; history: Binance -> Binance.US | Spot: 5s; history feed: 5 min; UI by range/on load | Shared stale history payload + frontend per-range cache | `server/services/btcRates.js`, `server/services/publicDataFeeds.js` |
| S03 Multi-Currency | `src/features/modules/live/S03_MultiCurrencyBoard.jsx` | `/api/s03/multi-currency` | `/api/btc/rates` as anchor; FX: `SCRAPER_BASE_URL/api/scrape/investing-currencies` -> direct Investing HTML parse | 30s | `withCacheLock()` + shared stale payload in `server/features/multi-currency/s03MultiCurrencyScraper.js` | `server/features/multi-currency/s03MultiCurrencyScraper.js`, `server/services/btcRates.js`, `server/app.js` |
| S04 Mempool Gauge | `src/features/modules/live/S04_MempoolGauge.jsx` | `fetchMempoolOverviewBundle()` + `fetchMempoolOfficialUsageSnapshot()` + `fetchMempoolNodeSnapshot()` | mempool.space `/api/mempool` + mempool blocks/recommended fees; `SCRAPER_BASE_URL/api/scrape/mempool-space-memory-usage` -> direct `https://mempool.space/api/v1/init-data`; `SCRAPER_BASE_URL/api/scrape/bitcoin-core-mempool` -> local Tor RPC `getmempoolinfo` when configured | Official overview 30s; node snapshot 5s | Shared stale payloads in `getFeed()` per source; official usage falls back to direct `init-data`; node snapshot falls back to local Tor RPC; UI keeps official and node views in separate surfaces | `src/shared/services/mempoolApi.js`, `server/services/publicDataFeeds.js`, `server/app.js`, `src/features/modules/live/S04_MempoolGauge.jsx` |
| S05 Long-Term Trend | `src/features/modules/live/S05_LongTermTrend.jsx` | `/api/public/mempool/live` | mempool blocks + mempool fee blocks + recommended fees | 10s | Shared stale payload in `getFeed()` | `server/services/publicDataFeeds.js` |
| S06 Nodes Map | `src/features/modules/live/S06_NodesMap.jsx` | `/api/bitnodes/cache` | `SCRAPER_BASE_URL/api/scrape/bitnodes-nodes` API data -> direct Bitnodes API + snapshot -> Bitnodes HTML modal scrape fallback | Backend follows Bitnodes next snapshot / scrape throttle; UI poll ~10 min | Existing fallback payload or stale cache | `server/features/bitnodes/bitnodesCache.js`, `server/app.js` |
| S07 Lightning Nodes Map | `src/features/modules/live/S07_LightningNodesMap.jsx` | `/api/public/lightning/world` | mempool.space lightning world | 60s | Shared stale payload in `getFeed()` | `server/services/publicDataFeeds.js` |
| S08 BTC Map Business Density | `src/features/modules/live/S08_BtcMapBusinessesMap.jsx` | `/api/public/btcmap/businesses-by-country` | BTC Map places API + Natural Earth high-res countries | Backend 6h; UI poll ~10 min | Shared stale aggregate payload | `server/services/publicDataFeeds.js` |
| S09 Lightning Network | `src/features/modules/live/S09_LightningNetwork.jsx` | `fetchBtcSpot()` | Binance -> Binance.US -> cached `btcRates` | Spot 5s; UI 15s | Cached `btcRates` payload / previous UI state | `src/shared/services/priceApi.js`, `server/services/btcRates.js` |
| S10 Stablecoin Peg Health | `src/features/modules/live/S10_StablecoinPegHealth.jsx` | `/api/s10/stablecoins`, `/api/s10/stablecoins/live-prices`, `/api/s10/stablecoin/:id` | CoinGecko markets list -> derived live-price payload -> CoinGecko detail endpoint | List/live 2 min; detail cache 10 min TTL with slower effective reuse | Stale list/live/detail payloads from memory/KV | `server/features/stablecoins/s10StablecoinPegCache.js`, `server/app.js` |
| S11 Fear & Greed | `src/features/modules/live/S11_FearGreedIndex.jsx` | `/api/public/fear-greed?limit=31` | Alternative.me | 6h | Shared stale payload in `getFeed()` | `server/services/publicDataFeeds.js` |
| S12 Address Distribution | `src/features/modules/live/S12_AddressDistribution.jsx` | `/api/s12/btc-distribution` | `SCRAPER_BASE_URL/api/scrape/bitinfocharts-richlist` -> direct BitInfoCharts HTML shared parser | 30 min | Stale shared payload | `server/services/bitinfochartsShared.js`, `server/features/bitinfocharts/s12BtcDistribution.js`, `server/app.js` |
| S13 Wealth Pyramid | `src/features/modules/live/S13_WealthPyramid.jsx` | `/api/s13/addresses-richer` | `SCRAPER_BASE_URL/api/scrape/bitinfocharts-richlist` -> direct BitInfoCharts HTML shared parser | 30 min | Stale shared payload | `server/services/bitinfochartsShared.js`, `server/features/bitinfocharts/s13AddressesRicher.js`, `server/app.js` |
| S14 Global Assets | `src/features/modules/live/S14_GlobalAssetsTreemap.jsx` | `/api/s14/global-assets` | `SCRAPER_BASE_URL/api/scrape/newhedge-global-assets` -> `https://r.jina.ai/http://newhedge.io/bitcoin/global-asset-values` | 60 min | Stale snapshot from KV/memory | `server/features/global-assets/s14GlobalAssetsCache.js`, `server/app.js` |
| S15 BTC vs Gold | `src/features/modules/live/S15_BTCvsGold.jsx` | `/api/s15/btc-vs-gold-market-cap` | Binance/Binance.US daily BTC history + `/api/btc/rates` spot -> backend BTC market-cap derivation from protocol issuance schedule; gold: `SCRAPER_BASE_URL/api/scrape/companiesmarketcap-gold` | BTC history 5 min; BTC spot 5s; gold snapshot 15 min | Backend payload built from stale/cached Binance history and stale/cached Zatobox gold snapshot | `server/services/publicDataFeeds.js`, `server/services/btcRates.js`, `server/app.js`, `src/features/modules/live/S15_BTCvsGold.jsx` |
| S16 Mayer Multiple | `src/features/modules/under-construction/S16_MayerMultiple.jsx` | `fetchBtcSpot()` + `fetchBtcHistory(2025, '1d')` | Spot: Binance -> Binance.US -> cached `btcRates`; history: Binance -> Binance.US | Spot poll 10s in UI; warmup-adjusted long-range daily history requested on load with effective 60 min backend cadence | Frontend memory cache in `priceApi.js`, backend stale history payload, previous UI spot value | `src/shared/services/priceApi.js`, `src/shared/utils/mayerMultiple.js`, `src/features/modules/under-construction/S16_MayerMultiple.jsx` |
| S17 Price Performance | `src/features/modules/under-construction/S17_PricePerformance.jsx` | `/api/btc/rates` | Binance -> Binance.US -> cached `btcRates` | On load | Local fallback price `84000` in component | `server/services/btcRates.js`, `src/features/modules/under-construction/S17_PricePerformance.jsx` |
| S21 Big Mac Sats Tracker | `src/features/modules/under-construction/S21_BigMacSatsTracker.jsx` | `/api/public/s21/big-mac-sats-data` | `/api/btc/rates` spot + Economist CSV + Binance/Binance.US historical close lookups | Combined feed 7d; subfeeds 12h-24h; UI 5 min | Shared stale combined payload | `server/services/publicDataFeeds.js`, `server/services/btcRates.js`, `src/features/modules/under-construction/S21_BigMacSatsTracker.jsx` |
| S23 Big Mac Index | `src/features/modules/under-construction/S23_BigMacIndex.jsx` | `/api/btc/rates` | Binance -> Binance.US -> cached `btcRates` | On load | Local fallback price `84000` in component | `server/services/btcRates.js`, `src/features/modules/under-construction/S23_BigMacIndex.jsx` |
| S30 U.S. National Debt | `src/features/modules/live/S30_USNationalDebt.jsx` | `/api/public/us-national-debt` | Treasury Debt to the Penny -> latest available ACS 1-Year population year | Debt 15 min; population 30d; UI local 1s interpolation loop | Combined stale payload from debt/population feeds | `server/services/publicDataFeeds.js`, `src/shared/services/usNationalDebtApi.js`, `server/app.js` |

## Change checklist (required whenever a source changes)

If you change a provider, scrape path, internal API route, refresh cadence, or fallback behavior:

1. Update the Human table.
2. Update the Technical table.
3. Update `README.md` if user-facing documentation changed.
4. Keep `src/features/module-registry/moduleDataMeta.js` aligned with the real provider story.
5. Run the verification required by `.claude/BACKEND_API_RULES.md`.

## Owner intent summary

The owner wants stable, approved data sources and does not want agents to casually swap providers.

That means:

- if the project uses Investing via Zatobox, keep that unless explicitly told otherwise
- if the project uses Bitnodes, BitInfoCharts, Newhedge, CoinGecko, Zatobox, Treasury, Census, Binance, BTC Map, or mempool.space, preserve them unless explicitly told otherwise
- if a source is scraped on purpose, do not replace it with a different API just because it is easier
- if the owner asks for a source change, update this file immediately so future agents do not undo it

## Registro Histórico de Automejoras y Lecciones Aprendidas

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- **Tipo de Evento/Contexto:** Configuración universal de automejora
- **Descripción del Evento Original:** La política de integridad de fuentes no incluía una regla universal de automejora ni un registro histórico obligatorio para cambios derivados de fallos o mejoras detectadas.
- **Acción Realizada/Corrección:** Se insertó la regla universal al inicio y se añadió la sección histórica para registrar futuras correcciones relacionadas con proveedores, fallback y cadencias.
- **Nueva/Modificada Regla o Directriz:** Las decisiones sobre fuentes de datos deben conservar una traza histórica y actualizar esta política cuando un aprendizaje cambie reglas o conocimiento operativo.
- **Justificación:** Reduce el riesgo de que futuros agentes deshagan ajustes críticos de proveedores o repitan cambios incompatibles con la intención del owner.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- **Tipo de Evento/Contexto:** Reorganización de rutas y corrección de consumidor inexistente
- **Descripción del Evento Original:** La política de fuentes apuntaba a rutas previas de frontend/backend y seguía documentando un `UniqueVisitorsCounter` montado en frontend aunque actualmente no existe ese consumidor en `src/`.
- **Acción Realizada/Corrección:** Se actualizaron las rutas al layout `src/features`/`src/shared` y `server/core`/`server/services`/`server/features`, y se corrigió la fila del visitor counter para marcarlo como endpoint backend sin consumidor frontend montado.
- **Nueva/Modificada Regla o Directriz:** Las tablas de integridad deben distinguir entre consumidores frontend realmente montados y endpoints backend disponibles, además de seguir siempre la estructura vigente del repositorio.
- **Justificación:** Reduce el riesgo de investigar archivos equivocados, asumir flujos inexistentes o alterar la historia de proveedores en el lugar incorrecto.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- **Tipo de Evento/Contexto:** Consolidación backend de comparación S15
- **Descripción del Evento Original:** `S15` mezclaba CoinGecko con una referencia local de oro directamente en el frontend, lo que dejaba la historia de datos repartida y dificultaba garantizar una API clara para el módulo de comparación.
- **Acción Realizada/Corrección:** Se movió la transformación `BTC vs Gold Market Cap` al backend con la ruta `/api/s15/btc-vs-gold-market-cap`, preservando CoinGecko como fuente aprobada y la referencia local de oro como complemento interno del servidor.
- **Nueva/Modificada Regla o Directriz:** Cuando un módulo comparativo combina una fuente aprobada con una referencia local estable, la composición debe preferirse en backend si mejora consistencia del contrato sin cambiar proveedores ni cadencias aprobadas.
- **Justificación:** Centraliza el flujo real del módulo, evita duplicar lógica de comparación en el cliente y mantiene intacta la intención del owner sobre proveedores y fallback.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- **Tipo de Evento/Contexto:** Corrección de semántica temporal en metadata de módulos
- **Descripción del Evento Original:** Algunos módulos mostraban un texto del tipo `Auto update: 30m` junto a un `Last:` tomado del snapshot de la fuente, lo que podía hacer pensar que el sistema no refrescaba aunque en realidad la fuente upstream no hubiera publicado un dato nuevo.
- **Acción Realizada/Corrección:** Se separaron las nociones de `Refresh target`, `Source snapshot` y `Last checked/sync` en frontend y backend, añadiendo timestamps de chequeo reales donde hacía falta.
- **Nueva/Modificada Regla o Directriz:** Las superficies de metadata temporal deben distinguir explícitamente entre cadencia de chequeo, momento del último chequeo del sistema y fecha del snapshot entregado por la fuente upstream.
- **Justificación:** Evita diagnósticos falsos de stale data, mejora transparencia operativa y ayuda a detectar si el retraso viene del backend o del proveedor real.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- **Tipo de Evento/Contexto:** Sustitución de mock local por derivación real en preview S16
- **Descripción del Evento Original:** `S16` seguía documentado como dataset sintético local, aunque pasó a derivar el Mayer Multiple desde el mismo spot e histórico diario de BTC ya aprobados para `S02`.
- **Acción Realizada/Corrección:** Se actualizaron las tablas humana y técnica para reflejar que `S16` usa `fetchBtcSpot()` más `fetchBtcHistory(1825, '1d')`, calculando SMA200 y Mayer Multiple en cliente con caché frontend y fallback del historial backend.
- **Nueva/Modificada Regla o Directriz:** Cuando un módulo preview deja de usar mocks y deriva un indicador desde feeds aprobados ya existentes, la política de fuentes debe pasar a describir el flujo derivado real y sus cadencias/fallbacks sin promocionarlo todavía como módulo live/indexable.
- **Justificación:** Mantiene coherencia entre implementación, metadata y documentación de integridad de fuentes, y evita que futuros agentes reintroduzcan datos sintéticos por creer que el módulo aún no consume servicios reales.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- **Tipo de Evento/Contexto:** Corrección de cobertura SMA200 en rango visible de S16
- **Descripción del Evento Original:** La primera versión con datos reales de `S16` usaba solo `1825` días, lo que dejaba sin warmup suficiente a la SMA200 al abrir el rango visible de 5 años y podía producir un tramo inicial vacío en la línea del Mayer Multiple.
- **Acción Realizada/Corrección:** Se documentó y adoptó una carga de `2025` días (`5Y + 200d` de warmup) para que el gráfico visible de 5 años conserve cobertura completa sin cambiar proveedor, ruta base ni semántica del indicador.
- **Nueva/Modificada Regla o Directriz:** Cuando un indicador derivado necesita ventana retrospectiva adicional (por ejemplo una SMA larga), la política de fuentes debe reflejar explícitamente el warmup necesario para evitar huecos o cálculos truncados en el rango visible.
- **Justificación:** Previene diagnósticos falsos de datos faltantes, mantiene honestidad matemática en indicadores derivados y evita que futuros agentes vuelvan a recortar demasiado la historia base.

- **Fecha de la Actualización:** `2026-03-09`
- **Archivo(s) Afectado(s):** `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- **Tipo de Evento/Contexto:** Sustitución aprobada de fuente en S15
- **Descripción del Evento Original:** `S15` dependía de CoinGecko para el market chart BTC y de una referencia local/manual para el oro, pero el owner pidió quitar CoinGecko de este módulo y usar la API scraper de Zatobox para el market cap del oro.
- **Acción Realizada/Corrección:** Se actualizaron las tablas humana y técnica para fijar `Binance/Binance.US + emision protocolaria` como base del market cap BTC y `SCRAPER_BASE_URL/api/scrape/companiesmarketcap-gold` como fuente aprobada del market cap actual del oro.
- **Nueva/Modificada Regla o Directriz:** En `S15`, CoinGecko deja de ser una fuente aprobada; el flujo permitido es Binance/Binance.US para precio/histórico BTC y Zatobox/CompaniesMarketCap para el snapshot actual del oro, con fallback stale de backend y sin volver a una tabla local/manual del oro salvo instrucción expresa del owner.
- **Justificación:** Evita que futuros agentes reintroduzcan CoinGecko o datos locales del oro en `S15`, preserva la decision explicita del owner y mantiene trazabilidad clara del nuevo contrato de datos.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- **Tipo de Evento/Contexto:** Eliminación de feature de tracking de visitantes
- **Descripción del Evento Original:** La política de fuentes seguía reservando filas para un visitor counter backend que ya no debe existir en el proyecto.
- **Acción Realizada/Corrección:** Se eliminaron las filas humana y técnica del visitor counter para dejar solo los flujos de datos que continúan soportados.
- **Nueva/Modificada Regla o Directriz:** Cuando un feature de datos o tracking se retire completamente, esta política debe borrar su entrada en ambas tablas en la misma tarea para evitar reintroducciones accidentales.
- **Justificación:** Mantiene la fuente de verdad centrada en integraciones activas y reduce el riesgo de que futuros agentes reconstruyan un flujo que el owner ya decidió eliminar.

- **Fecha de la Actualización:** `2026-03-11`
- **Archivo(s) Afectado(s):** `.claude/DATA_SOURCE_INTEGRITY_RULES.md`
- **Tipo de Evento/Contexto:** Separación aprobada de vistas oficial vs nodo en S04
- **Descripción del Evento Original:** `S04` necesitaba mostrar dos lecturas distintas del mempool sin volver a mezclarlas en una sola narrativa: la vista oficial de mempool.space y la vista del nodo Bitcoin Knots del owner.
- **Acción Realizada/Corrección:** Se actualizaron las tablas para fijar la arquitectura dual de `S04`: overview de mempool.space, scrape dedicado de `mempool-space-memory-usage` para la memoria oficial con fallback directo a `mempool.space /api/v1/init-data`, y snapshot `bitcoin-core-mempool` para la vista del nodo propio con fallback a Tor RPC local `getmempoolinfo`, cada una con su cadencia y fallback separados.
- **Nueva/Modificada Regla o Directriz:** Cuando `S04` compare el mempool oficial con el del nodo del owner, la política debe describir explícitamente ambos feeds, cualquier fallback que conserve la misma semántica oficial o node-scoped, mantenerlos en superficies diferenciadas y no volver a presentarlos como un único bundle homogéneo.
- **Justificación:** Preserva la trazabilidad del origen de cada métrica, reduce el riesgo de volver a mezclar scopes distintos y deja claro qué scrape aprobado corresponde a cada vista modal.
