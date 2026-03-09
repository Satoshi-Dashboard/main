import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '@/shared/lib/api.js';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { fetchBtcSpot } from '@/shared/services/priceApi.js';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';

/* ── Circulating supply from protocol constants (no API needed) ── */
function calculateBitcoinSupply(blockHeight) {
  const BLOCKS_PER_HALVING = 210_000;
  let reward = 50;
  let supply = 0;
  let remaining = blockHeight;
  while (remaining > 0) {
    const era = Math.min(remaining, BLOCKS_PER_HALVING);
    supply += era * reward;
    remaining -= era;
    reward /= 2;
    if (reward < 1e-8) break;
  }
  return Math.floor(supply);
}

const defaultStats = {
  price: null,
  priceSource: null,
  satsPerDollar: null,
  avgTxFee: null,
  blockHeight: null,
  hashRateEh: null,
  difficultyT: null,
  circulatingSupply: null,
  nextDifficultyEtaBlocks: null,
  difficultyProgress: null,
  diffChangeNext: null,
  diffChangePrev: null,
  fearGreedValue: null,
  fearGreedClass: null,
  fearGreedHistory: [],
};

const UI_COLORS = {
  brand: 'var(--accent-bitcoin)',
  positive: 'var(--accent-green)',
  negative: 'var(--accent-red)',
  warning: 'var(--accent-warning)',
  textTertiary: 'var(--text-tertiary)',
};

/* ── Fear & Greed color by value ── */
function fngColor(v) {
  if (v >= 75) return UI_COLORS.positive;
  if (v >= 56) return UI_COLORS.positive;
  if (v >= 45) return UI_COLORS.warning;
  if (v >= 25) return '#FF6B35';
  return UI_COLORS.negative;
}

/* ── Mini donut for Difficulty Adj. tile ── */
function MiniDonut({ pct, className = '' }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(Math.max(((pct ?? 0) / 100) * circ, 0), circ);
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className={className}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="#2a2a2a" strokeWidth="9" />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke={UI_COLORS.brand}
        strokeWidth="9"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
    </svg>
  );
}

/* ── Generic stat tile ── */
function Tile({ label, value, variant = 'number', decimals, suffix, accent, source }) {
  return (
    <div className="flex min-h-[108px] flex-col items-center justify-center bg-[#111111] px-3 py-2 select-none sm:px-4 sm:py-3">
      <div className="flex min-h-[2.4em] w-full max-w-full items-center justify-center">
        {value == null ? (
          <div className="skeleton w-3/4 max-w-[18rem]" style={{ height: '2.4em' }} />
        ) : (
          <div className="flex max-w-full flex-wrap items-end justify-center gap-x-1 gap-y-1 text-center font-mono font-bold leading-[1] text-white tabular-nums" style={{ fontSize: 'var(--fs-hero)' }}>
            <AnimatedMetric value={value} variant={variant} decimals={decimals} suffix={suffix} inline />
            {accent ? <span style={{ fontSize: '0.28em', color: UI_COLORS.brand }}>{accent}</span> : null}
          </div>
        )}
      </div>
      <div
        className="mt-2 text-center uppercase tracking-[0.18em]"
        style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}
      >
        {label}
      </div>
      {source ? (
        <div className="mt-1 text-center uppercase tracking-[0.14em] text-white/30" style={{ fontSize: 'var(--fs-tag)' }}>
          src: {source}
        </div>
      ) : null}
    </div>
  );
}

/* ── Fear & Greed tile ── */
function FearGreedTile({ value, classification, history }) {
  const loading = value == null;
  const color = fngColor(value ?? 0);
  const chartData = history.map((d, i) => ({ i, v: d.v }));
  return (
    <div className="flex min-h-[108px] flex-col items-center justify-center gap-0.5 bg-[#111111] px-3 py-2 select-none sm:px-4">
      {loading ? (
        <div className="skeleton w-3/4 max-w-[14rem]" style={{ height: '2.4em' }} />
      ) : (
        <AnimatedMetric
          value={value}
          className="font-mono font-bold tabular-nums leading-none"
          style={{ fontSize: 'var(--fs-hero)', color }}
          variant="number"
          inline
        />
      )}
      {loading ? (
        <div className="skeleton w-1/2" style={{ height: '1em' }} />
      ) : (
        <div
          className="font-mono uppercase tracking-widest"
          style={{ fontSize: 'var(--fs-caption)', color }}
        >
          {classification}
        </div>
      )}
      <div style={{ width: '100%', height: 'clamp(34px, 7vw, 44px)', marginTop: 4 }}>
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id="fngGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={color}
                strokeWidth={2}
                fill="url(#fngGrad)"
                dot={false}
                isAnimationActive={false}
              />
              <Tooltip
                contentStyle={{ background: '#12121A', border: `1px solid ${color}`, borderRadius: 4, fontSize: 11 }}
                formatter={(v) => [v, 'Index']}
                labelFormatter={() => ''}
                cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '3 3' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div
        className="uppercase tracking-[0.18em]"
        style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}
      >
        FEAR & GREED
      </div>
    </div>
  );
}

