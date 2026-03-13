import { memo, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import { fetchJson } from '@/shared/lib/api.js';

const DAY_MS = 86_400_000;

const RANGES = [
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'MAX', days: Infinity },
];
let lastBtcVsGoldPayload = null;

const RANGE_TEXT = {
  '3M': 'Past 3 Months',
  '6M': 'Past 6 Months',
  '1Y': 'Past Year',
  'MAX': 'All Available History',
};

function ComparisonCursor({ points, height }) {
  if (!points?.length) return null;

  const x = points[0]?.x;
  if (!Number.isFinite(x)) return null;

  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={height} stroke="rgba(255,255,255,0.16)" strokeWidth={1} />
      {points.map((point, index) => (
        <circle
          key={`${point.dataKey}-${index}`}
          cx={point.x}
          cy={point.y}
          r={index === 0 ? 4 : 3.5}
          fill={point.dataKey === 'bitcoin' ? 'var(--accent-bitcoin)' : 'rgba(214,214,214,0.95)'}
          stroke="#111111"
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

function HoverBridge({ active, payload, onHover }) {
  useLayoutEffect(() => {
    if (active && payload?.[0]?.payload) {
      onHover(payload[0].payload);
      return;
    }
    onHover(null);
  });

  return null;
}

const ChartSection = memo(function ChartSection({ chartData, showGold, yMin, yMax, onHoverChange }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 6, right: 4, left: 4, bottom: 2 }}>
        <defs>
          <linearGradient id="s15BtcFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-bitcoin)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--accent-bitcoin)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="s15GoldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(210,210,210,0.4)" stopOpacity="0.26" />
            <stop offset="100%" stopColor="rgba(210,210,210,0.22)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <XAxis dataKey="ts" hide />
        <YAxis domain={[yMin, yMax]} hide />

        <Tooltip
          content={(props) => <HoverBridge {...props} onHover={onHoverChange} />}
          cursor={<ComparisonCursor />}
        />

        {showGold ? (
          <Area
            type="monotone"
            dataKey="gold"
            stroke="rgba(214,214,214,0.92)"
            strokeWidth={2}
            fill="url(#s15GoldFill)"
            dot={false}
            activeDot={false}
            isAnimationActive
            animationDuration={650}
            animationEasing="ease-out"
          />
        ) : null}

        <Area
          type="monotone"
          dataKey="bitcoin"
          stroke="var(--accent-bitcoin)"
          strokeWidth={2.3}
          fill="url(#s15BtcFill)"
          dot={false}
          activeDot={false}
          isAnimationActive
          animationDuration={700}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

function MetricBox({ label, value, decimals = 2, color = 'var(--text-primary)', suffix = 'T' }) {
  return (
    <div className="rounded-xl border border-white/10 px-3 py-3 text-center">
      <div
        className="font-mono font-bold uppercase tracking-widest"
        style={{ fontSize: '0.62rem', color, marginBottom: 5 }}
      >
        {label}
      </div>
      <div className="font-mono tabular-nums font-semibold text-white" style={{ fontSize: '0.82rem' }}>
        <AnimatedMetric value={value} variant="number" decimals={decimals} prefix="$" suffix={suffix} inline />
      </div>
    </div>
  );
}

function MetricPlaceholder({ label, message = 'Unavailable', color = 'rgba(255,255,255,0.45)' }) {
  return (
    <div className="rounded-xl border border-white/10 px-3 py-3 text-center">
      <div
        className="font-mono font-bold uppercase tracking-widest"
        style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)', marginBottom: 5 }}
      >
        {label}
      </div>
      <div className="font-mono font-semibold" style={{ fontSize: '0.82rem', color }}>
        {message}
      </div>
    </div>
  );
}

export default function S15_BTCvsGold() {
  const [payload, setPayload] = useState(() => lastBtcVsGoldPayload);
  const [activeLabel, setActiveLabel] = useState('1Y');
  const [loading, setLoading] = useState(() => !lastBtcVsGoldPayload);
  const [hoverData, setHoverData] = useState(null);
  const [showGold, setShowGold] = useState(true);
  const [error, setError] = useState(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const nextPayload = await fetchJson('/api/s15/btc-vs-gold-market-cap', { timeout: 8000 });
        if (active) {
          lastBtcVsGoldPayload = nextPayload;
          setPayload(nextPayload);
          setError(null);
        }
      } catch {
        if (active) {
          setPayload((current) => current);
          setError('Live comparison is temporarily unavailable while the gold market-cap snapshot is missing.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [requestKey]);

  const points = useMemo(() => payload?.data?.points || [], [payload]);
  const activeRange = RANGES.find((range) => range.label === activeLabel) ?? RANGES.at(-1);

  const chartData = useMemo(() => {
    if (!points.length) return [];
    if (!Number.isFinite(activeRange.days)) return points;
    const lastTs = Number(points.at(-1)?.ts);
    if (!Number.isFinite(lastTs)) return points;
    const cutoff = lastTs - activeRange.days * DAY_MS;
    return points.filter((point) => Number(point.ts) >= cutoff);
  }, [activeRange.days, points]);

  const hasChart = chartData.length > 1;
  const latestPoint = chartData.at(-1) || payload?.data?.latest || null;
  const startPoint = chartData[0] || null;
  const hoveredPoint = hoverData || latestPoint;
  const showUnavailableState = !loading && !latestPoint;

  const btcDelta = Number.isFinite(startPoint?.bitcoin) && Number.isFinite(latestPoint?.bitcoin)
    ? latestPoint.bitcoin - startPoint.bitcoin
    : null;
  const btcDeltaPct = Number.isFinite(startPoint?.bitcoin) && startPoint.bitcoin > 0 && Number.isFinite(latestPoint?.bitcoin)
    ? ((latestPoint.bitcoin - startPoint.bitcoin) / startPoint.bitcoin) * 100
    : null;
  const hasDelta = Number.isFinite(btcDelta) && Number.isFinite(btcDeltaPct);
  const isUp = hasDelta ? btcDelta >= 0 : true;

  const values = useMemo(() => {
    if (!chartData.length) return [];
    return chartData.flatMap((point) => (showGold ? [point.bitcoin, point.gold] : [point.bitcoin])).filter(Number.isFinite);
  }, [chartData, showGold]);

  const high = values.length ? Math.max(...values) : null;
  const low = values.length ? Math.min(...values) : null;
  const yPad = high !== null && low !== null ? Math.max((high - low) * 0.08, 0.8) : 1;
  const yMin = low !== null ? Math.max(0, low - yPad) : 0;
  const yMax = high !== null ? high + yPad : 1;

  const rangeText = RANGE_TEXT[activeLabel] ?? 'Past Year';
  const updatedLabel = payload?.updated_at
    ? new Date(payload.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const handleRetry = () => {
    setHoverData(null);
    setError(null);
    setLoading(true);
    setRequestKey((current) => current + 1);
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#111111] px-3.5 pb-3.5 pt-4 sm:px-5 sm:pb-4 sm:pt-5 lg:px-[22px] lg:pb-4 lg:pt-5">
      <div className="flex flex-shrink-0 flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="min-w-0 flex-1">
          {!loading && hoveredPoint ? (
            <>
              {/* Dual market cap hero — flex row */}
              <div className="flex min-w-0 items-start gap-3 sm:gap-5">
                {/* BTC market cap */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 font-mono text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-bitcoin)' }}>
                    Bitcoin
                  </div>
                  <div className="flex min-h-[2.8rem] max-w-full items-center font-mono font-bold tabular-nums leading-none" style={{ fontSize: 'clamp(1.25rem, 4.5vw, 2.4rem)' }}>
                    <AnimatedMetric value={hoveredPoint.bitcoin} variant="number" decimals={2} prefix="$" suffix="T" inline />
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-5 w-px self-stretch opacity-20" style={{ background: 'white' }} />

                {/* Gold market cap */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 font-mono text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: 'rgba(214,214,214,0.72)' }}>
                    Gold
                  </div>
                  <div className="flex min-h-[2.8rem] max-w-full items-center font-mono font-bold tabular-nums leading-none" style={{ fontSize: 'clamp(1.25rem, 4.5vw, 2.4rem)', color: 'rgba(214,214,214,0.95)' }}>
                    <AnimatedMetric value={hoveredPoint.gold} variant="number" decimals={2} prefix="$" suffix="T" inline color="rgba(214,214,214,0.95)" />
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-mono tabular-nums" style={{ fontSize: '0.82rem' }}>
                {hoverData ? (
                  <span className="uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>{hoveredPoint.date}</span>
                ) : hasDelta ? (
                  <>
                    <span style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      <AnimatedMetric value={btcDelta} variant="number" decimals={2} prefix="$" suffix="T" signed inline color={isUp ? 'var(--accent-green)' : 'var(--accent-red)'} />
                    </span>
                    <span style={{ color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                      (<AnimatedMetric value={btcDeltaPct} variant="percent" decimals={2} signed inline color={isUp ? 'var(--accent-green)' : 'var(--accent-red)'} />)
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.38)' }}>{rangeText}</span>
                  </>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>Loading...</span>
                )}
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-secondary)' }}>
                {latestPoint ? (
                  <>
                    <span>BTC = <AnimatedMetric value={latestPoint.ratio} variant="percent" decimals={2} inline color="var(--accent-bitcoin)" /> of gold</span>
                    {updatedLabel ? <><span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" /><span>Synced {updatedLabel}</span></> : null}
                    {payload?.data?.gold_reference === 'current_market_cap_snapshot' ? <><span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" /><span>Gold line uses current market cap snapshot</span></> : null}
                  </>
                ) : null}
              </div>

              {error ? (
                <div className="mt-2 font-mono" style={{ fontSize: '0.72rem', color: 'var(--accent-red)' }}>
                  {error}
                </div>
              ) : null}
            </>
          ) : showUnavailableState ? (
            <>
              <div className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent-red)' }}>
                Live comparison unavailable
              </div>
              <div
                className="mt-2 max-w-2xl font-mono leading-relaxed text-white/70"
                style={{ fontSize: '0.8rem' }}
              >
                The BTC vs Gold chart needs the current gold market-cap snapshot. The module stays visible and will recover automatically when the upstream source responds again.
              </div>
              {error ? (
                <div className="mt-2 font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                  {error}
                </div>
              ) : null}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-full border border-white/12 px-3 py-1.5 font-mono uppercase tracking-[0.16em] text-white transition-colors hover:border-white/25 hover:bg-white/5"
                  style={{ fontSize: '0.68rem' }}
                >
                  Retry
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 sm:gap-5">
                <div className="flex-1">
                  <div className="skeleton mb-2" style={{ width: 36, height: '0.6rem', borderRadius: 3 }} />
                  <div className="skeleton" style={{ width: 'min(140px, 42vw)', height: '2.4rem', borderRadius: 6 }} />
                </div>
                <div className="mt-4 w-px self-stretch opacity-10" style={{ background: 'white' }} />
                <div className="flex-1">
                  <div className="skeleton mb-2" style={{ width: 30, height: '0.6rem', borderRadius: 3 }} />
                  <div className="skeleton" style={{ width: 'min(140px, 42vw)', height: '2.4rem', borderRadius: 6 }} />
                </div>
              </div>
              <div className="skeleton mt-3" style={{ width: 180, height: '1rem', borderRadius: 4 }} />
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowGold((value) => !value)}
          disabled={!hasChart}
          className="relative flex w-full flex-shrink-0 items-center justify-end gap-1.5 self-start pb-1.5 font-mono transition-colors disabled:cursor-not-allowed disabled:opacity-25 sm:w-auto sm:justify-start"
          style={{
            fontSize: '0.78rem',
            fontWeight: showGold ? 700 : 400,
            color: showGold ? 'white' : 'rgba(255,255,255,0.5)',
            letterSpacing: '0.05em',
          }}
        >
          {showGold ? 'Hide Gold' : 'Show Gold'}
          {showGold ? <span className="absolute bottom-0 left-0 right-0 rounded-full" style={{ height: 2, background: 'white' }} /> : null}
        </button>
      </div>

      <div className="min-h-0 flex-1" style={{ margin: '20px -4px 0' }}>
        {hasChart ? (
          <ChartSection chartData={chartData} showGold={showGold} yMin={yMin} yMax={yMax} onHoverChange={setHoverData} />
        ) : showUnavailableState ? (
          <div className="flex h-full min-h-[220px] items-center justify-center px-2 pb-1">
            <div className="flex w-full max-w-2xl flex-col items-center rounded-2xl border border-white/10 bg-[#0d0d0d] px-6 py-7 text-center">
              <div
                className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em]"
                style={{ color: 'var(--accent-red)' }}
              >
                Waiting for gold market-cap snapshot
              </div>
              <div className="mt-3 font-mono leading-relaxed text-white/70" style={{ fontSize: '0.82rem' }}>
                Binance BTC history is available locally, but the current gold market-cap reference did not arrive from the approved upstream source.
              </div>
              <div className="mt-2 font-mono text-white/50" style={{ fontSize: '0.74rem' }}>
                No fake fallback is shown here so the comparison stays honest.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-end gap-px pb-1">
            {Array.from({ length: 42 }, (_, index) => (
              <div
                key={index}
                className="skeleton flex-1"
                style={{
                  height: `${28 + Math.sin(index * 0.42) * 18 + Math.sin(index * 0.16) * 26}%`,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-5 overflow-x-auto" style={{ margin: '14px 0 16px', paddingBottom: 2 }}>
        {RANGES.map(({ label }) => {
          const isActive = activeLabel === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveLabel(label)}
              disabled={!hasChart}
              className="relative flex flex-shrink-0 items-center gap-1.5 pb-1.5 font-mono transition-colors"
              style={{
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 400,
                color: !hasChart ? 'rgba(255,255,255,0.18)' : isActive ? 'white' : 'rgba(255,255,255,0.32)',
                letterSpacing: '0.05em',
              }}
            >
              {label}
              {hasChart && isActive ? <span className="absolute bottom-0 left-0 right-0 rounded-full" style={{ height: 2, background: 'white' }} /> : null}
            </button>
          );
        })}
      </div>

      <div className="flex-shrink-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {latestPoint ? (
          <>
            <MetricBox label="BTC HIGH" value={Math.max(...chartData.map((point) => point.bitcoin))} color="var(--accent-bitcoin)" />
            <MetricBox label="GOLD REF" value={latestPoint.gold} color="rgba(214,214,214,0.9)" />
            <div className="rounded-xl border border-white/10 px-3 py-3 text-center">
              <div className="font-mono font-bold uppercase tracking-widest" style={{ fontSize: '0.62rem', color: 'var(--accent-green)', marginBottom: 5 }}>
                BTC / GOLD
              </div>
              <div className="font-mono tabular-nums font-semibold text-white" style={{ fontSize: '0.82rem' }}>
                <AnimatedMetric value={latestPoint.ratio} variant="percent" decimals={2} inline />
              </div>
            </div>
          </>
        ) : showUnavailableState ? (
          <>
            <MetricPlaceholder label="BTC HIGH" />
            <MetricPlaceholder label="GOLD REF" message="Waiting for source" />
            <MetricPlaceholder label="BTC / GOLD" message="Needs live gold ref" color="rgba(255,255,255,0.38)" />
          </>
        ) : (
          [0, 1, 2].map((index) => (
            <div key={index} className="rounded-xl px-3 py-3" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="skeleton mb-2" style={{ width: 40, height: '0.65rem', borderRadius: 3 }} />
              <div className="skeleton" style={{ width: 72, height: '0.9rem', borderRadius: 3 }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
