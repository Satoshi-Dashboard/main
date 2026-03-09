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

## Mandatory workflow before data-source changes

Before editing any of the following:

- `btcRates.js`
- `server/**`
- `api/**`
- frontend callers under `src/lib/**`, `src/services/**`, `src/components/sections/**`
- any module metadata that describes providers or refresh behavior

you must:

1. Read this file.
2. Confirm the target module/code/slug in `src/config/modules.js`.
3. Preserve the approved source priority documented here unless the owner explicitly says to change it.
4. After the change, update this file if any source/fallback/cadence/route changed.

## Human table

This table is intentionally plain-language and owner-friendly.

| Module / feature | What it is used for | Where the data really comes from | How often it refreshes for the project | If the source fails | What must not be changed silently |
| --- | --- | --- | --- | --- | --- |
| S01 Bitcoin Overview | Main BTC overview card set | BTC price from Binance; mempool and fee data from mempool.space; sentiment from Alternative.me | BTC spot about every 5s, overview about every 30s, UI refresh about every 30s | Use cached/stale backend payloads and keep last UI values | Do not swap Binance, mempool.space, or Alternative.me without owner approval |
| S02 Price Chart | BTC price chart ranges | Current BTC spot from Binance; historical candles from Binance/Binance.US | Historical cache about every 5 min; current spot about every 5s | Use cached history and existing UI cache | Do not swap Binance history source without owner approval |
| S03 Multi-Currency | BTC price in many fiat currencies | BTC/USD anchor comes from the BTC rates service; fiat cross factors come from Investing, preferably through `api.zatobox.io`, with direct Investing scrape as backup | About every 30s | Use stale shared payload if refresh fails | Do not replace Investing/Zatobox with another FX provider unless owner asks |
| S04 Mempool Gauge | Fees, mempool, hashrate snapshot | mempool.space plus Alternative.me fear/greed | About every 30s | Use stale cached payload | Do not replace mempool.space/Alternative.me silently |
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
| S15 BTC vs Gold | BTC vs gold comparison | BTC market chart from CoinGecko; gold comparison values are local/static in the frontend | About every 60 min for BTC chart | UI uses local/static fallback behavior if fetch fails | Do not replace CoinGecko silently |
| S16 Mayer Multiple | Under-construction model page | Local mock/generated data only | Static | No remote fallback needed | Do not document this as live API-driven data |
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
| Visitor counter | Unique visitor counter | Anonymous browser-generated ID tracked by backend, stored as salted hash in shared KV or local file | On stats read / session track | Falls back to local file mode when shared KV is absent | Do not switch to raw IP-based tracking |

## Technical table

This table mirrors the same intent with implementation details for agents.

