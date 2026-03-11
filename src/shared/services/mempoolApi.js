import { fetchJson } from '@/shared/lib/api.js';

function toFiniteNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function firstFiniteNumber(...values) {
  for (const value of values) {
    const numericValue = toFiniteNumber(value);
    if (numericValue != null) return numericValue;
  }
  return null;
}

export function resolveMempoolOverviewBundle(overviewPayload, livePayload) {
  const overview = overviewPayload?.data || {};
  const mempool = overview.mempool || {};
  const feeSnapshot = overview.fees || {};
  const blocks = Array.isArray(livePayload?.data?.mempool_blocks) ? livePayload.data.mempool_blocks : [];
  const firstBlock = blocks[0];
  const lastBlock = blocks[blocks.length - 1];
  const firstBlockFeeRange = Array.isArray(firstBlock?.feeRange) ? firstBlock.feeRange : [];

  return {
    overview,
    mempool: {
      count: toFiniteNumber(mempool.count),
      vsize: toFiniteNumber(mempool.vsize),
    },
    fees: {
      economy: firstFiniteNumber(lastBlock?.feeRange?.[0], feeSnapshot.economyFee),
      normal: firstFiniteNumber(firstBlock?.feeRange?.[0], feeSnapshot.halfHourFee),
      priority: firstFiniteNumber(
        feeSnapshot.fastestFee,
        firstBlockFeeRange[firstBlockFeeRange.length - 2],
      ),
    },
  };
}

export function resolveMempoolOfficialUsageSnapshot(payload) {
  const data = payload?.data || {};

  return {
    usageBytes: toFiniteNumber(data.usage),
    maxBytes: toFiniteNumber(data.maxmempool),
    label: typeof data.label === 'string' ? data.label : null,
    cachedAt: typeof data.cached_at === 'string' ? data.cached_at : null,
  };
}

export function resolveMempoolNodeSnapshot(payload) {
  const data = payload?.data || {};

  return {
    usageBytes: toFiniteNumber(data.usage),
    maxBytes: toFiniteNumber(data.maxmempool),
    count: toFiniteNumber(data.size),
    vsizeBytes: toFiniteNumber(data.bytes),
    mempoolMinFeeBtcKb: toFiniteNumber(data.mempoolminfee),
    relayMinFeeBtcKb: toFiniteNumber(data.minrelaytxfee),
    unbroadcastCount: toFiniteNumber(data.unbroadcastcount),
    feeEconomy: toFiniteNumber(data.fee_economy),
    feeHalfHour: toFiniteNumber(data.fee_half_hour),
    feeFastest: toFiniteNumber(data.fee_fastest),
    cachedAt: typeof data.cached_at === 'string' ? data.cached_at : null,
  };
}

/* ── In-flight deduplication ─────────────────────────────────────────────────
 * Calls arriving within DEDUP_WINDOW_MS of each other (e.g. S01 + S04 both
 * mounting at the same time) share a single HTTP round-trip instead of firing
 * two identical requests to the same endpoints.
 * ──────────────────────────────────────────────────────────────────────────── */
const DEDUP_WINDOW_MS = 2_000;
let _inflightBundle = null;
let _inflightAt     = 0;
let _inflightOfficialUsage = null;
let _inflightOfficialUsageAt = 0;
let _inflightNode = null;
let _inflightNodeAt = 0;

export async function fetchMempoolOverviewBundle(options = {}) {
  const { timeout = 8000, cache = 'no-store' } = options;
  const now = Date.now();

  if (_inflightBundle && now - _inflightAt < DEDUP_WINDOW_MS) {
    return _inflightBundle;
  }

  _inflightAt     = now;
  _inflightBundle = (async () => {
    const [overviewPayload, livePayload] = await Promise.all([
      fetchJson('/api/public/mempool/overview', { timeout, cache }),
      fetchJson('/api/public/mempool/live', { timeout, cache }).catch(() => null),
    ]);
    return resolveMempoolOverviewBundle(overviewPayload, livePayload);
  })();

  return _inflightBundle;
}

export async function fetchMempoolOfficialUsageSnapshot(options = {}) {
  const { timeout = 8000, cache = 'no-store' } = options;
  const now = Date.now();

  if (_inflightOfficialUsage && now - _inflightOfficialUsageAt < DEDUP_WINDOW_MS) {
    return _inflightOfficialUsage;
  }

  _inflightOfficialUsageAt = now;
  _inflightOfficialUsage = (async () => {
    const payload = await fetchJson('/api/public/mempool/official-usage', { timeout, cache });
    return resolveMempoolOfficialUsageSnapshot(payload);
  })();

  return _inflightOfficialUsage;
}

export async function fetchMempoolNodeSnapshot(options = {}) {
  const { timeout = 8000, cache = 'no-store' } = options;
  const now = Date.now();

  if (_inflightNode && now - _inflightNodeAt < DEDUP_WINDOW_MS) {
    return _inflightNode;
  }

  _inflightNodeAt = now;
  _inflightNode = (async () => {
    const payload = await fetchJson('/api/public/mempool/node', { timeout, cache });
    return resolveMempoolNodeSnapshot(payload);
  })();

  return _inflightNode;
}
