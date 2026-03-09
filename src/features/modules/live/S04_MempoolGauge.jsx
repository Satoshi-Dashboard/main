import { useEffect, useState } from 'react';
import { fetchJson } from '@/shared/lib/api.js';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';

const MAX_VMEMPOOL = 300; // design max vMB for gauge scale

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  positive: 'var(--accent-green)',
  negative: 'var(--accent-red)',
};

/* ── Gauge Arc (SVG half-circle) ── */
function GaugeArc({ pct, loading }) {
  const r = 120;
  const cx = 180;
  const cy = 160;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const totalArcLength = Math.PI * r;
  const filledLength = ((pct ?? 0) / 100) * totalArcLength;

  return (
    <svg width="360" height="190" viewBox="0 0 360 190" className="w-full max-w-[420px]">
      {/* Track */}
      <path d={arcPath} fill="none" stroke="#2a2a2a" strokeWidth="18" strokeLinecap="round" />
      {/* Fill */}
      {!loading && (
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
      ) : (
        <>
          <text
            x={cx} y={cy - 18}
            textAnchor="middle"
            fill={UI_COLORS.brand}
            fontSize="42"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="700"
          >
            {pct.toFixed(1)}%
          </text>
          <text
            x={cx} y={cy + 14}
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize="18"
            fontFamily="JetBrains Mono, monospace"
            letterSpacing="3"
          >
            CAPACITY
          </text>
        </>
      )}
      {/* Scale labels */}
      <text x={cx - r + 4} y={cy + 30} fill="#444" fontSize="15" fontFamily="JetBrains Mono, monospace">0</text>
      <text x={cx + r - 8} y={cy + 30} textAnchor="end" fill="#444" fontSize="15" fontFamily="JetBrains Mono, monospace">
        {MAX_VMEMPOOL} vMB
      </text>
    </svg>
  );
}

/* ── Fee Tile ── */
function FeeTile({ label, value, color = UI_COLORS.brand, loading }) {
  return (
    <div className="flex min-w-[92px] flex-col items-center gap-2 border-[#2a2a2a] px-4 py-1 sm:px-6">
      {loading || value == null ? (
        <div className="skeleton" style={{ width: 48, height: '2em' }} />
      ) : (
        <div className="font-mono font-bold tabular-nums" style={{ fontSize: 'var(--fs-title)', color }}>
          <AnimatedMetric value={value} variant="number" inline />
        </div>
      )}
      <div className="uppercase tracking-[0.2em] text-white/30" style={{ fontSize: 'var(--fs-tag)' }}>{label}</div>
      <div className="text-white/20 font-mono" style={{ fontSize: 'var(--fs-micro)' }}>sat/vB</div>
    </div>
  );
}

export default function S04_MempoolGauge() {
  const [mempool, setMempool] = useState({
    size: null,
    count: null,
    feeLow: null,
    feeMid: null,
    feeHigh: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const payload = await fetchJson('/api/public/mempool/overview', { timeout: 8000, cache: 'no-store' });
        const mem = payload?.data?.mempool || {};
        const fees = payload?.data?.fees || {};

        if (!active) return;
        setMempool((prev) => ({
          ...prev,
          count:   mem?.count   ?? prev.count,
          size:    mem?.vsize   != null ? Math.round(mem.vsize / 1e6) : prev.size,
          feeLow:  fees?.economyFee  ?? prev.feeLow,
          feeMid:  fees?.halfHourFee ?? prev.feeMid,
          feeHigh: fees?.fastestFee  ?? prev.feeHigh,
        }));
      } catch {
        /* keep previous values */
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const pct = mempool.size != null ? Math.min((mempool.size / MAX_VMEMPOOL) * 100, 100) : null;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#111111] px-3 py-4 sm:gap-6 sm:px-4">
      {/* Title */}
      <div className="text-center">
        <div
          className="font-mono font-bold uppercase tracking-[0.2em]"
          style={{ fontSize: 'var(--fs-heading)', color: UI_COLORS.brand }}
        >
          MEMPOOL STATUS
        </div>
      </div>

      {/* Gauge */}
      <div className="flex w-full items-center justify-center">
        <GaugeArc pct={pct ?? 0} loading={loading} />
      </div>

      {/* Main stats */}
      <div className="flex w-full max-w-[660px] flex-col items-center gap-4 border-y border-[#2a2a2a] px-3 py-4 sm:flex-row sm:justify-center sm:gap-8 sm:px-8 sm:py-5">
        <div className="flex flex-col items-center gap-2">
          {loading || mempool.count == null ? (
            <div className="skeleton" style={{ width: 100, height: '1.8em' }} />
          ) : (
            <div className="font-mono font-bold text-white tabular-nums" style={{ fontSize: 'var(--fs-title)' }}>
              <AnimatedMetric value={mempool.count} variant="number" inline />
            </div>
          )}
          <div className="uppercase tracking-[0.18em]" style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}>
            PENDING TXS
          </div>
        </div>

        <div className="h-px w-28 bg-[#2a2a2a] sm:h-16 sm:w-px" />

        <div className="flex flex-col items-center gap-2">
          {loading || mempool.size == null ? (
            <div className="skeleton" style={{ width: 80, height: '1.8em' }} />
          ) : (
            <div className="font-mono font-bold text-white tabular-nums" style={{ fontSize: 'var(--fs-title)' }}>
              <AnimatedMetric value={mempool.size} variant="number" inline /> <span className="text-[0.4em] text-white/50">vMB</span>
            </div>
          )}
          <div className="uppercase tracking-[0.18em]" style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}>
            MEMPOOL SIZE
          </div>
        </div>
      </div>

      {/* Fee row */}
      <div className="flex w-full flex-wrap items-center justify-center gap-1 sm:w-auto sm:flex-nowrap sm:gap-0 sm:divide-x sm:divide-[#2a2a2a]">
        <FeeTile label="ECONOMY" value={mempool.feeLow} color={UI_COLORS.positive} loading={loading} />
        <FeeTile label="NORMAL" value={mempool.feeMid} color={UI_COLORS.brand} loading={loading} />
        <FeeTile label="PRIORITY" value={mempool.feeHigh} color={UI_COLORS.negative} loading={loading} />
      </div>

      {/* Data cadence badge */}
      <div className="flex-shrink-0 pb-1">
        <span className="font-mono text-white/20" style={{ fontSize: 'var(--fs-micro)' }}>
          src: mempool.space · ~30s
        </span>
      </div>
    </div>
  );
}
