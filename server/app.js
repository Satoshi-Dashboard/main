import express from 'express';
import { ExternalApiError, getBtcRates, updateBtcRates } from '../btcRates.js';
import {
  getBitnodesPayload,
  pendingResponse,
  refreshBitnodesCache,
} from './bitnodesCache.js';
import {
  getBtcDistributionJs,
  getBtcDistributionPayload,
  getBtcDistributionStatus,
  updateBtcDistributionCache,
} from './btcDistribution.js';
import {
  getBtcAddressesRicherJs,
  getBtcAddressesRicherPayload,
  getBtcAddressesRicherStatus,
  updateBtcAddressesRicherCache,
} from './btcAddressesRicher.js';
import {
  getS03MultiCurrencyPayload,
  getS03MultiCurrencyStatus,
  refreshS03MultiCurrencyPayload,
  S03ScrapeError,
} from './s03MultiCurrencyScraper.js';
import {
  getS08StablecoinDetail,
  getS08StablecoinList,
  getS08StablecoinLivePrices,
  S08StablecoinError,
} from './s08StablecoinPegCache.js';
import {
  getS13GlobalAssetsPayload,
  getS13GlobalAssetsStatus,
  refreshS13GlobalAssetsPayload,
  S13GlobalAssetsError,
} from './s13GlobalAssetsCache.js';
import {
  getBinanceBtcHistoryPayload,
  getCoingeckoBitcoinMarketChartPayload,
  getCountriesGeoPayload,
  getFearGreedPayload,
  getLandGeoPayload,
  getLightningWorldPayload,
  getMempoolLivePayload,
  getMempoolOverviewPayload,
  getS21BigMacSatsPayload,
  PublicFeedError,
} from './publicDataFeeds.js';
import { extractClientIp, getVisitorStats, trackVisitorByIp } from './visitorCounter.js';

const REFRESH_API_TOKEN = String(process.env.REFRESH_API_TOKEN || '');

function asyncRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  };
}

function setDataCacheHeaders(res, { sMaxAge = 30, swr = 60 } = {}) {
  res.set('Cache-Control', `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`);
}

function setNoStoreHeaders(res) {
  res.set('Cache-Control', 'no-store, max-age=0');
}

