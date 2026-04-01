import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

if (!window.PointerEvent) {
  window.PointerEvent = MouseEvent;
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
  configurable: true,
  get() {
    return 900;
  },
});

Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
  configurable: true,
  value() {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 900,
      bottom: 700,
      width: 900,
      height: 700,
      toJSON() {
        return this;
      },
    };
  },
});

afterEach(() => {
  cleanup();
});
