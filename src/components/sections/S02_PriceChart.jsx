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

/* ── Fallback data (1 year, generated once) ── */
const FALLBACK = Array.from({ length: 365 }, (_, i) => {
  const t = new Date(Date.now() - (364 - i) * 86_400_000);
  return {
    date: t.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).replace('/', '.'),
    ts: t.getTime(),
    price: 55000 + Math.sin(i * 0.05) * 22000 + i * 140 + Math.random() * 4000,
  };
});

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { date, price } = payload[0].payload;
  return (
    <div className="rounded border border-[#F7931A]/40 bg-[#111111]/95 px-3 py-2 text-xs font-mono shadow-xl">
      <div className="text-white/50">{date}</div>
      <div className="text-[#F7931A] font-bold text-sm">{fmt.usd(price, 0)}</div>
    </div>
  );
}

// Cache to avoid re-fetching the same range twice in a session
const dataCache = {};

export default function S02_PriceChart() {
  const [chartData, setChartData] = useState(FALLBACK.slice(-365));
  const [range, setRange] = useState(365);
  const [livePrice, setLivePrice] = useState(107640);
  const [change24h, setChange24h] = useState(1.66);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  /* Fetch price + 24h change once on mount (with fallback chain) */
  useEffect(() => {
    fetchBtcSpot().then(spot => {
      if (spot) {
        setLivePrice(spot.usd);
        setChange24h(spot.change24h);
      }
    }).catch(() => {});
  }, []);

  /* Fetch historical data from CoinGecko per selected range */
  useEffect(() => {
    let active = true;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // Return cached data immediately if available
    if (dataCache[range]) {
      setChartData(dataCache[range]);
      return () => { active = false; ctrl.abort(); };
    }

    setLoading(true);
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

  /* Derived stats */
  const prices = chartData.map((d) => d.price);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const isUp = change24h >= 0;

  /* Y-axis domain with padding */
  const yMin = low * 0.98;
  const yMax = high * 1.02;

  /* X-axis: show ~6 evenly spaced ticks */
  const tickInterval = Math.max(1, Math.floor(chartData.length / 6));
  const xTicks = chartData
    .filter((_, i) => i % tickInterval === 0 || i === chartData.length - 1)
    .map((d) => d.date);

  return (
    <div className="flex h-full w-full flex-col bg-[#111111]">
      {/* ── Price Header ── */}
      <div className="flex flex-shrink-0 items-center justify-center gap-4 py-4">
        {/* Live dot */}
        <div
          className={`h-3 w-3 rounded-full ${isUp ? 'bg-[#00D897]' : 'bg-red-500'} shadow-lg`}
          style={{ boxShadow: isUp ? '0 0 8px #00D897' : '0 0 8px #FF4757' }}
        />
        {/* Price */}
        <span
          className="font-mono font-bold text-white tabular-nums"
          style={{ fontSize: 'var(--fs-hero)' }}
        >
          {fmt.usd(livePrice, 0)}
        </span>
        {/* Change */}
        <span
          className={`font-mono font-bold ${isUp ? 'text-[#00D897]' : 'text-red-400'}`}
          style={{ fontSize: 'var(--fs-subtitle)' }}
        >
          {isUp ? '+' : ''}{change24h.toFixed(2)}%&nbsp;{isUp ? '▲' : '▼'}
        </span>
      </div>

      {/* ── Range Selector ── */}
      <div className="flex flex-shrink-0 justify-center gap-3 pb-2">
        {RANGES.map(({ label, days }) => (
          <button
            key={label}
            type="button"
            onClick={() => setRange(days)}
            style={{ fontSize: 'var(--fs-tag)' }}
            className={`px-3 py-1 font-mono uppercase tracking-widest rounded transition ${
              range === days
                ? 'bg-[#F7931A]/20 text-[#F7931A] border border-[#F7931A]/40'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Full-width Area Chart ── */}
      <div className="min-h-0 flex-1">
        {(
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                {/* Orange → red-brown → transparent */}
                <linearGradient id="priceGradFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E88000" stopOpacity="0.85" />
                  <stop offset="35%" stopColor="#C04800" stopOpacity="0.65" />
                  <stop offset="75%" stopColor="#7a2000" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#111111" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="date"
                ticks={xTicks}
                tick={{ fill: '#555', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                height={28}
              />
              <YAxis
                domain={[yMin, yMax]}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#555', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: '#F7931A', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#F7931A"
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
      <div className="flex flex-shrink-0 justify-center gap-10 border-t border-[#2a2a2a] py-2">
        {[
          { label: 'HIGH', value: fmt.usd(high, 0), color: 'text-[#00D897]' },
          { label: 'CURRENT', value: fmt.usd(livePrice, 0), color: 'text-white' },
          { label: 'LOW', value: fmt.usd(low, 0), color: 'text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <span className="uppercase tracking-widest text-white/30" style={{ fontSize: 'var(--fs-tag)' }}>{label}</span>
            <span className={`font-mono font-bold tabular-nums ${color}`} style={{ fontSize: 'var(--fs-micro)' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
