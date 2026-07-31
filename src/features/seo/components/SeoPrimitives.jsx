import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '@/shared/utils/cx.js';

export function SeoEyebrow({ children, className = '' }) {
  return (
    <div
      className={cx(
        'font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--accent-bitcoin)] sm:text-[12px]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SeoSectionIntro({
  body,
  className = '',
  kicker,
  title,
  titleAs = 'h2',
}) {
  return (
    <div className={cx('max-w-3xl min-w-0', className)}>
      <SeoEyebrow>{kicker}</SeoEyebrow>
      {createElement(
        titleAs,
        { className: 'mt-3 text-safe-wrap font-mono text-[clamp(1.4rem,3vw,2.5rem)] leading-tight text-white' },
        title,
      )}
      <p className="mt-4 text-safe-wrap text-[15px] leading-8 text-white/66 sm:text-[16px]">
        {body}
      </p>
    </div>
  );
}

export function SeoRoutePill({
  children,
  className = '',
  tone = 'default',
  ...props
}) {
  return (
    <Link
      data-tone={tone}
      className={cx('seo-route-pill', className)}
      {...props}
    >
      {children}
    </Link>
  );
}
