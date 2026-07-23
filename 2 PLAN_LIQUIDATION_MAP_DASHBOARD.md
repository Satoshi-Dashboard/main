# PLAN — BTC/USDT Liquidation Map (lado dashboard)

> **Documento de especificación auto-contenido.** Este archivo es la ÚNICA fuente que necesita el agente implementador para construir el lado dashboard del módulo "BTC/USDT Liquidation Map" en este repo (`satoshi-dashboard` / londonstrategicedge.com). El lado servidor de datos (modelo, WebSocket de Binance, agregación) vive en OTRO repo (`satoshi-scraper`, Docker always-on en `api.zatobox.io`) y tiene su propio documento (`PLAN_LIQUIDATION_MAP_SCRAPER.md`). Este dashboard SOLO consume los endpoints del scraper vía `SCRAPER_BASE_URL`, los cachea en su API serverless (Express en Vercel) y los pinta.
>
> Todas las rutas de archivo y números de línea citados aquí fueron verificados contra el working tree actual (rama `dev`). Si al implementar los números de línea se han desplazado unas pocas líneas, usa el ancla de código citada (nombre de función/constante), no el número.

---

## A. Contexto y alcance

### Qué es el módulo

Un módulo estilo **Coinglass Liquidation Map** para BTC/USDT (Binance Futures perpetuo), con:

1. **Mapa de barras por nivel de precio**: cada barra representa un bucket de precio (múltiplos de `bucketSize`, hoy $100) con el **volumen estimado en USD de posiciones que se liquidarían** si el precio tocara ese nivel.
2. **Coloreado por tier de apalancamiento**: 10x / 25x / 50x / 100x, barras apiladas (los tiers de una misma barra se apilan).
3. **Curva acumulada** (línea sobre eje Y derecho): liquidaciones acumuladas sumando **hacia afuera desde el precio de referencia** por cada lado (longs hacia abajo, shorts hacia arriba). Se calcula client-side; NO viaja en el payload.
4. **Marcador de precio actual**: línea vertical punteada blanca en `refPrice` con label.
5. **Header de métricas**: mark price, open interest, funding rate, totales long/short.
6. **Badge "ESTIMATED"** con tooltip explicando el modelo.
7. **Ticker de liquidaciones reales recientes** (stream `forceOrder` de Binance, muestreado): filas coloreadas (rojo = long liquidado, verde = short liquidado).

### Qué NO hace

- **NO calcula el modelo de liquidaciones.** La distribución de open interest entre tiers, el cálculo de precios de liquidación, el seeding y el mantenimiento de buckets son 100 % responsabilidad del scraper (`satoshi-scraper`). El dashboard es un consumidor tonto del contrato de la sección B.
- **NO llama a Binance directamente.** Toda la data entra por `${SCRAPER_BASE_URL}/api/scrape/binance-liq-map` y `/api/scrape/binance-liq-events`, siempre a través del backend serverless propio (el navegador jamás llama al scraper ni a Binance).
- **NO presenta los eventos `forceOrder` como volumen total liquidado** (son una muestra: Binance emite máx. 1 evento/s por símbolo).

### Decisiones cerradas (no reabrir)

| Decisión | Valor |
| --- | --- |
| Librería de chart | **recharts** (ya es dependencia: `recharts@^3.7.0` en `package.json`, línea 41) |
| Cadencia de poll del frontend | **15 s** (`refreshMs: 15_000` en `useModuleData`) |
| Lanzamiento | **Live directo** — sin overlay "under construction", sin noindex, sin tocar `ModulePage.jsx` |
| Código runtime del módulo | **S32** (posicional: se genera del orden del array en `modules.js`) |
| Slug | `s32-bitcoin-liquidation-map` (auto: `código.toLowerCase() + '-' + slugBase`) |
| Nombre de archivo del componente | `src/features/modules/live/S33_LiquidationMap.jsx` (ver justificación en sección E) |

---

## B. Contrato de API compartido

El bloque siguiente es **VERBATIM** e idéntico al incluido en `PLAN_LIQUIDATION_MAP_SCRAPER.md` del repo `satoshi-scraper`. No modificar ni un campo sin actualizar ambos documentos.

<!-- CONTRACT-START -->
## Contrato de API compartido (dashboard ⇄ scraper)

**Fuente de verdad.** No cambiar sin actualizar este mismo bloque en ambos documentos (`PLAN_LIQUIDATION_MAP_DASHBOARD.md` en main-main y `PLAN_LIQUIDATION_MAP_SCRAPER.md` en satoshi-scraper).

Base URL: `SCRAPER_BASE_URL` — producción `https://api.zatobox.io`, local `http://localhost:9119`.

### Endpoint 1 — `GET /api/scrape/binance-liq-map`

Snapshot del mapa de liquidaciones estimado. Cache-Control: `public, s-maxage=15, stale-while-revalidate=30`.

```json
{
  "source": "binance-futures",
  "provider": "api.zatobox.io",
  "symbol": "BTCUSDT",
  "model": "oi-delta-leverage-tiers-v1",
  "estimated": true,
  "refPrice": 118432.5,
  "markPrice": 118440.1,
  "fundingRate": 0.0000125,
  "openInterest": { "base": 91234.5, "usd": 10804512345 },
  "longShortRatio": 1.02,
  "bucketSize": 100,
  "rangePct": 0.2,
  "leverageTiers": [10, 25, 50, 100],
  "leverageWeights": { "10": 0.30, "25": 0.30, "50": 0.25, "100": 0.15 },
  "mmr": 0.004,
  "buckets": [
    {
      "price": 112300,
      "longs":  { "10": 1250000, "25": 830000, "50": 410000, "100": 95000 },
      "shorts": { "10": 0, "25": 0, "50": 0, "100": 0 },
      "total": 2585000
    }
  ],
  "totals": { "long": 812000000, "short": 703000000 },
  "seededFrom": "snapshot",
  "lastEventAt": "2026-07-23T14:02:11.000Z",
  "_meta": {
    "cachedAt": "2026-07-23T14:02:30.000Z",
    "scraper": "satoshi-scraper",
    "transport": "ws+rest",
    "lastError": null
  }
}
```

Reglas:
- `buckets` ordenados por `price` ascendente; solo buckets con `total > 0` dentro de `refPrice × (1 ± rangePct)`.
- `price` = piso del bucket (múltiplo de `bucketSize`). Todos los valores de tiers en USD notional.
- La curva acumulada NO viaja en el payload: la calcula el frontend sumando hacia afuera desde `refPrice` por lado.
- `seededFrom` ∈ `"snapshot" | "disk" | "backfill" | null`.
- `estimated` es siempre `true`; el frontend DEBE mostrar el badge "ESTIMATED".

### Endpoint 2 — `GET /api/scrape/binance-liq-events`

Liquidaciones reales recientes (stream forceOrder de Binance). Cache-Control: `public, s-maxage=5, stale-while-revalidate=15`.

```json
{
  "source": "binance-futures",
  "provider": "api.zatobox.io",
  "symbol": "BTCUSDT",
  "sampled": true,
  "note": "Binance emite maximo 1 evento forceOrder por segundo por simbolo; esto es una muestra, no el volumen total de liquidaciones.",
  "events": [
    {
      "ts": 1753279331000,
      "side": "SELL",
      "price": 118221.3,
      "qty": 0.512,
      "notional": 60529.1,
      "orderStatus": "FILLED"
    }
  ],
  "count": 500,
  "_meta": {
    "cachedAt": "2026-07-23T14:02:30.000Z",
    "scraper": "satoshi-scraper",
    "lastError": null
  }
}
```

Reglas:
- `events` ordenados por `ts` descendente (más nuevo primero), máximo 500.
- `side: "SELL"` = long liquidado; `side: "BUY"` = short liquidado.
- `sampled` es siempre `true`; NUNCA presentar la suma de eventos como volumen total liquidado.

### Errores
- Sin datos (arranque frío fallido, Binance inaccesible/geo-block HTTP 451): responder HTTP `503` con `{ "error": "...", "_meta": { "lastError": "..." } }`.
- El dashboard trata 503/timeout sirviendo su último payload cacheado con `is_fallback: true` (patrón getFeed existente).
<!-- CONTRACT-END -->

