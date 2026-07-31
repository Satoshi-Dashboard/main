// .lighthouserc.cjs
// CJS required: @lhci/cli uses require() to load this config.
// "type": "module" in package.json means .js files are ESM, so we use .cjs.
'use strict';

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/landingpage',
        'http://localhost:4173/module/s02-bitcoin-price-chart-live',
      ],
      numberOfRuns: 1,
      settings: {
        // Chromium in GitHub Actions needs these flags
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        throttlingMethod: 'simulate',
      },
    },
    assert: {
      assertions: {
        // warn (not error) — heavy React SPA with live charts will hover near 75 in CI
        'categories:performance':    ['warn',  { minScore: 0.75 }],
        // error — deterministic, we own the markup
        'categories:accessibility':  ['error', { minScore: 0.90 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo':            ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
