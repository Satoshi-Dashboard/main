import { formatMetaTimestamp } from '@/shared/utils/formatters.js';
import { cx } from '@/shared/utils/cx.js';

function ProviderLabel({ providers, renderProviderLinks }) {
  return (
    <div className="text-safe-wrap">
      <span>src: </span>
      {renderProviderLinks(providers)}
    </div>
  );
}

function MetaRows({ cadenceLabel, metaLastAt, providers, renderProviderLinks }) {
  return (
    <>
      <ProviderLabel providers={providers} renderProviderLinks={renderProviderLinks} />
      <div>Auto update: {cadenceLabel}</div>
      <div>Last: {formatMetaTimestamp(metaLastAt)}</div>
    </>
  );
}

function MetaPanel({ align = 'right', className = '', children }) {
  return (
    <div
      className={cx(
        'rounded-md border border-white/10 bg-black/85 px-3 py-2 font-mono text-[11px] tracking-wide shadow-[0_8px_28px_rgba(0,0,0,0.38)] backdrop-blur-sm sm:text-[12px]',
        align === 'left' ? 'text-left' : 'text-right',
        className,
      )}
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </div>
  );
}

export function SharedMetaAbsoluteCard({ cadenceLabel, metaLastAt, providers, renderProviderLinks }) {
  return (
    <div
      className="pointer-events-none absolute right-2 top-2 z-30 sm:right-3 sm:top-3 lg:hidden"
      style={{
        top: 'max(0.5rem, calc(var(--safe-top) + 0.25rem))',
        right: 'max(0.5rem, calc(var(--safe-right) + 0.25rem))',
      }}
    >
      <MetaPanel className="pointer-events-auto">
        <MetaRows
          cadenceLabel={cadenceLabel}
          metaLastAt={metaLastAt}
          providers={providers}
          renderProviderLinks={renderProviderLinks}
        />
      </MetaPanel>
    </div>
  );
}

export function SharedMetaTopStrip({
  cadenceLabel,
  metaLastAt,
  providers,
  renderProviderLinks,
  title,
  hideMeta,
}) {
  return (
    <div className="flex flex-none items-start justify-between gap-3 bg-[#111111] px-3 py-2 sm:px-4">
      {title ? (
        <div
          className="min-w-0 text-safe-wrap"
          style={{
            color: 'var(--accent-bitcoin)',
            fontFamily: 'monospace',
            fontSize: 'var(--fs-subtitle)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          {title}
        </div>
      ) : (
        <div className="min-w-0" />
      )}

      {!hideMeta && (
        <MetaPanel className="max-w-[18rem] shrink-0 bg-transparent px-0 py-0 shadow-none border-0 backdrop-blur-none" align="right">
          <MetaRows
            cadenceLabel={cadenceLabel}
            metaLastAt={metaLastAt}
            providers={providers}
            renderProviderLinks={renderProviderLinks}
          />
        </MetaPanel>
      )}
    </div>
  );
}

export function SharedMetaBottomStrip({ cadenceLabel, metaLastAt, providers, renderProviderLinks }) {
  return (
    <div
      className="flex flex-none justify-end px-3 pb-6 pt-3 sm:px-4"
      style={{ paddingBottom: 'max(1.5rem, calc(var(--safe-bottom) + 0.75rem))' }}
    >
      <MetaPanel className="max-w-full bg-transparent px-0 py-0 shadow-none border-0 backdrop-blur-none">
        <MetaRows
          cadenceLabel={cadenceLabel}
          metaLastAt={metaLastAt}
          providers={providers}
          renderProviderLinks={renderProviderLinks}
        />
      </MetaPanel>
    </div>
  );
}
