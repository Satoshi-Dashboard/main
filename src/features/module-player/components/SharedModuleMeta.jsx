import { formatMetaTimestamp } from '@/shared/utils/formatters.js';

function ProviderLabel({ providers, renderProviderLinks }) {
  return (
    <div>
      <span>src: </span>
      {renderProviderLinks(providers)}
    </div>
  );
}

export function SharedMetaAbsoluteCard({ cadenceLabel, metaLastAt, providers, renderProviderLinks }) {
  return (
    <div className="pointer-events-none absolute right-2 top-2 z-30 sm:right-3 sm:top-3 lg:hidden" style={{ top: 'max(0.5rem, calc(var(--safe-top) + 0.25rem))', right: 'max(0.5rem, calc(var(--safe-right) + 0.25rem))' }}>
      <div className="pointer-events-auto rounded-md border border-white/10 bg-black/85 px-3 py-2 text-right font-mono text-[11px] tracking-wide shadow-[0_8px_28px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:text-[12px]" style={{ color: 'var(--text-secondary)' }}>
        <ProviderLabel providers={providers} renderProviderLinks={renderProviderLinks} />
        <div>Auto update: {cadenceLabel}</div>
        <div>Last: {formatMetaTimestamp(metaLastAt)}</div>
      </div>
    </div>
  );
}

export function SharedMetaTopStrip({ cadenceLabel, metaLastAt, providers, renderProviderLinks, title, hideMeta }) {
  return (
    <div className="flex flex-none items-center justify-between px-2 py-1.5 sm:px-3 lg:px-4">
      {title ? (
        <div className="min-w-0" style={{ color: 'var(--accent-bitcoin)', fontFamily: 'monospace', fontSize: 'var(--fs-subtitle)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          {title}
        </div>
      ) : <div className="min-w-0" />}
      {!hideMeta && (
        <div className="text-right font-mono text-[11px] tracking-wide" style={{ color: 'var(--text-secondary)' }}>
          <ProviderLabel providers={providers} renderProviderLinks={renderProviderLinks} />
          <div>Auto update: {cadenceLabel}</div>
          <div>Last: {formatMetaTimestamp(metaLastAt)}</div>
        </div>
      )}
    </div>
  );
}

export function SharedMetaBottomStrip({ cadenceLabel, metaLastAt, providers, renderProviderLinks }) {
  return (
    <div className="flex flex-none justify-end px-3 pb-6 pt-3 sm:px-4" style={{ paddingBottom: 'max(1.5rem, calc(var(--safe-bottom) + 0.75rem))' }}>
      <div className="text-right font-mono text-[11px] tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        <ProviderLabel providers={providers} renderProviderLinks={renderProviderLinks} />
        <div>Auto update: {cadenceLabel}</div>
        <div>Last: {formatMetaTimestamp(metaLastAt)}</div>
      </div>
    </div>
  );
}
