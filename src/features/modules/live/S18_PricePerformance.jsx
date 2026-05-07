import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LineSeries,
  PriceScaleMode,
} from 'lightweight-charts';
import { fetchBtcSpot } from '@/shared/services/priceApi.js';
import { fetchJson } from '@/shared/lib/api.js';
import AnimatedMetric from '@/shared/components/common/AnimatedMetric.jsx';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import { createDarkChart, CHART_FONT, PANEL_BG } from '@/shared/lib/lightweightChartConfig.js';
import { ModuleShell } from '@/shared/components/module/index.js';

const USD_COLOR = '#F7931A';
const BTC_COLOR = '#FFD700';

const COMPARISONS = [
  { label: '1 Year Ago',   daysBack: 365   },
  { label: '3 Years Ago',  daysBack: 1095  },
  { label: '5 Years Ago',  daysBack: 1825  },
  { label: '10 Years Ago', daysBack: 3650  },
  { label: '15 Years Ago', daysBack: 5475  },
  { label: '20 Years Ago', daysBack: 7300  },
];

function findClosestPoint(points, daysBack) {
  const targetTs = Date.now() - daysBack * 86_400_000;
  return points.reduce((best, p) =>
    Math.abs(p.ts - targetTs) < Math.abs(best.ts - targetTs) ? p : best
  , points[0]);
}

function formatBtc(sats) {
  if (sats == null) return '—';
  const btc = sats / 1e8;
  if (btc >= 1) return btc.toFixed(2) + ' BTC';
  if (btc >= 0.01) return btc.toFixed(4) + ' BTC';
  return btc.toFixed(6) + ' BTC';
}

