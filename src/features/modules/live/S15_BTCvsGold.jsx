import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  AreaSeries,
  createChart,
  CrosshairMode,
  LineSeries,
  LineStyle,
} from 'lightweight-charts';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import { fetchJson } from '@/shared/lib/api.js';

const DAY_MS = 86_400_000;

const RANGES = [
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: 'MAX', days: Infinity },
];

const RANGE_TEXT = {
  '3M': 'Past 3 Months',
  '6M': 'Past 6 Months',
  '1Y': 'Past Year',
  MAX: 'All Available History',
};

const CHART_FONT =
  'JetBrains Mono, SFMono-Regular, Cascadia Code, Fira Code, Consolas, Liberation Mono, monospace';
const PANEL_BG = '#111111';
const BTC_COLOR = '#F7931A';
const GOLD_COLOR = 'rgba(214,214,214,0.92)';

let lastBtcVsGoldPayload = null;

// ── Dual-series lightweight-charts canvas chart ───────────────────────────────
const ChartSection = memo(function ChartSection({
  chartData,
  showGold,
  onHoverChange,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const btcSeriesRef = useRef(null);
  const goldSeriesRef = useRef(null);
  const touchActiveRef = useRef(false);

  // Map unix-second timestamps → human date strings for hover label
  const labelMap = useMemo(() => {
    const map = new Map();
    chartData.forEach((point) => {
      const time = Math.floor(Number(point.ts) / 1000);
      map.set(time, point.date ?? null);
    });
    return map;
  }, [chartData]);

  // Chart init — runs once per mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { color: PANEL_BG },
        textColor: 'rgba(255,255,255,0.45)',
        fontFamily: CHART_FONT,
        attributionLogo: false,
      },
      localization: { locale: 'en-US' },
      grid: {
        vertLines: { color: 'transparent' },
        horzLines: { color: 'transparent' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(255,255,255,0.22)',
          width: 1,
          style: LineStyle.Solid,
          labelVisible: false,
        },
        horzLine: {
          color: 'rgba(255,255,255,0.10)',
          width: 1,
          style: LineStyle.Dashed,
          labelVisible: false,
        },
      },
      rightPriceScale: { visible: false, borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.08 } },
      leftPriceScale:  { visible: false, borderVisible: false },
      timeScale: {
        visible: false,
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 0,
        barSpacing: 7,
        minBarSpacing: 1.8,
      },
      handleScroll: false,
      handleScale: false,
    });

    // Gold series — rendered first so BTC sits on top visually
    const goldSeries = chart.addSeries(AreaSeries, {
      lineColor: GOLD_COLOR,
      topColor: 'rgba(214,214,214,0.14)',
      bottomColor: 'rgba(214,214,214,0.00)',
      lineWidth: 2,
      lineType: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 3.5,
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBorderColor: PANEL_BG,
      crosshairMarkerBackgroundColor: GOLD_COLOR,
    });

    // BTC series — on top
    const btcSeries = chart.addSeries(AreaSeries, {
      lineColor: BTC_COLOR,
      topColor: `${BTC_COLOR}40`,
      bottomColor: `${BTC_COLOR}00`,
      lineWidth: 2.3,
      lineType: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBorderColor: PANEL_BG,
      crosshairMarkerBackgroundColor: BTC_COLOR,
    });

    chartRef.current = chart;
    btcSeriesRef.current = btcSeries;
    goldSeriesRef.current = goldSeries;

    // ── Mouse/pointer crosshair ──────────────────────────────────────────
    const handleCrosshairMove = (param) => {
      const point = param?.point;
      const time = typeof param?.time === 'number' ? param.time : null;
      if (!point || time === null || point.x < 0 || point.y < 0) {
        if (!touchActiveRef.current) onHoverChange(null);
        return;
      }
      const btcVal = param.seriesData.get(btcSeries);
      const goldVal = param.seriesData.get(goldSeries);
      const btcPrice = typeof btcVal === 'number' ? btcVal : btcVal?.value ?? null;
      const goldPrice = typeof goldVal === 'number' ? goldVal : goldVal?.value ?? null;
      if (!Number.isFinite(btcPrice)) {
        if (!touchActiveRef.current) onHoverChange(null);
        return;
      }
      onHoverChange({
        bitcoin: btcPrice,
        gold: Number.isFinite(goldPrice) ? goldPrice : null,
        date: labelMap.get(time) ?? null,
      });
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    // ── Touch scrub (same pattern as S02) ───────────────────────────────
    let touchStartX = 0;
    let touchStartY = 0;
    let isScrubbing = false;

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isScrubbing = false;
      touchActiveRef.current = false;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartX);
      const dy = Math.abs(touch.clientY - touchStartY);

      if (!isScrubbing && dx < 4 && dy < 4) return;
      if (!isScrubbing) {
        isScrubbing = dx > dy;
      }
      if (!isScrubbing) return;

      e.preventDefault();
      touchActiveRef.current = true;

      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left;

      const logical = chart.timeScale().coordinateToLogical(x);
      if (logical === null) return;

      const rounded = Math.round(logical);
      const btcBar = btcSeries.dataByIndex(rounded, -1);
      if (!btcBar) return;

      const goldBar = goldSeries.dataByIndex(rounded, -1);
      chart.setCrosshairPosition(btcBar.value, btcBar.time, btcSeries);

      onHoverChange({
        bitcoin: btcBar.value,
        gold: goldBar?.value ?? null,
        date: labelMap.get(
          typeof btcBar.time === 'number' ? btcBar.time : null,
        ) ?? null,
      });
    };

    const handleTouchEnd = () => {
      isScrubbing = false;
      touchActiveRef.current = false;
      chart.clearCrosshairPosition();
      onHoverChange(null);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      chart.remove();
      chartRef.current = null;
      btcSeriesRef.current = null;
      goldSeriesRef.current = null;
      touchActiveRef.current = false;
      onHoverChange(null);
    };
  }, [labelMap, onHoverChange]);

  // Data + visibility update — runs when data or showGold changes
  useEffect(() => {
    const chart = chartRef.current;
    const btcSeries = btcSeriesRef.current;
    const goldSeries = goldSeriesRef.current;
    if (!chart || !btcSeries || !goldSeries) return;

    const btcData = chartData
      .filter((p) => Number.isFinite(p.bitcoin) && Number.isFinite(p.ts))
      .map((p) => ({ time: Math.floor(p.ts / 1000), value: p.bitcoin }));

    const goldData = chartData
      .filter((p) => Number.isFinite(p.gold) && Number.isFinite(p.ts))
      .map((p) => ({ time: Math.floor(p.ts / 1000), value: p.gold }));

    btcSeries.setData(btcData);

    if (showGold && goldData.length > 1) {
      goldSeries.applyOptions({ visible: true });
      goldSeries.setData(goldData);
    } else {
      goldSeries.applyOptions({ visible: false });
      goldSeries.setData([]);
    }

    chart.timeScale().fitContent();
  }, [chartData, showGold]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-[6px] sm:rounded-[10px]"
    />
  );
});

