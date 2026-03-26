#!/usr/bin/env node
// scripts/seo-audit-local.js
// Local SEO audit — no network calls, no API keys required.
// Reads source files and produces seo-report.json + console summary.
// Usage: node scripts/seo-audit-local.js

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT      = resolve(import.meta.dirname, '..');
const OUT_DIR   = join(ROOT, 'seo-reports');
const REPORT    = join(OUT_DIR, 'seo-report.json');
const TODAY     = new Date().toISOString().slice(0, 10);

// ─── Helpers ────────────────────────────────────────────────────────────────

function read(rel)  { return readFileSync(join(ROOT, rel), 'utf8'); }
function exists(rel){ return existsSync(join(ROOT, rel)); }

const issues  = [];   // { level: 'error'|'warn'|'info', code, message, file?, fix? }
const fixes   = [];   // issues that seo-fix-safe.js can address
let   passed  = 0;

function fail(code, message, file = '', fix = '') {
  issues.push({ level: 'error', code, message, file, fix: fix || null });
}
function warn(code, message, file = '', fix = '') {
  issues.push({ level: 'warn',  code, message, file, fix: fix || null });
  if (fix) fixes.push({ code, message, file, fix });
}
function ok(label) {
  passed++;
  process.stdout.write(`  ✓ ${label}\n`);
}

// ─── 1. index.html ──────────────────────────────────────────────────────────

console.log('\n[1/6] Auditing index.html…');
const html = read('index.html');

// <html lang>
if (/<html[^>]+lang="[a-z]{2}"/.test(html)) ok('<html lang> present');
else fail('HTML_LANG_MISSING', '<html> tag is missing a lang attribute', 'index.html', 'add lang="en" to <html>');

// <title>
const titleMatch = html.match(/<title>([^<]+)<\/title>/);
if (!titleMatch) {
  fail('TITLE_MISSING', '<title> tag not found', 'index.html');
} else {
  const len = titleMatch[1].length;
  if (len > 60) warn('TITLE_LONG', `<title> is ${len} chars (>60)`, 'index.html', 'shorten title to ≤60 chars');
  else if (len < 10) warn('TITLE_SHORT', `<title> is only ${len} chars (<10)`, 'index.html');
  else ok(`<title> (${len} chars)`);
}

// meta description
const descMatch = html.match(/name="description"\s+content="([^"]+)"/);
if (!descMatch) {
  fail('DESC_MISSING', 'meta description not found', 'index.html');
} else {
  const len = descMatch[1].length;
  if (len > 160) warn('DESC_LONG', `meta description is ${len} chars (>160)`, 'index.html', 'shorten description to ≤160 chars');
  else if (len < 50)  warn('DESC_SHORT', `meta description is only ${len} chars (<50)`, 'index.html');
  else ok(`meta description (${len} chars)`);
}

// canonical
if (html.includes('rel="canonical"')) ok('canonical link present');
else fail('CANONICAL_MISSING', 'No canonical <link> in index.html', 'index.html');

// OG tags
const ogRequired = ['og:title','og:description','og:url','og:image','og:type'];
for (const tag of ogRequired) {
  if (html.includes(`property="${tag}"`)) ok(`${tag}`);
  else fail('OG_TAG_MISSING', `Missing OG tag: ${tag}`, 'index.html');
}

// OG image dimensions
if (html.includes('og:image:width') && html.includes('og:image:height')) ok('og:image dimensions present');
else warn('OG_IMAGE_DIMS', 'og:image:width / og:image:height missing', 'index.html', 'add og:image:width and og:image:height meta tags');

// Twitter card
if (html.includes('twitter:card')) ok('twitter:card present');
else warn('TWITTER_CARD', 'twitter:card meta missing', 'index.html');

// Viewport
if (html.includes('name="viewport"')) ok('viewport meta present');
else fail('VIEWPORT_MISSING', 'No viewport meta tag', 'index.html');

// charset
if (html.includes('<meta charset=')) ok('charset declared');
else fail('CHARSET_MISSING', 'No charset meta tag', 'index.html');