---

## C. Backend serverless (Express en Vercel)

Tres archivos a tocar: `server/services/publicDataFeeds.js`, `server/shared/utils/normalizeUtils.js`, `server/app.js` — más una línea en `server/shared/serviceRegistry.js` (agregador que `server/app.js` usa para importar los getters; verificado: `server/app.js` importa TODO desde `./shared/serviceRegistry.js`, líneas 6–54).

### C.1 — `server/services/publicDataFeeds.js`

Datos verificados del archivo (1572 líneas):

- `SCRAPER_BASE_URL` ya existe en la **línea 73**: `const SCRAPER_BASE_URL = String(process.env.SCRAPER_BASE_URL || 'https://api.zatobox.io').trim();` — reutilizar, NO redeclarar.
- `FEED_DEFS` ocupa las **líneas 101–462**.
- El motor SWR `getFeed(feedKey, fetchData, validateData)` está en las **líneas 545–610** (con `refreshFeed` en 536–543, `stalePayload` en 479–488 y `buildPayload` en 490–508).
- **Util de fetch con timeout que usa el archivo hoy**: `fetchJsonWithTimeout(url, { timeoutMs })` importado de `server/shared/utils/fetchUtils.js` (definido allí en la línea 19; timeout por defecto `FETCH_TIMEOUT_MS = 12_000`, línea 6). Reutilizar exactamente este util con `{ timeoutMs: 8_000 }`, igual que hacen los feeds que llaman al scraper (p. ej. `getMempoolOfficialUsagePayload`, línea 753).
- Los errores de feed se lanzan con `PublicFeedError` (importado en la línea 60 desde `server/shared/errors/SatoshiBaseError.js`, clase en su línea 22).
- Convención de constantes de path del scraper: ver líneas 76–82 (`S15_GOLD_SCRAPER_PATH`, `S04_MEMPOOL_SPACE_USAGE_SCRAPER_PATH`, etc.).

#### Cambio 1 — constantes de path (junto a las existentes, tras la línea 82)

```js
const S32_BINANCE_LIQ_MAP_SCRAPER_PATH = '/api/scrape/binance-liq-map';
const S32_BINANCE_LIQ_EVENTS_SCRAPER_PATH = '/api/scrape/binance-liq-events';
```

#### Cambio 2 — nueva FEED_DEF `binanceLiqMap` dentro de `FEED_DEFS`

Añadir la entrada al objeto `FEED_DEFS` (recomendado: después de `binanceHistory_max_1d`, que termina en la línea 415, y antes de `usNationalDebtSeries`). Formato idéntico al de las entradas existentes:

```js
  binanceLiqMap: {
    cacheKey: 'public:binance:liq-map',
    lockKey: 'public:binance:liq-map:refresh',
    refreshMs: 15_000,
    sourceProvider: 'binance-futures-zatobox',
    sourceUrl: `${SCRAPER_BASE_URL}${S32_BINANCE_LIQ_MAP_SCRAPER_PATH} | ${SCRAPER_BASE_URL}${S32_BINANCE_LIQ_EVENTS_SCRAPER_PATH}`,
    safeMinuteBudget: 4,
    safeDailyBudget: 5760,
  },
```

Notas:
- `refreshMs: 15_000` alinea con el `s-maxage=15` del scraper y con el poll de 15 s del frontend.
- `safeMinuteBudget: 4` / `safeDailyBudget: 5760` = 1 refresh cada 15 s como máximo teórico (mismo par usado por `mempoolLive` y los `binanceHistory*`, p. ej. líneas 126–127).
- No lleva `hardMinuteLimit` (el upstream es nuestro propio scraper, no Binance directo).

#### Cambio 3 — getter exportado `getBinanceLiqMapPayload()`

Añadir junto a los demás getters (p. ej. después de `getBinanceBtcHistoryPayload`, que termina en la línea 1343). Importar `validateBinanceLiqMapData` en el bloque de imports de `normalizeUtils.js` (líneas 25–59).

```js
/** S32 — BTC/USDT liquidation map (estimated) + recent forceOrder events.
 *  Map snapshot is required; events feed is optional (ticker degrades to empty).
 */
export async function getBinanceLiqMapPayload() {
  return getFeed(
    'binanceLiqMap',
    async () => {
      const [map, events] = await Promise.all([
        fetchJsonWithTimeout(`${SCRAPER_BASE_URL}${S32_BINANCE_LIQ_MAP_SCRAPER_PATH}`, { timeoutMs: 8_000 }),
        fetchJsonWithTimeout(`${SCRAPER_BASE_URL}${S32_BINANCE_LIQ_EVENTS_SCRAPER_PATH}`, { timeoutMs: 8_000 })
          .catch(() => null),
      ]);

      const data = { map, events };
      if (!validateBinanceLiqMapData(data)) {
        throw new PublicFeedError('Binance liquidation map payload is incomplete');
      }
      return data;
    },
    validateBinanceLiqMapData,
  );
}
```

Comportamiento (heredado de `getFeed`, verificado en líneas 545–610):
- El **mapa es requerido**: si el fetch del mapa lanza (timeout, 503 del scraper, JSON inválido), `fetchData` lanza y `getFeed` sirve el último payload válido desde memoria/KV con `is_fallback: true` + `fallback_note` + `stale_age_ms` (función `stalePayload`, líneas 479–488). Si no hay nada cacheado, propaga `PublicFeedError` → la ruta responde 502.
- Los **eventos son opcionales**: `.catch(() => null)` — un fallo del feed de eventos NUNCA tumba el mapa; el ticker del frontend simplemente queda vacío.
- Nota: `fetchJsonWithTimeout` lanza en respuestas no-OK (incluye el 503 del scraper), por lo que el 503 de "sin datos" del contrato dispara el fallback stale automáticamente.

#### Cambio 4 — export en `server/shared/serviceRegistry.js`

`server/app.js` NO importa de `publicDataFeeds.js` directamente; importa del agregador. Añadir `getBinanceLiqMapPayload` a la lista de re-exports de `publicDataFeeds.js` (bloque `export { ... } from '../services/publicDataFeeds.js';`, líneas 3–22 de `server/shared/serviceRegistry.js`):

```js
export {
  getBinanceBtcHistoryPayload,
  getBinanceLiqMapPayload,   // ← nuevo
  getBtcMapBusinessesByCountryPayload,
  // ...resto sin tocar
} from '../services/publicDataFeeds.js';
```

### C.2 — Validador en `server/shared/utils/normalizeUtils.js`

Añadir junto a los validadores existentes (`validateArray` línea 236, `validateObject` línea 240, `validateS15GoldPayload` línea 244 — seguir ese estilo: función pura, `Boolean(...)`, coerción con `Number()`):

```js
export function validateBinanceLiqMapData(value) {
  return Boolean(
    value
      && typeof value === 'object'
      && value.map
      && typeof value.map === 'object'
      && value.map.estimated === true
      && Number.isFinite(Number(value.map.refPrice))
      && Array.isArray(value.map.buckets)
      && value.map.buckets.length > 0
      && Number.isFinite(Number(value.map.bucketSize)),
  );
}
```

Reglas del validador (cerradas):
- `value` (la `data` del envelope) debe ser objeto.
- `value.map.estimated === true` — el contrato garantiza `estimated: true` siempre; si un payload llega sin él, se rechaza (protege el badge ESTIMATED).
- `refPrice` finito, `buckets` array no vacío, `bucketSize` finito.
- `events` NO se valida aquí (es opcional y puede ser `null`).

Recuerda exportarlo también en el import de `publicDataFeeds.js` (bloque de imports líneas 25–59).

### C.3 — `server/app.js`: ruta pública + warmup

