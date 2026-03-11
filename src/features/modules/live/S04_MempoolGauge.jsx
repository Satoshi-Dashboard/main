import { useEffect, useState } from 'react';
import { fetchJson } from '@/shared/lib/api.js';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import { fetchMempoolOverviewBundle } from '@/shared/services/mempoolApi.js';

const UI_COLORS = {
  brand:    'var(--accent-bitcoin)',
  positive: 'var(--accent-green)',
  negative: 'var(--accent-red)',
};

/** Smart KB/MB formatter — returns { value, unit, decimals } */
function formatMemory(bytes) {
  if (bytes == null) return { value: null, unit: null, decimals: 1 };
  if (bytes < 1_000_000) {
    return { value: parseFloat((bytes / 1e3).toFixed(1)), unit: 'KB', decimals: 1 };
  }
  return { value: parseFloat((bytes / 1e6).toFixed(1)), unit: 'MB', decimals: 1 };
}

/* ── Gauge Arc ──────────────────────────────────────────────────────────────
 * usageBytes/maxMB from node data (future: zatobox API)
 * When unavailable: empty track + "--" placeholder
 * ────────────────────────────────────────────────────────────────────────── */
function GaugeArc({ usageBytes, maxMB, loading }) {
  const hasData = usageBytes != null && maxMB != null;
  const usageMB = usageBytes != null ? usageBytes / 1e6 : 0;
  const pct     = hasData ? Math.min((usageMB / maxMB) * 100, 100) : 0;

  const r              = 120;
  const cx             = 180;
  const cy             = 160;
  const arcPath        = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const totalArcLength = Math.PI * r;
  const filledLength   = (pct / 100) * totalArcLength;

  return (
    <svg width="360" height="190" viewBox="0 0 360 190" className="w-full max-w-[420px]">
      {/* Track */}
      <path d={arcPath} fill="none" stroke="#2a2a2a" strokeWidth="18" strokeLinecap="round" />
      {/* Fill */}
      {!loading && hasData && (
        <path
          d={arcPath}
          fill="none"
          stroke={UI_COLORS.brand}
          strokeWidth="18"
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${totalArcLength}`}
          style={{ filter: 'drop-shadow(0 0 8px rgba(247,147,26,0.5))' }}
        />
      )}
      {/* Center text */}
      {loading ? (
        <>
          <rect x={cx - 60} y={cy - 58} width="120" height="40" rx="6" fill="#2a2a2a" opacity="0.7">
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.4s" repeatCount="indefinite" />
          </rect>
          <rect x={cx - 44} y={cy - 6} width="88" height="20" rx="4" fill="#2a2a2a" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.4s" repeatCount="indefinite" />
          </rect>
        </>
      ) : hasData ? (
        <>
          <text x={cx} y={cy - 18} textAnchor="middle" fill={UI_COLORS.brand}
            fontSize="42" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            {pct.toFixed(1)}%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.35)"
            fontSize="18" fontFamily="JetBrains Mono, monospace" letterSpacing="3">
            RAM
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 18} textAnchor="middle" fill="#333"
            fontSize="42" fontFamily="JetBrains Mono, monospace" fontWeight="700">
            --%
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.12)"
            fontSize="18" fontFamily="JetBrains Mono, monospace" letterSpacing="3">
            RAM
          </text>
        </>
      )}
      {/* Scale labels */}
      <text x={cx - r + 4} y={cy + 30} fill="#333" fontSize="15" fontFamily="JetBrains Mono, monospace">0</text>
      <text x={cx + r - 8} y={cy + 30} textAnchor="end" fill="#333" fontSize="15" fontFamily="JetBrains Mono, monospace">
        {hasData ? `${maxMB} MB` : '--- MB'}
      </text>
    </svg>
  );
}

/* ── Fee Tile ── */
function FeeTile({ label, value, color = UI_COLORS.brand, loading }) {
  return (
    <div className="flex min-w-[92px] flex-1 basis-[132px] flex-col items-center gap-2 border-[#2a2a2a] px-4 py-1 sm:flex-none sm:basis-auto sm:px-6">
      {loading || value == null ? (
        <div className="skeleton" style={{ width: 48, height: '2em' }} />
      ) : (
        <div className="flex min-h-[2.1em] items-center font-mono font-bold tabular-nums" style={{ fontSize: 'var(--fs-title)', color }}>
          <AnimatedMetric value={value} variant="number" decimals={2} inline />
        </div>
      )}
      <div className="uppercase tracking-[0.2em] text-white/30" style={{ fontSize: 'var(--fs-tag)' }}>{label}</div>
      <div className="text-white/20 font-mono" style={{ fontSize: 'var(--fs-micro)' }}>sat/vB</div>
    </div>
  );
}

export default function S04_MempoolGauge() {
  const [mempool, setMempool] = useState({
    vsize:       null,  // tx virtual size in vMB  (mempool.space)
    count:       null,  // pending tx count        (mempool.space)
    feeLow:      null,
    feeMid:      null,
    feeHigh:     null,
  });

  // TODO: zatobox API — node memory data
  // Replace these nulls with data from the zatobox endpoint once available.
  // Expected shape: { usageBytes: number, maxmempoolMB: number }
  const [nodeData, setNodeData] = useState({
    usageBytes:    null,  // raw bytes (e.g. 1_433_776)
    maxmempoolMB:  null,  // MB       (e.g. 300)
  });

  const [loading, setLoading] = useState(true);

  // Node memory — via zatobox /api/scrape/bitcoin-core-mempool (1s client, 5s server cache)
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetchJson('/api/public/mempool/node', { timeout: 4000, cache: 'no-store' });
        if (!active) return;
        // res is the raw feed payload: { usage, maxmempool, bytes, size, total_fee, cached_at }
        const d = res?.data ?? res;
        if (d?.usage != null && d?.maxmempool != null) {
          setNodeData({
            usageBytes:   d.usage,
            maxmempoolMB: Math.round(d.maxmempool / 1e6),
          });
        }
      } catch { /* keep previous */ }
    };
    poll();
    const t = setInterval(poll, 1_000);
    return () => { active = false; clearInterval(t); };
  }, []);

  // Main poll — fees, tx count, vsize from mempool.space (30s)
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const bundle = await fetchMempoolOverviewBundle({ timeout: 8000, cache: 'no-store' });

        if (!active) return;
        setMempool((prev) => ({
          ...prev,
          count: bundle.mempool.count ?? prev.count,
          vsize: bundle.mempool.vsize != null ? parseFloat((bundle.mempool.vsize / 1e6).toFixed(1)) : prev.vsize,
          feeLow: bundle.fees.economy ?? prev.feeLow,
          feeMid: bundle.fees.normal ?? prev.feeMid,
          feeHigh: bundle.fees.priority ?? prev.feeHigh,
        }));
      } catch {
        /* keep previous values */
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => { active = false; clearInterval(t); };
  }, []);

  const hasNodeData = nodeData.usageBytes != null && nodeData.maxmempoolMB != null;
  const memFmt      = formatMemory(nodeData.usageBytes);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#111111] px-3 py-4 sm:gap-6 sm:px-4">
      {/* Title */}
      <div className="text-center">
        <div className="font-mono font-bold uppercase tracking-[0.2em]"
          style={{ fontSize: 'var(--fs-heading)', color: UI_COLORS.brand }}>
          MEMPOOL STATUS
        </div>
      </div>

      {/* Gauge */}
      <div className="flex w-full flex-col items-center justify-center gap-1">
        <GaugeArc
          usageBytes={nodeData.usageBytes}
          maxMB={nodeData.maxmempoolMB}
          loading={loading}
        />
        {/* Node status note */}
        {!loading && !hasNodeData ? (
          <div className="flex items-center gap-1.5 font-mono" style={{ fontSize: 'var(--fs-micro)', color: UI_COLORS.negative }}>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            NODE OFFLINE
          </div>
        ) : (
          <div className="font-mono text-white/25" style={{ fontSize: 'var(--fs-micro)' }}>
            {hasNodeData
              ? `node RAM usage · ${memFmt.value} ${memFmt.unit} / ${nodeData.maxmempoolMB} MB`
              : ''}
          </div>
        )}
      </div>

      {/* Main stats */}
      <div className="flex w-full max-w-[660px] flex-col items-center gap-4 border-y border-[#2a2a2a] px-3 py-4 sm:flex-row sm:justify-center sm:gap-8 sm:px-8 sm:py-5">
        <div className="flex flex-col items-center gap-2">
          {loading || mempool.count == null ? (
            <div className="skeleton" style={{ width: 100, height: '1.8em' }} />
          ) : (
            <div className="flex min-h-[2em] items-center font-mono font-bold text-white tabular-nums" style={{ fontSize: 'var(--fs-title)' }}>
              <AnimatedMetric value={mempool.count} variant="number" inline />
            </div>
          )}
          <div className="uppercase tracking-[0.18em]" style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}>
            PENDING TXS
          </div>
        </div>

        <div className="h-px w-28 bg-[#2a2a2a] sm:h-16 sm:w-px" />

        <div className="flex flex-col items-center gap-2">
          {loading || mempool.vsize == null ? (
            <div className="skeleton" style={{ width: 80, height: '1.8em' }} />
          ) : (
            <div className="flex min-h-[2em] items-center font-mono font-bold text-white tabular-nums" style={{ fontSize: 'var(--fs-title)' }}>
              <AnimatedMetric value={mempool.vsize} variant="number" decimals={1} inline />
              <span className="text-[0.4em] text-white/50 ml-1">vMB</span>
            </div>
          )}
          <div className="uppercase tracking-[0.18em]" style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}>
            VIRTUAL SIZE
          </div>
        </div>

        {/* Memory usage — shown when node data is available (zatobox) */}
        {hasNodeData && memFmt.value != null && (
          <>
            <div className="h-px w-28 bg-[#2a2a2a] sm:h-16 sm:w-px" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex min-h-[2em] items-center font-mono font-bold text-white tabular-nums" style={{ fontSize: 'var(--fs-title)' }}>
                <AnimatedMetric value={memFmt.value} variant="number" decimals={memFmt.decimals} inline />
                <span className="text-[0.4em] text-white/50 ml-1">{memFmt.unit}</span>
              </div>
              <div className="uppercase tracking-[0.18em]" style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}>
                MEMORY USAGE
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fee row */}
      <div className="flex w-full flex-wrap items-center justify-center gap-1 sm:w-auto sm:flex-nowrap sm:gap-0 sm:divide-x sm:divide-[#2a2a2a]">
        <FeeTile label="ECONOMY"  value={mempool.feeLow}  color={UI_COLORS.positive} loading={loading} />
        <FeeTile label="NORMAL"   value={mempool.feeMid}  color={UI_COLORS.brand}    loading={loading} />
        <FeeTile label="PRIORITY" value={mempool.feeHigh} color={UI_COLORS.negative} loading={loading} />
      </div>

      {/* Data cadence badge */}
      <div className="flex-shrink-0 pb-1 lg:hidden">
        <span className="font-mono text-white/20" style={{ fontSize: 'var(--fs-micro)' }}>
          src: mempool.space{hasNodeData ? ' + node' : ''} · ~30s
        </span>
      </div>
    </div>
  );
}
