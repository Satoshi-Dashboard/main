import { useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmt } from '../../utils/formatters';
import { fetchBtcSpot, fetchBtcHistory } from '../../services/priceApi';

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  positive: 'var(--accent-green)',
  negative: 'var(--accent-red)',
  textSecondary: 'var(--text-secondary)',
};

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { date, price } = payload[0].payload;
  return (
    <div className="rounded bg-[#111111]/95 px-3 py-2 text-xs font-mono shadow-xl" style={{ border: `1px solid ${UI_COLORS.brand}66` }}>
      <div className="text-white/50">{date}</div>
      <div className="font-bold text-sm" style={{ color: UI_COLORS.brand }}>{fmt.usd(price, 0)}</div>
    </div>
  );
}

// Cache to avoid re-fetching the same range twice in a session
const dataCache = {};

export default function S02_PriceChart() {
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState(365);
  const [livePrice, setLivePrice] = useState(null);
  const [change24h, setChange24h] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const abortRef = useRef(null);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* Fetch price + 24h change once on mount */
  useEffect(() => {
    fetchBtcSpot().then(spot => {
      if (spot) {
        setLivePrice(spot.usd);
        setChange24h(spot.change24h);
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
  const prices = hasChart ? chartData.map((d) => d.price) : [];
  const high = hasChart ? Math.max(...prices) : null;
  const low  = hasChart ? Math.min(...prices) : null;
  const isUp = change24h != null ? change24h >= 0 : true;

  const yMin = hasChart ? low * 0.98 : 0;
  const yMax = hasChart ? high * 1.02 : 1;
  const isPhone = viewportWidth < 640;

  const tickInterval = hasChart ? Math.max(1, Math.floor(chartData.length / 6)) : 1;
  const xTicks = hasChart
    ? chartData.filter((_, i) => i % tickInterval === 0 || i === chartData.length - 1).map((d) => d.date)
    : [];

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* ── Price Header ── */}
      <div className="flex flex-shrink-0 flex-wrap items-center justify-center gap-2 px-3 py-3 sm:gap-4 sm:py-4">
        {!hasPrice ? (
          <>
            <div className="skeleton" style={{ width: 12, height: 12, borderRadius: '50%' }} />
            <div className="skeleton" style={{ width: 160, height: '2em' }} />
            <div className="skeleton" style={{ width: 90, height: '1.4em' }} />
          </>
        ) : (
          <>
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
            <span
                className="font-mono font-bold"
                style={{ fontSize: 'var(--fs-subtitle)', color: isUp ? UI_COLORS.positive : UI_COLORS.negative }}
              >
                {isUp ? '+' : ''}{change24h.toFixed(2)}%&nbsp;{isUp ? '▲' : '▼'}
              </span>
          </>
        )}
      </div>

      {/* ── Range Selector ── */}
      <div className="flex flex-shrink-0 justify-center gap-2 overflow-x-auto px-2 pb-2 sm:gap-3">
        {RANGES.map(({ label, days }) => (
          <button
            key={label}
            type="button"
            onClick={() => setRange(days)}
            style={{
              fontSize: 'var(--fs-tag)',
              color: range === days ? UI_COLORS.brand : 'rgba(255,255,255,0.3)',
              background: range === days ? 'color-mix(in srgb, var(--accent-bitcoin) 20%, transparent)' : 'transparent',
              border: range === days ? `1px solid ${UI_COLORS.brand}66` : '1px solid transparent',
            }}
            className="rounded px-2.5 py-1 font-mono uppercase tracking-widest whitespace-nowrap transition hover:text-white/60 sm:px-3"
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Chart or Skeleton ── */}
      <div className="min-h-0 flex-1 relative">
        {loading || !hasChart ? (
          <div className="absolute inset-0 flex items-end gap-[2px] px-2 pb-6 sm:pb-7">
            {Array.from({ length: isPhone ? 24 : 40 }, (_, i) => (
              <div
                key={i}
                className="skeleton flex-1"
                style={{ height: `${30 + Math.sin(i * 0.4) * 20 + Math.sin(i * 0.15) * 30}%`, borderRadius: 2 }}
              />
            ))}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: isPhone ? 6 : 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#E88000" stopOpacity="0.85" />
                  <stop offset="35%"  stopColor="#C04800" stopOpacity="0.65" />
                  <stop offset="75%"  stopColor="#7a2000" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#111111" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                ticks={xTicks}
                tick={{ fill: '#555', fontSize: isPhone ? 9 : 11, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                height={isPhone ? 24 : 28}
              />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#555', fontSize: isPhone ? 9 : 11, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                width={isPhone ? 38 : 48}
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
                strokeWidth={1.5}
                fill="url(#priceGradFill)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── High / Low strip ── */}
      <div className="flex flex-shrink-0 flex-wrap justify-center gap-x-6 gap-y-2 border-t border-[#2a2a2a] px-3 py-2 sm:gap-10">
        {!hasChart || !hasPrice ? (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="skeleton" style={{ width: 48, height: '0.8em' }} />
                <div className="skeleton" style={{ width: 72, height: '1em' }} />
              </div>
            ))}
          </>
        ) : (
          [
            { label: 'HIGH', value: fmt.usd(high, 0), color: UI_COLORS.positive },
            { label: 'CURRENT', value: fmt.usd(livePrice, 0), color: 'white' },
            { label: 'LOW', value: fmt.usd(low, 0), color: UI_COLORS.negative },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="uppercase tracking-widest" style={{ fontSize: 'var(--fs-tag)', color: UI_COLORS.textSecondary }}>{label}</span>
              <span className="font-mono font-bold tabular-nums" style={{ fontSize: 'var(--fs-micro)', color }}>{value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
