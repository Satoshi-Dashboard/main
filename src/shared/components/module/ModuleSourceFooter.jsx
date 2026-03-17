import { formatMetaTimestamp } from '@/shared/utils/formatters.js';

/**
 * Safely convert a value to a renderable string.
 * Handles: string, Date, number, null/undefined.
 */
function toDisplayString(value) {
  if (value == null) return null;
  if (typeof value === 'string') return formatMetaTimestamp(value) || value;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toLocaleString() : null;
  }
  if (typeof value === 'number') return String(value);
  // Fallback: coerce to string to avoid rendering objects as React children
  return String(value);
}

/**
 * ModuleSourceFooter — Standardized data-source attribution strip.
 *
 * Renders: src: [Provider] · Refresh: X · Last sync: [timestamp]
 * Responsive: inline row on desktop, stacked on mobile.
 *
 * Usage:
 *   <ModuleSourceFooter
 *     providers={[{ name: 'BitInfoCharts', url: 'https://bitinfocharts.com' }]}
 *     refreshLabel="30m"
 *     lastSync="2026-03-16T12:00:00Z"
 *   />
 */
export default function ModuleSourceFooter({
  providers = [],
  refreshLabel,
  lastSync,
  lastSyncLabel = 'Last sync',
  sourceSnapshot,
  sourceSnapshotLabel = 'Source snapshot',
  extra,
  className = '',
  align = 'right',
  style = {},
}) {
  const alignClass = align === 'left' ? 'text-left' : 'text-right';

  return (
    <div
      className={`font-mono text-[11px] tracking-wide ${alignClass} ${className}`.trim()}
      style={{ color: 'var(--text-secondary)', ...style }}
    >
      {providers.length > 0 && (
        <div>
          src:{' '}
          {providers.map((p, i) => (
            <span key={p.name}>
              {i > 0 && ' · '}
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-bitcoin)', textDecoration: 'none' }}
                >
                  {p.name}
                </a>
              ) : (
                <span style={{ color: 'var(--accent-bitcoin)' }}>{p.name}</span>
              )}
            </span>
          ))}
        </div>
      )}
      {refreshLabel && <div>Refresh target: {refreshLabel}</div>}
      {sourceSnapshot && (
        <div>
          {sourceSnapshotLabel}: {toDisplayString(sourceSnapshot)}
        </div>
      )}
      {lastSync && (
        <div>
          {lastSyncLabel}: {toDisplayString(lastSync)}
        </div>
      )}
      {extra}
    </div>
  );
}