// Structured data
const schemaCount = (html.match(/application\/ld\+json/g) || []).length;
if (schemaCount > 0) ok(`Structured data blocks: ${schemaCount}`);
else warn('SCHEMA_MISSING', 'No application/ld+json found in index.html', 'index.html');

// Validate schema JSON
const schemaBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
let schemaValid = true;
for (let i = 0; i < schemaBlocks.length; i++) {
  try {
    JSON.parse(schemaBlocks[i][1]);
  } catch (e) {
    schemaValid = false;
    fail('SCHEMA_INVALID', `Structured data block #${i + 1} is not valid JSON: ${e.message}`, 'index.html');
  }
}
if (schemaValid && schemaCount > 0) ok('All structured data blocks are valid JSON');

// dateModified freshness
const dateModMatch = html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
if (dateModMatch) {
  const age = Math.floor((Date.now() - new Date(dateModMatch[1]).getTime()) / 86400000);
  if (age > 30) warn('DATE_STALE', `dateModified is ${age} days old (${dateModMatch[1]})`, 'index.html', `update dateModified to ${TODAY}`);
  else ok(`dateModified is fresh (${dateModMatch[1]}, ${age}d ago)`);
} else {
  warn('DATE_MISSING', 'No dateModified found in structured data', 'index.html', `add "dateModified": "${TODAY}"`);
}

// ─── 2. robots.txt ──────────────────────────────────────────────────────────

console.log('\n[2/6] Auditing robots.txt…');

