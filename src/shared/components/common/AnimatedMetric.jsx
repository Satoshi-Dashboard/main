import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatedCounter } from 'react-animated-counter';

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
  animate = true,
}) {
  const config = buildMetricConfig({ value, variant, decimals, signed, prefix, suffix });
  const wrapperRef = useRef(null);
  const [counterFontSize, setCounterFontSize] = useState('16px');
  const [isResponsiveViewport, setIsResponsiveViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(RESPONSIVE_MEDIA_QUERY).matches;
  });
  const [isPhoneViewport, setIsPhoneViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(PHONE_MEDIA_QUERY).matches;
  });
  const [preferStaticResponsive, setPreferStaticResponsive] = useState(false);
  const display = inline ? 'inline-flex' : 'flex';
  const textColor = color ?? 'white';

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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const responsiveMedia = window.matchMedia(RESPONSIVE_MEDIA_QUERY);
    const phoneMedia = window.matchMedia(PHONE_MEDIA_QUERY);
    const updateViewportState = () => {
      setIsResponsiveViewport(responsiveMedia.matches);
      setIsPhoneViewport(phoneMedia.matches);
    };

    updateViewportState();

    if (typeof responsiveMedia.addEventListener === 'function') {
      responsiveMedia.addEventListener('change', updateViewportState);
      phoneMedia.addEventListener('change', updateViewportState);
      return () => {
        responsiveMedia.removeEventListener('change', updateViewportState);
        phoneMedia.removeEventListener('change', updateViewportState);
      };
    }

    responsiveMedia.addListener(updateViewportState);
    phoneMedia.addListener(updateViewportState);
    return () => {
      responsiveMedia.removeListener(updateViewportState);
      phoneMedia.removeListener(updateViewportState);
    };
  }, []);

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

  const wrapperStyle = {
    ...style,
    color: textColor,
    display,
    alignItems: 'baseline',
    justifyContent: inline ? 'flex-start' : (blockAlign === 'start' ? 'flex-start' : 'center'),
    gap: 0,
    lineHeight: 1,
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    minWidth: 0,
    minHeight: counterFontSize,
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

  if (!animate || preferStaticResponsive) {
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
      <AnimatedCounter
        value={config.value}
        color={textColor}
        fontSize={counterFontSize}
        incrementColor={incrementColor}
        decrementColor={decrementColor}
        includeDecimals={config.decimals > 0}
        decimalPrecision={config.decimals}
        includeCommas={config.includeCommas}
        containerStyles={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: 'inherit', height: counterFontSize, lineHeight: counterFontSize, whiteSpace: 'nowrap', flexShrink: 0, margin: 0, minWidth: 0 }}
        digitStyles={{ fontFamily: 'inherit', lineHeight: counterFontSize }}
      />
      {config.suffix ? <span style={{ lineHeight: 1, flexShrink: 0 }}>{config.suffix}</span> : null}
    </span>
  );
}
