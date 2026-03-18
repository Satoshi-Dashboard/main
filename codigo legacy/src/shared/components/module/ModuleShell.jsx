/**
 * ModuleShell — Standard wrapper for all dashboard modules.
 *
 * Provides the `visual-integrity-lock` class, full-height container,
 * background color, and optional flex layout that every module needs.
 *
 * Usage:
 *   <ModuleShell>...</ModuleShell>
 *   <ModuleShell bg="#0B0B0B" layout="flex-row" className="items-center">...</ModuleShell>
 */
export default function ModuleShell({
  children,
  bg = '#111111',
  layout = 'flex-col',
  overflow = 'visible',
  className = '',
  style = {},
}) {
  const layoutClass = {
    'flex-col': 'flex flex-col',
    'flex-row': 'flex flex-row',
    grid: 'grid',
    none: '',
  }[layout] || 'flex flex-col';

  const overflowClass = {
    visible: 'overflow-visible',
    hidden: 'overflow-hidden',
    auto: 'overflow-auto',
    scroll: 'overflow-scroll',
  }[overflow] || 'overflow-visible';

  return (
    <div
      className={`visual-integrity-lock h-full w-full ${overflowClass} ${layoutClass} ${className}`.trim()}
      style={{ backgroundColor: bg, ...style }}
    >
      {children}
    </div>
  );
}
