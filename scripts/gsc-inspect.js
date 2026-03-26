// scripts/gsc-inspect.js
// Checks real indexing status of production URLs via Google Search Console URL Inspection API.
// Usage: node scripts/gsc-inspect.js
// Env:   GOOGLE_SERVICE_ACCOUNT_KEY (JSON string), GOOGLE_SITE_URL

import { google } from 'googleapis';

const SITE_URL = process.env.GOOGLE_SITE_URL ?? 'https://satoshidashboard.com/';

const URLS_TO_INSPECT = [
  'https://satoshidashboard.com/',
  'https://satoshidashboard.com/landingpage',
  'https://satoshidashboard.com/landingpage/blog',
  'https://satoshidashboard.com/landingpage/blog/live-bitcoin-price-dashboard',
  'https://satoshidashboard.com/module/s02-bitcoin-price-chart-live',
  'https://satoshidashboard.com/module/s04-bitcoin-mempool-fees',
  'https://satoshidashboard.com/module/s07-bitcoin-nodes-world-map',
  'https://satoshidashboard.com/module/s12-bitcoin-fear-greed-index',
  'https://satoshidashboard.com/module/s31-us-national-debt-live-counter',
];

async function getAuthClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY env var is not set');
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return auth.getClient();
}

async function inspectUrl(searchconsole, inspectionUrl) {
  const res = await searchconsole.urlInspection.index.inspect({
    requestBody: { inspectionUrl, siteUrl: SITE_URL },
  });
  return res.data.inspectionResult ?? {};
}

async function main() {
  const authClient    = await getAuthClient();
  const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });

  console.log('\nGoogle Search Console — URL Inspection Report');
  console.log('='.repeat(95));
  console.log('URL'.padEnd(60), 'Coverage'.padEnd(14), 'Verdict'.padEnd(10), 'Last Crawl');
  console.log('-'.repeat(95));

  let hasErrors = false;

  for (const url of URLS_TO_INSPECT) {
    try {
      const result   = await inspectUrl(searchconsole, url);
      const index    = result.indexStatusResult ?? {};
      const coverage = index.coverageState   ?? 'UNKNOWN';
      const verdict  = index.verdict          ?? 'UNKNOWN';
      const lastCrawl = index.lastCrawlTime   ?? 'never';

      if (verdict !== 'PASS') hasErrors = true;
      const flag = verdict === 'PASS' ? '  ' : '! ';

      console.log(
        (flag + url).padEnd(60),
        coverage.padEnd(14),
        verdict.padEnd(10),
        lastCrawl.slice(0, 19),
      );
    } catch (err) {
      hasErrors = true;
      console.error(`  ERROR inspecting ${url}: ${err.message}`);
    }

    // GSC URL Inspection API is rate-sensitive — pause between requests
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('='.repeat(95));

  if (hasErrors) {
    console.warn('\nWarning: one or more URLs are not passing indexing checks.');
    process.exit(1);
  } else {
    console.log('\nAll URLs passed indexing checks.');
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