if (!exists('public/robots.txt')) {
  fail('ROBOTS_MISSING', 'public/robots.txt not found', 'public/robots.txt');
} else {
  const robots = read('public/robots.txt');

  if (/Sitemap:/i.test(robots)) ok('Sitemap directive present');
  else fail('ROBOTS_NO_SITEMAP', 'robots.txt has no Sitemap: directive', 'public/robots.txt');

  if (/User-agent: \*/i.test(robots)) ok('Wildcard User-agent present');
  else warn('ROBOTS_NO_WILDCARD', 'No "User-agent: *" in robots.txt', 'public/robots.txt');

  if (/Disallow: \/api\//i.test(robots)) ok('/api/ is disallowed');
  else warn('ROBOTS_API_EXPOSED', '/api/ is not disallowed in robots.txt', 'public/robots.txt');

  if (robots.includes('satoshidashboard.com/sitemap.xml')) ok('Sitemap URL matches domain');
  else warn('ROBOTS_SITEMAP_URL', 'Sitemap URL in robots.txt may not match production domain', 'public/robots.txt');
}

// ─── 3. sitemap.xml ─────────────────────────────────────────────────────────

console.log('\n[3/6] Auditing sitemap.xml…');

if (!exists('public/sitemap.xml')) {
  fail('SITEMAP_MISSING', 'public/sitemap.xml not found', 'public/sitemap.xml');
} else {
  const sitemap = read('public/sitemap.xml');

  // URL count
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  ok(`Sitemap has ${urls.length} URLs`);

  // Trailing slashes consistency
  const withSlash    = urls.filter(u => u.endsWith('/'));
  const withoutSlash = urls.filter(u => !u.endsWith('/'));
  if (withSlash.length > 0 && withoutSlash.length > 0) {
    warn('SITEMAP_SLASH_INCONSISTENT', `Mixed trailing slashes in sitemap (${withSlash.length} with, ${withoutSlash.length} without)`, 'public/sitemap.xml');
  } else {
    ok('Trailing slash consistency OK');
  }

  // All use HTTPS
  const httpUrls = urls.filter(u => u.startsWith('http://'));
  if (httpUrls.length > 0) {
    fail('SITEMAP_HTTP', `${httpUrls.length} URLs in sitemap use http:// (not https://)`, 'public/sitemap.xml');
  } else {
    ok('All sitemap URLs use HTTPS');
  }

  // lastmod freshness
  const lastmods = [...sitemap.matchAll(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g)].map(m => m[1]);
  if (lastmods.length === 0) {
    warn('SITEMAP_NO_LASTMOD', 'No <lastmod> dates in sitemap.xml', 'public/sitemap.xml');
  } else {
    const oldest = lastmods.sort()[0];
    const ageD   = Math.floor((Date.now() - new Date(oldest).getTime()) / 86400000);
    if (ageD > 30) warn('SITEMAP_STALE', `Oldest <lastmod> is ${ageD} days old (${oldest})`, 'public/sitemap.xml', `update all <lastmod> dates to ${TODAY}`);
    else ok(`lastmod dates fresh (oldest: ${oldest}, ${ageD}d ago)`);
  }

  // homepage priority
  if (sitemap.includes('<priority>1.0</priority>')) ok('Homepage priority=1.0 set');
  else warn('SITEMAP_HOME_PRIORITY', 'Homepage is not set to priority 1.0', 'public/sitemap.xml');
}

// ─── 4. PWA manifest ────────────────────────────────────────────────────────

console.log('\n[4/6] Auditing site.webmanifest…');

if (!exists('public/site.webmanifest')) {
  warn('MANIFEST_MISSING', 'public/site.webmanifest not found', 'public/site.webmanifest');
} else {
  try {
    const mf = JSON.parse(read('public/site.webmanifest'));

    if (mf.name)       ok(`manifest.name = "${mf.name}"`);
    else warn('MANIFEST_NAME', 'manifest missing "name"', 'public/site.webmanifest');

    if (mf.short_name) ok(`manifest.short_name = "${mf.short_name}"`);
    else warn('MANIFEST_SHORT_NAME', 'manifest missing "short_name"', 'public/site.webmanifest');

    if (mf.start_url)  ok(`manifest.start_url = "${mf.start_url}"`);
    else warn('MANIFEST_START_URL', 'manifest missing "start_url"', 'public/site.webmanifest');

    if (mf.display)    ok(`manifest.display = "${mf.display}"`);
    else warn('MANIFEST_DISPLAY', 'manifest missing "display"', 'public/site.webmanifest');

    const icons = mf.icons || [];
    const has192 = icons.some(i => i.sizes === '192x192');
    const has512 = icons.some(i => i.sizes === '512x512');
    const hasMaskable = icons.some(i => (i.purpose || '').includes('maskable'));

    if (has192)      ok('192×192 icon declared');
    else warn('MANIFEST_ICON_192', 'No 192×192 icon in manifest', 'public/site.webmanifest');
    if (has512)      ok('512×512 icon declared');
    else warn('MANIFEST_ICON_512', 'No 512×512 icon in manifest', 'public/site.webmanifest');
    if (hasMaskable) ok('maskable icon declared');
    else warn('MANIFEST_MASKABLE', 'No maskable icon in manifest', 'public/site.webmanifest');

    // Verify icon files exist
    for (const icon of icons) {
      const rel = `public${icon.src}`;
      if (exists(rel)) ok(`Icon file exists: ${icon.src}`);
      else fail('MANIFEST_ICON_MISSING', `Manifest icon file not found: ${icon.src}`, 'public/site.webmanifest');
    }

    if (mf.theme_color)      ok(`theme_color = "${mf.theme_color}"`);
    else warn('MANIFEST_THEME', 'manifest missing "theme_color"', 'public/site.webmanifest');

    if (mf.background_color) ok(`background_color = "${mf.background_color}"`);
    else warn('MANIFEST_BG', 'manifest missing "background_color"', 'public/site.webmanifest');
  } catch (e) {
    fail('MANIFEST_JSON_INVALID', `site.webmanifest is not valid JSON: ${e.message}`, 'public/site.webmanifest');
  }
}

// ─── 5. Module SEO registry ──────────────────────────────────────────────────

console.log('\n[5/6] Auditing module SEO registry…');

const moduleSEOPath = 'src/features/module-registry/moduleSEO.js';
if (!exists(moduleSEOPath)) {
  warn('MODULE_SEO_MISSING', 'moduleSEO.js not found', moduleSEOPath);
} else {
  const seoSrc = read(moduleSEOPath);

  // Count entries
  const entryCount = (seoSrc.match(/'[a-z][a-z0-9-]+'\s*:/g) || []).length;
  ok(`Module SEO registry has ~${entryCount} entries`);

  // Check title lengths (approximate, from source)
  const titleLens = [...seoSrc.matchAll(/title:\s*'([^']+)'/g)].map(m => m[1].length);
  const longTitles = titleLens.filter(l => l > 60);
  if (longTitles.length > 0) warn('MODULE_SEO_TITLE_LONG', `${longTitles.length} module title(s) exceed 60 chars`, moduleSEOPath);
  else ok(`All module titles ≤60 chars`);

  // Check description lengths
  const descLens = [...seoSrc.matchAll(/description:\s*'([^']+)'/g)].map(m => m[1].length);
  const longDescs = descLens.filter(l => l > 160);
  if (longDescs.length > 0) warn('MODULE_SEO_DESC_LONG', `${longDescs.length} module description(s) exceed 160 chars`, moduleSEOPath);
  else ok(`All module descriptions ≤160 chars`);

  // Check keywords present
  const noKeywords = (seoSrc.match(/keywords:\s*\[/g) || []).length;
  if (noKeywords < entryCount / 2) warn('MODULE_SEO_KEYWORDS_SPARSE', 'Many module SEO entries may be missing keywords', moduleSEOPath);
  else ok(`Keywords present in most entries`);
}

// ─── 6. Favicons & static assets ────────────────────────────────────────────

console.log('\n[6/6] Auditing static assets…');

const requiredAssets = [
  'public/favicon.svg',
  'public/apple-touch-icon.png',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/icon-maskable-512.png',
  'public/logo.svg',
  'public/robots.txt',
  'public/sitemap.xml',
  'public/site.webmanifest',
];

for (const asset of requiredAssets) {
  if (exists(asset)) ok(`Asset exists: ${asset}`);
  else fail('ASSET_MISSING', `Required asset not found: ${asset}`, asset);
}

// OG image referenced in index.html
const ogImageMatch = html.match(/og:image"\s+content="([^"]+)"/);
if (ogImageMatch) {
  const ogUrl = ogImageMatch[1];
  // Convert absolute URL to relative path
  const rel = ogUrl.replace('https://satoshidashboard.com', 'public');
  if (exists(rel)) ok(`OG image file exists: ${rel}`);
  else warn('OG_IMAGE_FILE', `OG image file not found locally at ${rel} (may be OK if deployed)`, 'index.html');
}

// ─── Summary ─────────────────────────────────────────────────────────────────

const errors   = issues.filter(i => i.level === 'error');
const warnings = issues.filter(i => i.level === 'warn');

console.log('\n' + '═'.repeat(70));
console.log('SEO AUDIT SUMMARY');
console.log('═'.repeat(70));
console.log(`  Checks passed : ${passed}`);
console.log(`  Errors        : ${errors.length}`);
console.log(`  Warnings      : ${warnings.length}`);
console.log(`  Auto-fixable  : ${fixes.length}`);
console.log('─'.repeat(70));

if (errors.length > 0) {
  console.log('\nERRORS:');
  errors.forEach(e => console.log(`  [${e.code}] ${e.message}${e.file ? ' (' + e.file + ')' : ''}`));
}
if (warnings.length > 0) {
  console.log('\nWARNINGS:');
  warnings.forEach(w => console.log(`  [${w.code}] ${w.message}${w.file ? ' (' + w.file + ')' : ''}`));
}

console.log('═'.repeat(70));

// ─── Write report ────────────────────────────────────────────────────────────

mkdirSync(OUT_DIR, { recursive: true });

const report = {
  date: TODAY,
  runAt: new Date().toISOString(),
  summary: {
    passed,
    errors: errors.length,
    warnings: warnings.length,
    autoFixable: fixes.length,
  },
  issues,
  fixes,
};

writeFileSync(REPORT, JSON.stringify(report, null, 2));
console.log(`\nReport saved → ${REPORT}\n`);

process.exit(errors.length > 0 ? 1 : 0);
