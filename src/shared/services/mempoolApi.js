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

export async function fetchMempoolOverviewBundle(options = {}) {
  const {
    timeout = 8000,
    cache = 'no-store',
  } = options;

  const [overviewPayload, livePayload] = await Promise.all([
    fetchJson('/api/public/mempool/overview', { timeout, cache }),
    fetchJson('/api/public/mempool/live', { timeout, cache }).catch(() => null),
  ]);

  return resolveMempoolOverviewBundle(overviewPayload, livePayload);
}
