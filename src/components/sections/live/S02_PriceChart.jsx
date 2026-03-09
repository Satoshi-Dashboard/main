import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchBtcSpot, fetchBtcHistory } from '../../../services/priceApi';
import AnimatedMetric from '../../common/AnimatedMetric';

const RANGES = [
  { label: 'LIVE', days: 1,    interval: '15m', live: true },
  { label: '1D',   days: 1,    interval: '5m' },
  { label: '1W',   days: 7,    interval: '1h' },
  { label: '1M',   days: 30,   interval: '1h' },
  { label: '3M',   days: 90,   interval: '1d' },
  { label: '1Y',   days: 365,  interval: '1d' },
  { label: '5Y',   days: 1825, interval: '1d' },
];

const RANGE_TEXT = {
  LIVE: 'Live',
  '1D':  'Past Day',
  '1W':  'Past Week',
  '1M':  'Past Month',
  '3M':  'Past 3 Months',
  '1Y':  'Past Year',
  '5Y':  'Past 5 Years',
};

/* ── Robinhood cursor: vertical line + dot on the curve ── */
function RobinhoodCursor({ points, height, lineColor }) {
  if (!points?.length) return null;
  const { x, y } = points[0];
  return (
    <g>
      <line
        x1={x} y1={0} x2={x} y2={height}
        stroke="rgba(255,255,255,0.2)" strokeWidth={1}
      />
      <circle cx={x} cy={y} r={4} fill={lineColor} stroke="#111111" strokeWidth={2} />
    </g>
  );
}

/* ── Tooltip bridge: syncs hover data to parent without re-rendering the chart ── */
function HoverBridge({ active, payload, onHover }) {
  useLayoutEffect(() => {
    if (active && payload?.[0]?.payload) {
      const p = payload[0].payload;
      if (Number.isFinite(p.price)) {
        onHover({ price: p.price, label: p.tooltipLabel });
        return;
      }
    }
    onHover(null);
  });
  return null;
}

/* ── Session cache ── */
const dataCache = {};

