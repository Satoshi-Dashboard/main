import { randomUUID } from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { ExternalApiError, getBtcRates, updateBtcRates } from './services/btcRates.js';
import {
  getBitnodesPayload,
  pendingResponse,
  refreshBitnodesCache,
} from './features/bitnodes/bitnodesCache.js';
import {
  getS12BtcDistributionPayload,
  getS12BtcDistributionStatus,
  updateBtcDistributionCache,
} from './features/bitinfocharts/s12BtcDistribution.js';
import {
  getS13AddressesRicherPayload,
  getS13AddressesRicherStatus,
  updateS13AddressesRicherCache,
} from './features/bitinfocharts/s13AddressesRicher.js';
import {
  getS03MultiCurrencyPayload,
  getS03MultiCurrencyStatus,
  refreshS03MultiCurrencyPayload,
  S03ScrapeError,
} from './features/multi-currency/s03MultiCurrencyScraper.js';
import {
  getS10StablecoinDetail,
  getS10StablecoinList,
  getS10StablecoinLivePrices,
  S10StablecoinError,
} from './features/stablecoins/s10StablecoinPegCache.js';
import {
  getS14GlobalAssetsPayload,
  getS14GlobalAssetsStatus,
  refreshS14GlobalAssetsPayload,
  S14GlobalAssetsError,
} from './features/global-assets/s14GlobalAssetsCache.js';
import {
  getBinanceBtcHistoryPayload,
  getBtcMapBusinessesByCountryPayload,
  getCountriesGeoPayload,
  getFearGreedPayload,
  getLandGeoPayload,
  getLightningChannelsGeoPayload,
  getLightningWorldPayload,
  getMempoolLivePayload,
  getMempoolNodePayload,
  getMempoolOfficialUsagePayload,
  getMempoolOverviewPayload,
  getS15BtcVsGoldMarketCapPayload,
  getS21BigMacSatsPayload,
  getUsNationalDebtPayload,
  PublicFeedError,
} from './services/publicDataFeeds.js';

const REFRESH_API_TOKEN = String(process.env.REFRESH_API_TOKEN || '');
const REQUEST_ID_HEADER = 'x-request-id';
const LOCALHOST_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
const LOCALHOST_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const RATE_LIMIT_WINDOW_MS = 60_000;
const GENERAL_API_RATE_LIMIT_MAX = Number(process.env.GENERAL_API_RATE_LIMIT_MAX || 240);
const PUBLIC_API_RATE_LIMIT_MAX = Number(process.env.PUBLIC_API_RATE_LIMIT_MAX || 60);
const REFRESH_API_RATE_LIMIT_MAX = Number(process.env.REFRESH_API_RATE_LIMIT_MAX || 10);

function getRequestId(req) {
  const incomingId = String(req.headers[REQUEST_ID_HEADER] || '').trim();
  return incomingId || randomUUID();
}

function getSafePath(req) {
  return req.originalUrl || req.url || req.path || '/';
}

function logInternalError(req, error) {
  console.error('[api:error]', {
    requestId: req.requestId,
    method: req.method,
    path: getSafePath(req),
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      logInternalError(req, error);
      if (res.headersSent) {
        return;
      }
      res.status(500).json({
        error: 'Internal server error',
        requestId: req.requestId,
      });
    }
  };
}

function setDataCacheHeaders(res, { sMaxAge = 30, swr = 60 } = {}) {
  res.set('Cache-Control', `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`);
}

function setNoStoreHeaders(res) {
  res.set('Cache-Control', 'no-store, max-age=0');
}

function isLoopbackRequest(req) {
  const hostname = String(req.hostname || '').toLowerCase();
  const ip = String(req.ip || '').toLowerCase();
  if (!LOCALHOST_IPS.has(ip)) {
    return false;
  }
  return !hostname || LOCALHOST_HOSTS.has(hostname);
}

function createRateLimiter({ max, message }) {
  return rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: parsePositiveInteger(max, 1),
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    handler: (req, res) => {
      res.status(429).json({
        error: message,
        requestId: req.requestId,
      });
    },
  });
}

const generalApiRateLimiter = createRateLimiter({
  max: GENERAL_API_RATE_LIMIT_MAX,
  message: 'Too many API requests',
});

const publicApiRateLimiter = createRateLimiter({
  max: PUBLIC_API_RATE_LIMIT_MAX,
  message: 'Too many public API requests',
});

const refreshApiRateLimiter = createRateLimiter({
  max: REFRESH_API_RATE_LIMIT_MAX,
  message: 'Too many refresh requests',
});

function sendBtcError(res, error) {
  if (error instanceof ExternalApiError) {
    if (error.source === 'binance') {
      res.status(502).json({ error: 'Binance API unavailable' });
      return;
    }
    if (error.source === 'investing') {
      res.status(502).json({ error: 'Investing FX source unavailable' });
      return;
    }
  }
  res.status(500).json({ error: 'Internal server error' });
}