Datos verificados:
- `setDataCacheHeaders(res, { sMaxAge, swr })` definido en las **líneas 134–136**.
- `sendPublicFeedError(res, error)` en las **líneas 220–226** (responde 502 `Upstream data source unavailable` para `PublicFeedError`, 500 para el resto).
- Ruta hermana de referencia — `GET /api/public/binance/btc-history` — en las **líneas 650–660**.
- Rate limiter de `/api/public`: 60 req/min por IP (`PUBLIC_API_RATE_LIMIT_MAX`, línea 62; montado en línea 285). Poll de 15 s = 4 req/min por cliente: OK.
- Warmup scheduler: guard global `globalThis.__SATOSHI_WARMUP_SCHEDULED__` en la **línea 837**; el helper REAL es `const scheduleWarmup = (label, delayMs, task) => { ... }` definido inline en las **líneas 839–846**; llamadas existentes en las líneas 848–880 (bloque cerrado en la 881). La forma verificada es exactamente `scheduleWarmup('etiqueta', delayMs, () => getter())`.

#### Cambio 1 — import

Añadir `getBinanceLiqMapPayload` a la lista de imports desde `./shared/serviceRegistry.js` (bloque líneas 6–54), en orden alfabético junto a `getBinanceBtcHistoryPayload` (línea 35).

#### Cambio 2 — ruta (colocar inmediatamente después de la ruta btc-history, línea 660)

```js
  app.get('/api/public/binance/liq-map', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 15, swr: 30 });
    try {
      const payload = await getBinanceLiqMapPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));
```

Manejo de error idéntico a las rutas hermanas (verificado contra líneas 650–660): `asyncRoute` captura lo inesperado (500 + requestId), `sendPublicFeedError` mapea `PublicFeedError` → 502.

#### Cambio 3 — warmup (dentro del bloque `if (...__SATOSHI_WARMUP_SCHEDULED__)`, tras la línea 880)

```js
    scheduleWarmup('S32 liquidation map', 16_000, () => getBinanceLiqMapPayload());
```

`16_000` ms lo coloca al final de la escalera actual (la última entrada hoy es `S09 BTC Map businesses` a `15_500`, línea 880).

### C.4 — Envelope final que recibe el frontend

`buildPayload(feedDef, data)` (verificado, **líneas 490–508**) envuelve la data así — la data va bajo la clave **`data`** (línea 506):

```js
{
  updated_at: <ISO>,                    // normalizeTimestamp(now)
  next_update_at: <ISO>,                // now + refreshMs (15 s)
  source_provider: 'binance-futures-zatobox',
  source_url: '<SCRAPER_BASE_URL>/api/scrape/binance-liq-map | <SCRAPER_BASE_URL>/api/scrape/binance-liq-events',
  is_fallback: false,
  fallback_note: null,
  refresh_policy: {
    min_interval_ms: 15000,
    hard_minute_limit: null,
    hard_daily_limit: null,
    safe_minute_budget: 4,
    safe_daily_budget: 5760,
  },
  data: {
    map: { /* payload VERBATIM del Endpoint 1 del contrato */ },
    events: { /* payload VERBATIM del Endpoint 2 */ } | null
  }
}
```

Cuando el upstream falla y se sirve stale, `stalePayload` (líneas 479–488) añade sobre el payload cacheado: `is_fallback: true`, `fallback_note: '<motivo>'`, `stale_age_ms: <número>`.

**Shape final consumido por el frontend: `{ ...envelope, data: { map, events } }`.** El frontend lee `payload.data.map`, `payload.data.events`, `payload.updated_at`, `payload.is_fallback`.

---

## D. Servicio frontend — `src/shared/services/liquidationApi.js`

Clonar el patrón de `src/shared/services/priceApi.js` (verificado): cache TTL en memoria de módulo (`spotMemoryCache`, líneas 10–35) + dedup de requests in-flight (`historyInFlight` Map, líneas 20 y 155–187). Usa `fetchJson` de `src/shared/lib/api.js` (verificado: `fetchJson(url, { timeout })` con AbortController, timeout por defecto 10 s).

Archivo nuevo completo (listo para pegar y ajustar):

```js
/**
 * S32 — BTC/USDT Liquidation Map service.
 * Single source: internal /api/public/binance/liq-map (serverless cache over satoshi-scraper).
 */

import { fetchJson } from '@/shared/lib/api.js';

const LIQ_CACHE_MS = 10_000;   // < refreshMs (15 s) para que cada poll pegue al backend
const MAX_EVENTS = 100;
const TIER_KEYS = ['10', '25', '50', '100'];

let memoryCache = { expiresAt: 0, value: null };
let inFlight = null;

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toNumOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeTierMap(raw) {
  const out = {};
  for (const key of TIER_KEYS) out[key] = toNum(raw?.[key]);
  return out;
}

/** Devuelve el mapa normalizado (todo numérico) o null si el shape es inválido. */
function normalizeMap(rawMap) {
  if (!rawMap || typeof rawMap !== 'object') return null;
  if (rawMap.estimated !== true) return null;

  const refPrice = toNumOrNull(rawMap.refPrice);
  const bucketSize = toNumOrNull(rawMap.bucketSize);
  if (refPrice == null || bucketSize == null || bucketSize <= 0) return null;
  if (!Array.isArray(rawMap.buckets) || rawMap.buckets.length === 0) return null;

  const buckets = rawMap.buckets
    .map((bucket) => {
      const price = toNumOrNull(bucket?.price);
      if (price == null) return null;
      const longs = normalizeTierMap(bucket?.longs);
      const shorts = normalizeTierMap(bucket?.shorts);
      const total = toNumOrNull(bucket?.total)
        ?? TIER_KEYS.reduce((sum, k) => sum + longs[k] + shorts[k], 0);
      return { price, longs, shorts, total };
    })
    .filter(Boolean)
    .sort((a, b) => a.price - b.price);

  if (!buckets.length) return null;

  return {
    symbol: String(rawMap.symbol || 'BTCUSDT'),
    model: String(rawMap.model || ''),
    estimated: true,
    refPrice,
    markPrice: toNumOrNull(rawMap.markPrice),
    fundingRate: toNumOrNull(rawMap.fundingRate),
    openInterestBase: toNumOrNull(rawMap.openInterest?.base),
    openInterestUsd: toNumOrNull(rawMap.openInterest?.usd),
    longShortRatio: toNumOrNull(rawMap.longShortRatio),
    bucketSize,
    rangePct: toNumOrNull(rawMap.rangePct),
    leverageTiers: Array.isArray(rawMap.leverageTiers)
      ? rawMap.leverageTiers.map(toNum)
      : [10, 25, 50, 100],
    totals: {
      long: toNum(rawMap.totals?.long),
      short: toNum(rawMap.totals?.short),
    },
    lastEventAt: rawMap.lastEventAt || null,
    buckets,
  };
}

/** Normaliza y limita eventos; siempre devuelve array (posiblemente vacío). */
function normalizeEvents(rawEvents) {
  const list = Array.isArray(rawEvents?.events) ? rawEvents.events : [];
  return list
    .map((event) => {
      const ts = toNumOrNull(event?.ts);
      const price = toNumOrNull(event?.price);
      const notional = toNumOrNull(event?.notional);
      const side = event?.side === 'BUY' ? 'BUY' : (event?.side === 'SELL' ? 'SELL' : null);
      if (ts == null || price == null || side == null) return null;
      return { ts, side, price, qty: toNum(event?.qty), notional: notional ?? 0 };
    })
    .filter(Boolean)
    .slice(0, MAX_EVENTS);
}

/**
 * Returns { map, events, updatedAt, isFallback }.
 * `map` es null si el payload no cumple el shape mínimo (el componente muestra error).
 * `events` siempre es array; [] con mercado tranquilo o feed de eventos caído es NORMAL.
 */
export async function fetchLiquidationMap() {
  const now = Date.now();
  if (memoryCache.value && now < memoryCache.expiresAt) {
    return memoryCache.value;
  }
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const payload = await fetchJson('/api/public/binance/liq-map', { timeout: 8000 });
      const result = {
        map: normalizeMap(payload?.data?.map),
        events: normalizeEvents(payload?.data?.events),
        updatedAt: payload?.updated_at || null,
        isFallback: Boolean(payload?.is_fallback),
      };
      if (result.map) {
        memoryCache = { expiresAt: Date.now() + LIQ_CACHE_MS, value: result };
      }
      return result;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
```

