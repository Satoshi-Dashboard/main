import { createElement } from 'react';
import { cx } from '@/shared/utils/cx.js';

/**
 * ModuleShell - Standard wrapper for dashboard modules.
 */
export default function ModuleShell({
  as: Component = 'div',
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

  return createElement(
    Component,
    {
      className: cx('visual-integrity-lock h-full w-full min-w-0', overflowClass, layoutClass, className),
      style: { backgroundColor: bg, ...style },
    },
    children,
  );
}
