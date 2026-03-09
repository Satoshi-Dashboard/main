import { useLayoutEffect, useRef, useState } from 'react';
import { AnimatedCounter } from 'react-animated-counter';

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
}) {
  const config = buildMetricConfig({ value, variant, decimals, signed, prefix, suffix });
  const wrapperRef = useRef(null);
  const [counterFontSize, setCounterFontSize] = useState('16px');
  const display = inline ? 'inline-flex' : 'flex';
  const textColor = color ?? 'white';

  useLayoutEffect(() => {
    if (!wrapperRef.current || typeof window === 'undefined') return undefined;

    const node = wrapperRef.current;
    const updateFontSize = () => {
      const computedFontSize = window.getComputedStyle(node).fontSize;
      if (computedFontSize) {
        setCounterFontSize((current) => (current === computedFontSize ? current : computedFontSize));
      }
    };

    updateFontSize();

    const resizeObserver = typeof ResizeObserver === 'function'
      ? new ResizeObserver(() => updateFontSize())
      : null;

    resizeObserver?.observe(node);
    window.addEventListener('resize', updateFontSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateFontSize);
    };
  }, [style?.fontSize, className, inline]);

  if (!config) {
    return (
      <span ref={wrapperRef} className={className} style={{ ...style, color: textColor, display: inline ? 'inline-block' : 'block' }}>
        {fallback}
      </span>
    );
  }

  return (
    <span
      ref={wrapperRef}
      className={className}
      style={{
        ...style,
        color: textColor,
        display,
        alignItems: 'baseline',
        justifyContent: inline ? 'flex-start' : (blockAlign === 'start' ? 'flex-start' : 'center'),
        gap: 0,
        whiteSpace: 'nowrap',
        maxWidth: '100%',
      }}
    >
      {config.prefix ? <span>{config.prefix}</span> : null}
      <AnimatedCounter
        value={config.value}
        color={textColor}
        fontSize={counterFontSize}
        incrementColor={incrementColor}
        decrementColor={decrementColor}
        includeDecimals={config.decimals > 0}
        decimalPrecision={config.decimals}
        includeCommas={config.includeCommas}
        containerStyles={{ display: 'inline-flex', alignItems: 'baseline', fontFamily: 'inherit', height: counterFontSize, whiteSpace: 'nowrap', flexShrink: 0 }}
        digitStyles={{ fontFamily: 'inherit' }}
      />
      {config.suffix ? <span>{config.suffix}</span> : null}
    </span>
  );
}