Reglas cerradas del servicio:
- **TTL 10 s** (menor que el poll de 15 s: el interval de `useModuleData` siempre encuentra la cache expirada y refresca; la cache solo absorbe remounts/StrictMode/dobles llamadas).
- **`fetchJson('/api/public/binance/liq-map', { timeout: 8000 })`** — timeout 8 s como `priceApi.js`.
- **Coerción numérica de TODO** (buckets, tiers, métricas): el chart nunca debe recibir strings.
- **Eventos limitados a 100** aunque el backend mande hasta 500.
- **`map: null` si shape inválido** — no lanzar; el componente decide el estado de error.
- Si `fetchJson` lanza (timeout/HTTP error), la excepción se propaga: `useModuleData` la captura, setea `error` y conserva la data previa (`keepPreviousOnError: true` por defecto, verificado en `src/shared/hooks/useModuleData.js` líneas 19 y 46–49).

En dev, Vite proxya `/api` al Express local (verificado `vite.config.js` líneas 54–59, target `API_PROXY_TARGET || http://127.0.0.1:8787`; el server escucha en `API_PORT || 8787`, `server/index.js` línea 3).

---

## E. Componente y UX/UI — `src/features/modules/live/S33_LiquidationMap.jsx`

### E.0 — Por qué el archivo se llama S33 si el módulo es S32

**El código runtime NO sale del nombre de archivo: sale del ORDEN del array `MODULE_DEFS` en `src/features/module-registry/modules.js`** (verificado: `toCode = (index) => 'S' + String(index + 1).padStart(2, '0')` en la línea 76; `assertModuleRegistry` en las líneas 89–115 fuerza secuencia contigua). El nombre de archivo es solo un identificador de import.

El nombre `S32_*.jsx` está históricamente "quemado" por BtcQueue y usarlo crearía ambigüedad:

- En el commit HEAD actual (`1362f92 fix: restore BtcQueue to position 6...`) el archivo vive como `src/features/modules/live/S32_BtcQueue.jsx`; el working tree tiene un rename AÚN SIN COMMITEAR a `S06_BtcQueue.jsx` (`git status` muestra `RM S32_BtcQueue.jsx -> S06_BtcQueue.jsx`). Crear un `S32_LiquidationMap.jsx` nuevo podría chocar con ese path en merges dev ⇄ main.
- El archivo legacy `src/features/module-registry/moduleRegistry.js` (muerto: nadie lo importa, verificado con grep en `src/`) todavía referencia `@/features/modules/live/S32_BtcQueue` en su línea 89.
- Precedente en el propio repo de que nombre ≠ código: el archivo `S32_BtcQueue.jsx` sirvió el módulo **S06**, y el archivo `S31_USNationalDebt.jsx` sirvió el módulo **S30** (ambos renames en curso lo confirman).

Decisión cerrada: **archivo `S33_LiquidationMap.jsx`, const `S32_LiquidationMap`, módulo runtime S32**. Documentar este párrafo en un comentario corto en la cabecera del componente.

### E.1 — Wireframe ASCII

**Desktop (≥1024px):**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ BTC/USDT LIQUIDATION MAP  [ESTIMATED ⓘ]                                        │
│ ┌──────────────┬──────────────┬──────────────┬───────────────────────────────┐ │
│ │ MARK PRICE   │ OPEN INTEREST│ FUNDING RATE │ LONGS $812.00M · SHORTS $703M │ │
│ │ $118,440     │ $10.80B      │ +0.0013%     │ (totales estimados en riesgo) │ │
│ └──────────────┴──────────────┴──────────────┴───────────────────────────────┘ │
│                                                                                │
│  Vol/barra ▲                    ┊ mark                          ▲ Acumulado    │
│            │        ▂▄█         ┊                               │              │
│            │      ▂▄███▆        ┊         ▄▆▂                   │   ← Line     │
│            │    ▁▃██████▆▃      ┊       ▂████▄▂                 │   (Y der.)   │
│            └────┴─┴─┴─┴─┴─┴─────┊─────┴─┴─┴─┴─┴─┴──────────────►│              │
│              $94K   $106K   $118,432   $130K    $142K   (precio)               │
│                          (ReferenceLine punteada blanca)                       │
│                                                                                │
│  Leyenda:  [■ 10x] [■ 25x] [■ 50x] [■ 100x]     (chips clickeables, toggle)   │
│                                                                                │
│ ── RECENT LIQUIDATIONS (sampled) ────────────────────────────────────────────  │
│  14:02:11  LONG LIQ   $118,221.3   0.512 BTC   $60.5K      ← rojo             │
│  14:01:47  SHORT LIQ  $118,300.0   0.120 BTC   $14.2K      ← verde            │
│  ... (~20 filas, scroll interno)                                               │
│  muestreado: Binance emite máx 1 evento/s — no es el volumen total             │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Móvil (<768px):**

```
┌──────────────────────────────┐
│ LIQUIDATION MAP [ESTIMATED ⓘ]│
│ ┌─────────────┬─────────────┐│
│ │ MARK PRICE  │ OPEN INT.   ││   ← grid 2×2
│ │ $118,440    │ $10.80B     ││
│ ├─────────────┼─────────────┤│
│ │ FUNDING     │ L/S TOTALS  ││
│ │ +0.0013%    │ 812M / 703M ││
│ └─────────────┴─────────────┘│
│ ┌──────────────────────────┐ │
│ │      chart 300px alto    │ │   ← ~70 barras, 4-5 ticks X
│ │        ▂▄█ ┊ ▄▆▂         │ │
│ └──────────────────────────┘ │
│ [■10x][■25x][■50x][■100x]    │
│ ── RECENT LIQS (sampled) ──  │
│  (5 filas)                   │
│  nota de muestreo            │
└──────────────────────────────┘
```

### E.2 — Estructura general del componente

Convenciones verificadas en módulos recientes (`S17_MayerMultiple.jsx`, `S31_ThankYouSatoshi.jsx`):

- Export default `function S32_LiquidationMap({ onOpenDonate })` — el player inyecta la prop en `ModulePage.jsx` línea 649: `<Component onOpenDonate={() => setDonateOpen(true)} />`. Si el diseño no incluye botón de donación propio, aceptar la prop igualmente (patrón del resto de módulos live; puede quedar sin uso como en `S17`).
- Wrapper `ModuleShell` de `src/shared/components/module/index.js` (verificado: `export { default as ModuleShell } from './ModuleShell.jsx'`). API real de `ModuleShell` (`src/shared/components/module/ModuleShell.jsx`): props `{ children, bg = '#111111', layout = 'flex-col', overflow = 'visible', className = '', style = {} }`; añade la clase `visual-integrity-lock h-full w-full`. Uso: `<ModuleShell overflow="hidden" className="p-3 sm:p-4 lg:p-5">…</ModuleShell>`.
- Datos: `const { data, loading, error, refetch } = useModuleData(fetchLiquidationMap, { refreshMs: 15_000 });` — firma REAL verificada en `src/shared/hooks/useModuleData.js` línea 15: `useModuleData(fetchFn, { refreshMs = 0, initialData = null, keepPreviousOnError = true, transform })` → `{ data, loading, error, refetch }`. No se necesita `transform` (la normalización vive en `liquidationApi.js`).
- Responsive: `const isMobile = useMediaQuery('(max-width: 767px)');` — hook verificado en `src/shared/hooks/useMediaQuery.js` línea 13 (`useMediaQuery(query, defaultValue = false)`).
- Formatters: `import { fmt } from '@/shared/utils/formatters.js';` — verificados en `src/shared/utils/formatters.js`: `fmt.usd(n, d=0)` (línea 2), `fmt.usdCompact(n)` (línea 16), `fmt.pct(n, d=2)` (línea 6), `fmt.time(ts)` → `HH:MM` (línea 39), `fmt.ago(ts)` → `3m ago` (línea 54).

Skeleton estructural del JSX (listo para adaptar):

