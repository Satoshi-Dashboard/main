/**
 * ModuleTitle — Standardized module heading.
 *
 * Enforces the canonical title style: uppercase, monospace, Bitcoin orange,
 * consistent letter-spacing and font-size tokens.
 *
 * Usage:
 *   <ModuleTitle>Address Distribution</ModuleTitle>
 *   <ModuleTitle subtitle="by market cap" size="--fs-heading">Global Assets</ModuleTitle>
 */
export default function ModuleTitle({
  children,
  subtitle,
  size = 'var(--fs-subtitle)',
  className = '',
  style = {},
}) {
  return (
    <h1
      className={`font-mono font-bold uppercase ${className}`.trim()}
      style={{
        color: 'var(--accent-bitcoin)',
        fontSize: size,
        letterSpacing: '0.02em',
        lineHeight: 1.2,
        margin: 0,
        ...style,
      }}
    >
      {children}
      {subtitle && (
        <span
          className="block font-normal normal-case"
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--fs-caption)',
            letterSpacing: '0.01em',
            marginTop: '0.25em',
          }}
        >
          {subtitle}
        </span>
      )}
    </h1>
  );
}