function sendS03Error(res, error) {
  if (error instanceof S03ScrapeError) {
    res.status(502).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
}

function sendS10Error(res, error) {
  if (error instanceof S10StablecoinError) {
    res.status(502).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
}

function sendS14Error(res, error) {
  if (error instanceof S14GlobalAssetsError) {
    res.status(502).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
}

function sendPublicFeedError(res, error) {
  if (error instanceof PublicFeedError) {
    res.status(502).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
}

function requireRefreshToken(req, res, next) {
  if (!REFRESH_API_TOKEN) {
    if (!isLoopbackRequest(req)) {
      res.status(403).json({ error: 'Refresh endpoints require REFRESH_API_TOKEN outside localhost' });
      return;
    }
    next();
    return;
  }

  const tokenFromHeader = req.headers['x-refresh-token'];
  const authHeader = String(req.headers.authorization || '');
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const token = String(tokenFromHeader || bearerToken || '');

  if (token !== REFRESH_API_TOKEN) {
    res.status(401).json({ error: 'Unauthorized refresh request' });
    return;
  }

  next();
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', true);
  app.use(express.json({ limit: '8kb' }));
  app.use((req, res, next) => {
    req.requestId = getRequestId(req);
    res.set(REQUEST_ID_HEADER, req.requestId);
    next();
  });
  app.use((req, res, next) => {
    res.set('Referrer-Policy', 'no-referrer');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use('/api', generalApiRateLimiter);
  app.use('/api/public', publicApiRateLimiter);

  app.get('/api/bitnodes/cache', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 21600, swr: 3600 });
    const payload = await getBitnodesPayload();
    if (!payload || !payload.data) {
      res.json(pendingResponse());
      return;
    }
    res.json(payload);
  }));

  app.get('/api/bitnodes/cache/status', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 120, swr: 300 });
    const cache = await getBitnodesPayload();
    if (!cache || !cache.data) {
      res.json(pendingResponse());
      return;
    }
    res.json({
      status: 'ready',
      last_updated: cache.last_updated,
      next_update: cache.next_update,
      source_provider: cache.source_provider || 'bitnodes',
      is_fallback: Boolean(cache.is_fallback),
    });
  }));

  app.get('/api/btc/rates', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 5, swr: 15 });
    try {
      const payload = await getBtcRates();
      res.json(payload);
    } catch (error) {
      sendBtcError(res, error);
    }
  }));

  app.get('/api/btc/refresh', refreshApiRateLimiter, requireRefreshToken, asyncRoute(async (_req, res) => {
    setNoStoreHeaders(res);
    try {
      const payload = await updateBtcRates();
      res.json(payload);
    } catch (error) {
      sendBtcError(res, error);
    }
  }));

  app.get('/api/btc/rates/:currency', asyncRoute(async (req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 5, swr: 15 });
    try {
      const payload = await getBtcRates();
      const code = String(req.params.currency || '').toUpperCase();
      const value = payload?.rates?.[code];

      if (!Number.isFinite(value)) {
        res.status(404).json({ error: `Currency ${code} not found in BTC rates cache` });
        return;
      }

      res.json({
        currency: code,
        btc_price: value,
        updated_at: payload.updated_at,
        source_btc: payload.source_btc,
        source_fiat: payload.source_fiat,
      });
    } catch (error) {
      sendBtcError(res, error);
    }
  }));

  app.get('/api/s03/multi-currency', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 30, swr: 60 });
    try {
      const payload = await getS03MultiCurrencyPayload();
      res.json(payload);
    } catch (error) {
      sendS03Error(res, error);
    }
  }));

  app.get('/api/s03/multi-currency/status', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 30, swr: 60 });
    try {
      const status = await getS03MultiCurrencyStatus();
      res.json(status);
    } catch (error) {
      sendS03Error(res, error);
    }
  }));

  app.get('/api/s03/multi-currency/refresh', refreshApiRateLimiter, requireRefreshToken, asyncRoute(async (_req, res) => {
    setNoStoreHeaders(res);
    try {
      const payload = await refreshS03MultiCurrencyPayload();
      res.json({
        source: payload.source_provider,
        updatedAt: payload.updated_at,
        nextUpdateAt: payload.next_update_at,
        pairs: payload.upstream_pairs,
      });
    } catch (error) {
      sendS03Error(res, error);
    }
  }));

  const sendS10StablecoinList = async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 120, swr: 240 });
    try {
      const payload = await getS10StablecoinList();
      res.json(payload);
    } catch (error) {
      sendS10Error(res, error);
    }
  };

  app.get('/api/s10/stablecoins', asyncRoute(sendS10StablecoinList));

  const sendS10StablecoinLivePrices = async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 120, swr: 240 });
    try {
      const payload = await getS10StablecoinLivePrices();
      res.json(payload);
    } catch (error) {
      sendS10Error(res, error);
    }
  };

  app.get('/api/s10/stablecoins/live-prices', asyncRoute(sendS10StablecoinLivePrices));

  const sendS10StablecoinDetail = async (req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 120, swr: 300 });
    try {
      const payload = await getS10StablecoinDetail(req.params.id);
      res.json(payload);
    } catch (error) {
      sendS10Error(res, error);
    }
  };

  app.get('/api/s10/stablecoin/:id', asyncRoute(sendS10StablecoinDetail));

  const sendS14GlobalAssets = async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3600, swr: 7200 });
    try {
      const payload = await getS14GlobalAssetsPayload();
      res.json(payload);
    } catch (error) {
      sendS14Error(res, error);
    }
  };

  app.get('/api/s14/global-assets', asyncRoute(sendS14GlobalAssets));

  const sendS14GlobalAssetsStatus = async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3600, swr: 7200 });
    try {
      const payload = await getS14GlobalAssetsStatus();
      res.json(payload);
    } catch (error) {
      sendS14Error(res, error);
    }
  };

  app.get('/api/s14/global-assets/status', asyncRoute(sendS14GlobalAssetsStatus));

  const refreshS14GlobalAssets = async (_req, res) => {
    setNoStoreHeaders(res);
    try {
      const payload = await refreshS14GlobalAssetsPayload();
      res.json({
        source: payload.source_provider,
        updatedAt: payload.updated_at,
        nextUpdateAt: payload.next_update_at,
        assets: payload?.data?.asset_count ?? 0,
      });
    } catch (error) {
      sendS14Error(res, error);
    }
  };

  app.get('/api/s14/global-assets/refresh', refreshApiRateLimiter, requireRefreshToken, asyncRoute(refreshS14GlobalAssets));

  app.get('/api/public/mempool/overview', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 5, swr: 20 });
    try {
      const payload = await getMempoolOverviewPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/mempool/official-usage', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 5, swr: 20 });
    try {
      const payload = await getMempoolOfficialUsagePayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  // Node memory data via zatobox bitcoin-core-mempool scraper (5s server cache)
  app.get('/api/public/mempool/node', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3, swr: 5 });
    try {
      const payload = await getMempoolNodePayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/mempool/live', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 5, swr: 10 });
    try {
      const payload = await getMempoolLivePayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/fear-greed', asyncRoute(async (req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 21600, swr: 3600 });
    try {
      const limit = Number(req.query?.limit || 31);
      const payload = await getFearGreedPayload({ limit });
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/geo/countries', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 2592000, swr: 86400 });
    try {
      const payload = await getCountriesGeoPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/geo/land', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 2592000, swr: 86400 });
    try {
      const payload = await getLandGeoPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/lightning/world', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 15, swr: 45 });
    try {
      const payload = await getLightningWorldPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/lightning/channels-geo', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 60, swr: 240 });
    try {
      const payload = await getLightningChannelsGeoPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/btcmap/businesses-by-country', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3600, swr: 21600 });
    try {
      const payload = await getBtcMapBusinessesByCountryPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/s15/btc-vs-gold-market-cap', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 120, swr: 600 });
    try {
      const payload = await getS15BtcVsGoldMarketCapPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/binance/btc-history', asyncRoute(async (req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 30, swr: 120 });
    try {
      const days = Number(req.query?.days || 365);
      const interval = req.query?.interval ?? undefined;
      const payload = await getBinanceBtcHistoryPayload({ days, interval });
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/s21/big-mac-sats-data', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 604800, swr: 86400 });
    try {
      const payload = await getS21BigMacSatsPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/us-national-debt', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 300, swr: 900 });
    try {
      const payload = await getUsNationalDebtPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  const sendS12BtcDistribution = async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3600, swr: 7200 });
    try {
      const payload = await getS12BtcDistributionPayload();
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  };

  app.get('/api/s12/btc-distribution', asyncRoute(sendS12BtcDistribution));

  const sendS12BtcDistributionStatus = async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3600, swr: 7200 });
    try {
      const status = await getS12BtcDistributionStatus();
      res.json(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  };

  app.get('/api/s12/btc-distribution/status', asyncRoute(sendS12BtcDistributionStatus));

  const refreshS12BtcDistribution = async (_req, res) => {
    setNoStoreHeaders(res);
    try {
      const payload = await updateBtcDistributionCache();
      res.json({
        source: payload.source,
        updatedAt: payload.updatedAt,
        nextUpdateAt: payload.nextUpdateAt,
        rows: payload.distribution.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  };

  app.get('/api/s12/btc-distribution/refresh', refreshApiRateLimiter, requireRefreshToken, asyncRoute(refreshS12BtcDistribution));

  const sendS13AddressesRicher = async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3600, swr: 7200 });
    try {
      const payload = await getS13AddressesRicherPayload();
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  };

  app.get('/api/s13/addresses-richer', asyncRoute(sendS13AddressesRicher));

  const sendS13AddressesRicherStatus = async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3600, swr: 7200 });
    try {
      const status = await getS13AddressesRicherStatus();
      res.json(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  };

  app.get('/api/s13/addresses-richer/status', asyncRoute(sendS13AddressesRicherStatus));

  const refreshS13AddressesRicher = async (_req, res) => {
    setNoStoreHeaders(res);
    try {
      const payload = await updateS13AddressesRicherCache();
      res.json({
        source: payload.source,
        updatedAt: payload.updatedAt,
        nextUpdateAt: payload.nextUpdateAt,
        rows: payload.richerThan.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  };

  app.get('/api/s13/addresses-richer/refresh', refreshApiRateLimiter, requireRefreshToken, asyncRoute(refreshS13AddressesRicher));

  app.get('/api/bitnodes/cache/refresh', refreshApiRateLimiter, requireRefreshToken, asyncRoute(async (_req, res) => {
    setNoStoreHeaders(res);
    try {
      const payload = await refreshBitnodesCache();
      res.json({
        status: 'ready',
        last_updated: payload.last_updated,
        next_update: payload.next_update,
        total_nodes: payload?.data?.total_nodes ?? null,
        source_provider: payload.source_provider || 'bitnodes',
        is_fallback: Boolean(payload.is_fallback),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `Bitnodes unavailable: ${message}` });
    }
  }));

  // ── Cache warm-up on startup ──────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    const scheduleWarmup = (label, delayMs, task) => {
      setTimeout(() => {
        Promise.resolve()
          .then(task)
          .then(() => console.log(`[warmup] ${label} cache ready`))
          .catch((err) => console.warn(`[warmup] ${label} failed:`, err?.message));
      }, delayMs);
    };

    scheduleWarmup('BTC spot', 500, () => getBtcRates());
    scheduleWarmup('S01 mempool overview', 1200, () => getMempoolOverviewPayload());
    scheduleWarmup('S04 mempool official usage', 1800, () => getMempoolOfficialUsagePayload());
    scheduleWarmup('S05 mempool live', 2400, () => getMempoolLivePayload());
    scheduleWarmup('S03 multi-currency', 3000, () => getS03MultiCurrencyPayload());
    scheduleWarmup('S10 stablecoin list', 3600, () => getS10StablecoinList());
    scheduleWarmup('S10 stablecoin live prices', 4200, () => getS10StablecoinLivePrices());

    // S06 Bitnodes: cold start hits Bitnodes API (2-3s) or HTML scraper fallback (5-10s).
    scheduleWarmup('S06 Bitnodes nodes', 5000, () => getBitnodesPayload());

    // S07 Lightning: mempool.space responds fast but GeoJSON + lock wait adds latency cold.
    scheduleWarmup('S07 Lightning world', 6000, () => getLightningWorldPayload());
    scheduleWarmup('geo countries', 6500, () => getCountriesGeoPayload());

    // S14/S15/S30 benefit from having composed real payloads ready before the first visit.
    scheduleWarmup('S14 global assets', 7500, () => getS14GlobalAssetsPayload());
    scheduleWarmup('S30 U.S. debt', 8200, () => getUsNationalDebtPayload());
    scheduleWarmup('S15 BTC vs Gold', 9000, () => getS15BtcVsGoldMarketCapPayload());

    // S02/S16 history ranges share the same Binance history cache family.
    scheduleWarmup('S02 history 1D', 9800, () => getBinanceBtcHistoryPayload({ days: 1, interval: '5m' }));
    scheduleWarmup('S02 history 1W', 10_400, () => getBinanceBtcHistoryPayload({ days: 7, interval: '1h' }));
    scheduleWarmup('S02 history 1M', 11_000, () => getBinanceBtcHistoryPayload({ days: 30, interval: '1h' }));
    scheduleWarmup('S02 history 1Y', 11_600, () => getBinanceBtcHistoryPayload({ days: 365, interval: '1d' }));
    scheduleWarmup('S02 history 5Y', 12_200, () => getBinanceBtcHistoryPayload({ days: 1825, interval: '1d' }));
    scheduleWarmup('S16 history 2025d', 12_800, () => getBinanceBtcHistoryPayload({ days: 2025, interval: '1d' }));

    // S08 BTC Map: paginating ~50k places + point-in-polygon matching takes 20-60s cold.
    // Warm it up after core modules so long-running aggregation does not delay more common feeds.
    scheduleWarmup('S08 BTC Map businesses', 14_000, () => getBtcMapBusinessesByCountryPayload());
  }

  return app;
}