```jsx
/**
 * S33_LiquidationMap.jsx — módulo runtime S32 (el código sale del orden de
 * MODULE_DEFS en modules.js, no del nombre de archivo; el nombre S32_*.jsx
 * está reservado históricamente por BtcQueue en git history).
 */
import { useMemo, useState } from 'react';
import {
  Bar,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ModuleShell } from '@/shared/components/module/index.js';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js';
import { fetchLiquidationMap } from '@/shared/services/liquidationApi.js';
import { fmt } from '@/shared/utils/formatters.js';

const TIER_COLORS = {
  10: 'var(--accent-green)',    // #00D897
  25: 'var(--accent-warning)',  // #FFD700
  50: 'var(--accent-bitcoin)',  // #F7931A
  100: 'var(--accent-red)',     // #FF4757
};
const TIERS = [10, 25, 50, 100];
const TARGET_BARS_DESKTOP = 140;
const TARGET_BARS_MOBILE = 70;

export default function S32_LiquidationMap({ onOpenDonate }) {   // eslint-disable-line no-unused-vars
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { data, loading, error, refetch } = useModuleData(fetchLiquidationMap, { refreshMs: 15_000 });
  const [visibleTiers, setVisibleTiers] = useState(() => new Set(TIERS));

  const map = data?.map ?? null;
  const events = data?.events ?? [];

  const chartData = useMemo(
    () => buildChartData(map, isMobile ? TARGET_BARS_MOBILE : TARGET_BARS_DESKTOP, visibleTiers),
    [map, isMobile, visibleTiers],
  );

  if (loading && !map) return <LiqSkeleton />;
  if (!map) return <LiqError onRetry={refetch} />;

  return (
    <ModuleShell overflow="hidden" className="px-3 pb-3 pt-3 sm:px-4 sm:pb-4 lg:px-5">
      {data?.isFallback && <StaleBanner />}
      <LiqHeader map={map} isMobile={isMobile} />
      <div
        className="min-h-0 flex-1"
        role="img"
        aria-label={`Mapa estimado de liquidaciones BTC/USDT alrededor de ${fmt.usd(map.refPrice)}`}
      >
        <ResponsiveContainer width="100%" height={isMobile ? 300 : '100%'}>
          <ComposedChart data={chartData.rows} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
            <XAxis
              type="number"
              dataKey="price"
              domain={[chartData.minPrice, chartData.maxPrice]}
              tickFormatter={fmt.usdCompact}
              tickCount={isMobile ? 5 : 9}
              stroke="rgba(255,255,255,0.18)"
            />
            <YAxis yAxisId="vol" tickFormatter={fmt.usdCompact} width={52} stroke="rgba(255,255,255,0.18)" />
            <YAxis yAxisId="cum" orientation="right" tickFormatter={fmt.usdCompact} width={56} stroke="rgba(255,255,255,0.18)" />
            <Tooltip content={<LiqTooltip refPrice={map.refPrice} />} />
            {TIERS.filter((tier) => visibleTiers.has(tier)).map((tier) => (
              <Bar key={`l${tier}`} yAxisId="vol" dataKey={`l${tier}`} stackId="liq" fill={TIER_COLORS[tier]} isAnimationActive={false} />
            ))}
            {TIERS.filter((tier) => visibleTiers.has(tier)).map((tier) => (
              <Bar key={`s${tier}`} yAxisId="vol" dataKey={`s${tier}`} stackId="liq" fill={TIER_COLORS[tier]} isAnimationActive={false} />
            ))}
            <Line
              yAxisId="cum"
              dataKey="cumulative"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <ReferenceLine
              yAxisId="vol"
              x={map.refPrice}
              stroke="#FFFFFF"
              strokeDasharray="4 4"
              label={{ value: fmt.usd(map.refPrice), fill: '#FFFFFF', fontSize: 11, position: 'top' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <TierLegend visibleTiers={visibleTiers} onToggle={toggleTier} />
      <LiqTicker events={events} isMobile={isMobile} />
    </ModuleShell>
  );
}
```

(`LiqSkeleton`, `LiqError`, `StaleBanner`, `LiqHeader`, `LiqTooltip`, `TierLegend`, `LiqTicker`, `buildChartData`, `toggleTier` se definen en el mismo archivo; especificados abajo.)

### E.3 — Chart (recharts v3)

