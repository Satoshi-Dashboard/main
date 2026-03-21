import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AreaSeries,
  LineSeries,
  LineStyle,
} from 'lightweight-charts';
import { fetchBtcSpot, fetchBtcHistory } from '@/shared/services/priceApi.js';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import { ModuleShell } from '@/shared/components/module/index.js';
import { createDarkChart, CHART_FONT, PANEL_BG } from '@/shared/lib/lightweightChartConfig.js';

const RANGES = [
  { label: 'LIVE', days: 1, interval: '15m', live: true },
  { label: '1D', days: 1, interval: '5m' },
  { label: '1W', days: 7, interval: '1h' },
  { label: '1M', days: 30, interval: '1h' },
  { label: '3M', days: 90, interval: '1d' },
  { label: '1Y', days: 365, interval: '1d' },
  { label: '5Y', days: 1825, interval: '1d' },
];

const RANGE_TEXT = {
  LIVE: 'Live',
  '1D': 'Past Day',
  '1W': 'Past Week',
  '1M': 'Past Month',
  '3M': 'Past 3 Months',
  '1Y': 'Past Year',
  '5Y': 'Past 5 Years',
};

const BITCOIN_ORANGE = '#F7931A';
const ACCENT_GREEN = '#00D897';
const ACCENT_RED = '#FF4757';

const dataCache = {};

function getAreaPointValue(point) {
  if (typeof point === 'number') return point;
  if (point && typeof point === 'object' && Number.isFinite(point.value)) return point.value;
  return null;
}

