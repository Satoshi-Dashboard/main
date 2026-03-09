import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmt } from '../../../utils/formatters';
import { fetchBtcSpot, fetchBtcHistory } from '../../../services/priceApi';

const RANGES = [
  { label: '24H', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  positive: 'var(--accent-green)',
  negative: 'var(--accent-red)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  border: 'rgba(255,255,255,0.08)',
  grid: 'rgba(255,255,255,0.06)',
  panel: 'rgba(255,255,255,0.03)',
};

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { tooltipLabel, price } = payload[0].payload;
  return (
    <div
      className="rounded bg-[#111111]/95 px-3 py-2 text-xs font-mono shadow-xl"
      style={{ border: '1px solid color-mix(in srgb, var(--accent-bitcoin) 38%, transparent)' }}
    >
      <div className="text-white/50">{tooltipLabel}</div>
      <div className="font-bold text-sm" style={{ color: UI_COLORS.brand }}>{fmt.usd(price, 0)}</div>
    </div>
  );
}

// Cache to avoid re-fetching the same range twice in a session
const dataCache = {};

export default function S02_PriceChart() {
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState(1);
  const [livePrice, setLivePrice] = useState(null);
  const [showAverageLine, setShowAverageLine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const abortRef = useRef(null);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Fetch live price once on mount */
  useEffect(() => {
    fetchBtcSpot().then(spot => {
      if (spot) {
        setLivePrice(spot.usd);
      }
    }).catch(() => {});
  }, []);

  /* Fetch historical data from Binance per selected range */
  useEffect(() => {
    let active = true;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    if (dataCache[range]) {
      setChartData(dataCache[range]);
      setLoading(false);
      return () => { active = false; ctrl.abort(); };
    }

    setLoading(true);
    setChartData([]);
    (async () => {
      try {
        const hist = await fetchBtcHistory(range);
        if (!active) return;
        if (hist?.length) {
          dataCache[range] = hist;
          setChartData(hist);
        }
      } catch {
        /* keep previous chart data */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      ctrl.abort();
    };
  }, [range]);

  /* Derived stats — only when data is available */
  const hasChart = chartData.length > 0;
  const hasPrice = livePrice !== null;
  const activeRange = RANGES.find(({ days }) => days === range) ?? RANGES[0];
  const prices = useMemo(
    () => (hasChart ? chartData.map((d) => d.price).filter((price) => Number.isFinite(price)) : []),
    [chartData, hasChart],
  );
  const high = hasChart ? Math.max(...prices) : null;
  const low  = hasChart ? Math.min(...prices) : null;
  const averagePrice = prices.length
    ? prices.reduce((sum, price) => sum + price, 0) / prices.length
    : null;
  const rangeStartPrice = hasChart ? Number(chartData[0]?.price) : null;
  const rangeEndPrice = Number.isFinite(livePrice) && livePrice > 0
    ? livePrice
    : hasChart
      ? Number(chartData[chartData.length - 1]?.price)
      : null;
  const rangeChange = Number.isFinite(rangeStartPrice) && Number.isFinite(rangeEndPrice) && rangeStartPrice > 0
    ? ((rangeEndPrice - rangeStartPrice) / rangeStartPrice) * 100
    : null;
  const hasAveragePrice = Number.isFinite(averagePrice);
  const hasRangeChange = Number.isFinite(rangeChange);
  const isUp = hasRangeChange ? rangeChange >= 0 : true;

  const yMin = hasChart ? low * 0.98 : 0;
  const yMax = hasChart ? high * 1.02 : 1;
  const isTablet = viewportWidth < 1024;
  const isPhone = viewportWidth < 640;
  const isTinyPhone = viewportWidth < 480;

  const axisLabelMap = useMemo(
    () => new Map(chartData.map((point) => [point.ts, point.axisLabel])),
    [chartData],
  );

  const xTicks = useMemo(() => {
    if (!hasChart) return [];

    const targetTicks = isTinyPhone ? 4 : isPhone ? 5 : isTablet ? 6 : 7;
    const step = Math.max(1, Math.floor((chartData.length - 1) / Math.max(1, targetTicks - 1)));
    const ticks = chartData
      .filter((_, index) => index === 0 || index === chartData.length - 1 || index % step === 0)
      .map((point) => point.ts);

    return [...new Set(ticks)];
  }, [chartData, hasChart, isPhone, isTablet, isTinyPhone]);

  const statItems = [
    { label: 'HIGH', value: fmt.usd(high, 0), color: UI_COLORS.positive },
    { label: 'AVG BUY', value: hasAveragePrice ? fmt.usd(averagePrice, 0) : '—', color: UI_COLORS.brand },
    { label: 'LOW', value: fmt.usd(low, 0), color: UI_COLORS.negative },
  ];

  const changeBorder = isUp ? UI_COLORS.positive : UI_COLORS.negative;
  const changeBorderColor = isUp
    ? 'color-mix(in srgb, var(--accent-green) 42%, transparent)'
    : 'color-mix(in srgb, var(--accent-red) 42%, transparent)';
  const changeBackground = `color-mix(in srgb, ${changeBorder} 18%, transparent)`;

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* ── Price Header ── */}
      <div className="flex flex-shrink-0 flex-col items-center justify-center gap-2 px-3 py-3 text-center sm:flex-row sm:flex-wrap sm:gap-3 sm:py-4">
        {!hasPrice ? (
          <>
            <div className="skeleton" style={{ width: 12, height: 12, borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: 160, height: '2em' }} />
            <div className="skeleton" style={{ width: 90, height: '1.4em' }} />
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-3">
              <div
                className="h-3 w-3 rounded-full shadow-lg"
                style={{
                  backgroundColor: isUp ? UI_COLORS.positive : UI_COLORS.negative,
                  boxShadow: `0 0 8px ${isUp ? UI_COLORS.positive : UI_COLORS.negative}`,
                }}
              />
              <span
                className="font-mono font-bold text-white tabular-nums"
                style={{ fontSize: 'var(--fs-hero)' }}
              >
                {fmt.usd(livePrice, 0)}
              </span>
            </div>
            <span
              className="rounded-full border px-3 py-1 font-mono font-bold tabular-nums"
              style={{
                fontSize: 'var(--fs-caption)',
                color: changeBorder,
                borderColor: changeBorderColor,
                background: changeBackground,
              }}
            >
              {hasRangeChange ? `${isUp ? '+' : ''}${rangeChange.toFixed(2)}% ${activeRange.label} ${isUp ? '▲' : '▼'}` : '...'}
            </span>
          </>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-shrink-0 flex-col gap-3 border-y px-3 py-3 sm:px-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: UI_COLORS.border }}>
        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          <span className="uppercase tracking-[0.28em]" style={{ fontSize: 'var(--fs-tag)', color: UI_COLORS.textSecondary }}>
            Range
          </span>
          <span
            className="rounded-full border px-2.5 py-1 font-mono font-bold uppercase tracking-[0.24em]"
            style={{
              fontSize: 'var(--fs-tag)',
              color: UI_COLORS.textPrimary,
              borderColor: UI_COLORS.border,
              background: UI_COLORS.panel,
            }}
          >
            {activeRange.label}
          </span>
          <span
            className="rounded-full border px-2.5 py-1 font-mono tabular-nums"
            style={{
              fontSize: 'var(--fs-tag)',
              color: hasAveragePrice ? UI_COLORS.brand : UI_COLORS.textSecondary,
              borderColor: hasAveragePrice ? 'color-mix(in srgb, var(--accent-bitcoin) 28%, transparent)' : UI_COLORS.border,
              background: hasAveragePrice ? 'color-mix(in srgb, var(--accent-bitcoin) 14%, transparent)' : UI_COLORS.panel,
            }}
          >
            {hasAveragePrice ? `Avg Buy ${fmt.usd(averagePrice, 0)}` : 'Avg Buy --'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
          {RANGES.map(({ label, days }) => (
            <button
              key={label}
              type="button"
              onClick={() => setRange(days)}
              style={{
                fontSize: 'var(--fs-tag)',
                color: range === days ? UI_COLORS.brand : 'rgba(255,255,255,0.42)',
                background: range === days ? 'color-mix(in srgb, var(--accent-bitcoin) 18%, transparent)' : UI_COLORS.panel,
                border: range === days ? '1px solid color-mix(in srgb, var(--accent-bitcoin) 38%, transparent)' : `1px solid ${UI_COLORS.border}`,
              }}
              className="min-w-[58px] rounded-full px-3 py-1.5 font-mono uppercase tracking-widest whitespace-nowrap transition hover:text-white/80"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chart or Skeleton ── */}
      <div className="min-h-0 flex-1">
        <div className="flex h-full min-h-0 flex-col md:flex-row">
          <div
            className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-3 py-3 md:w-[148px] md:flex-col md:items-stretch md:justify-center md:border-b-0 md:border-r"
            style={{ borderColor: UI_COLORS.border, background: 'rgba(255,255,255,0.02)' }}
          >
            <button
              type="button"
              onClick={() => setShowAverageLine((value) => !value)}
              disabled={!hasAveragePrice}
              aria-pressed={showAverageLine}
              className="rounded-2xl px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                border: showAverageLine ? '1px solid color-mix(in srgb, var(--accent-bitcoin) 38%, transparent)' : `1px solid ${UI_COLORS.border}`,
                background: showAverageLine ? 'color-mix(in srgb, var(--accent-bitcoin) 16%, transparent)' : UI_COLORS.panel,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="uppercase tracking-[0.22em]" style={{ fontSize: 'var(--fs-tag)', color: showAverageLine ? UI_COLORS.brand : UI_COLORS.textPrimary }}>
                  {showAverageLine ? 'Hide Avg Buy' : 'Show Avg Buy'}
                </span>
                <span className="w-8 border-t-2 border-dashed" style={{ borderColor: UI_COLORS.brand }} />
              </div>
              <div className="mt-2 font-mono font-bold tabular-nums" style={{ fontSize: 'var(--fs-body)', color: hasAveragePrice ? UI_COLORS.brand : UI_COLORS.textSecondary }}>
                {hasAveragePrice ? fmt.usd(averagePrice, 0) : '—'}
              </div>
            </button>

            <div className="text-right md:text-left">
              <div className="uppercase tracking-[0.22em]" style={{ fontSize: 'var(--fs-tag)', color: UI_COLORS.textSecondary }}>
                Guide
              </div>
              <div className="mt-1 font-mono" style={{ fontSize: 'var(--fs-micro)', color: UI_COLORS.textTertiary }}>
                Average buy line
              </div>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 px-2 py-3 sm:px-3 md:px-4">
            {loading || !hasChart ? (
              <div className="absolute inset-0 flex items-end gap-[3px] px-3 pb-8 pt-4 sm:px-4">
                {Array.from({ length: isTinyPhone ? 16 : isPhone ? 22 : isTablet ? 30 : 40 }, (_, i) => (
                  <div
                    key={i}
                    className="skeleton flex-1"
                    style={{ height: `${30 + Math.sin(i * 0.4) * 20 + Math.sin(i * 0.15) * 30}%`, borderRadius: 4 }}
                  />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 12, right: isPhone ? 8 : 12, left: isPhone ? 0 : 6, bottom: isPhone ? 2 : 6 }}>
                  <defs>
                    <linearGradient id="priceGradFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E88000" stopOpacity="0.85" />
                      <stop offset="35%" stopColor="#C04800" stopOpacity="0.65" />
                      <stop offset="75%" stopColor="#7a2000" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#111111" stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={UI_COLORS.grid} strokeDasharray="2 4" />
                  {showAverageLine && hasAveragePrice ? (
                    <ReferenceLine
                      y={averagePrice}
                      stroke={UI_COLORS.brand}
                      strokeWidth={1.2}
                      strokeDasharray="6 6"
                    />
                  ) : null}
                  <XAxis
                    dataKey="ts"
                    ticks={xTicks}
                    tickFormatter={(value) => axisLabelMap.get(value) ?? ''}
                    tick={{ fill: '#555', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={8}
                    height={isPhone ? 30 : 34}
                    minTickGap={isTinyPhone ? 10 : 16}
                  />
                  <YAxis
                    domain={[yMin, yMax]}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: '#555', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={10}
                    width={isPhone ? 0 : isTablet ? 46 : 54}
                    hide={isPhone}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: UI_COLORS.brand, strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={UI_COLORS.brand}
                    strokeWidth={1.7}
                    fill="url(#priceGradFill)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Range Stats ── */}
      <div className="grid flex-shrink-0 grid-cols-3 gap-2 border-t px-3 py-3 sm:px-4" style={{ borderColor: UI_COLORS.border }}>
        {!hasChart || !hasPrice ? (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2" style={{ background: UI_COLORS.panel }}>
                <div className="skeleton" style={{ width: 48, height: '0.8em' }} />
                <div className="skeleton" style={{ width: 72, height: '1em' }} />
              </div>
            ))}
          </>
        ) : (
          statItems.map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-center" style={{ background: UI_COLORS.panel }}>
              <span className="uppercase tracking-[0.24em]" style={{ fontSize: 'var(--fs-tag)', color: UI_COLORS.textSecondary }}>{label}</span>
              <span className="font-mono font-bold tabular-nums" style={{ fontSize: 'var(--fs-micro)', color }}>{value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