// ── Stat card atoms ───────────────────────────────────────────────────────────
function MetricBox({ label, value, decimals = 2, color = 'var(--text-primary)', suffix = 'T' }) {
  return (
    <div className="rounded-lg border border-white/10 px-2 py-2.5 text-center sm:rounded-xl sm:px-3 sm:py-3">
      <div className="font-mono font-bold uppercase tracking-widest" style={{ fontSize: 'clamp(0.58rem,1.6vw,0.62rem)', color, marginBottom: 4 }}>
        {label}
      </div>
      <div className="flex min-h-[1.1em] items-center justify-center font-mono tabular-nums font-semibold text-white" style={{ fontSize: 'clamp(0.72rem,2vw,0.82rem)' }}>
        <AnimatedMetric value={value} variant="number" decimals={decimals} prefix="$" suffix={suffix} inline />
      </div>
    </div>
  );
}

function MetricPlaceholder({ label, message = 'Unavailable', color = 'rgba(255,255,255,0.45)' }) {
  return (
    <div className="rounded-lg border border-white/10 px-2 py-2.5 text-center sm:rounded-xl sm:px-3 sm:py-3">
      <div className="font-mono font-bold uppercase tracking-widest" style={{ fontSize: 'clamp(0.58rem,1.6vw,0.62rem)', color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>
        {label}
      </div>
      <div className="font-mono font-semibold" style={{ fontSize: 'clamp(0.72rem,2vw,0.82rem)', color }}>
        {message}
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────
export default function S15_BTCvsGold() {
  const [payload, setPayload]       = useState(() => lastBtcVsGoldPayload);
  const [activeLabel, setActiveLabel] = useState('1Y');
  const [loading, setLoading]       = useState(() => !lastBtcVsGoldPayload);
  const [hoverData, setHoverData]   = useState(null);
  const [showGold, setShowGold]     = useState(true);
  const [error, setError]           = useState(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const next = await fetchJson('/api/s15/btc-vs-gold-market-cap', { timeout: 8000 });
        if (active) { lastBtcVsGoldPayload = next; setPayload(next); setError(null); }
      } catch {
        if (active) {
          setPayload((c) => c);
          setError('Live comparison is temporarily unavailable while the gold market-cap snapshot is missing.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [requestKey]);

  const points     = useMemo(() => payload?.data?.points || [], [payload]);
  const activeRange = RANGES.find((r) => r.label === activeLabel) ?? RANGES.at(-1);

  const chartData = useMemo(() => {
    if (!points.length) return [];
    if (!Number.isFinite(activeRange.days)) return points;
    const lastTs = Number(points.at(-1)?.ts);
    if (!Number.isFinite(lastTs)) return points;
    const cutoff = lastTs - activeRange.days * DAY_MS;
    return points.filter((p) => Number(p.ts) >= cutoff);
  }, [activeRange.days, points]);

  const hasChart          = chartData.length > 1;
  const latestPoint       = chartData.at(-1) || payload?.data?.latest || null;
  const startPoint        = chartData[0] || null;
  const hoveredPoint      = hoverData || latestPoint;
  const showUnavailable   = !loading && !latestPoint;

  const btcDelta = Number.isFinite(startPoint?.bitcoin) && Number.isFinite(latestPoint?.bitcoin)
    ? latestPoint.bitcoin - startPoint.bitcoin : null;
  const btcDeltaPct = Number.isFinite(startPoint?.bitcoin) && startPoint.bitcoin > 0
    && Number.isFinite(latestPoint?.bitcoin)
    ? ((latestPoint.bitcoin - startPoint.bitcoin) / startPoint.bitcoin) * 100 : null;
  const hasDelta = Number.isFinite(btcDelta) && Number.isFinite(btcDeltaPct);
  const isUp     = hasDelta ? btcDelta >= 0 : true;

  const rangeText    = RANGE_TEXT[activeLabel] ?? 'Past Year';
  const updatedLabel = payload?.updated_at
    ? new Date(payload.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const btcHigh = hasChart ? Math.max(...chartData.map((p) => p.bitcoin).filter(Number.isFinite)) : null;

  const handleRetry = () => { setHoverData(null); setError(null); setLoading(true); setRequestKey((k) => k + 1); };

  return (
    <div className="visual-integrity-lock flex h-full w-full flex-col bg-[#111111] px-3.5 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4 lg:px-[22px] lg:pb-4 lg:pt-5">

      {/* ── HEADER ── */}
      <div className="flex flex-shrink-0 flex-row items-start justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          {!loading && hoveredPoint ? (
            <>
              {/* Dual price hero */}
              <div className="flex min-w-0 items-start gap-2 sm:gap-5">
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: BTC_COLOR }}>
                    Bitcoin
                  </div>
                  <div className="flex max-w-full items-center font-mono font-bold tabular-nums leading-none" style={{ fontSize: 'clamp(1.15rem,4vw,2.4rem)' }}>
                    <AnimatedMetric value={hoveredPoint.bitcoin} variant="number" decimals={2} prefix="$" suffix="T" inline />
                  </div>
                </div>

                <div className="mt-4 w-px self-stretch opacity-20" style={{ background: 'white' }} />

                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 font-mono text-[0.58rem] font-bold uppercase tracking-widest" style={{ color: 'rgba(214,214,214,0.72)' }}>
                    Gold
                  </div>
                  <div className="flex max-w-full items-center font-mono font-bold tabular-nums leading-none" style={{ fontSize: 'clamp(1.15rem,4vw,2.4rem)', color: 'rgba(214,214,214,0.95)' }}>
                    <AnimatedMetric value={hoveredPoint.gold} variant="number" decimals={2} prefix="$" suffix="T" inline color="rgba(214,214,214,0.95)" />
                  </div>
                </div>
              </div>

              {/* Delta / hover date */}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 font-mono tabular-nums" style={{ fontSize: 'clamp(0.72rem,2.2vw,0.82rem)' }}>
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
                    <span className="hidden xs:inline" style={{ color: 'rgba(255,255,255,0.38)' }}>{rangeText}</span>
                  </>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>Loading...</span>
                )}
              </div>

              {/* Sub-meta row */}
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono" style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-secondary)' }}>
                {latestPoint ? (
                  <>
                    <span>BTC = <AnimatedMetric value={latestPoint.ratio} variant="percent" decimals={2} inline color={BTC_COLOR} /> of gold</span>
                    {updatedLabel ? <><span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" /><span>Synced {updatedLabel}</span></> : null}
                  </>
                ) : null}
              </div>

              {error ? (
                <div className="mt-1.5 font-mono" style={{ fontSize: '0.72rem', color: 'var(--accent-red)' }}>{error}</div>
              ) : null}
            </>
          ) : showUnavailable ? (
            <>
              <div className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--accent-red)' }}>
                Live comparison unavailable
              </div>
              <div className="mt-2 max-w-2xl font-mono leading-relaxed text-white/70" style={{ fontSize: '0.8rem' }}>
                The BTC vs Gold chart needs the current gold market-cap snapshot. It will recover automatically when the upstream source responds.
              </div>
              {error ? <div className="mt-2 font-mono" style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>{error}</div> : null}
              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 rounded-full border border-white/12 px-3 py-1.5 font-mono uppercase tracking-[0.16em] text-white transition-colors hover:border-white/25 hover:bg-white/5"
                style={{ fontSize: '0.68rem' }}
              >
                Retry
              </button>
            </>
          ) : (
            /* Loading skeleton */
            <>
              <div className="flex items-start gap-3 sm:gap-5">
                <div className="flex-1">
                  <div className="skeleton mb-2" style={{ width: 36, height: '0.6rem', borderRadius: 3 }} />
                  <div className="skeleton" style={{ width: 'min(130px, 40vw)', height: '2.2rem', borderRadius: 6 }} />
                </div>
                <div className="mt-3 w-px self-stretch opacity-10" style={{ background: 'white' }} />
                <div className="flex-1">
                  <div className="skeleton mb-2" style={{ width: 30, height: '0.6rem', borderRadius: 3 }} />
                  <div className="skeleton" style={{ width: 'min(130px, 40vw)', height: '2.2rem', borderRadius: 6 }} />
                </div>
              </div>
              <div className="skeleton mt-2.5" style={{ width: 180, height: '1rem', borderRadius: 4 }} />
            </>
          )}
        </div>

        {/* Gold toggle — top-right, ≥44pt touch target on phone */}
        <button
          type="button"
          onClick={() => setShowGold((v) => !v)}
          disabled={!hasChart}
          aria-pressed={showGold}
          aria-label={showGold ? 'Hide gold series' : 'Show gold series'}
          className="relative flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center gap-1.5 self-start rounded-md px-3 font-mono transition-colors disabled:cursor-not-allowed disabled:opacity-25 sm:min-h-[36px]"
          style={{
            fontSize: 'clamp(0.7rem,1.8vw,0.78rem)',
            fontWeight: showGold ? 700 : 400,
            color: showGold ? 'rgba(214,214,214,0.95)' : 'rgba(255,255,255,0.45)',
            letterSpacing: '0.05em',
            paddingTop: 6,
            paddingBottom: 6,
          }}
        >
          {showGold ? 'Hide Gold' : 'Gold'}
          {showGold && (
            <span className="absolute bottom-0 left-2 right-2 rounded-full" style={{ height: 2, background: 'rgba(214,214,214,0.8)' }} />
          )}
        </button>
      </div>

      {/* ── CHART ── */}
      <div
        className="visual-chart-surface mt-3 min-h-[140px] flex-1 sm:mt-4 sm:min-h-[180px]"
        style={{ margin: '12px -2px 0', flex: '1 1 0' }}
      >
        {hasChart ? (
          <ChartSection
            key={activeLabel}
            chartData={chartData}
            showGold={showGold}
            onHoverChange={setHoverData}
          />
        ) : showUnavailable ? (
          <div className="flex h-full min-h-[140px] items-center justify-center px-2 pb-1 sm:min-h-[180px]">
            <div className="flex w-full max-w-2xl flex-col items-center rounded-2xl border border-white/10 bg-[#0d0d0d] px-6 py-7 text-center">
              <div className="font-mono text-[0.7rem] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--accent-red)' }}>
                Waiting for gold market-cap snapshot
              </div>
              <div className="mt-3 font-mono leading-relaxed text-white/70" style={{ fontSize: '0.82rem' }}>
                Binance BTC history is available, but the gold market-cap reference did not arrive from the approved upstream source.
              </div>
              <div className="mt-2 font-mono text-white/50" style={{ fontSize: '0.74rem' }}>
                No fake fallback is shown — the comparison stays honest.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[140px] items-end gap-px pb-1 sm:min-h-[180px]">
            {Array.from({ length: 42 }, (_, i) => (
              <div
                key={i}
                className="skeleton flex-1"
                style={{ height: `${28 + Math.sin(i * 0.42) * 18 + Math.sin(i * 0.16) * 26}%`, borderRadius: 2 }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── RANGE TABS ── */}
      <div
        className="scrollbar-hidden-mobile flex flex-shrink-0 items-center gap-2 overflow-x-auto sm:gap-4"
        style={{ margin: '10px 0 10px', paddingBottom: 3 }}
      >
        {RANGES.map(({ label }) => {
          const isActive = activeLabel === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveLabel(label)}
              disabled={!hasChart}
              aria-pressed={isActive}
              aria-label={`Show ${RANGE_TEXT[label] ?? label} chart`}
              className="relative flex min-h-[44px] flex-shrink-0 items-center gap-1 rounded-md px-2.5 pb-2 pt-2 font-mono transition-colors disabled:opacity-30 sm:min-h-[36px] sm:px-2 sm:pb-1.5 sm:pt-1"
              style={{
                fontSize: 'clamp(0.75rem,2.4vw,0.82rem)',
                fontWeight: isActive ? 700 : 400,
                color: !hasChart ? 'rgba(255,255,255,0.18)' : isActive ? 'white' : 'rgba(255,255,255,0.32)',
                letterSpacing: '0.05em',
              }}
            >
              {label}
              {hasChart && isActive && (
                <span className="absolute bottom-0.5 left-1 right-1 rounded-full" style={{ height: 2, background: 'white' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── STAT CARDS — always 3-col horizontal ── */}
      <div className="grid flex-shrink-0 grid-cols-3 gap-2 sm:gap-3">
        {latestPoint ? (
          <>
            <MetricBox label="BTC HIGH" value={btcHigh} color={BTC_COLOR} />
            <MetricBox label="GOLD REF" value={latestPoint.gold} color="rgba(214,214,214,0.9)" />
            <div className="rounded-lg border border-white/10 px-2 py-2.5 text-center sm:rounded-xl sm:px-3 sm:py-3">
              <div className="font-mono font-bold uppercase tracking-widest" style={{ fontSize: 'clamp(0.58rem,1.6vw,0.62rem)', color: 'var(--accent-green)', marginBottom: 4 }}>
                BTC/Gold
              </div>
              <div className="flex min-h-[1.1em] items-center justify-center font-mono tabular-nums font-semibold text-white" style={{ fontSize: 'clamp(0.72rem,2vw,0.82rem)' }}>
                <AnimatedMetric value={latestPoint.ratio} variant="percent" decimals={2} inline />
              </div>
            </div>
          </>
        ) : showUnavailable ? (
          <>
            <MetricPlaceholder label="BTC HIGH" />
            <MetricPlaceholder label="GOLD REF" message="Waiting" />
            <MetricPlaceholder label="BTC/Gold" message="Needs ref" color="rgba(255,255,255,0.38)" />
          </>
        ) : (
          [0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg px-2 py-2.5 sm:rounded-xl sm:px-3 sm:py-3" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="skeleton mb-1.5" style={{ width: '45%', height: '0.6rem', borderRadius: 3 }} />
              <div className="skeleton" style={{ width: '70%', height: '0.85rem', borderRadius: 3 }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
