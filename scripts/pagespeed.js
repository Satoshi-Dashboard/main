// scripts/pagespeed.js
// Runs PageSpeed Insights against production URLs and saves a JSON report.
// Uses Node 20 built-in fetch — no extra package needed.
// Usage: node scripts/pagespeed.js
// Env:   PROD_URL (base URL, no trailing slash), PAGESPEED_API_KEY (optional)

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL   = (process.env.PROD_URL ?? 'https://satoshidashboard.com').replace(/\/$/, '');
const API_KEY    = process.env.PAGESPEED_API_KEY ?? '';
const STRATEGY   = 'mobile';
const CATEGORIES = ['performance', 'seo', 'accessibility', 'best-practices'];
const OUTPUT_DIR = 'lhci-reports';

const URLS_TO_TEST = [
  BASE_URL + '/',
  BASE_URL + '/landingpage',
  BASE_URL + '/landingpage/blog',
  BASE_URL + '/module/s02-bitcoin-price-chart-live',
  BASE_URL + '/module/s04-bitcoin-mempool-fees',
  BASE_URL + '/module/s07-bitcoin-nodes-world-map',
];

async function runPSI(url) {
  const categoryParams = CATEGORIES.map(c => `category=${c}`).join('&');
  const keyParam       = API_KEY ? `&key=${API_KEY}` : '';
  const endpoint       =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(url)}&strategy=${STRATEGY}&${categoryParams}${keyParam}`;

  const res = await fetch(endpoint);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PSI API error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function extractScores(data) {
  const cats = data.lighthouseResult?.categories ?? {};
  return {
    performance:   Math.round((cats.performance?.score          ?? 0) * 100),
    seo:           Math.round((cats.seo?.score                   ?? 0) * 100),
    accessibility: Math.round((cats.accessibility?.score         ?? 0) * 100),
    bestPractices: Math.round((cats['best-practices']?.score     ?? 0) * 100),
    lcp:           data.lighthouseResult?.audits?.['largest-contentful-paint']?.displayValue ?? 'n/a',
    cls:           data.lighthouseResult?.audits?.['cumulative-layout-shift']?.displayValue  ?? 'n/a',
    tbt:           data.lighthouseResult?.audits?.['total-blocking-time']?.displayValue      ?? 'n/a',
  };
}

function scoreLabel(score) {
  if (score >= 90) return 'GOOD';
  if (score >= 50) return 'NEEDS WORK';
  return 'POOR';
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const date    = new Date().toISOString().slice(0, 10);
  const results = [];
  let   exitCode = 0;

  console.log(`\nPageSpeed Insights — ${STRATEGY.toUpperCase()} — ${date}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(105));
  console.log(
    'URL'.padEnd(50),
    'Perf'.padEnd(8),
    'SEO'.padEnd(8),
    'A11y'.padEnd(8),
    'BP'.padEnd(8),
    'LCP'.padEnd(10),
    'CLS'.padEnd(8),
    'TBT',
  );
  console.log('-'.repeat(105));

  for (const url of URLS_TO_TEST) {
    try {
      const data   = await runPSI(url);
      const scores = extractScores(data);
      results.push({ url, ...scores, timestamp: new Date().toISOString() });

      if (scoreLabel(scores.performance) !== 'GOOD' || scoreLabel(scores.seo) !== 'GOOD') {
        exitCode = 1;
      }

      const shortUrl = url.replace(BASE_URL, '') || '/';
      console.log(
        shortUrl.padEnd(50),
        String(scores.performance).padEnd(8),
        String(scores.seo).padEnd(8),
        String(scores.accessibility).padEnd(8),
        String(scores.bestPractices).padEnd(8),
        scores.lcp.padEnd(10),
        scores.cls.padEnd(8),
        scores.tbt,
      );
    } catch (err) {
      exitCode = 1;
      console.error(`  ERROR for ${url}: ${err.message}`);
      results.push({ url, error: err.message, timestamp: new Date().toISOString() });
    }

    // Pause between requests — PSI does a real Lighthouse run server-side
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('='.repeat(105));

  const outPath = join(OUTPUT_DIR, `pagespeed-${date}.json`);
  writeFileSync(outPath, JSON.stringify({ date, strategy: STRATEGY, results }, null, 2));
  console.log(`\nReport saved to ${outPath}`);

  process.exit(exitCode);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
