// scripts/gsc-sitemap.js
// Submits the sitemap to Google Search Console and reads back its status.
// Safe to call on every deploy — sitemaps.submit() is idempotent.
// Usage: node scripts/gsc-sitemap.js
// Env:   GOOGLE_SERVICE_ACCOUNT_KEY (JSON string), GOOGLE_SITE_URL

import { google } from 'googleapis';

const SITE_URL    = process.env.GOOGLE_SITE_URL ?? 'https://satoshidashboard.com/';
const SITEMAP_URL = `${SITE_URL.replace(/\/$/, '')}/sitemap.xml`;

async function getAuthClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY env var is not set');
  const credentials = JSON.parse(keyJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    // webmasters (write) scope required for sitemaps.submit()
    scopes: ['https://www.googleapis.com/auth/webmasters'],
  });
  return auth.getClient();
}

async function main() {
  const authClient    = await getAuthClient();
  const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });

  console.log(`Submitting sitemap: ${SITEMAP_URL}`);
  console.log(`For property:       ${SITE_URL}`);

  await searchconsole.sitemaps.submit({
    siteUrl:  SITE_URL,
    feedpath: SITEMAP_URL,
  });

  console.log('Sitemap submitted successfully.\n');

  // Verify by reading back the sitemap status
  const res = await searchconsole.sitemaps.get({
    siteUrl:  SITE_URL,
    feedpath: SITEMAP_URL,
  });

  const sm = res.data;
  console.log('Sitemap status:');
  console.log('  Type:             ', sm.type              ?? 'unknown');
  console.log('  Last submitted:   ', sm.lastSubmitted     ?? 'never');
  console.log('  Last downloaded:  ', sm.lastDownloaded    ?? 'never');
  console.log('  URLs in sitemap:  ', sm.contents?.[0]?.submitted ?? 'n/a');
  console.log('  URLs indexed:     ', sm.contents?.[0]?.indexed   ?? 'n/a');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
