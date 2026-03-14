import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery.js';

let animatedCounterPromise;

function loadAnimatedCounter() {
  if (!animatedCounterPromise) {
    animatedCounterPromise = import('react-animated-counter').then((module) => module.AnimatedCounter);
  }
  return animatedCounterPromise;
}

const RESPONSIVE_MEDIA_QUERY = '(max-width: 1023px)';
const PHONE_MEDIA_QUERY = '(max-width: 639px)';

function toCompactParts(value) {
  const amount = Math.abs(Number(value));
  if (!Number.isFinite(amount)) return null;
  if (amount >= 1e12) return { divisor: 1e12, suffix: 'T', decimals: 2 };
  if (amount >= 1e9) return { divisor: 1e9, suffix: 'B', decimals: 2 };
  if (amount >= 1e6) return { divisor: 1e6, suffix: 'M', decimals: 2 };
  if (amount >= 1e3) return { divisor: 1e3, suffix: 'K', decimals: 1 };
  return null;
}

function toHashrateParts(value) {
  const amount = Math.abs(Number(value));
  if (!Number.isFinite(amount)) return null;
  if (amount >= 1e24) return { divisor: 1e24, suffix: 'YH/s', decimals: 2 };
  if (amount >= 1e21) return { divisor: 1e21, suffix: 'ZH/s', decimals: 2 };
  if (amount >= 1e18) return { divisor: 1e18, suffix: 'EH/s', decimals: 2 };
  if (amount >= 1e15) return { divisor: 1e15, suffix: 'PH/s', decimals: 2 };
  if (amount >= 1e12) return { divisor: 1e12, suffix: 'TH/s', decimals: 2 };
  return { divisor: 1, suffix: 'H/s', decimals: 0 };
}

function buildMetricConfig({ value, variant, decimals, signed, prefix, suffix }) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;

  if (variant === 'usdCompact') {
    const parts = toCompactParts(amount);
    if (parts) {
      return {
        value: Math.abs(amount) / parts.divisor,
        decimals: decimals ?? parts.decimals,
        prefix: `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${prefix ?? '$'}`,
        suffix: `${parts.suffix}${suffix ?? ''}`,
        includeCommas: false,
      };
    }

    return {
      value: Math.abs(amount),
      decimals: decimals ?? 0,
      prefix: `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${prefix ?? '$'}`,
      suffix: suffix ?? '',
      includeCommas: true,
    };
  }

  if (variant === 'compact') {
    const parts = toCompactParts(amount);
    if (parts) {
      return {
        value: Math.abs(amount) / parts.divisor,
        decimals: decimals ?? parts.decimals,
        prefix: `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${prefix ?? ''}`,
        suffix: `${parts.suffix}${suffix ?? ''}`,
        includeCommas: false,
      };
    }
  }

  if (variant === 'hashrate') {
    const parts = toHashrateParts(amount);
    return {
      value: Math.abs(amount) / parts.divisor,
      decimals: decimals ?? parts.decimals,
      prefix: `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${prefix ?? ''}`,
      suffix: ` ${parts.suffix}${suffix ?? ''}`,
      includeCommas: false,
    };
  }

  if (variant === 'usd') {
    return {
      value: Math.abs(amount),
      decimals: decimals ?? 0,
      prefix: `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${prefix ?? '$'}`,
      suffix: suffix ?? '',
      includeCommas: true,
    };
  }

  if (variant === 'percent') {
    return {
      value: Math.abs(amount),
      decimals: decimals ?? 2,
      prefix: `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${prefix ?? ''}`,
      suffix: `%${suffix ?? ''}`,
      includeCommas: false,
    };
  }

  return {
    value: Math.abs(amount),
    decimals: decimals ?? 0,
    prefix: `${signed && amount > 0 ? '+' : amount < 0 ? '-' : ''}${prefix ?? ''}`,
    suffix: suffix ?? '',
    includeCommas: true,
  };
}