/* ── Memoized chart — isolated so hover state updates don't re-render it ── */
const ChartSection = memo(function ChartSection({
  chartData, showAvgLine, hasAvg, avgPrice,
  lineColor, gradId, yMin, yMax, onHoverChange,
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 6, right: 4, left: 4, bottom: 2 }}
      >
        <defs>
          <linearGradient id="s02GradGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--accent-green)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="s02GradRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--accent-red)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--accent-red)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <XAxis dataKey="ts" hide />
        <YAxis domain={[yMin, yMax]} hide />

        {showAvgLine && hasAvg && (
          <ReferenceLine
            y={avgPrice}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1.2}
            strokeDasharray="6 4"
          />
        )}

        <Tooltip
          content={(props) => <HoverBridge {...props} onHover={onHoverChange} />}
          cursor={<RobinhoodCursor lineColor={lineColor} />}
        />

        <Area
          type="monotone"
          dataKey="price"
          stroke={lineColor}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={false}
          isAnimationActive={true}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default function S02_PriceChart() {
  const [chartData, setChartData]     = useState([]);
  const [activeLabel, setActiveLabel] = useState('1W');
  const [livePrice, setLivePrice]     = useState(null);
  const [showAvgLine, setShowAvgLine] = useState(false);
  const [loading, setLoading]         = useState(true);
  const [hoverData, setHoverData]     = useState(null); // { price, label } | null
  const abortRef      = useRef(null);

  const activeRange = RANGES.find(r => r.label === activeLabel) ?? RANGES[2];

  /* ── Apply live price ── */
  const applyPrice = useCallback((newPrice) => {
    if (!Number.isFinite(newPrice) || newPrice <= 0) return;
    setLivePrice(newPrice);
  }, []);

  /* ── Spot price — poll every 10 s ── */
  useEffect(() => {
    let mounted = true;
    fetchBtcSpot().then(s => { if (s && mounted) applyPrice(s.usd); }).catch(() => {});
    const id = setInterval(() => {
      fetchBtcSpot().then(s => { if (s && mounted) applyPrice(s.usd); }).catch(() => {});
    }, 10_000);
    return () => { mounted = false; clearInterval(id); };
  }, [applyPrice]);

  /* ── Historical data ── */
  useEffect(() => {
    let active = true;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const key = `${activeLabel}_${activeRange.interval}`;
    if (dataCache[key]) {
      setChartData(dataCache[key]);
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setChartData([]);
    (async () => {
      try {
        const hist = await fetchBtcHistory(activeRange.days, activeRange.interval);
        if (!active) return;
        if (hist?.length) { dataCache[key] = hist; setChartData(hist); }
      } catch { /* keep */ } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; ctrl.abort(); };
  }, [activeLabel, activeRange.days, activeRange.interval]);

  /* ── Derived stats ── */
  const hasChart = chartData.length > 0;
  const hasPrice = livePrice !== null;

  const prices = useMemo(
    () => hasChart ? chartData.map(d => d.price).filter(Number.isFinite) : [],
    [chartData, hasChart],
  );

  const high     = hasChart ? Math.max(...prices) : null;
  const low      = hasChart ? Math.min(...prices) : null;
  const avgPrice = prices.length ? prices.reduce((s, p) => s + p, 0) / prices.length : null;
  const hasAvg   = Number.isFinite(avgPrice);

  const startPrice = hasChart ? Number(chartData[0]?.price) : null;
  const endPrice   = Number.isFinite(livePrice) && livePrice > 0
    ? livePrice
    : hasChart ? Number(chartData.at(-1)?.price) : null;

  const delta    = Number.isFinite(startPrice) && Number.isFinite(endPrice) && startPrice > 0
    ? endPrice - startPrice : null;
  const deltaPct = delta !== null && startPrice > 0
    ? (delta / startPrice) * 100 : null;

  const hasChange = Number.isFinite(delta) && Number.isFinite(deltaPct);
  const isUp      = hasChange ? delta >= 0 : true;

  const lineColor = isUp ? 'var(--accent-green)' : 'var(--accent-red)';
  const gradId    = isUp ? 's02GradGreen' : 's02GradRed';

  const yPad = hasChart ? (high - low) * 0.06 : 1;
  const yMin = hasChart ? low  - yPad : 0;
  const yMax = hasChart ? high + yPad : 1;

  const rangeText = RANGE_TEXT[activeLabel] ?? 'Past Period';

  /* ── Display values (hover overrides live) ── */
  const displayPrice = hoverData ? hoverData.price : livePrice;

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]" style={{ padding: '20px 22px 16px' }}>

      {/* ── Header ── */}
      <div className="flex flex-shrink-0 items-start justify-between gap-4">
        <div className="min-w-0">
          {!hasPrice ? (
            <>
              <div className="skeleton" style={{ width: 220, height: '2.8rem', borderRadius: 6, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: 180, height: '1rem', borderRadius: 4 }} />
            </>
          ) : (
            <>
              <div
                className="font-mono font-bold tabular-nums leading-none"
                style={{
                  fontSize: 'clamp(1.9rem, 3.8vw, 2.9rem)',
                }}
              >
                <AnimatedMetric value={displayPrice} variant="usd" decimals={2} inline />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono tabular-nums" style={{ fontSize: '0.82rem' }}>
                {hoverData ? (
                  <span className="uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {hoverData.label}
                  </span>
                ) : hasChange ? (
                  <>
                    <span style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      <AnimatedMetric value={delta} variant="usd" decimals={2} signed inline color={isUp ? 'var(--accent-green)' : 'var(--accent-red)'} />
                    </span>
                    <span style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      (<AnimatedMetric value={deltaPct} variant="percent" decimals={2} signed inline color={isUp ? 'var(--accent-green)' : 'var(--accent-red)'} />)
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.38)' }}>{rangeText}</span>
                  </>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>Loading…</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Show / Hide AVG Buy */}
        <button
          type="button"
          onClick={() => setShowAvgLine(v => !v)}
          disabled={!hasAvg}
          className="relative flex flex-shrink-0 items-center gap-1.5 pb-1.5 font-mono transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          style={{
            fontSize: '0.78rem',
            fontWeight: showAvgLine ? 700 : 400,
            color: showAvgLine ? 'white' : 'rgba(255,255,255,0.5)',
            letterSpacing: '0.05em',
          }}
        >
          {showAvgLine ? 'Hide AVG Buy' : 'Show AVG Buy'}
          {showAvgLine && (
            <span
              className="absolute bottom-0 left-0 right-0 rounded-full"
              style={{ height: 2, background: 'white' }}
            />
          )}
        </button>
      </div>

      {/* ── Chart ── */}
      <div className="min-h-0 flex-1" style={{ margin: '20px -4px 0' }}>
        {loading || !hasChart ? (
          <div className="flex h-full items-end gap-px pb-1">
            {Array.from({ length: 60 }, (_, i) => (
              <div
                key={i}
                className="skeleton flex-1"
                style={{
                  height: `${32 + Math.sin(i * 0.38) * 24 + Math.sin(i * 0.11) * 30}%`,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        ) : (
          <ChartSection
            key={activeLabel}
            chartData={chartData}
            showAvgLine={showAvgLine}
            hasAvg={hasAvg}
            avgPrice={avgPrice}
            lineColor={lineColor}
            gradId={gradId}
            yMin={yMin}
            yMax={yMax}
            onHoverChange={setHoverData}
          />
        )}
      </div>

      {/* ── Range Tabs ── */}
      <div
        className="flex-shrink-0 flex items-center gap-5 overflow-x-auto"
        style={{ margin: '14px 0 16px', paddingBottom: 2 }}
      >
        {RANGES.map(({ label, live }) => {
          const isActive = activeLabel === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveLabel(label)}
              className="relative flex flex-shrink-0 items-center gap-1.5 pb-1.5 font-mono transition-colors"
              style={{
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'white' : 'rgba(255,255,255,0.32)',
                letterSpacing: '0.05em',
              }}
            >
              {live && (
                <span
                  className="rounded-full flex-shrink-0"
                  style={{
                    width: 6,
                    height: 6,
                    background: isActive ? 'var(--accent-green)' : 'rgba(255,255,255,0.32)',
                    boxShadow: isActive ? '0 0 6px var(--accent-green)' : 'none',
                  }}
                />
              )}
              {label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 rounded-full"
                  style={{ height: 2, background: 'white' }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Stat Boxes ── */}
      <div className="flex-shrink-0 grid grid-cols-3 gap-3">
        {!hasChart || !hasPrice ? (
          [0, 1, 2].map(i => (
            <div key={i} className="rounded-xl px-3 py-3" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="skeleton mb-2" style={{ width: 40, height: '0.65rem', borderRadius: 3 }} />
              <div className="skeleton"       style={{ width: 72, height: '0.9rem',  borderRadius: 3 }} />
            </div>
          ))
        ) : (
          [
              { label: 'HIGH',    value: high,     color: 'var(--accent-green)' },
              { label: 'AVG BUY', value: hasAvg ? avgPrice : null, color: 'var(--accent-bitcoin)' },
              { label: 'LOW',     value: low,      color: 'var(--accent-red)' },
            ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl px-3 py-3 text-center"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div
                className="font-mono font-bold uppercase tracking-widest"
                style={{ fontSize: '0.62rem', color, marginBottom: 5 }}
              >
                {label}
              </div>
              <div
                className="font-mono tabular-nums font-semibold text-white"
                style={{ fontSize: '0.82rem' }}
              >
                <AnimatedMetric value={value} variant="usd" decimals={0} inline />
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
