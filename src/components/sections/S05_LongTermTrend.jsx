import { useEffect, useMemo, useState } from 'react';
import { fmt } from '../../utils/formatters';

const BLOCKS_PER_EPOCH = 210_000;

const defaultHalving = {
  remainingBlocks: 149504,
  progressPercent: 28.81,
  estimatedDate: new Date('2028-04-12T16:51:24Z'),
};

/* ── SVG Ring ── */
function HalvingRing({ pct, children }) {
  const SIZE = 600;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const R = 245;
  const SW = 30; // stroke width
  const circ = 2 * Math.PI * R;
  const dash = Math.min(Math.max((pct / 100) * circ, 0), circ);

  // Tick marks at 12, 3, 9 o'clock
  const tickAngle = (deg) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return {
      x1: cx + (R - SW / 2 - 6) * Math.cos(rad),
      y1: cy + (R - SW / 2 - 6) * Math.sin(rad),
      x2: cx + (R + SW / 2 + 6) * Math.cos(rad),
      y2: cy + (R + SW / 2 + 6) * Math.sin(rad),
    };
  };

  const tick12 = tickAngle(0);   // 12 o'clock (top)
  const tick3 = tickAngle(90);   // 3 o'clock (right)
  const tick9 = tickAngle(270);  // 9 o'clock (left)
  const tick6 = tickAngle(180);  // 6 o'clock (bottom)

  return (
    <div className="relative flex items-center justify-center" style={{ width: '100%', maxWidth: 'min(82vw, 68vh)' }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-full"
        style={{ aspectRatio: '1' }}
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="#252525"
          strokeWidth={SW}
        />

        {/* Progress arc (clockwise from 12 o'clock) */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="#F7931A"
          strokeWidth={SW}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="butt"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: 'drop-shadow(0 0 10px rgba(247,147,26,0.45))' }}
        />

        {/* Tick marks */}
        {[tick3, tick9, tick6].map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="#444"
            strokeWidth="2"
          />
        ))}

        {/* 12 o'clock tick (white, more prominent) */}
        <line
          x1={tick12.x1}
          y1={tick12.y1}
          x2={tick12.x2}
          y2={tick12.y2}
          stroke="#888"
          strokeWidth="2.5"
        />
      </svg>

      {/* Inner content (absolutely centered over SVG) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>

      {/* % badge at 12 o'clock (top center, above the ring) */}
      <div
        className="absolute flex items-center justify-center rounded-sm bg-[#F7931A] font-mono font-bold text-white"
        style={{
          top: '2%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 'var(--fs-heading)',
          padding: '4px 12px',
        }}
      >
        {pct.toFixed(2)}%
      </div>
    </div>
  );
}

/* ── Digit Box ── */
function DigitBox({ char }) {
  const isDigit = /\d/.test(char);
  if (!isDigit) {
    // Comma / separator
    return (
      <div
        className="flex items-end justify-center pb-1 text-white/60 font-mono font-bold"
        style={{ fontSize: 'var(--fs-hero)', minWidth: 'clamp(0.6rem, 1.5vw, 1.4rem)' }}
      >
        {char}
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center border-r border-[#3a3a3a] bg-[#1e1e24] font-mono font-bold text-white last:border-r-0 tabular-nums"
      style={{
        fontSize: 'var(--fs-hero)',
        minWidth: 'clamp(1.2rem, 3.5vw, 3.8rem)',
        padding: 'clamp(4px, 0.8vw, 10px) clamp(3px, 0.6vw, 8px)',
      }}
    >
      {char}
    </div>
  );
}

export default function S05_LongTermTrend() {
  const [halving, setHalving] = useState(defaultHalving);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('https://mempool.space/api/blocks/tip/height');
        const tipHeight = Number(await res.text());
        if (!active || !Number.isFinite(tipHeight)) return;

        const nextHalvingHeight = Math.ceil(tipHeight / BLOCKS_PER_EPOCH) * BLOCKS_PER_EPOCH;
        const remainingBlocks = Math.max(nextHalvingHeight - tipHeight, 0);
        const progressPercent = ((tipHeight % BLOCKS_PER_EPOCH) / BLOCKS_PER_EPOCH) * 100;
        const estimatedDate = new Date(Date.now() + remainingBlocks * 10 * 60 * 1000);
        setHalving({ remainingBlocks, progressPercent, estimatedDate });
      } catch {
        /* keep defaults */
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, []);

  const pct = Math.min(Math.max(halving.progressPercent, 0), 100);

  const digits = useMemo(() => {
    const str = fmt.num(halving.remainingBlocks);
    return str.split('');
  }, [halving.remainingBlocks]);

  const dateStr = halving.estimatedDate.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
  const timeStr = halving.estimatedDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#111111] py-4">
      <HalvingRing pct={pct}>
        {/* Center content */}
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center">
          {/* Label */}
          <div
            className="uppercase tracking-[0.2em] text-[#F7931A]"
            style={{ fontSize: 'var(--fs-caption)' }}
          >
            REMAINING BLOCKS
          </div>

          {/* Digit boxes */}
          <div className="flex overflow-hidden rounded border border-[#3a3a3a]">
            {digits.map((char, i) => (
              <DigitBox key={i} char={char} />
            ))}
          </div>

          {/* "NEXT HALVING" label */}
          <div
            className="mt-1 uppercase tracking-[0.2em] text-[#F7931A]"
            style={{ fontSize: 'var(--fs-caption)' }}
          >
            NEXT HALVING
          </div>

          {/* Estimated date */}
          <div
            className="font-mono text-white tabular-nums"
            style={{ fontSize: 'var(--fs-label)' }}
          >
            ≈{dateStr} {timeStr}
          </div>
        </div>
      </HalvingRing>
    </div>
  );
}
