import { useCallback, useMemo, useState } from 'react';
import {
  Area,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import { fetchBtcHistory, fetchBtcSpot } from '@/shared/services/priceApi.js';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import { ModuleShell } from '@/shared/components/module/index.js';
import {
  buildCurrentMayerSnapshot,
  buildRangeChange,
  calcularMayerMultiple,
  getMayerState,
  MAYER_EXTREME_UNDERVALUE,
  MAYER_FAIR_VALUE,
  MAYER_HISTORICAL_AVERAGE,
  MAYER_OVERVALUED,
  MAYER_SMA_WINDOW,
  sliceMayerSeriesByDays,
} from '@/shared/utils/mayerMultiple.js';

const BASE_HISTORY_DAYS = 2025;
const BASE_HISTORY_INTERVAL = '1d';
const SPOT_POLL_MS = 10_000;

const PRICE_LINE_COLOR = 'var(--accent-bitcoin)';
const MAYER_LINE_COLOR = '#7fc4ff';

const RANGES = [
  { label: '3M', days: 90 },
  { label: '1Y', days: 365 },
  { label: '5Y', days: 1825 },
];

const RANGE_TEXT = {
  '3M': 'Past 3 Months',
  '1Y': 'Past Year',
  '5Y': 'Past 5 Years',
};

const PRICE_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function formatUsd(value) {
  return Number.isFinite(value) ? PRICE_FORMATTER.format(value) : '—';
}

function formatSignedMayer(value) {
  if (!Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

function formatSignedPercent(value) {
  if (!Number.isFinite(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function MayerCursor({ points, height }) {
  const validPoints = Array.isArray(points)
    ? points.filter((point) => Number.isFinite(point?.x) && Number.isFinite(point?.y))
    : [];

  if (!validPoints.length) return null;

  const x = validPoints[0].x;

  return (
    <g>
      <line x1={x} y1={0} x2={x} y2={height} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      {validPoints.map((point, index) => (
        <circle
          key={`${point.dataKey}-${index}`}
          cx={point.x}
          cy={point.y}
          r={4}
          fill={point.dataKey === 'price' ? PRICE_LINE_COLOR : MAYER_LINE_COLOR}
          stroke="#111111"
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

function formatMayer(value) {
  return Number.isFinite(value) ? value.toFixed(2) : '—';
}

function MayerTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div
      className="rounded-xl border border-white/12 bg-[rgba(9,12,18,0.96)] px-3 py-2.5 font-mono shadow-[0_12px_28px_rgba(0,0,0,0.38)]"
      style={{ minWidth: 188 }}
    >
      <div className="text-[11px] uppercase tracking-[0.14em] text-white/55">
        {point.tooltipLabel || 'Daily candle'}
      </div>
      <div className="mt-2 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-white/55">BTC Price</span>
          <span style={{ color: PRICE_LINE_COLOR }}>{formatUsd(point.price)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-white/55">Mayer Multiple</span>
          <span style={{ color: MAYER_LINE_COLOR }}>{formatMayer(point.mayerMultiple)}</span>
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, range, active, color }) {
  return (
    <div
      className="rounded-xl px-3 py-3 text-center"
      style={{
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        boxShadow: active ? `0 0 0 1px ${color} inset` : 'none',
      }}
    >
      <div
        className="font-mono font-bold uppercase tracking-widest"
        style={{ fontSize: '0.62rem', color, marginBottom: 5 }}
      >
        {label}
      </div>
      <div className="font-mono tabular-nums font-semibold text-white" style={{ fontSize: '0.82rem' }}>
        {range}
      </div>
    </div>
  );
}

function WarningPanel({ title, description }) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center px-5 py-6 text-center">
      <div className="max-w-md font-mono">
        <div style={{ color: 'var(--accent-warning)', fontSize: 'var(--fs-label)', fontWeight: 700 }}>
          {title}
        </div>
        <div className="mt-3 text-white/60" style={{ fontSize: 'var(--fs-caption)', lineHeight: 1.65 }}>
          {description}
        </div>
      </div>
    </div>
  );
}

export default function S16_MayerMultiple() {
  const [activeLabel, setActiveLabel] = useState('1Y');
  const [hoverData, setHoverData] = useState(null);
  const [showZones, setShowZones] = useState(false);

  const fetchHistory = useCallback(
    () => fetchBtcHistory(BASE_HISTORY_DAYS, BASE_HISTORY_INTERVAL),
    [],
  );

  const { data: historyData, loading, error: historyError } = useModuleData(fetchHistory, {
    initialData: [],
    keepPreviousOnError: false,
    transform: (raw) => (raw?.length ? raw : []),
  });

  const loadError = historyError
    ? 'Could not load daily Bitcoin history from the shared price feed.'
    : (!loading && historyData.length === 0 ? 'Could not load daily Bitcoin history from the shared price feed.' : '');

  const fetchSpot = useCallback(async () => {
    const spot = await fetchBtcSpot();
    if (Number.isFinite(spot?.usd) && spot.usd > 0) return spot.usd;
    throw new Error('Invalid spot');
  }, []);

  const { data: liveSpot } = useModuleData(fetchSpot, {
    refreshMs: SPOT_POLL_MS,
    initialData: null,
    keepPreviousOnError: true,
  });

  const mayerSeries = useMemo(() => calcularMayerMultiple(historyData), [historyData]);
  const activeRange = RANGES.find((range) => range.label === activeLabel) ?? RANGES[1];

  const chartData = useMemo(
    () => sliceMayerSeriesByDays(mayerSeries, activeRange.days)
      .filter((point) => Number.isFinite(point?.mayerMultiple)),
    [activeRange.days, mayerSeries],
  );

  const currentSnapshot = useMemo(
    () => buildCurrentMayerSnapshot(mayerSeries, liveSpot),
    [liveSpot, mayerSeries],
  );

  const rangeChange = useMemo(
    () => buildRangeChange(currentSnapshot.currentMayerMultiple, chartData),
    [currentSnapshot.currentMayerMultiple, chartData],
  );

  const hasEnoughData = historyData.length >= MAYER_SMA_WINDOW && chartData.length > 1;
  const currentState = currentSnapshot.state || getMayerState(null);
  const displayValue = hoverData?.mayerMultiple ?? currentSnapshot.currentMayerMultiple;
  const displayState = hoverData ? getMayerState(hoverData.mayerMultiple) : currentState;
  const showHoverLabel = Boolean(hoverData?.label);
  const hasRangeChange = Number.isFinite(rangeChange.absolute) && Number.isFinite(rangeChange.percent);

  const prices = useMemo(
    () => chartData.map((point) => point.price).filter(Number.isFinite),
    [chartData],
  );

  const priceHigh = prices.length ? Math.max(...prices) : null;
  const priceLow = prices.length ? Math.min(...prices) : null;
  const pricePad = priceHigh !== null && priceLow !== null ? Math.max((priceHigh - priceLow) * 0.06, 1) : 1;
  const priceYMin = priceLow !== null ? Math.max(0, priceLow - pricePad) : 0;
  const priceYMax = priceHigh !== null ? priceHigh + pricePad : 1;

  const mayerValues = useMemo(
    () => chartData.map((point) => point.mayerMultiple).filter(Number.isFinite),
    [chartData],
  );

  const mayerHigh = mayerValues.length ? Math.max(...mayerValues) : null;
  const mayerLow = mayerValues.length ? Math.min(...mayerValues) : null;
  const mayerYMin = mayerLow !== null ? Math.max(0, Math.min(0.6, mayerLow - 0.12)) : 0;
  const mayerYMax = mayerHigh !== null ? Math.max(2.8, mayerHigh + 0.18) : 2.8;

  return (
    <ModuleShell className="px-3.5 pb-3.5 pt-4 sm:px-5 sm:pb-4 sm:pt-5 lg:px-[22px] lg:pb-4 lg:pt-5">
      <div className="flex flex-shrink-0 flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div className="min-w-0">
          {loading ? (
            <>
              <div className="skeleton" style={{ width: 220, height: '2.8rem', borderRadius: 6, marginBottom: 10 }} />
              <div className="skeleton" style={{ width: 180, height: '1rem', borderRadius: 4 }} />
            </>
          ) : (
            <>
              <div className="font-mono font-bold lg:hidden" style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-subtitle)' }}>
                Mayer Multiple
              </div>

              <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1.5 font-mono tabular-nums leading-none">
                <div style={{ fontSize: 'clamp(1.55rem, 5.6vw, 2.9rem)', color: displayState.color }}>
                  <AnimatedMetric value={displayValue} variant="number" decimals={2} inline color={displayState.color} />
                </div>

                <div className="pb-1" style={{ fontSize: '0.82rem' }}>
                  {showHoverLabel ? (
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{hoverData.label}</span>
                  ) : hasRangeChange ? (
                    <>
                      <span style={{ color: rangeChange.absolute >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                        {formatSignedMayer(rangeChange.absolute)} ({formatSignedPercent(rangeChange.percent)})
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.38)', marginLeft: 8 }}>{RANGE_TEXT[activeLabel] || 'Past Year'}</span>
                    </>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.25)' }}>Loading...</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowZones((value) => !value)}
          disabled={!hasEnoughData}
          className="relative flex flex-shrink-0 items-center gap-1.5 self-start pb-1.5 font-mono transition-colors disabled:cursor-not-allowed disabled:opacity-25"
          style={{
            fontSize: '0.78rem',
            fontWeight: showZones ? 700 : 400,
            color: showZones ? 'white' : 'rgba(255,255,255,0.5)',
            letterSpacing: '0.05em',
          }}
        >
          {showZones ? 'Hide Zones' : 'Show Zones'}
          {showZones ? (
            <span className="absolute bottom-0 left-0 right-0 rounded-full" style={{ height: 2, background: 'white' }} />
          ) : null}
        </button>
      </div>

      <div className="min-h-0 flex-1" style={{ margin: '20px -4px 0' }}>
        {loading ? (
          <div className="flex h-full items-end gap-px pb-1">
            {Array.from({ length: 60 }, (_, index) => (
              <div
                key={index}
                className="skeleton flex-1"
                style={{
                  height: `${32 + Math.sin(index * 0.38) * 24 + Math.sin(index * 0.11) * 30}%`,
                  borderRadius: 2,
                }}
              />
            ))}
          </div>
        ) : loadError ? (
          <WarningPanel title="History feed unavailable" description={loadError} />
        ) : !hasEnoughData ? (
          <WarningPanel
            title="Need at least 200 daily candles"
            description="The Mayer Multiple depends on a full 200-day simple moving average. This preview waits for enough daily price points before drawing the indicator so the chart stays honest and readable."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 6, right: 4, left: 4, bottom: 2 }}
              onMouseMove={(e) => {
                const point = e?.activePayload?.[0]?.payload;
                if (Number.isFinite(point?.mayerMultiple)) {
                  setHoverData({ mayerMultiple: point.mayerMultiple, label: point.tooltipLabel });
                }
              }}
              onMouseLeave={() => setHoverData(null)}
            >
              <defs>
                <linearGradient id="s16PriceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-bitcoin)" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="var(--accent-bitcoin)" stopOpacity="0" />
                </linearGradient>
              </defs>

              <XAxis dataKey="ts" hide />
              <YAxis yAxisId="price" domain={[priceYMin, priceYMax]} hide />
              <YAxis yAxisId="mayer" orientation="right" domain={[mayerYMin, mayerYMax]} hide />

              {showZones ? (
                <>
                  <ReferenceArea yAxisId="mayer" y1={mayerYMin} y2={MAYER_EXTREME_UNDERVALUE} fill="rgba(0,216,151,0.10)" />
                  <ReferenceArea yAxisId="mayer" y1={MAYER_EXTREME_UNDERVALUE} y2={MAYER_OVERVALUED} fill="rgba(255,215,0,0.05)" />
                  <ReferenceArea yAxisId="mayer" y1={MAYER_OVERVALUED} y2={mayerYMax} fill="rgba(255,71,87,0.10)" />
                  <ReferenceLine yAxisId="mayer" y={MAYER_EXTREME_UNDERVALUE} stroke="rgba(0,216,151,0.45)" strokeDasharray="6 4" />
                  <ReferenceLine yAxisId="mayer" y={MAYER_FAIR_VALUE} stroke="rgba(255,255,255,0.42)" strokeDasharray="6 4" />
                  <ReferenceLine yAxisId="mayer" y={MAYER_HISTORICAL_AVERAGE} stroke="rgba(127,196,255,0.75)" strokeDasharray="5 4" />
                  <ReferenceLine yAxisId="mayer" y={MAYER_OVERVALUED} stroke="rgba(255,71,87,0.52)" strokeDasharray="6 4" />
                </>
              ) : null}

              <Tooltip
                content={MayerTooltip}
                cursor={<MayerCursor />}
              />

              <Area
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke={PRICE_LINE_COLOR}
                strokeWidth={2}
                fill="url(#s16PriceFill)"
                dot={false}
                activeDot={false}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />

              <Line
                yAxisId="mayer"
                type="monotone"
                dataKey="mayerMultiple"
                stroke={MAYER_LINE_COLOR}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive
                animationDuration={700}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
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
              className="relative flex flex-shrink-0 items-center gap-1.5 pb-1.5 font-mono transition-colors"
              style={{
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'white' : 'rgba(255,255,255,0.32)',
                letterSpacing: '0.05em',
              }}
            >
              {label}
              {isActive ? (
                <span className="absolute bottom-0 left-0 right-0 rounded-full" style={{ height: 2, background: 'white' }} />
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex-shrink-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatusCard label="Overvalued" range="> 2.40" active={currentState.key === 'overvalued'} color="var(--accent-red)" />
        <StatusCard label="Neutral" range="1.00 - 2.40" active={currentState.key === 'neutral'} color="var(--accent-warning)" />
        <StatusCard label="Undervalued" range="< 1.00" active={currentState.key === 'undervalued'} color="var(--accent-green)" />
      </div>
    </ModuleShell>
  );
}