/* ── Difficulty Adjustment tile (special layout) ── */
function DifficultyTile({ pct, etaBlocks, changeNext, changePrev }) {
  const loading = pct == null;
  const hasChanges = Number.isFinite(changeNext) && Number.isFinite(changePrev);
  const nextUp = hasChanges ? changeNext >= 0 : null;
  const prevUp = hasChanges ? changePrev >= 0 : null;
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 bg-[#111111] px-3 py-3 select-none sm:min-h-[108px] sm:px-4 sm:py-3">
      <div className="hidden w-full items-center justify-center gap-3 sm:flex">
        <div className="flex flex-col gap-1 text-right" style={{ fontSize: 'var(--fs-caption)' }}>
          {loading || !hasChanges ? (
            <>
              <div className="skeleton" style={{ width: '92px', height: '1.1em' }} />
              <div className="skeleton" style={{ width: '92px', height: '1.1em', marginTop: '2px' }} />
            </>
          ) : (
            <>
              <span className="font-mono" style={{ color: UI_COLORS.negative }}>
                <AnimatedMetric value={changeNext} variant="percent" decimals={2} signed inline /> {nextUp ? '▲' : '▼'} Next
              </span>
              <span className="font-mono" style={{ color: UI_COLORS.positive }}>
                <AnimatedMetric value={changePrev} variant="percent" decimals={2} signed inline /> {prevUp ? '▲' : '▼'} Prev
              </span>
            </>
          )}
        </div>
        <MiniDonut pct={pct} className="h-24 w-24 shrink-0 lg:h-28 lg:w-28" />
      </div>

      <div className="flex w-full flex-col items-center gap-2 sm:hidden">
        <div className="relative flex items-center justify-center">
          <MiniDonut pct={pct} className="h-[84px] w-[84px] shrink-0" />
          {!loading && (
            <AnimatedMetric
              value={pct}
              className="absolute font-mono font-bold tabular-nums text-white"
              style={{ fontSize: 'var(--fs-heading)' }}
              variant="percent"
              decimals={2}
              inline
            />
          )}
        </div>

        <div className="flex w-full max-w-full flex-wrap items-center justify-center gap-1.5" style={{ fontSize: 'var(--fs-micro)' }}>
          {loading || !hasChanges ? (
            <>
              <div className="skeleton" style={{ width: '98px', height: '1.2em' }} />
              <div className="skeleton" style={{ width: '98px', height: '1.2em' }} />
            </>
          ) : (
            <>
              <span className="inline-flex max-w-full flex-wrap items-center justify-center rounded bg-black/40 px-1.5 py-px font-mono text-center" style={{ color: UI_COLORS.negative }}>
                <AnimatedMetric value={changeNext} variant="percent" decimals={2} signed inline /> {nextUp ? '▲' : '▼'} Next
              </span>
              <span className="inline-flex max-w-full flex-wrap items-center justify-center rounded bg-black/40 px-1.5 py-px font-mono text-center" style={{ color: UI_COLORS.positive }}>
                <AnimatedMetric value={changePrev} variant="percent" decimals={2} signed inline /> {prevUp ? '▲' : '▼'} Prev
              </span>
            </>
          )}
        </div>
      </div>

      <div className="hidden sm:block">
        {loading ? (
          <div className="skeleton" style={{ width: '65%', height: '2em', marginTop: '4px' }} />
        ) : (
          <AnimatedMetric
            value={pct}
            className="font-mono font-bold text-white tabular-nums leading-none"
            style={{ fontSize: 'var(--fs-title)' }}
            variant="percent"
            decimals={2}
            inline
          />
        )}
      </div>

      <div
        className="uppercase tracking-[0.18em]"
        style={{ fontSize: 'var(--fs-label)', color: UI_COLORS.brand }}
      >
        DIFFICULTY ADJ.
      </div>

      {loading ? (
        <div className="skeleton" style={{ width: '55%', height: '1em' }} />
      ) : (
          <div className="flex max-w-full flex-wrap items-center justify-center gap-x-1 text-center font-mono" style={{ fontSize: 'var(--fs-micro)', color: UI_COLORS.textTertiary }}>
            <AnimatedMetric value={etaBlocks} variant="number" suffix=" blocks remaining" inline />
          </div>
      )}
    </div>
  );
}

