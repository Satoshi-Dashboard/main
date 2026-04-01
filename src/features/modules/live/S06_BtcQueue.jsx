import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LineSeries } from 'lightweight-charts';
import { createDarkChart, CHART_FONT } from '@/shared/lib/lightweightChartConfig.js';
import { fetchJohoeHistory } from '@/shared/services/btcQueueApi.js';
import { useModuleData } from '@/shared/hooks/useModuleData.js';
import { ModuleShell } from '@/shared/components/module/index.js';

const METRIC_OPTIONS = [
  { key: 'count', label: 'COUNT' },
  { key: 'fee', label: 'FEE' },
  { key: 'weight', label: 'WEIGHT' },
];

function satsToBtc(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric / 1e8 : 0;
}

const METRIC_META = {
  count: {
    label: 'TX COUNT',
    color: 'rgba(255,255,255,0.78)',
    heroLabel: 'Pending Transaction Count in BTC',
    bandLabel: 'Transactions',
    formatValue: (v) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(v),
    formatFull: (v) => new Intl.NumberFormat('en-US').format(Math.round(v)),
  },
  fee: {
    label: 'TOTAL FEES',
    color: 'var(--accent-bitcoin)',
    heroLabel: 'Pending Transaction Fee in BTC',
    bandLabel: 'BTC',
    formatValue: (v) => `${satsToBtc(v).toFixed(4)} BTC`,
    formatFull: (v) => satsToBtc(v).toFixed(6),
  },
  weight: {
    label: 'QUEUE WEIGHT',
    color: '#7FC4FF',
    heroLabel: 'Mempool Weight (vMB)',
    bandLabel: 'vMB',
    formatValue: (v) => `${(v / 1e6).toFixed(2)} vMB`,
    formatFull: (v) => `${(v / 1e6).toFixed(4)} vMB`,
  },
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toTimestampMs(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return numeric > 1e12 ? numeric : numeric * 1000;
}

function toTimestampSeconds(value) {
  const timestampMs = toTimestampMs(value);
  return Number.isFinite(timestampMs) ? Math.floor(timestampMs / 1000) : null;
}

function hexToRgb(hex) {
  const normalized = String(hex || '').trim().replace('#', '');
  const safeHex = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  if (!/^[0-9a-f]{6}$/i.test(safeHex)) {
    return null;
  }

  return {
    r: parseInt(safeHex.slice(0, 2), 16),
    g: parseInt(safeHex.slice(2, 4), 16),
    b: parseInt(safeHex.slice(4, 6), 16),
  };
}

function rgba(color, alpha) {
  const rgb = hexToRgb(color);
  if (rgb) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  const rgbMatch = String(color || '').match(/rgba?\(([^)]+)\)/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(',').map((part) => Number(part.trim())).filter(Number.isFinite);
    if (parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
  }

  return color;
}

function softenLineColor(color, index, total) {
  const ratio = total > 1 ? index / (total - 1) : 0;
  if (ratio >= 0.82) return mixHex(color, '#ffb3a7', 0.42);
  if (ratio >= 0.64) return mixHex(color, '#ffd27a', 0.18);
  return color;
}

function mixHex(colorA, colorB, weight = 0.5) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  if (!a || !b) return colorA;

  const mix = (first, second) => Math.round((first * (1 - weight)) + (second * weight));
  return `rgb(${mix(a.r, b.r)}, ${mix(a.g, b.g)}, ${mix(a.b, b.b)})`;
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return '';

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatMetaTimestamp(value) {
  const timestamp = Date.parse(String(value || ''));
  if (!Number.isFinite(timestamp)) return '—';
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatAgeLabel(ageMs) {
  if (!Number.isFinite(ageMs) || ageMs < 0) return 'age unknown';
  const minutes = Math.round(ageMs / 60_000);
  if (minutes < 1) return '<1m old';
  if (minutes < 60) return `${minutes}m old`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m old` : `${hours}h old`;
}

function BandLegend({ bands }) {
  return (
    <div className="scrollbar-hidden-mobile flex gap-2 overflow-x-auto pb-1">
      {bands.slice().reverse().map((band) => (
        <div
          key={band.key}
          className="inline-flex min-h-[32px] items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 font-mono"
          style={{ fontSize: 'var(--fs-micro)', color: 'rgba(255,255,255,0.72)' }}
        >
          <span
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              flexShrink: 0,
              background: band.color,
              boxShadow: `0 0 8px ${rgba(band.color, 0.55)}`,
            }}
          />
          <span>{band.label}</span>
        </div>
      ))}
    </div>
  );
}

function MetricSelector({ active, onChange }) {
  return (
    <div className="scrollbar-hidden-mobile flex w-full flex-shrink-0 items-center gap-2 overflow-x-auto sm:w-auto sm:justify-end sm:gap-4">
      {METRIC_OPTIONS.map((metric) => (
        <button
          key={metric.key}
          type="button"
          onClick={() => onChange(metric.key)}
          aria-pressed={active === metric.key}
          className="relative flex min-h-[44px] flex-shrink-0 items-center rounded-md px-2.5 pb-2 pt-2 font-mono transition-colors sm:min-h-[36px] sm:px-2 sm:pb-1.5 sm:pt-1"
          style={{
            fontSize: 'clamp(0.75rem, 2.4vw, 0.82rem)',
            fontWeight: active === metric.key ? 700 : 400,
            color: active === metric.key ? 'white' : 'rgba(255,255,255,0.38)',
            letterSpacing: '0.05em',
          }}
        >
          {metric.label}
          {active === metric.key ? (
            <span className="absolute bottom-0.5 left-1 right-1 rounded-full" style={{ height: 2, background: 'white' }} />
          ) : null}
        </button>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full min-h-[240px] items-end gap-px pb-1 sm:min-h-[280px]">
      {Array.from({ length: 48 }, (_, index) => (
        <div
          key={index}
          className="skeleton flex-1"
          style={{
            height: `${28 + Math.sin(index * 0.37) * 18 + Math.sin(index * 0.14) * 24}%`,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

function ErrorPanel({ onRetry }) {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center px-5 py-6 text-center sm:min-h-[220px]">
      <div className="max-w-md font-mono">
        <div style={{ color: 'var(--accent-warning)', fontSize: 'var(--fs-label)', fontWeight: 700 }}>
          Queue feed unavailable
        </div>
        <div className="mt-3 text-white/60" style={{ fontSize: 'var(--fs-caption)', lineHeight: 1.65 }}>
          The BTC queue history could not be loaded. Retry in a moment or keep the current page open while the cache recovers.
        </div>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color:var(--accent-bitcoin)] px-4 py-2 text-[12px] uppercase tracking-[0.18em] text-[color:var(--accent-bitcoin)] transition hover:bg-[rgba(247,147,26,0.08)] hover:text-white"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function S06_BtcQueue() {
  const activeRange = '24h';
  const [activeMetric, setActiveMetric] = useState('count');
  const [hoverIndex, setHoverIndex] = useState(null);
  const [hoverCoords, setHoverCoords] = useState(null);
  const [zoomRange, setZoomRange] = useState(null);
  const [selectionBox, setSelectionBox] = useState(null);

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRefs = useRef([]);
  const hoverSeriesRef = useRef(null);
  const timeToIndexRef = useRef(new Map());
  const zoomRangeRef = useRef(null);
  const pointCountRef = useRef(0);
  const interactionRef = useRef({
    selecting: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    pinchDistance: null,
    pinchRange: null,
    touchMode: null,
    lastTapAt: 0,
  });

  const fetchHistory = useCallback(() => fetchJohoeHistory(), []);

  const {
    data: historyPayload,
    loading,
    error,
    refetch,
  } = useModuleData(fetchHistory, {
    refreshMs: 60_000,
    keepPreviousOnError: true,
  });
  const historyData = historyPayload?.data || null;

  // Parse bands from API data (scraper returns bands at root level)
  const bands = useMemo(() => {
    if (!historyData?.bands) return [];
    return historyData.bands.map((band, index, allBands) => ({
      key: band.key || `band-${index}`,
      label: band.label || band.key || `${index}`,
      longLabel: band.longLabel || band.label || `${index}`,
      color: band.color || `hsl(${(index * 360) / 8}, 70%, 60%)`,
      lineColor: softenLineColor(band.color || `hsl(${(index * 360) / 8}, 70%, 60%)`, index, allBands.length),
      fillAlpha: 0.24 + ((index / Math.max(1, allBands.length - 1)) * 0.46),
      minFee: band.minFee || band.min_fee || 0,
    }));
  }, [historyData]);

  const normalizedPoints = useMemo(() => {
    const pointPayload = historyData?.points || historyData?.preview;
    if (!pointPayload) return [];

    if (Array.isArray(pointPayload)) {
      return pointPayload
        .map((point) => {
          const sourceTimestamp = point?.snapshot_ts_unix ?? point?.timestamp;
          const timestampSeconds = toTimestampSeconds(sourceTimestamp);
          const timestampMs = toTimestampMs(sourceTimestamp);
          if (!Number.isFinite(timestampSeconds) || !Number.isFinite(timestampMs)) return null;

          return {
            timestampSeconds,
            timestampMs,
            snapshotTs: typeof point?.snapshot_ts === 'string' ? point.snapshot_ts : point?.date,
            fetchedAt: typeof point?.fetched_at === 'string' ? point.fetched_at : point?.fetchedAt,
            countBuckets: Array.isArray(point?.countBuckets) ? point.countBuckets : [],
            weightBuckets: Array.isArray(point?.weightBuckets) ? point.weightBuckets : [],
            feeBuckets: Array.isArray(point?.feeBuckets) ? point.feeBuckets : [],
            totals: {
              count: Number(point?.countTotal) || 0,
              weight: Number(point?.weightTotal) || 0,
              fee: Number(point?.feeTotal) || 0,
            },
          };
        })
        .filter(Boolean);
    }

    const ts = Array.isArray(pointPayload?.ts) ? pointPayload.ts : [];
    const snapshotTs = Array.isArray(pointPayload?.snapshot_ts) ? pointPayload.snapshot_ts : [];
    const fetchedAt = Array.isArray(pointPayload?.fetched_at) ? pointPayload.fetched_at : [];
    const seriesByMetric = pointPayload?.series || {};
    const totalsByMetric = pointPayload?.totals || {};

    return ts
      .map((rawTs, pointIndex) => {
        const timestampSeconds = toTimestampSeconds(rawTs);
        const timestampMs = toTimestampMs(rawTs);
        if (!Number.isFinite(timestampSeconds) || !Number.isFinite(timestampMs)) return null;

        return {
          timestampSeconds,
          timestampMs,
          snapshotTs: typeof snapshotTs?.[pointIndex] === 'string' ? snapshotTs[pointIndex] : null,
          fetchedAt: typeof fetchedAt?.[pointIndex] === 'string' ? fetchedAt[pointIndex] : null,
          countBuckets: Array.isArray(seriesByMetric?.count)
            ? seriesByMetric.count.map((bandSeries) => Number(bandSeries?.[pointIndex]) || 0)
            : [],
          weightBuckets: Array.isArray(seriesByMetric?.weight)
            ? seriesByMetric.weight.map((bandSeries) => Number(bandSeries?.[pointIndex]) || 0)
            : [],
          feeBuckets: Array.isArray(seriesByMetric?.fee)
            ? seriesByMetric.fee.map((bandSeries) => Number(bandSeries?.[pointIndex]) || 0)
            : [],
          totals: {
            count: Number(totalsByMetric?.count?.[pointIndex]) || 0,
            weight: Number(totalsByMetric?.weight?.[pointIndex]) || 0,
            fee: Number(totalsByMetric?.fee?.[pointIndex]) || 0,
          },
        };
      })
      .filter(Boolean);
  }, [historyData]);

  // Build chart points from API data.
  const chartPoints = useMemo(() => {
    if (!normalizedPoints.length || !bands.length) return [];
    const bucketKey = `${activeMetric}Buckets`;

    const uniquePointsMap = new Map();
    normalizedPoints.forEach((point) => {
      uniquePointsMap.set(point.timestampSeconds, point);
    });
    const sortedPoints = Array.from(uniquePointsMap.values()).sort((a, b) => a.timestampSeconds - b.timestampSeconds);

    return sortedPoints.map((point, pointIndex) => {
      const bucketArray = point[bucketKey] || [];
      let runningTotal = 0;
      const stacks = bands.map((band, bandIndex) => {
        const value = Number(bucketArray[bandIndex]) || 0;
        const lower = runningTotal;
        const upper = runningTotal + value;
        runningTotal = upper;

        return {
          key: band.key,
          label: band.label,
          longLabel: band.longLabel,
          color: band.color,
          fillAlpha: band.fillAlpha,
          minFee: band.minFee,
          value,
          lower,
          upper,
        };
      });

      return {
        time: point.timestampSeconds,
        timestamp: point.timestampMs,
        pointIndex,
        total: Number(point?.totals?.[activeMetric]) || runningTotal,
        totals: point.totals,
        stacks,
      };
    });
  }, [activeMetric, bands, normalizedPoints]);

  const stackedSeriesData = useMemo(() => {
    if (!chartPoints.length || !bands.length) return [];

    return bands.map((band, bandIndex) => ({
      band,
      data: chartPoints.map((point) => ({
        time: point.time,
        value: Number(point.stacks?.[bandIndex]?.upper) || 0,
      })),
    }));
  }, [bands, chartPoints]);

  // Build time to index map
  const timeToIndex = useMemo(() => {
    const map = new Map();
    chartPoints.forEach((point) => {
      map.set(point.time, point.pointIndex);
    });
    return map;
  }, [chartPoints]);

  useEffect(() => {
    timeToIndexRef.current = timeToIndex;
  }, [timeToIndex]);

  useEffect(() => {
    zoomRangeRef.current = zoomRange;
  }, [zoomRange]);

  useEffect(() => {
    pointCountRef.current = chartPoints.length;
  }, [chartPoints]);

  // Latest values (last point in the series)
  const latestValues = useMemo(() => {
    const latestPoint = historyData?.latest;
    if (latestPoint?.totals) {
      return {
        count: Number(latestPoint.totals.count) || 0,
        fee: Number(latestPoint.totals.fee) || 0,
        weight: Number(latestPoint.totals.weight) || 0,
      };
    }

    if (!chartPoints.length) return null;
    const lastPoint = chartPoints[chartPoints.length - 1];
    if (!lastPoint) return null;
    return {
      count: Number(lastPoint?.totals?.count) || 0,
      fee: Number(lastPoint?.totals?.fee) || 0,
      weight: Number(lastPoint?.totals?.weight) || 0,
    };
  }, [chartPoints, historyData]);

  const heroValue = latestValues?.[activeMetric] ?? null;
  const meta = METRIC_META[activeMetric];

  // 24h average — FEE: promedio por banda primero, luego se unifica sumando
  const avg24h = useMemo(() => {
    if (!normalizedPoints.length || !bands.length) return null;
    const n = normalizedPoints.length;
    const count = normalizedPoints.reduce((s, p) => s + (p.totals.count || 0), 0) / n;
    const weight = normalizedPoints.reduce((s, p) => s + (p.totals.weight || 0), 0) / n;
    const feeBandAvgs = bands.map((_, i) =>
      normalizedPoints.reduce((s, p) => s + (p.feeBuckets[i] || 0), 0) / n
    );
    const fee = feeBandAvgs.reduce((s, v) => s + v, 0);
    return { count, weight, fee };
  }, [normalizedPoints, bands]);
  const sourceSnapshotAt = historyPayload?.source_snapshot_at || historyData?.latest?.snapshot_ts || null;
  const sourceFetchedAt = historyPayload?.source_fetched_at || historyData?.latest?.fetched_at || null;
  const sourceAgeMs = Number(historyPayload?.source_age_ms);
  const sourceStale = Boolean(historyPayload?.source_stale || historyPayload?.is_fallback);
  const sourceStatusLabel = sourceStale ? 'STALE 24H FEED' : 'LIVE 24H FEED';
  const sourceStatusColor = sourceStale ? 'var(--accent-warning)' : 'var(--accent-bitcoin)';
  const sourceDetail = historyPayload?.fallback_note || formatAgeLabel(sourceAgeMs);

  // Hover state
  const hoverPoint = hoverIndex !== null ? chartPoints[hoverIndex] || null : null;
  const tooltipBands = useMemo(() => {
    if (!hoverPoint?.stacks) return [];
    return hoverPoint.stacks
      .filter((band) => band.value > 0)
      .slice()
      .sort((a, b) => (Number(b.minFee) || 0) - (Number(a.minFee) || 0));
  }, [hoverPoint]);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const tooltipPosition = useMemo(() => {
    if (hoverIndex === null || !hoverCoords) return null;
    const { width, height } = containerSize;
    const tooltipWidth = 244;
    const tooltipHeight = 188;
    const offset = 14;
    const placeRight = hoverCoords.x < width - tooltipWidth - 24;
    const placeBelow = hoverCoords.y < height - tooltipHeight - 24;

    return {
      left: clamp(
        placeRight ? hoverCoords.x + offset : hoverCoords.x - tooltipWidth - offset,
        10,
        Math.max(10, width - tooltipWidth - 10),
      ),
      top: clamp(
        placeBelow ? hoverCoords.y + offset : hoverCoords.y - tooltipHeight - offset,
        10,
        Math.max(10, height - tooltipHeight - 10),
      ),
    };
  }, [containerSize, hoverCoords, hoverIndex]);

  // Container resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateSize = () => {
      setContainerSize({
        width: container.clientWidth || 0,
        height: container.clientHeight || 0,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Chart setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const chart = createDarkChart(container, {
      localization: { locale: 'en-US' },
      crosshair: {
        vertLine: { color: 'rgba(255,255,255,0.22)' },
        horzLine: { color: 'rgba(255,255,255,0.10)' },
      },
      rightPriceScale: { visible: false, borderVisible: false, scaleMargins: { top: 0.06, bottom: 0.02 } },
      leftPriceScale: { visible: false, borderVisible: false },
      timeScale: {
        visible: false,
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 0,
        barSpacing: 7,
        minBarSpacing: 1.4,
      },
      handleScroll: false,
      handleScale: false,
    });

    chartRef.current = chart;
    seriesRefs.current = [];
    hoverSeriesRef.current = null;

    const clearHover = () => {
      setHoverIndex(null);
      setHoverCoords(null);
    };

    const getMaxIndex = () => Math.max(0, pointCountRef.current - 1);
    const getDefaultRange = () => ({ from: 0, to: getMaxIndex() });
    const getCurrentRange = () => chart.timeScale().getVisibleLogicalRange() || zoomRangeRef.current || getDefaultRange();
    const applyRange = (nextFrom, nextTo) => {
      const maxIndex = getMaxIndex();
      const minSpan = Math.min(24, maxIndex + 1);
      let from = Number(nextFrom);
      let to = Number(nextTo);

      if (!Number.isFinite(from) || !Number.isFinite(to)) return;
      if (to < from) {
        const swap = from;
        from = to;
        to = swap;
      }

      if ((to - from) < minSpan) {
        const center = (from + to) / 2;
        from = center - (minSpan / 2);
        to = center + (minSpan / 2);
      }

      if (from < 0) {
        to += -from;
        from = 0;
      }
      if (to > maxIndex) {
        from -= (to - maxIndex);
        to = maxIndex;
      }

      from = Math.max(0, from);
      to = Math.min(maxIndex, to);

      chart.timeScale().setVisibleLogicalRange({ from, to });
      setZoomRange({ from, to });
    };
    const resetZoom = () => {
      setZoomRange(null);
      setSelectionBox(null);
      chart.timeScale().fitContent();
    };

    const handleCrosshairMove = (param) => {
      if (interactionRef.current.selecting || interactionRef.current.touchMode === 'pinch') return;
      const point = param?.point;
      const time = typeof param?.time === 'number' ? param.time : null;
      if (!point || time === null || point.x < 0 || point.y < 0) {
        clearHover();
        return;
      }

      const pointIndex = timeToIndexRef.current.get(time);
      if (!Number.isInteger(pointIndex)) {
        clearHover();
        return;
      }

      setHoverIndex(pointIndex);
      setHoverCoords({ x: point.x, y: point.y });
    };

    const handleWheel = (event) => {
      if (!pointCountRef.current) return;
      event.preventDefault();

      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const logicalAtPointer = chart.timeScale().coordinateToLogical(x);
      const current = getCurrentRange();
      const span = Math.max(24, current.to - current.from);
      const nextSpan = clamp(span * (event.deltaY > 0 ? 1.14 : 0.84), 24, Math.max(24, pointCountRef.current - 1));
      const center = Number.isFinite(logicalAtPointer) ? logicalAtPointer : (current.from + current.to) / 2;
      applyRange(center - (nextSpan / 2), center + (nextSpan / 2));
    };

    const finishSelection = (clientX) => {
      if (!interactionRef.current.selecting) return;

      const rect = container.getBoundingClientRect();
      const startX = clamp(interactionRef.current.startX - rect.left, 0, rect.width);
      const endX = clamp(clientX - rect.left, 0, rect.width);
      const distance = Math.abs(endX - startX);

      interactionRef.current.selecting = false;
      interactionRef.current.pointerId = null;

      if (distance >= 18) {
        const fromLogical = chart.timeScale().coordinateToLogical(Math.min(startX, endX));
        const toLogical = chart.timeScale().coordinateToLogical(Math.max(startX, endX));
        if (Number.isFinite(fromLogical) && Number.isFinite(toLogical)) {
          applyRange(fromLogical, toLogical);
        }
      }

      setSelectionBox(null);
    };

    const handlePointerDown = (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      interactionRef.current.selecting = true;
      interactionRef.current.pointerId = event.pointerId;
      interactionRef.current.startX = event.clientX;
      interactionRef.current.startY = event.clientY;
      clearHover();
      setSelectionBox({ left: event.offsetX, width: 0 });
      container.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
      if (!interactionRef.current.selecting || interactionRef.current.pointerId !== event.pointerId) return;
      const rect = container.getBoundingClientRect();
      const start = clamp(interactionRef.current.startX - rect.left, 0, rect.width);
      const current = clamp(event.clientX - rect.left, 0, rect.width);
      setSelectionBox({ left: Math.min(start, current), width: Math.abs(current - start) });
    };

    const handlePointerUp = (event) => {
      finishSelection(event.clientX);
      container.releasePointerCapture?.(event.pointerId);
    };

    const touchDistance = (touchA, touchB) => Math.hypot(touchA.clientX - touchB.clientX, touchA.clientY - touchB.clientY);
    const touchCenterX = (touchA, touchB, rect) => (((touchA.clientX + touchB.clientX) / 2) - rect.left);

    const handleTouchStart = (event) => {
      const now = Date.now();

      if (event.touches.length === 2) {
        interactionRef.current.touchMode = 'pinch';
        interactionRef.current.pinchDistance = touchDistance(event.touches[0], event.touches[1]);
        interactionRef.current.pinchRange = getCurrentRange();
        clearHover();
        return;
      }

      if (event.touches.length === 1) {
        interactionRef.current.startX = event.touches[0].clientX;
        interactionRef.current.startY = event.touches[0].clientY;
        interactionRef.current.touchMode = zoomRange ? 'pan' : 'scrub';

        if (now - interactionRef.current.lastTapAt < 280) {
          resetZoom();
        }
        interactionRef.current.lastTapAt = now;
      }
    };

    const handleTouchMove = (event) => {
      if (!pointCountRef.current) return;

      if (event.touches.length === 2 && interactionRef.current.touchMode === 'pinch') {
        event.preventDefault();
        const rect = container.getBoundingClientRect();
        const nextDistance = touchDistance(event.touches[0], event.touches[1]);
        const startDistance = interactionRef.current.pinchDistance || nextDistance;
        const baseRange = interactionRef.current.pinchRange || getCurrentRange();
        const centerX = touchCenterX(event.touches[0], event.touches[1], rect);
        const logicalCenter = chart.timeScale().coordinateToLogical(centerX);
        const scale = startDistance > 0 ? startDistance / nextDistance : 1;
        const span = Math.max(24, (baseRange.to - baseRange.from) * scale);
        const center = Number.isFinite(logicalCenter) ? logicalCenter : (baseRange.from + baseRange.to) / 2;
        applyRange(center - (span / 2), center + (span / 2));
        return;
      }

      if (event.touches.length !== 1) return;

      const touch = event.touches[0];
      const rect = container.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const dx = touch.clientX - interactionRef.current.startX;
      const dy = touch.clientY - interactionRef.current.startY;

      if (interactionRef.current.touchMode === 'pan' && zoomRangeRef.current && Math.abs(dx) > Math.abs(dy)) {
        event.preventDefault();
        const current = getCurrentRange();
        const span = current.to - current.from;
        const logical = chart.timeScale().coordinateToLogical(x);
        const origin = chart.timeScale().coordinateToLogical(interactionRef.current.startX - rect.left);
        if (Number.isFinite(logical) && Number.isFinite(origin)) {
          const shift = origin - logical;
          applyRange(current.from + shift, current.from + shift + span);
          interactionRef.current.startX = touch.clientX;
          interactionRef.current.startY = touch.clientY;
        }
        return;
      }

      if (Math.abs(dx) <= Math.abs(dy)) return;

      event.preventDefault();
      const logical = chart.timeScale().coordinateToLogical(x);
      if (logical === null) return;

      const rounded = Math.round(logical);
      const hoverSeries = hoverSeriesRef.current;
      const bar = hoverSeries?.dataByIndex?.(rounded, -1);
      if (!bar || typeof bar.time !== 'number') return;

      chart.setCrosshairPosition(bar.value ?? 0, bar.time, hoverSeries);
      const pointIndex = timeToIndexRef.current.get(bar.time);
      if (!Number.isInteger(pointIndex)) return;
      setHoverIndex(pointIndex);
      setHoverCoords({ x, y });
    };

    const handleTouchEnd = () => {
      interactionRef.current.touchMode = null;
      interactionRef.current.pinchDistance = null;
      interactionRef.current.pinchRange = null;
      chart.clearCrosshairPosition();
    };

    const handlePointerCancel = () => {
      interactionRef.current.selecting = false;
      interactionRef.current.pointerId = null;
      setSelectionBox(null);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerCancel);
    container.addEventListener('dblclick', resetZoom);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    chart.subscribeCrosshairMove(handleCrosshairMove);

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerCancel);
      container.removeEventListener('dblclick', resetZoom);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      chart.remove();
      chartRef.current = null;
      seriesRefs.current = [];
      hoverSeriesRef.current = null;
      setHoverIndex(null);
      setHoverCoords(null);
    };
  }, []);

  // Update chart data
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !stackedSeriesData.length) return;

    const existingSeries = seriesRefs.current;
    if (existingSeries.length) {
      existingSeries.forEach((series) => chart.removeSeries(series));
    }

    const nextSeries = [];
    stackedSeriesData.forEach(({ band, data }, index) => {
      const lineSeries = chart.addSeries(LineSeries, {
        color: rgba(band.lineColor || band.color, index >= stackedSeriesData.length - 2 ? 0.84 : 0.92),
        lineWidth: index === stackedSeriesData.length - 1 ? 1.35 : index >= stackedSeriesData.length - 3 ? 2.9 : 2.15,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      lineSeries.setData(data);
      nextSeries.push(lineSeries);
    });

    seriesRefs.current = nextSeries;
    hoverSeriesRef.current = nextSeries[nextSeries.length - 1] || null;

    const activeZoom = zoomRangeRef.current;
    if (
      activeZoom
      && Number.isFinite(activeZoom.from)
      && Number.isFinite(activeZoom.to)
      && activeZoom.to > activeZoom.from
    ) {
      chart.timeScale().setVisibleLogicalRange(activeZoom);
      return;
    }

    chart.timeScale().fitContent();
  }, [stackedSeriesData]);

  const showError = !loading && !chartPoints.length && error;
  const showEmpty = !loading && !chartPoints.length && !error;

  return (
    <ModuleShell className="px-3.5 pb-3 pt-3 sm:px-5 sm:pb-4 sm:pt-4 lg:px-[22px] lg:pb-4 lg:pt-5">
      {/* Header */}
      <div className="flex flex-shrink-0 flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div className="min-w-0 flex-1">
          {loading && !heroValue ? (
            <>
              <div className="skeleton max-w-full" style={{ width: 'min(220px, 72vw)', height: 'clamp(1.8rem,6vw,2.9rem)', borderRadius: 6, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 'min(210px, 65vw)', height: '0.9rem', borderRadius: 4 }} />
            </>
          ) : (
            <>
              <div
                className="font-mono font-bold lg:hidden"
                style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-subtitle)' }}
              >
                BTC Queue
              </div>

              <div
                className="mt-2 flex max-w-full items-baseline font-mono font-bold tabular-nums leading-none text-white"
                style={{ fontSize: 'clamp(1.45rem, 5.2vw, 2.9rem)' }}
              >
                {heroValue !== null ? meta.formatValue(heroValue) : '—'}
              </div>

              <div
                className="mt-1.5 flex max-w-full flex-wrap items-center gap-x-1 gap-y-0.5 font-mono tabular-nums sm:mt-2"
                style={{ fontSize: 'clamp(0.72rem, 2.2vw, 0.82rem)' }}
              >
                <span style={{ color: 'var(--accent-bitcoin)' }}>{meta.heroLabel}</span>
              </div>

              <div className="mt-3 flex max-w-full flex-col gap-1.5 font-mono text-white/58" style={{ fontSize: 'clamp(0.67rem, 2vw, 0.76rem)' }}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="uppercase tracking-[0.16em]" style={{ color: sourceStatusColor }}>
                    {sourceStatusLabel}
                  </span>
                  <span>{sourceDetail}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Source snapshot: {formatMetaTimestamp(sourceSnapshotAt)}</span>
                  <span>Last sync: {formatMetaTimestamp(sourceFetchedAt)}</span>
                </div>
                {avg24h && heroValue !== null && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                    <span className="uppercase tracking-[0.16em] text-white/40">24H AVG</span>
                    <span style={{ color: meta.color }}>{meta.formatValue(avg24h[activeMetric])}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <MetricSelector active={activeMetric} onChange={setActiveMetric} />
      </div>

      {/* Chart area */}
      <div
        ref={containerRef}
        className="visual-chart-surface relative mt-3 min-h-[240px] flex-1 sm:mt-4 sm:min-h-[280px]"
        style={{ margin: '12px -2px 0', flex: '1 1 0', touchAction: 'pan-y' }}
      >
        {loading && !chartPoints.length ? (
          <LoadingSkeleton />
        ) : showError ? (
          <ErrorPanel onRetry={refetch} />
        ) : showEmpty ? (
          <div className="flex h-full min-h-[180px] items-center justify-center px-5 py-6 text-center sm:min-h-[220px]">
            <div className="max-w-md font-mono">
              <div style={{ color: 'var(--accent-warning)', fontSize: 'var(--fs-label)', fontWeight: 700 }}>
                No queue history yet
              </div>
              <div className="mt-3 text-white/60" style={{ fontSize: 'var(--fs-caption)', lineHeight: 1.65 }}>
                The approved API responded without usable chart points for this range. Try another range or wait for the next upstream snapshot.
              </div>
            </div>
          </div>
        ) : null}

        {selectionBox?.width > 0 ? (
          <div
            className="pointer-events-none absolute inset-y-2 z-[1] rounded-md border border-[rgba(247,147,26,0.55)] bg-[rgba(247,147,26,0.14)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            style={{ left: selectionBox.left, width: selectionBox.width }}
          />
        ) : null}

        {/* Tooltip */}
        {hoverPoint && tooltipPosition && !selectionBox?.width ? (
          <div
            className="pointer-events-none absolute z-[2] min-w-[228px] max-w-[268px] rounded-xl border border-white/10 bg-[rgba(9,12,18,0.97)] px-3 py-3 shadow-[0_12px_28px_rgba(0,0,0,0.38)]"
            style={{
              left: tooltipPosition.left,
              top: tooltipPosition.top,
              fontFamily: CHART_FONT,
            }}
          >
            <div className="uppercase tracking-[0.14em] text-white/55" style={{ fontSize: '11px' }}>
              {formatDate(hoverPoint.timestamp, activeRange)}
            </div>
            <div className="mt-2 text-white/90" style={{ fontSize: '12px' }}>
              <span className="text-white/55">{meta.bandLabel}: </span>
              <span>{meta.formatFull(hoverPoint.total)}</span>
            </div>
            <div className="mt-2 border-t border-white/8 pt-2">
              <div className="uppercase tracking-[0.14em] text-white/42" style={{ fontSize: '10px' }}>
                Fee Range (sat/vB) → {meta.bandLabel}
              </div>
              <div className="mt-1.5 space-y-1.5">
                {tooltipBands.map((band) => (
                  <div
                    key={band.key}
                    className="flex items-start justify-between gap-3"
                    style={{ fontSize: '11px' }}
                  >
                    <div className="flex min-w-0 gap-2">
                      <span
                        className="mt-[4px] h-[7px] w-[7px] rounded-full"
                        style={{ background: band.color, boxShadow: `0 0 8px ${rgba(band.color, 0.55)}` }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-white/88">{band.longLabel}</div>
                        <div className="text-white/42">{band.minFee}+ sat/vB</div>
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-right text-white/88">
                      {activeMetric === 'count' && meta.formatFull(band.value)}
                      {activeMetric === 'fee' && `${satsToBtc(band.value).toFixed(6)} BTC`}
                      {activeMetric === 'weight' && `${(band.value / 1e6).toFixed(4)} vMB`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Band legend */}
      {bands.length > 0 && (
        <div className="mt-3 flex flex-shrink-0 flex-col gap-2 sm:mt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono uppercase tracking-[0.18em] text-white/38" style={{ fontSize: 'var(--fs-tag)' }}>
              Fee bands
            </div>
          </div>
          <BandLegend bands={bands} />
        </div>
      )}
    </ModuleShell>
  );
}
