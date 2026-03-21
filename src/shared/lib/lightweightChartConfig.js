import { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';

/**
 * Shared monospace font stack used by all lightweight-charts instances.
 */
export const CHART_FONT =
  'JetBrains Mono, SFMono-Regular, Cascadia Code, Fira Code, Consolas, Liberation Mono, monospace';

/**
 * Default dark panel background matching the module standard.
 */
export const PANEL_BG = '#111111';

/**
 * Create a lightweight-chart instance with the standard dark theme.
 *
 * @param {HTMLElement} container  DOM element to mount the chart in.
 * @param {object}      [overrides={}] Deep-merged overrides for any config key.
 * @returns {IChartApi} The chart instance.
 *
 * Usage:
 *   const chart = createDarkChart(containerRef.current);
 *   const chart = createDarkChart(containerRef.current, {
 *     rightPriceScale: { visible: true },
 *     timeScale: { visible: true },
 *   });
 */
export function createDarkChart(container, overrides = {}) {
  const {
    layout: layoutOverrides,
    grid: gridOverrides,
    crosshair: crosshairOverrides,
    ...rest
  } = overrides;

  return createChart(container, {
    autoSize: true,
    layout: {
      background: { color: PANEL_BG },
      textColor: 'rgba(255,255,255,0.45)',
      fontFamily: CHART_FONT,
      attributionLogo: false,
      ...layoutOverrides,
    },
    grid: {
      vertLines: { visible: false },
      horzLines: { visible: false },
      ...gridOverrides,
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
        color: 'rgba(255,255,255,0.1)',
        width: 1,
        style: LineStyle.Dashed,
        labelVisible: false,
      },
      ...crosshairOverrides,
    },
    handleScroll: false,
    handleScale: false,
    ...rest,
  });
}

/**
 * Hook that manages touch-scrub interaction on a lightweight-charts instance.
 *
 * Handles touchstart/touchmove/touchend to enable scrubbing on mobile,
 * and clears the crosshair when the touch ends.
 *
 * @param {React.RefObject<IChartApi>} chartRef   Ref to the chart instance.
 * @param {React.RefObject<HTMLElement>} containerRef Ref to the chart container element.
 * @param {(point: {time, value}|null) => void} onHoverChange Callback on crosshair change.
 */
export function useTouchScrub(chartRef, containerRef, onHoverChange) {
  const touchActiveRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = () => {
      touchActiveRef.current = true;
    };

    const handleTouchEnd = () => {
      touchActiveRef.current = false;
      // Clear crosshair on touch end
      const chart = chartRef.current;
      if (chart) {
        chart.clearCrosshairPosition();
      }
      if (onHoverChange) onHoverChange(null);
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [chartRef, containerRef, onHoverChange]);

  return touchActiveRef;
}