const ChartSection = memo(function ChartSection({
  chartData,
  showAvgLine,
  hasAvg,
  avgPrice,
  lineColor,
  onHoverChange,
}) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const areaSeriesRef = useRef(null);
  const avgSeriesRef = useRef(null);
  // Track whether a touch scrub is active so we can clear on touchend
  const touchActiveRef = useRef(false);

  const hoverLabelMap = useMemo(() => {
    const map = new Map();
    chartData.forEach((point) => {
      const time = Math.floor(point.ts / 1000);
      map.set(time, point.tooltipLabel);
    });
    return map;
  }, [chartData]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const chart = createDarkChart(container, {
      localization: { locale: 'en-US' },
      crosshair: {
        vertLine: { color: 'rgba(255,255,255,0.24)' },
        horzLine: { color: 'rgba(255,255,255,0.12)' },
      },
      rightPriceScale: {
        visible: false,
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      leftPriceScale: {
        visible: false,
        borderVisible: false,
      },
      timeScale: {
        visible: false,
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 0,
        barSpacing: 7,
        minBarSpacing: 1.8,
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: `${lineColor}33`,
      bottomColor: `${lineColor}00`,
      lineWidth: 2,
      lineType: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderWidth: 2,
      crosshairMarkerBorderColor: PANEL_BG,
      crosshairMarkerBackgroundColor: lineColor,
    });

    const avgSeries = chart.addSeries(LineSeries, {
      color: 'rgba(255,255,255,0.58)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    chartRef.current = chart;
    areaSeriesRef.current = areaSeries;
    avgSeriesRef.current = avgSeries;

    // ── Mouse/pointer crosshair (desktop) ───────────────────────────────
    const handleCrosshairMove = (param) => {
      const point = param?.point;
      const time = typeof param?.time === 'number' ? param.time : null;
      if (!point || time === null || point.x < 0 || point.y < 0) {
        // Only clear if no touch is holding the position
        if (!touchActiveRef.current) onHoverChange(null);
        return;
      }
      const priceValue = getAreaPointValue(param.seriesData.get(areaSeries));
      if (!Number.isFinite(priceValue)) {
        if (!touchActiveRef.current) onHoverChange(null);
        return;
      }
      onHoverChange({
        price: priceValue,
        label: hoverLabelMap.get(time) || null,
      });
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    // ── Touch scrub (mobile/tablet) ──────────────────────────────────────
    // Strategy: intercept touchmove on the canvas wrapper, compute the
    // x offset relative to the container, then use setCrosshairPosition
    // to move the crosshair to that logical coordinate.
    // We use { passive: false } so we can call preventDefault() only
    // when the touch is clearly horizontal (scrubbing the chart).
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

      // Decide on first significant movement: horizontal = scrub, vertical = scroll
      if (!isScrubbing && dx < 4 && dy < 4) return;
      if (!isScrubbing) {
        isScrubbing = dx > dy; // horizontal wins → scrub
      }
      if (!isScrubbing) return; // vertical — let page scroll

      // We are scrubbing — prevent page scroll for this touch sequence
      e.preventDefault();
      touchActiveRef.current = true;

      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left;

      // lightweight-charts exposes setCrosshairPosition(price, time, series)
      // but the simplest approach is to move via logical pixel coordinate.
      // We get the bar nearest to x and read its price.
      const timeScale = chart.timeScale();
      const logical = timeScale.coordinateToLogical(x);
      if (logical === null) return;

      const bar = areaSeries.dataByIndex(Math.round(logical), -1);
      if (!bar) return;

      // Move the crosshair to the snapped bar position
      chart.setCrosshairPosition(bar.value, bar.time, areaSeries);

      onHoverChange({
        price: bar.value,
        label: hoverLabelMap.get(
          typeof bar.time === 'number' ? bar.time : null,
        ) || null,
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
      areaSeriesRef.current = null;
      avgSeriesRef.current = null;
      touchActiveRef.current = false;
      onHoverChange(null);
    };
  }, [hoverLabelMap, lineColor, onHoverChange]);

  useEffect(() => {
    const chart = chartRef.current;
    const areaSeries = areaSeriesRef.current;
    const avgSeries = avgSeriesRef.current;
    if (!chart || !areaSeries || !avgSeries) return;

    const areaData = chartData.map((point) => ({
      time: Math.floor(point.ts / 1000),
      value: point.price,
    }));

    areaSeries.applyOptions({
      lineColor,
      topColor: `${lineColor}33`,
      bottomColor: `${lineColor}00`,
      crosshairMarkerBackgroundColor: lineColor,
    });
    areaSeries.setData(areaData);

    if (showAvgLine && hasAvg && Number.isFinite(avgPrice)) {
      avgSeries.applyOptions({ visible: true });
      avgSeries.setData(areaData.map((point) => ({ time: point.time, value: avgPrice })));
    } else {
      avgSeries.applyOptions({ visible: false });
      avgSeries.setData([]);
    }

    chart.timeScale().fitContent();
  }, [avgPrice, chartData, hasAvg, lineColor, showAvgLine]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-[6px] sm:rounded-[10px]"
    />
  );
});

export default function S02_PriceChart() {
  const [chartData, setChartData] = useState([]);
  const [activeLabel, setActiveLabel] = useState('LIVE');
  const [livePrice, setLivePrice] = useState(null);
  const [showAvgLine, setShowAvgLine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hoverData, setHoverData] = useState(null);
  const abortRef = useRef(null);

  const activeRange = RANGES.find((range) => range.label === activeLabel) ?? RANGES[0];

  const applyPrice = useCallback((newPrice) => {
    if (!Number.isFinite(newPrice) || newPrice <= 0) return;
    setLivePrice(newPrice);
  }, []);

  useModuleData(fetchBtcSpot, {
    refreshMs: 10_000,
    transform: (spot) => {
      if (spot) applyPrice(spot.usd);
      return spot;
    },
  });

  useEffect(() => {
    let active = true;
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const key = `${activeLabel}_${activeRange.interval}`;
    if (dataCache[key]) {
      setChartData(dataCache[key]);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    (async () => {
      try {
        const history = await fetchBtcHistory(activeRange.days, activeRange.interval);
        if (!active) return;
        if (history?.length) {
          dataCache[key] = history;
          setChartData(history);
        }
      } catch {
        // keep previous view on fetch failure
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      ctrl.abort();
    };
  }, [activeLabel, activeRange.days, activeRange.interval]);

  const hasChart = chartData.length > 0;
  const hasPrice = livePrice !== null;

  const prices = useMemo(
    () => (hasChart ? chartData.map((point) => point.price).filter(Number.isFinite) : []),
    [chartData, hasChart],
  );

  const high = hasChart ? Math.max(...prices) : null;
  const low = hasChart ? Math.min(...prices) : null;
  const avgPrice = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;
  const hasAvg = Number.isFinite(avgPrice);

  const startPrice = hasChart ? Number(chartData[0]?.price) : null;
  const endPrice = Number.isFinite(livePrice) && livePrice > 0
    ? livePrice
    : hasChart ? Number(chartData.at(-1)?.price) : null;

  const delta = Number.isFinite(startPrice) && Number.isFinite(endPrice) && startPrice > 0
    ? endPrice - startPrice
    : null;
  const deltaPct = delta !== null && startPrice > 0 ? (delta / startPrice) * 100 : null;

  const hasChange = Number.isFinite(delta) && Number.isFinite(deltaPct);
  const isUp = hasChange ? delta >= 0 : true;
  const lineColor = isUp ? ACCENT_GREEN : ACCENT_RED;
  const rangeText = RANGE_TEXT[activeLabel] ?? 'Past Period';
  const displayPrice = hoverData ? hoverData.price : livePrice;

  return (
    /*
     * Outer shell: mobile-first padding scale
     * phone  → px-3.5  pt-3   pb-3
     * tablet → px-5    pt-4   pb-4
     * desktop→ px-[22px] pt-5 pb-4
     */
    <ModuleShell className="px-3.5 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4 lg:px-[22px] lg:pb-4 lg:pt-5">

      {/* ── HEADER ROW ──────────────────────────────────────────────────────
          Phone:  price on top, AVG button right-aligned on same row
          Tablet+: side-by-side (price left, AVG button right)
          Rule: content-priority — price is always first & largest
      */}
      <div className="flex flex-shrink-0 flex-row items-start justify-between gap-2 sm:gap-4">

        {/* Price + delta */}
        <div className="min-w-0 flex-1">
          {!hasPrice ? (
            <>
              <div className="skeleton max-w-full" style={{ width: 'min(200px, 65vw)', height: 'clamp(1.8rem,6vw,2.9rem)', borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 'min(160px, 50vw)', height: '0.9rem', borderRadius: 4 }} />
            </>
          ) : (
            <>
              {/* Price: clamp keeps it readable from 320px up to 1440px */}
              <div
                className="flex max-w-full items-baseline font-mono font-bold tabular-nums leading-none"
                style={{ fontSize: 'clamp(1.45rem, 5.2vw, 2.9rem)' }}
              >
                <AnimatedMetric value={displayPrice} variant="usd" decimals={2} inline />
              </div>

              {/* Delta / hover label */}
              <div
                className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 font-mono tabular-nums sm:mt-2"
                style={{ fontSize: 'clamp(0.72rem, 2.2vw, 0.82rem)' }}
              >
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
                    <span className="hidden xs:inline" style={{ color: 'rgba(255,255,255,0.38)' }}>{rangeText}</span>
                  </>
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.25)' }}>Loading...</span>
                )}
              </div>
            </>
          )}
        </div>

        {/*
         * AVG Buy toggle — always top-right corner on all breakpoints
         * Rule: touch-target-size ≥44pt → min-h-[44px] min-w-[44px]
         * Rule: primary-action — secondary action visually subordinate
         */}
        <button
          type="button"
          onClick={() => setShowAvgLine((v) => !v)}
          disabled={!hasAvg}
          aria-pressed={showAvgLine}
          aria-label={showAvgLine ? 'Hide average buy price line' : 'Show average buy price line'}
          className="relative flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center gap-1.5 self-start rounded-md px-3 font-mono transition-colors disabled:cursor-not-allowed disabled:opacity-25 sm:min-h-[36px]"
          style={{
            fontSize: 'clamp(0.7rem, 1.8vw, 0.78rem)',
            fontWeight: showAvgLine ? 700 : 400,
            color: showAvgLine ? 'white' : 'rgba(255,255,255,0.45)',
            letterSpacing: '0.05em',
            paddingTop: 6,
            paddingBottom: 6,
          }}
        >
          <span className="hidden sm:inline">{showAvgLine ? 'Hide AVG' : 'AVG Buy'}</span>
          <span className="sm:hidden">{showAvgLine ? 'Hide' : 'AVG'}</span>
          {showAvgLine && (
            <span className="absolute bottom-0 left-2 right-2 rounded-full" style={{ height: 2, background: 'white' }} />
          )}
        </button>
      </div>

      {/*
       * ── CHART AREA ──────────────────────────────────────────────────────
       * min-h ensures the chart never collapses below 140px on phone landscape.
       * flex-1 fills remaining space on larger screens.
       * Rule: responsive-chart — chart must not become illegible on small screens
       * Rule: content-priority — chart is the most important element
       */}
      <div
        className="visual-chart-surface mt-3 min-h-[140px] flex-1 sm:mt-4 sm:min-h-[180px]"
        style={{ margin: '12px -2px 0', flex: '1 1 0' }}
      >
        {loading || !hasChart ? (
          /* Skeleton: same wave pattern, respects reduced motion via CSS */
          <div className="flex h-full min-h-[140px] items-end gap-px pb-1 sm:min-h-[180px]">
            {Array.from({ length: 48 }, (_, i) => (
              <div
                key={i}
                className="skeleton flex-1"
                style={{
                  height: `${32 + Math.sin(i * 0.4) * 26 + Math.sin(i * 0.12) * 28}%`,
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
            onHoverChange={setHoverData}
          />
        )}
      </div>

      {/*
       * ── RANGE TABS ──────────────────────────────────────────────────────
       * Rule: touch-target-size ≥44pt → min-h-[44px] on phone, 36px on sm+
       * Rule: touch-spacing ≥8px → gap-2 (8px) between buttons
       * overflow-x-auto + scrollbar-hidden allows swipe on phone
       * padding-bottom: 2px prevents underline clipping
       */}
      <div
        className="scrollbar-hidden-mobile flex flex-shrink-0 items-center gap-2 overflow-x-auto sm:gap-4"
        style={{ margin: '10px 0 10px', paddingBottom: 3 }}
      >
        {RANGES.map(({ label, live }) => {
          const isActive = activeLabel === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setActiveLabel(label)}
              aria-pressed={isActive}
              aria-label={`Show ${RANGE_TEXT[label] ?? label} chart`}
              /* min-h-[44px] on phone meets Apple/Material touch target (skill rule touch-target-size) */
              className="relative flex min-h-[44px] flex-shrink-0 items-center gap-1 rounded-md px-2.5 pb-2 pt-2 font-mono transition-colors sm:min-h-[36px] sm:px-2 sm:pb-1.5 sm:pt-1"
              style={{
                fontSize: 'clamp(0.75rem, 2.4vw, 0.82rem)',
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'white' : 'rgba(255,255,255,0.32)',
                letterSpacing: '0.05em',
              }}
            >
              {live && (
                <span
                  className="flex-shrink-0 rounded-full"
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
                <span className="absolute bottom-0.5 left-1 right-1 rounded-full" style={{ height: 2, background: 'white' }} />
              )}
            </button>
          );
        })}
      </div>

      {/*
       * ── STAT CARDS ──────────────────────────────────────────────────────
       * Phone:  3 cards in a single ROW (grid-cols-3) — compact, no stacking
       * Tablet+: same 3-col grid, slightly more padding
       * Rule: content-priority — horizontal row saves vertical space on phone
       * Rule: spacing-scale — 4/8dp rhythm (gap-2 = 8px, gap-3 = 12px on sm+)
       */}
      <div className="grid flex-shrink-0 grid-cols-3 gap-2 sm:gap-3">
        {!hasChart || !hasPrice ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg px-2 py-2.5 sm:rounded-xl sm:px-3 sm:py-3" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="skeleton mb-1.5" style={{ width: '45%', height: '0.6rem', borderRadius: 3 }} />
              <div className="skeleton" style={{ width: '70%', height: '0.85rem', borderRadius: 3 }} />
            </div>
          ))
        ) : (
          [
            { label: 'HIGH', value: high, color: 'var(--accent-green)' },
            { label: 'AVG', value: hasAvg ? avgPrice : null, color: 'var(--accent-bitcoin)' },
            { label: 'LOW', value: low, color: 'var(--accent-red)' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-lg px-2 py-2.5 text-center sm:rounded-xl sm:px-3 sm:py-3"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <div
                className="font-mono font-bold uppercase tracking-widest"
                style={{ fontSize: 'clamp(0.58rem, 1.6vw, 0.62rem)', color, marginBottom: 4 }}
              >
                {label}
              </div>
              <div
                className="flex min-h-[1.1em] items-center justify-center font-mono tabular-nums font-semibold text-white"
                style={{ fontSize: 'clamp(0.72rem, 2vw, 0.82rem)' }}
              >
                <AnimatedMetric value={value} variant="usd" decimals={0} inline />
              </div>
            </div>
          ))
        )}
      </div>
    </ModuleShell>
  );
}