export default function AnimatedMetric({
  value,
  variant = 'number',
  decimals,
  signed = false,
  prefix,
  suffix,
  className = '',
  style,
  inline = false,
  fallback = '—',
  color,
  incrementColor = 'var(--accent-green)',
  decrementColor = 'var(--accent-red)',
  blockAlign = 'center',
  justify = 'start',
  align = 'baseline',
  animate = true,
}) {
  const config = buildMetricConfig({ value, variant, decimals, signed, prefix, suffix });
  const wrapperRef = useRef(null);
  const [counterFontSize, setCounterFontSize] = useState('16px');
  const isResponsiveViewport = useMediaQuery(RESPONSIVE_MEDIA_QUERY);
  const isPhoneViewport = useMediaQuery(PHONE_MEDIA_QUERY);
  const [preferStaticResponsive, setPreferStaticResponsive] = useState(false);
  const [CounterComponent, setCounterComponent] = useState(null);
  const display = inline ? 'inline-flex' : 'flex';
  const textColor = color ?? 'white';
  const metricMinHeight = useMemo(() => {
    const fontPx = Number.parseFloat(counterFontSize) || 16;
    return `${Math.max(fontPx * 1.08, fontPx + 2)}px`;
  }, [counterFontSize]);

  const formattedValue = config
    ? new Intl.NumberFormat('en-US', {
      useGrouping: config.includeCommas,
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    }).format(config.value)
    : fallback;
  const metricText = useMemo(
    () => `${config?.prefix ?? ''}${formattedValue}${config?.suffix ?? ''}`,
    [config?.prefix, config?.suffix, formattedValue],
  );
  const shouldAnimateCounter = Boolean(config && animate && !preferStaticResponsive);

  useLayoutEffect(() => {
    if (!wrapperRef.current || typeof window === 'undefined') return undefined;

    const node = wrapperRef.current;
    let rafId = 0;

    const updateMetricSizing = () => {
      const computedFontSize = window.getComputedStyle(node).fontSize;
      const fontPx = Number.parseFloat(computedFontSize || counterFontSize) || 16;
      const availableWidth = node.clientWidth;
      const contentWidth = node.scrollWidth;
      const hasOverflow = availableWidth > 0 && (contentWidth - availableWidth) > 1;
      const shouldPreferStatic = isPhoneViewport
        ? (metricText.length >= 8 || fontPx >= 18 || hasOverflow)
        : (isResponsiveViewport && (metricText.length >= 12 || fontPx >= 26 || hasOverflow));

      if (computedFontSize) {
        setCounterFontSize((current) => (current === computedFontSize ? current : computedFontSize));
      }
      setPreferStaticResponsive((current) => (current === shouldPreferStatic ? current : shouldPreferStatic));
    };

    const scheduleSizingUpdate = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateMetricSizing);
    };

    updateMetricSizing();

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => scheduleSizingUpdate())
      : null;

    resizeObserver?.observe(node);
    window.addEventListener('resize', scheduleSizingUpdate);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', scheduleSizingUpdate);
    };
  }, [style?.fontSize, className, counterFontSize, inline, isPhoneViewport, isResponsiveViewport, metricText]);

  useEffect(() => {
    if (!shouldAnimateCounter || typeof window === 'undefined') return undefined;

    let cancelled = false;

    loadAnimatedCounter().then((Counter) => {
      if (!cancelled) {
        setCounterComponent(() => Counter);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [shouldAnimateCounter]);

  const wrapperStyle = {
    ...style,
    color: textColor,
    display,
    alignItems: align,
    justifyContent: inline
      ? (justify === 'end' ? 'flex-end' : justify === 'center' ? 'center' : 'flex-start')
      : (justify === 'end' ? 'flex-end' : justify === 'center' ? 'center' : (blockAlign === 'start' ? 'flex-start' : 'center')),
    gap: 0,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    minWidth: 0,
    minHeight: metricMinHeight,
    overflow: 'visible',
    fontVariantNumeric: 'tabular-nums',
  };

  if (!config) {
    return (
      <span ref={wrapperRef} className={className} style={wrapperStyle}>
        {fallback}
      </span>
    );
  }

  if (!shouldAnimateCounter || !CounterComponent) {
    return (
      <span
        ref={wrapperRef}
        className={className}
        style={wrapperStyle}
      >
        {config.prefix ? <span style={{ lineHeight: 1, flexShrink: 0 }}>{config.prefix}</span> : null}
        <span style={{ lineHeight: 1, flexShrink: 0 }}>{formattedValue}</span>
        {config.suffix ? <span style={{ lineHeight: 1, flexShrink: 0 }}>{config.suffix}</span> : null}
      </span>
    );
  }

  return (
    <span
      ref={wrapperRef}
      className={className}
      style={wrapperStyle}
    >
      {config.prefix ? <span style={{ lineHeight: 1, flexShrink: 0 }}>{config.prefix}</span> : null}
      <CounterComponent
        value={config.value}
        color={textColor}
        fontSize={counterFontSize}
        incrementColor={incrementColor}
        decrementColor={decrementColor}
        includeDecimals={config.decimals > 0}
        decimalPrecision={config.decimals}
        includeCommas={config.includeCommas}
        containerStyles={{ display: 'inline-flex', alignItems: align, fontFamily: 'inherit', height: counterFontSize, lineHeight: counterFontSize, whiteSpace: 'nowrap', flexShrink: 0, margin: 0, minWidth: 0, maxWidth: '100%' }}
        digitStyles={{ fontFamily: 'inherit', lineHeight: counterFontSize }}
      />
      {config.suffix ? <span style={{ lineHeight: 1, flexShrink: 0 }}>{config.suffix}</span> : null}
    </span>
  );
}
