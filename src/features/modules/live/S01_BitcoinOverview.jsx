import { useCallback, useMemo } from 'react';
import { fetchBtcSpot } from '@/shared/services/priceApi.js';
import { fetchMempoolOverviewBundle } from '@/shared/services/mempoolApi.js';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import { ModuleShell } from '@/shared/components/module/index.js';
import { UI_COLORS } from '@/shared/constants/colors.js';

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

function buildSparklinePaths(values, width = 220, height = 44, padding = 4) {
  const numericValues = values.filter((value) => Number.isFinite(value));
  if (numericValues.length < 2) return null;

  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  const range = max - min;
  const innerWidth = width - (padding * 2);
  const innerHeight = height - (padding * 2);

  const points = numericValues.map((value, index) => {
    const x = padding + ((innerWidth * index) / (numericValues.length - 1));
    const ratio = range === 0 ? 0.5 : (value - min) / range;
    const y = height - padding - (ratio * innerHeight);
    return [x, y];
  });

  const line = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');

  const baseline = height - padding;
  const [firstX] = points[0];
  const [lastX] = points[points.length - 1];
  const area = `${line} L ${lastX.toFixed(2)} ${baseline.toFixed(2)} L ${firstX.toFixed(2)} ${baseline.toFixed(2)} Z`;

  return { line, area, width, height };
}

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
    <svg viewBox="0 0 96 96" overflow="visible" aria-hidden="true" className={`block h-full w-full ${className}`}>
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
    <div className="flex h-full min-h-[108px] flex-col items-center justify-center bg-[#111111] px-3 py-2 select-none sm:px-4 sm:py-3">
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
  const sparkline = useMemo(
    () => buildSparklinePaths(history.map((d) => d.v)),
    [history],
  );

  return (
    <div className="visual-chart-surface flex h-full min-h-[108px] flex-col items-center justify-center gap-0.5 bg-[#111111] px-3 py-2 select-none sm:px-4">
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
        {sparkline && (
          <svg
            className="visual-svg-surface h-full w-full"
            viewBox={`0 0 ${sparkline.width} ${sparkline.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="s01FearGreedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={sparkline.area} fill="url(#s01FearGreedGrad)" />
            <path
              d={sparkline.line}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
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
    <div className="visual-svg-surface flex h-full min-h-[108px] flex-col items-center justify-center gap-1 overflow-hidden bg-[#111111] px-3 py-3 select-none sm:px-4 sm:py-3">
      <div className="hidden w-full min-w-0 items-center justify-center gap-3 sm:flex">
        <div className="flex min-w-0 flex-col gap-1 text-right" style={{ fontSize: 'var(--fs-caption)' }}>
          {loading || !hasChanges ? (
            <>
              <div className="skeleton" style={{ width: '92px', height: '1.1em' }} />
              <div className="skeleton" style={{ width: '92px', height: '1.1em', marginTop: '2px' }} />
            </>
          ) : (
            <>
              <span className="font-mono inline-flex items-center gap-1">
                <span style={{ color: nextUp ? UI_COLORS.positive : UI_COLORS.negative }}>
                  <AnimatedMetric value={changeNext} variant="percent" decimals={2} signed />
                </span>
                <span style={{ color: nextUp ? UI_COLORS.positive : UI_COLORS.negative }}>{nextUp ? '▲' : '▼'}</span>
                <span style={{ color: UI_COLORS.textPrimary }}>Next</span>
              </span>
              <span className="font-mono inline-flex items-center gap-1">
                <span style={{ color: prevUp ? UI_COLORS.positive : UI_COLORS.negative }}>
                  <AnimatedMetric value={changePrev} variant="percent" decimals={2} signed />
                </span>
                <span style={{ color: prevUp ? UI_COLORS.positive : UI_COLORS.negative }}>{prevUp ? '▲' : '▼'}</span>
                <span style={{ color: UI_COLORS.textPrimary }}>Prev</span>
              </span>
            </>
          )}
        </div>
        <div className="aspect-square w-[clamp(4rem,10vw,6rem)] shrink-0 lg:w-[clamp(5rem,8vw,7rem)]">
          <MiniDonut pct={pct} />
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-2 sm:hidden">
        <div className="relative flex items-center justify-center">
          <div className="aspect-square w-[clamp(4rem,20vw,5.25rem)]">
            <MiniDonut pct={pct} />
          </div>
          {!loading && (
            <AnimatedMetric
              value={pct}
              className="absolute font-mono font-bold tabular-nums text-white"
              style={{ fontSize: 'var(--fs-heading)' }}
              variant="percent"
              decimals={2}
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
              <span className="inline-flex items-center gap-1 rounded bg-black/40 px-1.5 py-px font-mono">
                <span style={{ color: nextUp ? UI_COLORS.positive : UI_COLORS.negative }}>
                  <AnimatedMetric value={changeNext} variant="percent" decimals={2} signed />
                </span>
                <span style={{ color: nextUp ? UI_COLORS.positive : UI_COLORS.negative }}>{nextUp ? '▲' : '▼'}</span>
                <span style={{ color: UI_COLORS.textPrimary }}>Next</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-black/40 px-1.5 py-px font-mono">
                <span style={{ color: prevUp ? UI_COLORS.positive : UI_COLORS.negative }}>
                  <AnimatedMetric value={changePrev} variant="percent" decimals={2} signed />
                </span>
                <span style={{ color: prevUp ? UI_COLORS.positive : UI_COLORS.negative }}>{prevUp ? '▲' : '▼'}</span>
                <span style={{ color: UI_COLORS.textPrimary }}>Prev</span>
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
            <AnimatedMetric value={etaBlocks} variant="number" suffix=" blocks remaining" />
          </div>
      )}
    </div>
  );
}

export default function S01_BitcoinOverview() {
  const sourceLabel = (src) => {
    if (src === 'binance') return 'BINANCE';
    if (src === 'coingecko_fallback') return 'COINGECKO';
    return null;
  };

  const fetchSpot = useCallback(() => fetchBtcSpot(), []);
  const fetchOverview = useCallback(
    () => fetchMempoolOverviewBundle({ timeout: 8000, cache: 'no-store' }),
    [],
  );

  const { data: spotData } = useModuleData(fetchSpot, {
    refreshMs: 30_000,
    initialData: null,
    keepPreviousOnError: true,
  });

  const { data: overviewData } = useModuleData(fetchOverview, {
    refreshMs: 30_000,
    initialData: null,
    keepPreviousOnError: true,
  });

  const stats = useMemo(() => {
    const base = { ...defaultStats };

    /* ── Spot price data ── */
    if (spotData) {
      base.price = spotData.usd || base.price;
      base.priceSource = spotData.source || base.priceSource;
      base.satsPerDollar = spotData.usd ? Math.round(1e8 / spotData.usd) : base.satsPerDollar;
    }

    /* ── Mempool overview bundle ── */
    if (overviewData) {
      const overview = overviewData.overview || {};
      const diff = overview.difficulty || {};
      const hashData = overview.hashrate || {};
      const fng = overview.fear_greed || {};
      const h = Number(overview.block_height);

      base.circulatingSupply = h ? calculateBitcoinSupply(h) : base.circulatingSupply;
      base.avgTxFee = overviewData.fees.normal ?? base.avgTxFee;
      base.blockHeight = h || base.blockHeight;
      base.difficultyT = hashData?.currentDifficulty ? hashData.currentDifficulty / 1e12 : base.difficultyT;
      base.nextDifficultyEtaBlocks = diff?.remainingBlocks != null ? Number(diff.remainingBlocks) : base.nextDifficultyEtaBlocks;
      base.difficultyProgress = diff?.progressPercent != null ? Number(diff.progressPercent) : base.difficultyProgress;
      base.diffChangeNext = diff?.difficultyChange != null ? Number(diff.difficultyChange) : base.diffChangeNext;
      base.diffChangePrev = diff?.previousRetarget != null ? Number(diff.previousRetarget) : base.diffChangePrev;
      base.hashRateEh = hashData?.currentHashrate ? hashData.currentHashrate / 1e18 : base.hashRateEh;
      base.fearGreedValue = fng?.data?.[0]?.value != null ? Number(fng.data[0].value) : base.fearGreedValue;
      base.fearGreedClass = fng?.data?.[0]?.value_classification ?? base.fearGreedClass;
      base.fearGreedHistory = fng?.data ? fng.data.map(d => ({ v: Number(d.value) })).reverse() : base.fearGreedHistory;
    }

    return base;
  }, [spotData, overviewData]);

  const tiles = useMemo(
    () => [
      {
        label: 'BTC/USD',
        value: stats.price,
        variant: 'usd',
        source: sourceLabel(stats.priceSource),
      },
      { label: 'SATS PER DOLLAR', value: stats.satsPerDollar },
      { label: 'AVG TX FEE (sat/vB)', value: stats.avgTxFee, decimals: 2 },
      { label: 'BLOCK HEIGHT', value: stats.blockHeight },
      { label: 'CURRENT HASH RATE', value: stats.hashRateEh != null ? stats.hashRateEh * 1e18 : null, variant: 'hashrate' },
      { label: 'NETWORK DIFFICULTY', value: stats.difficultyT, decimals: 2, suffix: ' T' },
      { label: 'CIRCULATING SUPPLY', value: stats.circulatingSupply, accent: '∞/21M' },
    ],
    [stats],
  );

  return (
    <ModuleShell layout="none" className="overflow-y-auto">
      <div className="grid h-full min-h-full w-full auto-rows-fr grid-cols-1 divide-y divide-[#2a2a2a] sm:grid-cols-2 sm:divide-x xl:grid-cols-3">
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
    </ModuleShell>
  );
}
