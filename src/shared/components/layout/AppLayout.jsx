import { createElement } from 'react';
import { cx } from '@/shared/utils/cx.js';

const CONTAINER_CLASS = {
  default: 'app-container',
  wide: 'app-container app-container-wide',
  reading: 'app-container app-container-reading',
  full: 'app-container app-container-full',
};

export function AppPage({ as: Component = 'div', className = '', ...props }) {
  return createElement(Component, { className: cx('app-page', className), ...props });
}

export function AppContainer({
  as: Component = 'div',
  className = '',
  size = 'default',
  ...props
}) {
  return createElement(Component, {
    className: cx(CONTAINER_CLASS[size] || CONTAINER_CLASS.default, className),
    ...props,
  });
}

export function AppSection({ as: Component = 'section', className = '', ...props }) {
  return createElement(Component, { className: cx('app-section', className), ...props });
}

export function SurfaceCard({
  as: Component = 'article',
  className = '',
  tone = 'default',
  ...props
}) {
  return createElement(Component, {
    'data-tone': tone,
    className: cx('app-surface-card', className),
    ...props,
  });
}