function sendBtcError(res, error) {
  if (error instanceof ExternalApiError) {
    if (error.source === 'binance') {
      res.status(502).json({ error: 'Binance API unavailable' });
      return;
    }
    if (error.source === 'frankfurter') {
      res.status(502).json({ error: 'Frankfurter API unavailable' });
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

function sendS08Error(res, error) {
  if (error instanceof S08StablecoinError) {
    res.status(502).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
}

function sendS13Error(res, error) {
  if (error instanceof S13GlobalAssetsError) {
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
    next();
    return;
  }

  const tokenFromHeader = req.headers['x-refresh-token'];
  const tokenFromQuery = req.query?.token;
  const token = String(tokenFromHeader || tokenFromQuery || '');

  if (token !== REFRESH_API_TOKEN) {
    res.status(401).json({ error: 'Unauthorized refresh request' });
    return;
  }

  next();
}

export function createApp() {
  const app = express();

  app.get('/api/bitnodes/cache', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 300, swr: 900 });
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

  app.get('/api/btc/refresh', requireRefreshToken, asyncRoute(async (_req, res) => {
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
    setDataCacheHeaders(res, { sMaxAge: 10, swr: 35 });
    try {
      const payload = await getS03MultiCurrencyPayload();
      res.json(payload);
    } catch (error) {
      sendS03Error(res, error);
    }
  }));

  app.get('/api/s03/multi-currency/status', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 10, swr: 35 });
    try {
      const status = await getS03MultiCurrencyStatus();
      res.json(status);
    } catch (error) {
      sendS03Error(res, error);
    }
  }));

  app.get('/api/s03/multi-currency/refresh', requireRefreshToken, asyncRoute(async (_req, res) => {
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

  app.get('/api/s08/stablecoins', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 30, swr: 90 });
    try {
      const payload = await getS08StablecoinList();
      res.json(payload);
    } catch (error) {
      sendS08Error(res, error);
    }
  }));

  app.get('/api/s08/stablecoins/live-prices', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 30, swr: 90 });
    try {
      const payload = await getS08StablecoinLivePrices();
      res.json(payload);
    } catch (error) {
      sendS08Error(res, error);
    }
  }));

  app.get('/api/s08/stablecoin/:id', asyncRoute(async (req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 120, swr: 300 });
    try {
      const payload = await getS08StablecoinDetail(req.params.id);
      res.json(payload);
    } catch (error) {
      sendS08Error(res, error);
    }
  }));

  app.get('/api/s13/global-assets', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 60, swr: 180 });
    try {
      const payload = await getS13GlobalAssetsPayload();
      res.json(payload);
    } catch (error) {
      sendS13Error(res, error);
    }
  }));

  app.get('/api/s13/global-assets/status', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 60, swr: 180 });
    try {
      const payload = await getS13GlobalAssetsStatus();
      res.json(payload);
    } catch (error) {
      sendS13Error(res, error);
    }
  }));

  app.get('/api/s13/global-assets/refresh', requireRefreshToken, asyncRoute(async (_req, res) => {
    setNoStoreHeaders(res);
    try {
      const payload = await refreshS13GlobalAssetsPayload();
      res.json({
        source: payload.source_provider,
        updatedAt: payload.updated_at,
        nextUpdateAt: payload.next_update_at,
        assets: payload?.data?.asset_count ?? 0,
      });
    } catch (error) {
      sendS13Error(res, error);
    }
  }));

  app.get('/api/public/mempool/overview', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 5, swr: 20 });
    try {
      const payload = await getMempoolOverviewPayload();
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
    setDataCacheHeaders(res, { sMaxAge: 10, swr: 25 });
    try {
      const limit = Number(req.query?.limit || 31);
      const payload = await getFearGreedPayload({ limit });
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/geo/countries', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3600, swr: 21600 });
    try {
      const payload = await getCountriesGeoPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/geo/land', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 3600, swr: 21600 });
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

  app.get('/api/public/coingecko/bitcoin-market-chart', asyncRoute(async (req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 120, swr: 600 });
    try {
      const days = Number(req.query?.days || 365);
      const payload = await getCoingeckoBitcoinMarketChartPayload({ days });
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/binance/btc-history', asyncRoute(async (req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 30, swr: 120 });
    try {
      const days = Number(req.query?.days || 365);
      const payload = await getBinanceBtcHistoryPayload({ days });
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/public/s21/big-mac-sats-data', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 10, swr: 30 });
    try {
      const payload = await getS21BigMacSatsPayload();
      res.json(payload);
    } catch (error) {
      sendPublicFeedError(res, error);
    }
  }));

  app.get('/api/visitors/stats', asyncRoute(async (_req, res) => {
    setNoStoreHeaders(res);
    const payload = await getVisitorStats();
    res.json(payload);
  }));

  app.get('/api/visitors/track', asyncRoute(async (req, res) => {
    setNoStoreHeaders(res);
    const ip = extractClientIp(req);
    const payload = await trackVisitorByIp(ip);
    res.json(payload);
  }));

  app.get('/api/s10/btc-distribution.js', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 60, swr: 120 });
    try {
      const js = await getBtcDistributionJs();
      res.type('application/javascript; charset=utf-8').send(js);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  }));

  app.get('/api/s10/btc-distribution', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 60, swr: 120 });
    try {
      const payload = await getBtcDistributionPayload();
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  }));

  app.get('/api/s10/btc-distribution/status', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 60, swr: 120 });
    try {
      const status = await getBtcDistributionStatus();
      res.json(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  }));

  app.get('/api/s10/btc-distribution/refresh', requireRefreshToken, asyncRoute(async (_req, res) => {
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
  }));

  app.get('/api/s14/addresses-richer.js', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 60, swr: 120 });
    try {
      const js = await getBtcAddressesRicherJs();
      res.type('application/javascript; charset=utf-8').send(js);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  }));

  app.get('/api/s14/addresses-richer', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 60, swr: 120 });
    try {
      const payload = await getBtcAddressesRicherPayload();
      res.json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  }));

  app.get('/api/s14/addresses-richer/status', asyncRoute(async (_req, res) => {
    setDataCacheHeaders(res, { sMaxAge: 60, swr: 120 });
    try {
      const status = await getBtcAddressesRicherStatus();
      res.json(status);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(502).json({ error: `BitInfoCharts unavailable: ${message}` });
    }
  }));

  app.get('/api/s14/addresses-richer/refresh', requireRefreshToken, asyncRoute(async (_req, res) => {
    setNoStoreHeaders(res);
    try {
      const payload = await updateBtcAddressesRicherCache();
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
  }));

  app.get('/api/bitnodes/cache/refresh', requireRefreshToken, asyncRoute(async (_req, res) => {
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

  return app;
}