function CardsView({ points, liveHomeInBtc, loading, btcError, change24h }) {
  const currentSats = liveHomeInBtc ? Math.round(liveHomeInBtc * 1e8) : null;

  const cards = useMemo(() => {
    if (!points.length) return [];
    return COMPARISONS.map((c) => {
      const pt = findClosestPoint(points, c.daysBack);
      const histSats = pt ? Math.round(pt.homeInBtc * 1e8) : null;
      const diffPct = (currentSats && histSats) ? ((currentSats - histSats) / histSats) * 100 : null;
      const improved = diffPct !== null && diffPct < 0;
      return { ...c, histSats, diffPct, improved, date: pt?.date ?? null };
    });
  }, [points, currentSats]);

  return (
    <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', padding: '0.5rem 0 0.75rem' }}>
      {/* Hero */}
      <div style={{ fontSize: 'clamp(2.5rem,8vw,4rem)', lineHeight: 1, marginBottom: '0.4rem' }}>🏠</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
        <span style={{
          display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
          backgroundColor: btcError ? 'var(--accent-red)' : '#00D897', flexShrink: 0,
          animation: btcError ? 'none' : 's17-pulse 2s ease-in-out infinite',
        }} />
        <span style={{ color: '#ffffff', fontFamily: CHART_FONT, fontSize: 'clamp(1.1rem,4vw,2rem)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          {loading ? '…' : currentSats ? formatBtc(currentSats) : '—'}
        </span>
        {Number.isFinite(change24h) && (
          <span style={{ color: change24h >= 0 ? '#00D897' : '#FF4757', fontFamily: 'monospace', fontSize: 'var(--fs-subtitle)', fontWeight: 600 }}>
            {Math.abs(change24h).toFixed(2)}% {change24h >= 0 ? '▲' : '▼'}
          </span>
        )}
      </div>

      <div style={{ color: '#888', fontFamily: CHART_FONT, fontSize: 'var(--fs-caption)', marginBottom: '1.25rem' }}>
        Median US Home Price in BTC · Live
      </div>

      {/* Cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.65rem',
        width: '100%',
        maxWidth: 780,
        padding: '0 0.75rem',
        alignItems: 'stretch',
      }}>
        {loading && (
          <div style={{ color: '#555', fontFamily: CHART_FONT, fontSize: 'var(--fs-caption)', gridColumn: '1/-1', textAlign: 'center' }}>
            Loading…
          </div>
        )}
        {!loading && cards.map((c) => (
          <div key={c.label} style={{
            background: '#1a1a1a',
            border: `1px solid ${c.improved ? '#00D89740' : c.diffPct !== null ? '#FF475740' : '#2a2a2a'}`,
            borderRadius: 10,
            padding: '0.9rem 1.1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div style={{ color: '#888', fontFamily: CHART_FONT, fontSize: 'var(--fs-caption)', marginBottom: 5 }}>
              {c.label}{c.date ? <span style={{ color: '#555', marginLeft: 6 }}>({c.date})</span> : null}
            </div>
            <div style={{ color: '#cccccc', fontFamily: CHART_FONT, fontSize: 'var(--fs-section)', fontWeight: 600, marginBottom: 4 }}>
              {c.histSats != null ? formatBtc(c.histSats) : '—'}
            </div>
            {c.diffPct !== null && (
              <div style={{ color: c.improved ? '#00D897' : '#FF4757', fontFamily: CHART_FONT, fontSize: 'var(--fs-caption)', fontWeight: 600 }}>
                {Math.abs(c.diffPct).toFixed(1)}% {c.improved ? '▼' : '▲'}
                <span style={{ color: '#555', fontWeight: 400, marginLeft: 6 }}>
                  {c.improved ? 'cheaper in BTC' : 'more expensive in BTC'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const ChartSection = memo(function ChartSection({ points, onHoverChange }) {
  const containerRef  = useRef(null);
  const chartRef      = useRef(null);
  const usdSeriesRef  = useRef(null);
  const btcSeriesRef  = useRef(null);
  const touchActiveRef = useRef(false);

  const labelMap = useMemo(() => {
    const m = new Map();
    points.forEach(p => m.set(Math.floor(p.ts / 1000), p.date ?? null));
    return m;
  }, [points]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createDarkChart(container, {
      layout: { textColor: 'rgba(255,255,255,0.38)' },
      leftPriceScale: { visible: true, borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 }, textColor: `${USD_COLOR}99` },
      rightPriceScale: { visible: true, borderVisible: false, scaleMargins: { top: 0.1, bottom: 0.1 }, textColor: `${BTC_COLOR}99`, mode: PriceScaleMode.Logarithmic },
      timeScale: { visible: true, borderVisible: false, timeVisible: false, rightOffset: 2, fixLeftEdge: true, fixRightEdge: true },
    });

    const usdSeries = chart.addSeries(LineSeries, {
      color: USD_COLOR, lineWidth: 2.5, lineType: 2, priceScaleId: 'left',
      priceLineVisible: false, lastValueVisible: false,
      crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
      crosshairMarkerBorderWidth: 2, crosshairMarkerBorderColor: PANEL_BG,
      crosshairMarkerBackgroundColor: USD_COLOR,
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
    });

    const btcSeries = chart.addSeries(LineSeries, {
      color: BTC_COLOR, lineWidth: 2.5, lineType: 2, priceScaleId: 'right',
      priceLineVisible: false, lastValueVisible: false,
      crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
      crosshairMarkerBorderWidth: 2, crosshairMarkerBorderColor: PANEL_BG,
      crosshairMarkerBackgroundColor: BTC_COLOR,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    chartRef.current = chart;
    usdSeriesRef.current = usdSeries;
    btcSeriesRef.current = btcSeries;

    const handleMove = (param) => {
      const time = typeof param?.time === 'number' ? param.time : null;
      const pt = param?.point;
      if (!pt || time === null || pt.x < 0 || pt.y < 0) {
        if (!touchActiveRef.current) onHoverChange(null);
        return;
      }
      const usdRaw = param.seriesData.get(usdSeries);
      const btcRaw = param.seriesData.get(btcSeries);
      const usd = typeof usdRaw === 'number' ? usdRaw : usdRaw?.value ?? null;
      const homeInBtc = typeof btcRaw === 'number' ? btcRaw : btcRaw?.value ?? null;
      if (!Number.isFinite(usd) && !Number.isFinite(homeInBtc)) {
        if (!touchActiveRef.current) onHoverChange(null);
        return;
      }
      onHoverChange({ usd, homeInBtc, date: labelMap.get(time) ?? null });
    };
    chart.subscribeCrosshairMove(handleMove);

    let touchX0 = 0, touchY0 = 0, scrubbing = false;
    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchX0 = e.touches[0].clientX; touchY0 = e.touches[0].clientY;
      scrubbing = false; touchActiveRef.current = false;
    };
    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const dx = Math.abs(e.touches[0].clientX - touchX0);
      const dy = Math.abs(e.touches[0].clientY - touchY0);
      if (!scrubbing && dx < 4 && dy < 4) return;
      if (!scrubbing) scrubbing = dx > dy;
      if (!scrubbing) return;
      e.preventDefault(); touchActiveRef.current = true;
      const rect = container.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const logical = chart.timeScale().coordinateToLogical(x);
      if (logical === null) return;
      const rounded = Math.round(logical);
      const usdBar = usdSeries.dataByIndex(rounded, -1);
      if (!usdBar) return;
      const btcBar = btcSeries.dataByIndex(rounded, -1);
      chart.setCrosshairPosition(usdBar.value, usdBar.time, usdSeries);
      onHoverChange({ usd: usdBar.value, homeInBtc: btcBar?.value ?? null, date: labelMap.get(typeof usdBar.time === 'number' ? usdBar.time : null) ?? null });
    };
    const onTouchEnd = () => { scrubbing = false; touchActiveRef.current = false; chart.clearCrosshairPosition(); onHoverChange(null); };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      chart.unsubscribeCrosshairMove(handleMove);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
      chart.remove();
      chartRef.current = usdSeriesRef.current = btcSeriesRef.current = null;
      touchActiveRef.current = false;
      onHoverChange(null);
    };
  }, [labelMap, onHoverChange]);

  useEffect(() => {
    const usdS = usdSeriesRef.current;
    const btcS = btcSeriesRef.current;
    const chart = chartRef.current;
    if (!usdS || !btcS || !chart || !points.length) return;

    const usdData = points.filter(p => Number.isFinite(p.usd) && Number.isFinite(p.ts)).map(p => ({ time: Math.floor(p.ts / 1000), value: p.usd }));
    const btcData = points.filter(p => Number.isFinite(p.homeInBtc) && Number.isFinite(p.ts)).map(p => ({ time: Math.floor(p.ts / 1000), value: p.homeInBtc }));

    usdS.setData(usdData);
    btcS.setData(btcData);
    chart.timeScale().fitContent();
  }, [points]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
});

function LegendPill({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}80` }} />
      <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: CHART_FONT, fontSize: 'var(--fs-micro)', letterSpacing: '0.04em' }}>{label}</span>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', gap: 2, padding: '8px 0' }}>
      {Array.from({ length: 48 }, (_, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 2, height: `${22 + Math.sin(i * 0.35) * 16 + Math.sin(i * 0.12) * 24}%`, background: 'rgba(255,255,255,0.06)', animation: `s17-pulse 1.6s ease-in-out ${i * 30}ms infinite` }} />
      ))}
    </div>
  );
}

export default function S17_PricePerformance() {
  const fetchSpot = useCallback(() => fetchBtcSpot().then(s => s ? { usd: s.usd, change24h: s.change24h } : null), []);
  const fetchHouse = useCallback(() => fetchJson('/api/s17/house-price'), []);

  const { data: btcSpot, error: btcSpotError } = useModuleData(fetchSpot);
  const { data: payload, loading } = useModuleData(fetchHouse);
  const [hoverData, setHoverData] = useState(null);
  const [isAdvanced, setIsAdvanced] = useState(false);

  const btcError = btcSpotError !== null;
  const btcUsd = btcSpot?.usd ?? null;
  const btcChange24h = btcSpot?.change24h ?? null;
  // house in BTC moves inverse to BTC price
  const homeBtcChange24h = Number.isFinite(btcChange24h) ? -btcChange24h : null;

  const points = useMemo(() => payload?.data?.points ?? [], [payload]);
  const latestPoint = points.at(-1) ?? null;
  const hoveredPt = hoverData ?? latestPoint;

  const liveHomeInBtc = (btcUsd && payload?.data?.latest_value) ? payload.data.latest_value / btcUsd : null;
  const displayUsd = hoveredPt?.usd ?? payload?.data?.latest_value ?? null;
  const displayBtc = hoverData ? hoveredPt?.homeInBtc : (liveHomeInBtc ?? hoveredPt?.homeInBtc ?? null);

  const firstPt = points[0] ?? null;
  const usdDeltaPct = (firstPt && latestPoint) ? ((latestPoint.usd - firstPt.usd) / firstPt.usd) * 100 : null;
  const btcDeltaPct = (firstPt && latestPoint) ? ((latestPoint.homeInBtc - firstPt.homeInBtc) / firstPt.homeInBtc) * 100 : null;

  const fredQuarter = payload?.data?.quarter_label ?? null;
  const handleHover = useCallback(d => setHoverData(d), []);

  const isResponsive = typeof window !== 'undefined' && window.innerWidth < 1024;

  return (
    <ModuleShell style={{ padding: 'clamp(0.6rem,1.8vw,1rem) clamp(0.75rem,2vw,1.25rem) clamp(0.4rem,1vw,0.6rem)' }}>
      <style>{`
        @keyframes s17-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @media (prefers-reduced-motion:reduce){ *{animation-duration:.01ms!important;transition-duration:.01ms!important;} }
      `}</style>

      {/* Header */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: 'clamp(0.4rem,1.2vw,0.75rem)' }}>

        {/* Toggle button */}
        <button
          onClick={() => { setIsAdvanced(v => !v); setHoverData(null); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem',
            borderRadius: 20,
            border: `1px solid ${isAdvanced ? USD_COLOR : 'rgba(255,255,255,0.15)'}`,
            background: isAdvanced ? `${USD_COLOR}20` : 'rgba(255,255,255,0.05)',
            color: isAdvanced ? USD_COLOR : 'rgba(255,255,255,0.5)',
            fontFamily: CHART_FONT,
            fontSize: 'var(--fs-micro)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '0.7rem' }}>⚡</span>
          ADVANCED
        </button>

        {/* Metrics — only in advanced mode */}
        {isAdvanced && (
          <div style={{ display: 'flex', gap: 'clamp(0.75rem, 2vw, 2rem)', alignItems: 'flex-start', flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: CHART_FONT, fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem', minHeight: '1.2em' }}>
                {hoverData ? hoverData.date : (fredQuarter ?? 'Median (USD)')}
              </div>
              <div style={{ fontFamily: CHART_FONT, fontSize: 'clamp(0.9rem, 2.5vw, 1.6rem)', fontWeight: 700, color: USD_COLOR, letterSpacing: '-0.02em', lineHeight: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                <AnimatedMetric value={displayUsd} variant="usd" decimals={0} disabled={isResponsive} />
                {Number.isFinite(usdDeltaPct) && !hoverData && (
                  <span style={{ fontSize: 'var(--fs-micro)', fontWeight: 400, color: usdDeltaPct >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginLeft: '0.4rem' }}>{usdDeltaPct >= 0 ? '↑' : '↓'} {Math.abs(usdDeltaPct).toFixed(1)}%</span>
                )}
              </div>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.12)', marginTop: 4 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: CHART_FONT, fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem', minHeight: '1.2em' }}>
                {hoverData ? hoverData.date : 'Median (BTC)'}
                {!hoverData && <span style={{ width: 5, height: 5, borderRadius: '50%', background: btcError ? 'var(--accent-red)' : 'var(--accent-green)', display: 'inline-block', animation: btcError ? 'none' : 's17-pulse 2s ease-in-out infinite' }} />}
              </div>
              <div style={{ fontFamily: CHART_FONT, fontSize: 'clamp(0.9rem, 2.5vw, 1.6rem)', fontWeight: 700, color: BTC_COLOR, letterSpacing: '-0.02em', lineHeight: 1, display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                {Number.isFinite(displayBtc) ? (
                  <AnimatedMetric value={displayBtc} decimals={2} prefix="₿ " color={BTC_COLOR} disabled={isResponsive} />
                ) : '—'}
                {Number.isFinite(btcDeltaPct) && !hoverData && (
                  <span style={{ fontSize: 'var(--fs-micro)', fontWeight: 400, color: btcDeltaPct <= 0 ? 'var(--accent-green)' : 'var(--accent-red)', marginLeft: '0.4rem' }}>{btcDeltaPct <= 0 ? '↓' : '↑'} {Math.abs(btcDeltaPct).toFixed(1)}%</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      {isAdvanced ? (
        <>
          <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative', margin: '0 -4px' }}>
            {loading ? <SkeletonChart /> : points.length > 1 ? <ChartSection points={points} onHoverChange={handleHover} /> : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.3)', fontFamily: CHART_FONT, fontSize: 'var(--fs-micro)' }}>Data unavailable — Zatobox or Binance unreachable</div>
            )}
          </div>
          <div style={{ flexShrink: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.4rem 1rem', marginTop: 'clamp(0.35rem,1vw,0.55rem)' }}>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <LegendPill color={USD_COLOR} label="Real Estate / USD (Left)" />
              <LegendPill color={BTC_COLOR} label="Real Estate / BTC (Right)" />
            </div>
          </div>
        </>
      ) : (
        <CardsView
          points={points}
          liveHomeInBtc={liveHomeInBtc}
          loading={loading}
          btcError={btcError}
          change24h={homeBtcChange24h}
        />
      )}
    </ModuleShell>
  );
}
