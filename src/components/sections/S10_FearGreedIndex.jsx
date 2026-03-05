import { useEffect, useState } from 'react';

const EMPTY_DATA = {
  value: null,
  yesterday: null,
  sevenDaysAgo: null,
  thirtyDaysAgo: null,
  classification: null,
};

const SEGMENTS = [
  { from: 0,  to: 25,  color: '#b30000', label: 'EXTREME FEAR' },
  { from: 25, to: 45,  color: '#e05600', label: 'FEAR' },
  { from: 45, to: 55,  color: '#f4c430', label: 'NEUTRAL' },
  { from: 55, to: 75,  color: '#56c45a', label: 'GREED' },
  { from: 75, to: 100, color: '#1ea849', label: 'EXTREME GREED' },
];

function classify(v) {
  return SEGMENTS.find((s) => v >= s.from && v < s.to) ?? SEGMENTS[SEGMENTS.length - 1];
}

/* Arc helper: draws a semicircle segment from fromVal to toVal (0–100 scale) */
function ArcSegment({ cx, cy, r, fromVal, toVal, color, sw }) {
  const toRad = (v) => Math.PI - (v / 100) * Math.PI;
  const a1 = toRad(fromVal);
  const a2 = toRad(toVal);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy - r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy - r * Math.sin(a2);
  const large = toVal - fromVal > 50 ? 1 : 0;
  return (
    <path
      d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="butt"
    />
  );
}

/* Tick mark at a given value position */
function Tick({ cx, cy, r, v, sw }) {
  const rad = Math.PI - (v / 100) * Math.PI;
  const r1 = r - sw / 2 - 1;
  const r2 = r + sw / 2 + 1;
  return (
    <line
      x1={cx + r1 * Math.cos(rad)}
      y1={cy - r1 * Math.sin(rad)}
      x2={cx + r2 * Math.cos(rad)}
      y2={cy - r2 * Math.sin(rad)}
      stroke="#111"
      strokeWidth="2"
    />
  );
}

/* Outer label at a given value position */
function Label({ cx, cy, r, v, sw }) {
  const rad = Math.PI - (v / 100) * Math.PI;
  const lr = r + sw / 2 + 18;
  return (
    <text
      x={cx + lr * Math.cos(rad)}
      y={cy - lr * Math.sin(rad)}
      textAnchor="middle"
      dominantBaseline="middle"
      fill="#666"
      fontSize="13"
      fontFamily="JetBrains Mono, monospace"
    >
      {v}
    </text>
  );
}

/* Historical bubble */
function Bubble({ label, value }) {
  const loading = !Number.isFinite(value);
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div
          className="skeleton rounded-full"
          style={{
            width: 'clamp(40px, 6vw, 72px)',
            height: 'clamp(40px, 6vw, 72px)',
          }}
        />
        <span className="font-mono text-white/40" style={{ fontSize: 'var(--fs-micro)' }}>
          {label}
        </span>
      </div>
    );
  }

  const cls = classify(value);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center justify-center rounded-full font-mono font-bold text-white"
        style={{
          width: 'clamp(40px, 6vw, 72px)',
          height: 'clamp(40px, 6vw, 72px)',
          fontSize: 'var(--fs-section)',
          backgroundColor: cls.color,
        }}
      >
        {value}
      </div>
      <span className="font-mono text-white/40" style={{ fontSize: 'var(--fs-micro)' }}>
        {label}
      </span>
    </div>
  );
}