| Module / feature | Frontend consumer | Internal route / service | Approved upstream priority | Effective refresh cadence | Allowed fallback path | Key files |
| --- | --- | --- | --- | --- | --- | --- |
| S01 Bitcoin Overview | `src/components/sections/live/S01_BitcoinOverview.jsx` | `fetchBtcSpot()` + `/api/public/mempool/overview` | BTC spot: Binance -> Binance.US -> cached `btcRates`; overview: mempool.space + Alternative.me via `getMempoolOverviewPayload()` | `btcRates`: 5s; mempool overview: 30s; UI poll: 30s | Shared KV/memory stale payloads; keep previous UI state | `btcRates.js`, `server/shared/publicDataFeeds.js`, `server/app.js` |
| S02 Price Chart | `src/components/sections/live/S02_PriceChart.jsx` | `fetchBtcSpot()` + `/api/public/binance/btc-history` | Spot: Binance -> Binance.US -> cached `btcRates`; history: Binance -> Binance.US | Spot: 5s; history feed: 5 min; UI by range/on load | Shared stale history payload + frontend per-range cache | `btcRates.js`, `server/shared/publicDataFeeds.js` |
| S03 Multi-Currency | `src/components/sections/live/S03_MultiCurrencyBoard.jsx` | `/api/s03/multi-currency` | `/api/btc/rates` as anchor; FX: `SCRAPER_BASE_URL/api/scrape/investing-currencies` -> direct Investing HTML parse | 30s | `withCacheLock()` + shared stale payload in `server/features/s03MultiCurrencyScraper.js` | `server/features/s03MultiCurrencyScraper.js`, `btcRates.js`, `server/app.js` |
| S04 Mempool Gauge | `src/components/sections/live/S04_MempoolGauge.jsx` | `/api/public/mempool/overview` | mempool difficulty/fees/hashrate/mempool + Alternative.me FNG | 30s | Shared stale payload in `getFeed()` | `server/shared/publicDataFeeds.js` |
| S05 Long-Term Trend | `src/components/sections/live/S05_LongTermTrend.jsx` | `/api/public/mempool/live` | mempool blocks + mempool fee blocks + recommended fees | 10s | Shared stale payload in `getFeed()` | `server/shared/publicDataFeeds.js` |
| S06 Nodes Map | `src/components/sections/live/S06_NodesMap.jsx` | `/api/bitnodes/cache` | `SCRAPER_BASE_URL/api/scrape/bitnodes-nodes` API data -> direct Bitnodes API + snapshot -> Bitnodes HTML modal scrape fallback | Backend follows Bitnodes next snapshot / scrape throttle; UI poll ~10 min | Existing fallback payload or stale cache | `server/features/bitnodesCache.js`, `server/app.js` |
| S07 Lightning Nodes Map | `src/components/sections/live/S07_LightningNodesMap.jsx` | `/api/public/lightning/world` | mempool.space lightning world | 60s | Shared stale payload in `getFeed()` | `server/shared/publicDataFeeds.js` |
| S08 BTC Map Business Density | `src/components/sections/live/S08_BtcMapBusinessesMap.jsx` | `/api/public/btcmap/businesses-by-country` | BTC Map places API + Natural Earth high-res countries | Backend 6h; UI poll ~10 min | Shared stale aggregate payload | `server/shared/publicDataFeeds.js` |
| S09 Lightning Network | `src/components/sections/live/S09_LightningNetwork.jsx` | `fetchBtcSpot()` | Binance -> Binance.US -> cached `btcRates` | Spot 5s; UI 15s | Cached `btcRates` payload / previous UI state | `src/services/priceApi.js`, `btcRates.js` |
| S10 Stablecoin Peg Health | `src/components/sections/live/S10_StablecoinPegHealth.jsx` | `/api/s10/stablecoins`, `/api/s10/stablecoins/live-prices`, `/api/s10/stablecoin/:id` | CoinGecko markets list -> derived live-price payload -> CoinGecko detail endpoint | List/live 2 min; detail cache 10 min TTL with slower effective reuse | Stale list/live/detail payloads from memory/KV | `server/features/s10StablecoinPegCache.js`, `server/app.js` |
| S11 Fear & Greed | `src/components/sections/live/S11_FearGreedIndex.jsx` | `/api/public/fear-greed?limit=31` | Alternative.me | 6h | Shared stale payload in `getFeed()` | `server/shared/publicDataFeeds.js` |
| S12 Address Distribution | `src/components/sections/live/S12_AddressDistribution.jsx` | `/api/s12/btc-distribution` | `SCRAPER_BASE_URL/api/scrape/bitinfocharts-richlist` -> direct BitInfoCharts HTML shared parser | 30 min | Stale shared payload | `server/shared/bitinfochartsShared.js`, `server/features/s12BtcDistribution.js`, `server/app.js` |
| S13 Wealth Pyramid | `src/components/sections/live/S13_WealthPyramid.jsx` | `/api/s13/addresses-richer` | `SCRAPER_BASE_URL/api/scrape/bitinfocharts-richlist` -> direct BitInfoCharts HTML shared parser | 30 min | Stale shared payload | `server/shared/bitinfochartsShared.js`, `server/features/s13AddressesRicher.js`, `server/app.js` |
| S14 Global Assets | `src/components/sections/live/S14_GlobalAssetsTreemap.jsx` | `/api/s14/global-assets` | `SCRAPER_BASE_URL/api/scrape/newhedge-global-assets` -> `https://r.jina.ai/http://newhedge.io/bitcoin/global-asset-values` | 60 min | Stale snapshot from KV/memory | `server/features/s14GlobalAssetsCache.js`, `server/app.js` |
| S15 BTC vs Gold | `src/components/sections/live/S15_BTCvsGold.jsx` | `/api/public/coingecko/bitcoin-market-chart?days=365` | CoinGecko | 60 min | Component-side local fallback rendering path | `server/shared/publicDataFeeds.js`, `src/components/sections/live/S15_BTCvsGold.jsx` |
| S17 Price Performance | `src/components/sections/under-construction/S17_PricePerformance.jsx` | `/api/btc/rates` | Binance -> Binance.US -> cached `btcRates` | On load | Local fallback price `84000` in component | `btcRates.js`, `src/components/sections/under-construction/S17_PricePerformance.jsx` |
| S21 Big Mac Sats Tracker | `src/components/sections/under-construction/S21_BigMacSatsTracker.jsx` | `/api/public/s21/big-mac-sats-data` | `/api/btc/rates` spot + Economist CSV + Binance/Binance.US historical close lookups | Combined feed 7d; subfeeds 12h-24h; UI 5 min | Shared stale combined payload | `server/shared/publicDataFeeds.js`, `btcRates.js`, `src/components/sections/under-construction/S21_BigMacSatsTracker.jsx` |
| S23 Big Mac Index | `src/components/sections/under-construction/S23_BigMacIndex.jsx` | `/api/btc/rates` | Binance -> Binance.US -> cached `btcRates` | On load | Local fallback price `84000` in component | `btcRates.js`, `src/components/sections/under-construction/S23_BigMacIndex.jsx` |
| S30 U.S. National Debt | `src/components/sections/live/S30_USNationalDebt.jsx` | `/api/public/us-national-debt` | Treasury Debt to the Penny -> latest available ACS 1-Year population year | Debt 15 min; population 30d; UI local 1s interpolation loop | Combined stale payload from debt/population feeds | `server/shared/publicDataFeeds.js`, `src/services/usNationalDebtApi.js`, `server/app.js` |
| Visitor counter | `src/components/common/UniqueVisitorsCounter.jsx` | `/api/visitors/stats`, `/api/visitors/track` | Shared KV if configured -> local file fallback; visitor identity is browser-generated and salted server-side | Session-based track; stats read on demand | Local file mode with approximate behavior in production if KV missing | `server/features/visitorCounter.js`, `server/app.js` |

## Change checklist (required whenever a source changes)

If you change a provider, scrape path, internal API route, refresh cadence, or fallback behavior:

1. Update the Human table.
2. Update the Technical table.
3. Update `README.md` if user-facing documentation changed.
4. Keep `src/config/moduleDataMeta.js` aligned with the real provider story.
5. Run the verification required by `.claude/BACKEND_API_RULES.md`.

## Owner intent summary

The owner wants stable, approved data sources and does not want agents to casually swap providers.

That means:

- if the project uses Investing via Zatobox, keep that unless explicitly told otherwise
- if the project uses Bitnodes, BitInfoCharts, Newhedge, CoinGecko, Treasury, Census, Binance, BTC Map, or mempool.space, preserve them unless explicitly told otherwise
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