export default function S01_BitcoinOverview() {
  const [stats, setStats] = useState(defaultStats);

  const sourceLabel = (src) => {
    if (src === 'binance') return 'BINANCE';
    if (src === 'coingecko_fallback') return 'COINGECKO';
    return null;
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [spot, overviewRes] = await Promise.all([
          fetchBtcSpot(),
          fetchJson('/api/public/mempool/overview'),
        ]);
        const overviewPayload = overviewRes;
        const overview = overviewPayload?.data || {};
        const diff = overview.difficulty || {};
        const fees = overview.fees || {};
        const hashData = overview.hashrate || {};
        const fng = overview.fear_greed || {};

        if (!active) return;
        const h = Number(overview.block_height);

        setStats((prev) => ({
          ...prev,
          price:         spot?.usd         || prev.price,
          priceSource:   spot?.source      || prev.priceSource,
          satsPerDollar: spot?.usd ? Math.round(1e8 / spot.usd) : prev.satsPerDollar,
          circulatingSupply: h ? calculateBitcoinSupply(h) : prev.circulatingSupply,
          avgTxFee:      Number(fees?.halfHourFee) || prev.avgTxFee,
          blockHeight:   h || prev.blockHeight,
          difficultyT:   hashData?.currentDifficulty ? hashData.currentDifficulty / 1e12 : prev.difficultyT,
          nextDifficultyEtaBlocks: diff?.remainingBlocks  != null ? Number(diff.remainingBlocks)  : prev.nextDifficultyEtaBlocks,
          difficultyProgress:     diff?.progressPercent  != null ? Number(diff.progressPercent)  : prev.difficultyProgress,
          diffChangeNext:         diff?.difficultyChange  != null ? Number(diff.difficultyChange) : prev.diffChangeNext,
          diffChangePrev:         diff?.previousRetarget  != null ? Number(diff.previousRetarget) : prev.diffChangePrev,
          hashRateEh: hashData?.currentHashrate ? hashData.currentHashrate / 1e18 : prev.hashRateEh,
          fearGreedValue:   fng?.data?.[0]?.value != null ? Number(fng.data[0].value) : prev.fearGreedValue,
          fearGreedClass:   fng?.data?.[0]?.value_classification ?? prev.fearGreedClass,
          fearGreedHistory: fng?.data ? fng.data.map(d => ({ v: Number(d.value) })).reverse() : prev.fearGreedHistory,
        }));
      } catch {
        /* keep previous values */
      }
    };
    load();
    const timer = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const tiles = useMemo(
    () => [
      {
        label: 'BTC/USD',
        value: stats.price,
        variant: 'usd',
        source: sourceLabel(stats.priceSource),
      },
      { label: 'SATS PER DOLLAR', value: stats.satsPerDollar },
      { label: 'AVG TX FEE (sat/vB)', value: stats.avgTxFee },
      { label: 'BLOCK HEIGHT', value: stats.blockHeight },
      { label: 'CURRENT HASH RATE', value: stats.hashRateEh != null ? stats.hashRateEh * 1e18 : null, variant: 'hashrate' },
      { label: 'NETWORK DIFFICULTY', value: stats.difficultyT, decimals: 2, suffix: ' T' },
      { label: 'CIRCULATING SUPPLY', value: stats.circulatingSupply, accent: '∞/21M' },
    ],
    [stats],
  );

  return (
    <div className="h-full w-full overflow-visible bg-[#111111] lg:overflow-y-auto">
      <div className="grid h-full min-h-full w-full grid-cols-1 divide-y divide-[#2a2a2a] sm:grid-cols-2 sm:divide-x xl:grid-cols-3">
        {tiles.map((t) => (
          <Tile key={t.label} {...t} />
        ))}
        <FearGreedTile
          value={stats.fearGreedValue}
          classification={stats.fearGreedClass}
          history={stats.fearGreedHistory}
        />
        <DifficultyTile
          pct={stats.difficultyProgress}
          etaBlocks={stats.nextDifficultyEtaBlocks}
          changeNext={stats.diffChangeNext}
          changePrev={stats.diffChangePrev}
        />
      </div>
    </div>
  );
}