export default function S10_FearGreedIndex() {
  const [data, setData] = useState(EMPTY_DATA);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch('https://api.alternative.me/fng/?limit=31');
        const json = await res.json();
        if (!active || !Array.isArray(json?.data)) return;
        const e = json.data;
        const value = Number(e[0]?.value);
        const yesterday = Number(e[1]?.value);
        const sevenDaysAgo = Number(e[7]?.value);
        const thirtyDaysAgo = Number(e[30]?.value);

        setData((prev) => ({
          value: Number.isFinite(value) ? value : prev.value,
          yesterday: Number.isFinite(yesterday) ? yesterday : prev.yesterday,
          sevenDaysAgo: Number.isFinite(sevenDaysAgo) ? sevenDaysAgo : prev.sevenDaysAgo,
          thirtyDaysAgo: Number.isFinite(thirtyDaysAgo) ? thirtyDaysAgo : prev.thirtyDaysAgo,
          classification: e[0]?.value_classification || prev.classification,
        }));
      } catch { /* keep fallback */ }

    };

    load();
    const timer = setInterval(load, 60_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const { value, yesterday, sevenDaysAgo, thirtyDaysAgo, classification } = data;
  const hasMain = Number.isFinite(value);
  const cls = hasMain ? classify(value) : { color: '#555', label: 'LOADING' };
  const pct = hasMain && Number.isFinite(yesterday) && yesterday !== 0
    ? ((value - yesterday) / yesterday) * 100
    : null;
  const pctLabel = Number.isFinite(pct) ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%` : null;

  /* SVG gauge params */
  const VW = 700;
  const VH = 380;
  const cx = VW / 2;
  const cy = VH - 20;
  const R = 270;
  const SW = 32;

  /* Needle */
  const needleRad = Math.PI - (((Number.isFinite(value) ? value : 50) / 100) * Math.PI);
  const ntx = cx + (R - 16) * Math.cos(needleRad);
  const nty = cy - (R - 16) * Math.sin(needleRad);

  /* Ticks every 5 units */
  const ticks = Array.from({ length: 21 }, (_, i) => i * 5);
  /* Labels every 10 units */
  const labelVals = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#111111] py-4">
      {/* Title row */}
      <div className="flex flex-shrink-0 items-center gap-3">
        <span className="font-mono text-white/70" style={{ fontSize: 'var(--fs-section)' }}>
          Fear &amp; Greed:
        </span>
        {hasMain ? (
          <div
            className="flex items-center justify-center rounded-full font-mono font-bold text-white"
            style={{
              width: 'clamp(32px, 4vw, 52px)',
              height: 'clamp(32px, 4vw, 52px)',
              fontSize: 'var(--fs-heading)',
              backgroundColor: cls.color,
            }}
          >
            {value}
          </div>
        ) : (
          <div
            className="skeleton rounded-full"
            style={{ width: 'clamp(32px, 4vw, 52px)', height: 'clamp(32px, 4vw, 52px)' }}
          />
        )}

        {pctLabel ? (
          <span className="font-mono text-white/30" style={{ fontSize: 'var(--fs-label)' }}>
            {pctLabel}
          </span>
        ) : (
          <div className="skeleton" style={{ width: 56, height: '0.9em' }} />
        )}

        <span style={{ color: cls.color, fontSize: '1.1em' }}>{hasMain ? '■' : '·'}</span>
      </div>

      {/* SVG Gauge */}
      <div className="w-full flex-shrink-0 flex justify-center" style={{ maxWidth: 'min(95vw, 680px)' }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ overflow: 'visible' }}>
          {/* Colored arc segments */}
          {SEGMENTS.map((s) => (
            <ArcSegment key={s.from} cx={cx} cy={cy} r={R} fromVal={s.from} toVal={s.to} color={s.color} sw={SW} />
          ))}

          {/* Tick marks */}
          {ticks.map((v) => (
            <Tick key={v} cx={cx} cy={cy} r={R} v={v} sw={SW} />
          ))}

          {/* Labels */}
          {labelVals.map((v) => (
            <Label key={v} cx={cx} cy={cy} r={R} v={v} sw={SW} />
          ))}

          {/* Needle */}
          {hasMain ? (
            <>
              <line x1={cx} y1={cy} x2={ntx} y2={nty} stroke="#ccc" strokeWidth="3" strokeLinecap="round" />
              <circle cx={cx} cy={cy} r="9" fill="#888" />
            </>
          ) : (
            <circle cx={cx} cy={cy} r="9" fill="#555" />
          )}
        </svg>
      </div>

      {/* Classification */}
      <div
        className="flex-shrink-0 font-mono font-bold tracking-widest"
        style={{ color: cls.color, fontSize: 'var(--fs-section)' }}
      >
        {classification || cls.label}
      </div>

      {/* Historical bubbles */}
      <div className="flex flex-shrink-0 justify-center gap-8 pt-2 sm:gap-14">
        <Bubble label="Yesterday" value={yesterday} />
        <Bubble label="7 Days Ago" value={sevenDaysAgo} />
        <Bubble label="30 Days Ago" value={thirtyDaysAgo} />
      </div>
    </div>
  );
}
