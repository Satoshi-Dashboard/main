import { useEffect, useState } from 'react';
import { fmt } from '../../utils/formatters';

const defaultMempool = {
  size: 187,       // vMB
  count: 84312,    // pending txs
  maxSize: 300,    // vMB
  feeLow: 3,       // sat/vB
  feeMid: 8,
  feeHigh: 24,
};

/* ── Gauge Arc (SVG half-circle) ── */
function GaugeArc({ pct }) {
  const r = 120;
  const cx = 180;
  const cy = 160;
  // Half-circle arc: from left (180°) to right (0°)
  const toRad = (deg) => (deg * Math.PI) / 180;
  // SVG arc path for half-circle (from 180° to 0°, top half only)
  // Start: (cx - r, cy) → End: (cx + r, cy) through top
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  // How much of the half-circle arc to fill
  // Arc length of half-circle = π * r
  const totalArcLength = Math.PI * r;
  const filledLength = (pct / 100) * totalArcLength;

  return (
    <svg width="360" height="190" viewBox="0 0 360 190" className="w-full max-w-[420px]">
      {/* Track */}
      <path
        d={arcPath}
        fill="none"
        stroke="#2a2a2a"
        strokeWidth="18"
        strokeLinecap="round"
      />
      {/* Fill - using stroke-dasharray on the path */}
      <path
        d={arcPath}
        fill="none"
        stroke="#F7931A"
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray={`${filledLength} ${totalArcLength}`}
        style={{ filter: 'drop-shadow(0 0 8px rgba(247,147,26,0.5))' }}
      />
      {/* Percentage text inside arc */}
      <text
        x={cx}
        y={cy - 18}
        textAnchor="middle"
        fill="#F7931A"
        fontSize="42"
        fontFamily="JetBrains Mono, monospace"
        fontWeight="700"
      >
        {pct.toFixed(1)}%
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="rgba(255,255,255,0.35)"
        fontSize="18"
        fontFamily="JetBrains Mono, monospace"
        letterSpacing="3"
      >
        CAPACITY
      </text>
      {/* Min / Max labels */}
      <text x={cx - r + 4} y={cy + 30} fill="#444" fontSize="15" fontFamily="JetBrains Mono, monospace">
        0
      </text>
      <text x={cx + r - 8} y={cy + 30} textAnchor="end" fill="#444" fontSize="15" fontFamily="JetBrains Mono, monospace">
        {defaultMempool.maxSize} vMB
      </text>
    </svg>
  );
}

/* ── Fee Tile ── */
function FeeTile({ label, value, color = '#F7931A' }) {
  return (
    <div className="flex flex-col items-center gap-2 border-[#2a2a2a] px-6">
      <div
        className="font-mono font-bold tabular-nums"
        style={{ fontSize: 'var(--fs-title)', color }}
      >
        {value}
      </div>
      <div className="uppercase tracking-[0.2em] text-white/30" style={{ fontSize: 'var(--fs-tag)' }}>{label}</div>
      <div className="text-white/20 font-mono" style={{ fontSize: 'var(--fs-micro)' }}>sat/vB</div>
    </div>
  );
}

export default function S04_MempoolGauge() {
  const [mempool, setMempool] = useState(defaultMempool);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [mempoolRes, feesRes] = await Promise.all([
          fetch('https://mempool.space/api/mempool'),
          fetch('https://mempool.space/api/v1/fees/recommended'),
        ]);
        const [mem, fees] = await Promise.all([mempoolRes.json(), feesRes.json()]);
        if (!active) return;
        setMempool((prev) => ({
          ...prev,
          count: mem?.count ?? prev.count,
          size: mem?.vsize ? Math.round(mem.vsize / 1e6) : prev.size,
          feeLow: fees?.economyFee ?? prev.feeLow,
          feeMid: fees?.halfHourFee ?? prev.feeMid,
          feeHigh: fees?.fastestFee ?? prev.feeHigh,
        }));
      } catch {
        /* keep defaults */
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const pct = Math.min((mempool.size / mempool.maxSize) * 100, 100);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-[#111111] py-4">
      {/* Title */}
      <div className="text-center">
        <div
          className="font-mono font-bold uppercase tracking-[0.2em] text-[#F7931A]"
          style={{ fontSize: 'var(--fs-heading)' }}
        >
          MEMPOOL STATUS
        </div>
      </div>

      {/* Gauge */}
      <div className="flex items-center justify-center">
        <GaugeArc pct={pct} />
      </div>

      {/* Main stats */}
      <div className="flex items-center gap-8 border-t border-b border-[#2a2a2a] py-5 px-8">
        <div className="flex flex-col items-center gap-2">
          <div
            className="font-mono font-bold text-white tabular-nums"
            style={{ fontSize: 'var(--fs-title)' }}
          >
            {fmt.num(mempool.count)}
          </div>
          <div
            className="uppercase tracking-[0.18em] text-[#F7931A]"
            style={{ fontSize: 'var(--fs-label)' }}
          >
            PENDING TXS
          </div>
        </div>
        <div className="h-16 w-px bg-[#2a2a2a]" />
        <div className="flex flex-col items-center gap-2">
          <div
            className="font-mono font-bold text-white tabular-nums"
            style={{ fontSize: 'var(--fs-title)' }}
          >
            {mempool.size} <span className="text-[0.4em] text-white/50">vMB</span>
          </div>
          <div
            className="uppercase tracking-[0.18em] text-[#F7931A]"
            style={{ fontSize: 'var(--fs-label)' }}
          >
            MEMPOOL SIZE
          </div>
        </div>
      </div>

      {/* Fee row */}
      <div className="flex items-center divide-x divide-[#2a2a2a]">
        <FeeTile label="ECONOMY" value={mempool.feeLow} color="#00D897" />
        <FeeTile label="NORMAL" value={mempool.feeMid} color="#F7931A" />
        <FeeTile label="PRIORITY" value={mempool.feeHigh} color="#FF4757" />
      </div>
    </div>
  );
}