recharts `^3.7.0` verificado en `package.json` línea 41 (chunk `vendor-recharts` ya configurado en `vite.config.js` línea 30). Ejemplos de uso en el repo: `src/features/modules/live/S17_MayerMultiple.jsx` (líneas 2–12: `ComposedChart`, `Line`, `ReferenceLine`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis` — imitar su estilo de tooltip custom y colores), `src/features/modules/under-construction/S29_UTXODistribution.jsx` (`Bar`).

Especificación cerrada:

- `ResponsiveContainer` > `ComposedChart` con `data={chartData.rows}`.
- **8 `<Bar>` apiladas**: 4 tiers × long/short, dataKeys `l10, l25, l50, l100, s10, s25, s50, s100`, TODAS con el mismo `stackId="liq"` y `isAnimationActive={false}`. En cualquier bucket solo un lado tiene volumen (longs debajo de `refPrice`, shorts encima), así que el apilado nunca mezcla lados visualmente. Mismo color por tier en ambos lados.
- **`<Line>` de acumulada** en el YAxis derecho (`yAxisId="cum"`), dataKey `cumulative`, `dot={false}`, `isAnimationActive={false}`, stroke `rgba(255,255,255,0.65)`.
- **`<ReferenceLine x={refPrice}>`** punteada blanca (`strokeDasharray="4 4"`) con label del precio (`fmt.usd`).
- **`<Tooltip content={<LiqTooltip refPrice={...} />} />`** custom tema oscuro (imitar `MayerTooltip` de S17, líneas 100–130: contenedor `rounded-xl border border-white/12 bg-[rgba(9,12,18,0.96)] px-3 py-2.5 font-mono`). Contenido: precio del bucket (`fmt.usd`), lado (LONGS/SHORTS según posición vs `refPrice`), desglose USD por tier con su swatch de color (`fmt.usdCompact`), total del bucket y acumulado hasta ese nivel.
- **XAxis** `type="number"` `dataKey="price"` `domain={[minPrice, maxPrice]}` (min/max de los buckets ya mergeados), `tickFormatter={fmt.usdCompact}`; `tickCount` 9 desktop / 5 móvil.
- **YAxis izquierdo** (`yAxisId="vol"`): volumen por barra, `tickFormatter={fmt.usdCompact}`.
- Los ticks heredan el estilo global de `src/index.css` línea 164 (`.recharts-cartesian-axis-tick-value { fill: var(--text-tertiary); font-size: var(--fs-tag); font-family: var(--font-mono); }`) — no redefinir fuentes.

**Cálculo client-side (un solo `useMemo`): re-bucketing + acumulada.** La acumulada se suma **hacia afuera desde `refPrice` por lado** (longs hacia abajo, shorts hacia arriba); en `refPrice` vale ~0 y crece hacia ambos extremos (forma de V invertida):

```js
function buildChartData(map, targetBars, visibleTiers) {
  if (!map) return { rows: [], minPrice: 0, maxPrice: 0 };

  // 1) Merge de resolución: payload trae buckets de $100 (~470 en ±20%).
  const mergeFactor = Math.max(1, Math.ceil(map.buckets.length / targetBars));
  const groupSize = map.bucketSize * mergeFactor;
  const merged = new Map();
  for (const bucket of map.buckets) {
    const key = Math.floor(bucket.price / groupSize) * groupSize;
    const row = merged.get(key) || {
      price: key, l10: 0, l25: 0, l50: 0, l100: 0, s10: 0, s25: 0, s50: 0, s100: 0, total: 0,
    };
    for (const tier of [10, 25, 50, 100]) {
      if (!visibleTiers.has(tier)) continue;         // toggle de leyenda
      row[`l${tier}`] += bucket.longs[String(tier)];
      row[`s${tier}`] += bucket.shorts[String(tier)];
      row.total += bucket.longs[String(tier)] + bucket.shorts[String(tier)];
    }
    merged.set(key, row);
  }
  const rows = [...merged.values()].sort((a, b) => a.price - b.price);

  // 2) Acumulada hacia afuera desde refPrice, por lado.
  let cum = 0;
  for (let i = rows.length - 1; i >= 0; i -= 1) {     // longs: refPrice → abajo
    if (rows[i].price >= map.refPrice) continue;
    cum += rows[i].total;
    rows[i].cumulative = cum;
  }
  cum = 0;
  for (let i = 0; i < rows.length; i += 1) {          // shorts: refPrice → arriba
    if (rows[i].price < map.refPrice) continue;
    cum += rows[i].total;
    rows[i].cumulative = cum;
  }

  return {
    rows,
    minPrice: rows[0]?.price ?? 0,
    maxPrice: (rows.at(-1)?.price ?? 0) + groupSize,
  };
}
```

### E.4 — Colores por tier (tokens obligatorios del repo)

Verificados en `src/index.css` (líneas 5–13) y coherentes con `src/shared/constants/colors.js` (`UI_COLORS`, líneas 96–107). **Usar SIEMPRE los tokens CSS, nunca hex hardcodeados** (los hex se listan solo como referencia):

| Tier | Token | Hex de referencia |
| --- | --- | --- |
| 10x | `var(--accent-green)` | `#00D897` |
| 25x | `var(--accent-warning)` | `#FFD700` |
| 50x | `var(--accent-bitcoin)` | `#F7931A` |
| 100x | `var(--accent-red)` | `#FF4757` |

- Fondo del módulo: `var(--bg-primary)` (`#111111`) — es el `bg` por defecto de `ModuleShell`.
- Tipografía: `var(--font-mono)` (heredada del body, `src/index.css` línea 98) y escala `var(--fs-*)` (líneas 28–38): títulos de sección `--fs-heading`, métricas del header `--fs-subtitle`, labels `--fs-micro`, ticker `--fs-tag`/`--fs-micro`.
- Texto secundario: `var(--text-secondary)` (`#8B8A88`), terciario `var(--text-tertiary)` (`#555555`), bordes `var(--border-subtle)`.

### E.5 — Perf

- **Re-bucketing client-side en `useMemo`** (código en E.3). El payload trae buckets de `bucketSize` $100: con `rangePct 0.2` y BTC ~$118K son hasta ~470 buckets con `total > 0`. Renderizar 470 barras × 8 series castiga el frame rate → merge a resolución de display: `mergeFactor = Math.ceil(rawBuckets / targetBars)` con **targetBars ≈ 140 desktop / 70 móvil**.
- Dependencias del memo: `[map, isMobile, visibleTiers]` — el objeto `map` cambia de identidad solo cuando el servicio entrega payload nuevo (cache de 10 s), así que el memo no recalcula en re-renders del ticker.
- `isAnimationActive={false}` en TODAS las Bars y la Line (obligatorio: con poll de 15 s las animaciones provocan parpadeo).
- El ticker se renderiza como componente separado (`LiqTicker`) para que sus re-renders no invaliden el chart.

### E.6 — Estados

1. **Loading inicial** (`loading && !map`): skeleton shimmer con la clase global **`.skeleton`** (verificada en `src/index.css` líneas 137–142; uso de referencia en `ModulePage.jsx` → `ModuleContentFallback`, líneas 189–224: divs con `className="skeleton h-… w-… rounded-…"`). Estructura del skeleton: fila header (4 bloques `h-14`), bloque chart (`flex-1 min-h-[240px]`), 3 filas de ticker (`h-4`).
2. **Error sin data** (`!map` tras cargar): panel centrado con mensaje ("Liquidation map unavailable") y botón **Retry** cableado a `refetch` de `useModuleData` (verificado: `refetch` re-ejecuta `load`, líneas 71–78 del hook). El botón hereda el focus-visible global (outline naranja, `src/index.css` líneas 116–126).
3. **Fallback/stale** (`data.isFallback === true`): banner delgado arriba del header — fondo `rgba(255,215,0,0.08)`, borde `var(--accent-warning)`, texto `--fs-micro`: "Datos en fallback — mostrando el último snapshot válido". El módulo sigue pintando la data stale (nunca desmontar el chart por stale).
4. **Ticker vacío** (`events.length === 0`): mensaje "sin liquidaciones recientes (mercado tranquilo)" en `var(--text-secondary)`. **0 eventos es NORMAL** — no es un error, no mostrar estado rojo.
5. **Error con data previa** (`error && map`): seguir mostrando la última data (comportamiento por defecto de `keepPreviousOnError`); opcionalmente reutilizar el banner stale.

### E.7 — Ticker de liquidaciones

- Últimas **~20 filas** en desktop, **5 en móvil**, dentro de un contenedor con altura fija y `overflow-y: auto`.
- Cada fila: hora (`fmt.time(ev.ts)`; usar `fmt.ago(ev.ts)` como `title`/tooltip de la celda — ambos verificados en `src/shared/utils/formatters.js` líneas 39 y 54), etiqueta de lado, precio (`fmt.usd(ev.price, 1)`), cantidad (`ev.qty.toFixed(3)` BTC), notional (`fmt.usdCompact(ev.notional)`).
- **Color por lado**: `side === 'SELL'` → **long liquidado** → texto/acento `var(--accent-red)`; `side === 'BUY'` → **short liquidado** → `var(--accent-green)`.
- **Nota al pie obligatoria** (texto `--fs-tag`, `var(--text-tertiary)`): "muestreado: Binance emite máx 1 evento/s por símbolo — no es el volumen total".
- **Animación de flash en fila nueva**: keyframe local en un `<style>` dentro del componente con guard de reduced motion:

```css
@keyframes liq-row-flash {
  0% { background-color: rgba(255,255,255,0.10); }
  100% { background-color: transparent; }
}
.liq-row-new { animation: liq-row-flash 0.9s ease-out 1; }
@media (prefers-reduced-motion: reduce) {
  .liq-row-new { animation: none; }
}
```

  Detección de "nueva": guardar en un `useRef` el `ts` más reciente del render anterior; filas con `ts` mayor reciben `liq-row-new`. Key de fila: `${ev.ts}-${ev.price}-${ev.side}`.

### E.8 — Responsive

Breakpoint: `useMediaQuery('(max-width: 767px)')` (<768px = móvil).

| Aspecto | Desktop | Móvil |
| --- | --- | --- |
| Altura chart | `height="100%"` dentro de contenedor `flex-1 min-h-0` | **300px** fijo |
| Header métricas | fila de 4 celdas | **grid 2×2** (`grid grid-cols-2 gap-2`) |
| Ticks eje X | `tickCount={9}` | **`tickCount={5}`** (4-5 ticks) |
| Barras objetivo | ~140 | ~70 |
| Filas ticker | ~20 (scroll) | **5** |
| Padding shell | `lg:px-5` | `px-3` |

La escala `--fs-*` ya se reduce sola en los media queries de `src/index.css` (líneas 41–87) — no redefinir tamaños por breakpoint.

### E.9 — Accesibilidad

- **Contraste AA sobre `#111111`**: los 4 colores de tier y los textos primario/secundario cumplen AA para texto normal (`#00D897` ~10.4:1, `#FFD700` ~13.2:1, `#F7931A` ~8.1:1, `#FF4757` ~5.5:1, `#E8E6E3` ~14:1, `#8B8A88` ~5.4:1). No usar `--text-tertiary` (`#555555`, ~2.6:1) para texto informativo esencial — solo para notas decorativas junto a contenido redundante.
- **Chips de leyenda** = `<button type="button">` con `aria-pressed={visibleTiers.has(tier)}` y `aria-label={"Mostrar/ocultar tier " + tier + "x"}`. El focus visible lo aporta el CSS global (`src/index.css` líneas 116–126, outline `var(--accent-bitcoin)`); no poner `outline: none`. Estado apagado: swatch al 30 % de opacidad + texto tachado o atenuado.
- **Chart**: contenedor con `role="img"` y `aria-label` descriptivo que incluya `refPrice` y totales (los SVG de recharts no son navegables por lector de pantalla; el label del contenedor es la superficie accesible).
- **Ticker**: contenedor `role="log"` + `aria-label="Liquidaciones recientes (muestreadas)"`; NO usar `aria-live="polite"` (con poll de 15 s generaría ruido constante).
- Toggle de tier (estado local): `const [visibleTiers, setVisibleTiers] = useState(() => new Set(TIERS));` con `toggleTier(tier)` que nunca permite dejar el Set vacío (si es el último tier visible, ignorar el click).

### E.10 — Badge "ESTIMATED"

- Pastilla junto al título: borde `var(--accent-warning)`, texto `ESTIMATED` en `--fs-tag`, `letter-spacing: 0.14em`, fondo `rgba(255,215,0,0.08)`.
- Elemento `<button type="button">` con tooltip accesible (visible en hover Y focus; en móvil, tap alterna visibilidad). `aria-describedby` apuntando al tooltip.
- **Texto del tooltip (un párrafo, cerrado):**

> "Mapa estimado por el modelo `oi-delta-leverage-tiers-v1`: distribuye el open interest observado en Binance Futures entre tiers de apalancamiento asumidos (10x/25x/50x/100x) y proyecta a qué precio se liquidaría cada tramo. NO son posiciones reales — nadie tiene las posiciones reales, tampoco Coinglass. Úsalo como mapa de zonas de presión, no como dato exacto."

---

## F. Registro / meta / SEO

### F.1 — `src/features/module-registry/modules.js`

Formato verificado (líneas 4–8 `lazyWithPreload`, líneas 10–41 consts, líneas 42–74 `MODULE_DEFS` con 31 entradas, última: `satoshi-nakamoto-bitcoin-whitepaper` en la línea 73).

1. Añadir la const después de `S31_ThankYouSatoshi` (línea 40):

```js
const S32_LiquidationMap = lazyWithPreload(() => import('@/features/modules/live/S33_LiquidationMap'));
```

2. **APPEND AL FINAL** de `MODULE_DEFS` (después de la entrada de la línea 73 y antes del `];` de la línea 74). **NUNCA insertar en medio**: `assertModuleRegistry` (líneas 89–115) fuerza secuencia contigua `S01..SNN` y los códigos son posicionales — insertar en medio renumeraría todos los módulos posteriores y rompería slugs/SEO indexados:

```js
  { slugBase: 'bitcoin-liquidation-map', title: 'Liquidation Map', component: S32_LiquidationMap },
```

Resultado automático: código `S32` (índice 31 → `toCode`), slug **`s32-bitcoin-liquidation-map`**, ruta `/module/s32-bitcoin-liquidation-map`, contador del player `32 / 32` (el total se deriva de `MODULES` en `ModulePage.jsx`, líneas 295–302). No tocar `legacyModuleRedirects.js` (solo aplica a slugs históricos).

### F.2 — `src/features/module-registry/moduleDataMeta.js`

Formato verificado (objeto `MODULE_DATA_META` desde la línea 18; `getModuleDataMeta` línea 200 mergea sobre `DEFAULT_META`). Añadir entrada con key = `slugBase` (colocarla después de `'us-national-debt-live-counter'`, línea 192):

```js
  'bitcoin-liquidation-map': {
    providers: [
      { name: 'Binance Futures', url: 'https://www.binance.com/en/futures/BTCUSDT' },
      { name: 'Internal API', url: null },
    ],
    refreshSeconds: 15,
    stripTitle: 'BTC/USDT Liquidation Map (Estimated)',
  },
```

Con esto el strip compartido muestra "Binance Futures + Internal API", cadencia "15s" (lógica `getCadenceLabel`, `ModulePage.jsx` líneas 91–107) y el título con "(Estimated)".

### F.3 — `src/features/module-registry/moduleSEO.js`

Formato verificado (objeto `MODULE_SEO` desde la línea 6, keys por `slugBase`; `getModuleSEO` línea 165). Añadir después de `'us-national-debt-live-counter'` (línea 156):

```js
  'bitcoin-liquidation-map': {
    title: 'Bitcoin Liquidation Map - BTC/USDT Estimated Liquidation Levels',
    description: 'Explore an estimated BTC/USDT liquidation map: leverage tiers from 10x to 100x, cumulative liquidation pressure by price level, live mark price, and recent forced liquidations from Binance Futures.',
    keywords: ['bitcoin liquidation map', 'btc liquidation levels', 'btc usdt liquidation heatmap', 'crypto liquidation map'],
  },
```

### F.4 — `.claude/DATA_SOURCE_INTEGRITY_RULES.md`

Leer el archivo ANTES de editarlo y seguir su formato exacto: tabla humana (línea ~75), tabla técnica (línea ~114) y una entrada nueva en "Registro Histórico de Automejoras" (obligatorio por su propia regla 6 y el "Change checklist").

- **Aviso verificado**: las últimas filas de ambas tablas conservan numeración vieja (dicen "S31 U.S. National Debt" / "S32 Thank You Satoshi" cuando el registry vivo es S30/S31). Según la regla del propio archivo ("no se permite dejar tablas historicas con numeracion desfasada respecto al registry vivo"), corrige esos códigos en la misma edición y añade la fila nueva como **S32 Liquidation Map**.

Fila para la tabla humana:

| Campo | Contenido |
| --- | --- |
| Module / feature | S32 Liquidation Map |
| What it is used for | Mapa ESTIMADO de niveles de liquidación BTC/USDT por tier de apalancamiento + muestra de liquidaciones reales |
| Where the data really comes from | Modelo versionado `oi-delta-leverage-tiers-v1` calculado en `satoshi-scraper` (api.zatobox.io) sobre datos de Binance Futures (OI, mark price, funding, stream forceOrder) |
| How often it refreshes | Backend cada ~15 s; UI poll 15 s |
| If the source fails | Payload stale con `is_fallback: true` vía `getFeed`; ticker degrada a vacío |
| What must not be changed silently | El feed es una ESTIMACIÓN de modelo versionada — el badge ESTIMATED es obligatorio en la UI; los eventos forceOrder son un MUESTREO (máx 1/s) y NUNCA se presentan como volumen total liquidado; no cambiar el contrato sin actualizar ambos PLAN_LIQUIDATION_MAP_* |

Fila para la tabla técnica:

| Campo | Contenido |
| --- | --- |
| Frontend consumer | `src/features/modules/live/S33_LiquidationMap.jsx` |
| Internal route / service | `fetchLiquidationMap()` + `/api/public/binance/liq-map` |
| Approved upstream priority | `SCRAPER_BASE_URL/api/scrape/binance-liq-map` (requerido) + `SCRAPER_BASE_URL/api/scrape/binance-liq-events` (opcional) — sin fallback directo a Binance |
| Effective refresh cadence | Feed 15 s; UI 15 s; cache frontend 10 s |
| Allowed fallback path | Stale compartido de `getFeed` (memoria + KV); eventos opcionales a `null` |
| Key files | `server/services/publicDataFeeds.js`, `server/app.js`, `src/shared/services/liquidationApi.js`, `src/features/modules/live/S33_LiquidationMap.jsx` |

### F.5 — `ModulePage.jsx`: NO TOCAR

Lanzamiento live directo. **NO** añadir el slug a `NOINDEX_PREVIEW_SLUGS` (líneas 66–77) ni a `BLOCKING_OVERLAY_SLUGS` (líneas 79–89). El contador, la navegación prev/next y el strip de meta se actualizan solos desde el registry.

---

## G. Verificación / criterios de aceptación

### G.1 — Setup

- [ ] `.env` local: `SCRAPER_BASE_URL=http://localhost:9119` (scraper local) o `SCRAPER_BASE_URL=https://api.zatobox.io` (producción). La variable ya está listada en `.env.example` (línea 21).
- [ ] `npm run dev` levanta UI (Vite) + API (Express en `:8787`) — script verificado en `package.json` línea 9.
- [ ] `curl http://localhost:8787/api/public/binance/liq-map` devuelve el envelope de la sección C.4 con `data.map.estimated === true`.
- [ ] Abrir `http://localhost:5173/module/s32-bitcoin-liquidation-map` (o el puerto que reporte Vite).

### G.2 — Checklist visual

- [ ] Al entrar: skeleton shimmer (`.skeleton`) → chart en <2 s con scraper caliente.
- [ ] Barras apiladas con los 4 colores de tier correctos (10x verde, 25x amarillo, 50x naranja, 100x rojo) sobre fondo `#111111`.
- [ ] Curva acumulada crece **hacia afuera** del marcador de precio (mínima cerca de `refPrice`, máxima en los extremos), pintada sobre el eje Y derecho.
- [ ] `ReferenceLine` blanca punteada en `refPrice` con label `fmt.usd`; entre polls consecutivos (15 s) el marcador se mueve si el precio cambió.
- [ ] Tooltip custom oscuro con precio del bucket, desglose por tier en `fmt.usdCompact` y acumulado.
- [ ] Header: mark price con `fmt.usd`, open interest y totales long/short en `fmt.usdCompact`, funding rate con signo.
- [ ] Meta strip del player muestra "Binance Futures + Internal API · 15s" y el título "BTC/USDT Liquidation Map (Estimated)".
- [ ] Ticker: filas rojas (long liq / side SELL) y verdes (short liq / side BUY), hora `fmt.time`, nota de muestreo al pie; con 0 eventos muestra "sin liquidaciones recientes (mercado tranquilo)".
- [ ] Chips de leyenda togglean tiers (con re-cálculo de barras y acumulada) y muestran focus visible con teclado; `aria-pressed` correcto.
- [ ] Badge ESTIMATED visible con tooltip accesible (hover + focus + tap móvil).
- [ ] **Prueba de resiliencia**: matar el scraper (o apuntar `SCRAPER_BASE_URL` a un puerto muerto) → siguiente poll sirve stale con banner "datos en fallback"; si se reinicia el backend sin cache, el módulo muestra el estado de error con botón Retry — **sin crash ni pantalla en blanco** (el `ModuleErrorBoundary` del player no debe llegar a dispararse).
- [ ] Viewport móvil (<768px): chart 300px, header 2×2, 4-5 ticks en X, ticker de 5 filas.
- [ ] `prefers-reduced-motion: reduce` desactiva el flash de filas nuevas.

### G.3 — Regresión

- [ ] `npm run lint` verde (script `eslint .`, `package.json` línea 14).
- [ ] `npm run build` verde (`vite build`, línea 12).
- [ ] `npm test` sigue verde (`vitest run`, línea 22) — no hay tests del módulo nuevo, pero `assertModuleRegistry` corre en import: si la entrada se insertó mal, el build/test revienta con "Module code sequence mismatch".
- [ ] Navegación prev/next del player recorre S31 → S32 → S01 sin huecos; contador del footer muestra `32 / 32`.
- [ ] El resto de módulos (S01, S06, S30…) cargan igual que antes.

### G.4 — Fixture de desarrollo (trabajar sin scraper)

Si el scraper aún no está listo, desarrollar contra un mock local que sirva el **fixture del contrato** en los MISMOS paths. Crear `scripts/dev/mock-liq-scraper.mjs` (archivo de desarrollo; no forma parte del build):

```js
// scripts/dev/mock-liq-scraper.mjs — mock local del satoshi-scraper para S32.
// Uso: node scripts/dev/mock-liq-scraper.mjs   (escucha en :9119)
// y en .env: SCRAPER_BASE_URL=http://localhost:9119
import http from 'node:http';

const REF = 118432.5;
const BUCKET = 100;
const buckets = [];
for (let p = Math.round(REF * 0.8 / BUCKET) * BUCKET; p <= REF * 1.2; p += BUCKET) {
  const isLong = p < REF;
  const dist = Math.abs(p - REF) / REF;
  const base = Math.max(0, Math.round((0.2 - dist) * 4e7 * (0.4 + Math.random())));
  if (base === 0) continue;
  const side = { 10: Math.round(base * 0.3), 25: Math.round(base * 0.3), 50: Math.round(base * 0.25), 100: Math.round(base * 0.15) };
  const zero = { 10: 0, 25: 0, 50: 0, 100: 0 };
  buckets.push({
    price: p,
    longs: isLong ? side : zero,
    shorts: isLong ? zero : side,
    total: Object.values(side).reduce((a, b) => a + b, 0),
  });
}

const mapPayload = {
  source: 'binance-futures', provider: 'mock-local', symbol: 'BTCUSDT',
  model: 'oi-delta-leverage-tiers-v1', estimated: true,
  refPrice: REF, markPrice: REF + 7.6, fundingRate: 0.0000125,
  openInterest: { base: 91234.5, usd: 10804512345 }, longShortRatio: 1.02,
  bucketSize: BUCKET, rangePct: 0.2,
  leverageTiers: [10, 25, 50, 100],
  leverageWeights: { 10: 0.30, 25: 0.30, 50: 0.25, 100: 0.15 },
  mmr: 0.004, buckets,
  totals: { long: 812000000, short: 703000000 },
  seededFrom: 'snapshot', lastEventAt: new Date().toISOString(),
  _meta: { cachedAt: new Date().toISOString(), scraper: 'mock', transport: 'ws+rest', lastError: null },
};

const eventsPayload = {
  source: 'binance-futures', provider: 'mock-local', symbol: 'BTCUSDT', sampled: true,
  note: 'Binance emite maximo 1 evento forceOrder por segundo por simbolo; esto es una muestra, no el volumen total de liquidaciones.',
  events: Array.from({ length: 24 }, (_, i) => ({
    ts: Date.now() - i * 47_000,
    side: Math.random() > 0.5 ? 'SELL' : 'BUY',
    price: REF + (Math.random() - 0.5) * 600,
    qty: Number((Math.random() * 2).toFixed(3)),
    notional: Math.round(Math.random() * 250_000),
    orderStatus: 'FILLED',
  })),
  count: 24,
  _meta: { cachedAt: new Date().toISOString(), scraper: 'mock', lastError: null },
};

http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/api/scrape/binance-liq-map') return res.end(JSON.stringify(mapPayload));
  if (req.url === '/api/scrape/binance-liq-events') return res.end(JSON.stringify(eventsPayload));
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
}).listen(9119, () => console.log('[mock-liq-scraper] http://localhost:9119'));
```

Flujo: `node scripts/dev/mock-liq-scraper.mjs` → `.env` con `SCRAPER_BASE_URL=http://localhost:9119` → `npm run dev`. El JSON del mock replica el fixture del contrato de la sección B (mismos campos, mismos tipos), así que cambiar del mock al scraper real es solo cambiar la env var. Para probar el estado de error/stale: matar el mock con el dashboard abierto. (Alternativa sin script: servir dos ficheros JSON estáticos con cualquier static server que respete esos paths; el script es preferible porque los paths anidados y el timestamp fresco vienen gratis.)

---

## H. Coordinación con el otro repo (`satoshi-scraper`)

1. **El contrato de la sección B es la fuente de verdad.** Cualquier cambio (campo nuevo, rename, semántica) exige actualizar EN LA MISMA TAREA el bloque idéntico en `PLAN_LIQUIDATION_MAP_SCRAPER.md` en `C:\Users\liber\OneDrive\Documentos\satoshi-scraper`. Un solo lado desincronizado invalida ambos documentos.
2. **Orden recomendado**: scraper primero, o en paralelo usando el fixture/mock de G.4 (el dashboard no tiene ninguna dependencia de build sobre el scraper, solo de runtime).
3. **Prueba de integración final**:
   - Fase 1 — scraper local: scraper corriendo en `http://localhost:9119`, dashboard con `SCRAPER_BASE_URL=http://localhost:9119`, checklist G.2 completo.
   - Fase 2 — producción: `SCRAPER_BASE_URL=https://api.zatobox.io` (valor por defecto del código, `publicDataFeeds.js` línea 73), repetir G.2 + verificar cabeceras `Cache-Control: public, s-maxage=15, stale-while-revalidate=30` en `/api/public/binance/liq-map`.
4. El dashboard **nunca** implementa fallback directo a Binance: si el scraper muere, la degradación correcta es stale → error, jamás llamar a Binance desde este repo (regla alineada con `.claude/DATA_SOURCE_INTEGRITY_RULES.md`).
