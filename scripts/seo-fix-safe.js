#!/usr/bin/env node
// scripts/seo-fix-safe.js
// Applies safe, non-destructive SEO fixes identified by seo-audit-local.js.
// Only modifies: index.html, public/robots.txt, public/sitemap.xml
// Backs up each file before editing.
// Usage: node scripts/seo-fix-safe.js

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT  = resolve(import.meta.dirname, '..');
const TODAY = new Date().toISOString().slice(0, 10);

function read(rel)  { return readFileSync(join(ROOT, rel), 'utf8'); }
function write(rel, content) { writeFileSync(join(ROOT, rel), content, 'utf8'); }
function backup(rel) {
  const src = join(ROOT, rel);
  const dst = join(ROOT, rel + '.seo-backup');
  if (existsSync(src)) copyFileSync(src, dst);
}

const applied = [];
const skipped = [];

function fix(label, fn) {
  try {
    fn();
    applied.push(label);
    console.log(`  ✓ FIXED  ${label}`);
  } catch (e) {
    skipped.push({ label, reason: e.message });
    console.log(`  ✗ SKIP   ${label}: ${e.message}`);
  }
}
function skip(label, reason) {
  skipped.push({ label, reason });
  console.log(`  — SKIP   ${label}: ${reason}`);
}

// ─── index.html ──────────────────────────────────────────────────────────────

console.log('\n[1/3] Fixing index.html…');
backup('index.html');
let html = read('index.html');
const htmlOrig = html;

// Fix 1: Update dateModified to today
fix('Update dateModified to today', () => {
  const before = html;
  html = html.replace(
    /"dateModified"\s*:\s*"\d{4}-\d{2}-\d{2}"/g,
    `"dateModified": "${TODAY}"`,
  );
  if (html === before) throw new Error('dateModified not found — nothing to change');
});

// Fix 2: Add og:image:width / og:image:height if missing
if (!html.includes('og:image:width')) {
  fix('Add og:image:width and og:image:height meta tags', () => {
    const insertion = `    <meta property="og:image:width" content="1280" />\n    <meta property="og:image:height" content="720" />\n`;
    const anchor    = '    <meta property="og:image:alt"';
    if (!html.includes(anchor)) throw new Error('anchor tag og:image:alt not found');
    html = html.replace(anchor, insertion + anchor);
  });
} else {
  skip('Add og:image:width/height', 'already present');
}

// Fix 3: Trim title if over 60 chars (warn only — title is intentionally descriptive)
const titleMatch = html.match(/<title>([^<]+)<\/title>/);
if (titleMatch && titleMatch[1].length > 60) {
  // This is a borderline case; do not auto-trim — too risky. Just note it.
  skip('Trim <title> length', 'manual review recommended — auto-trim may hurt SEO signal');
}

// Write if changed
if (html !== htmlOrig) {
  write('index.html', html);
  console.log('  → index.html written');
} else {
  console.log('  → index.html unchanged');
}

// ─── sitemap.xml ─────────────────────────────────────────────────────────────

console.log('\n[2/3] Fixing sitemap.xml…');
backup('public/sitemap.xml');
let sitemap = read('public/sitemap.xml');
const sitemapOrig = sitemap;

// Fix: Update all <lastmod> dates to today
fix('Update all <lastmod> dates in sitemap to today', () => {
  const before = sitemap;
  sitemap = sitemap.replace(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g, `<lastmod>${TODAY}</lastmod>`);
  if (sitemap === before) throw new Error('No <lastmod> dates found');
});

if (sitemap !== sitemapOrig) {
  write('public/sitemap.xml', sitemap);
  console.log('  → public/sitemap.xml written');
} else {
  console.log('  → public/sitemap.xml unchanged');
}

// ─── robots.txt ──────────────────────────────────────────────────────────────

console.log('\n[3/3] Checking robots.txt…');
const robots = read('public/robots.txt');

if (/Sitemap:/i.test(robots)) {
  skip('Add Sitemap: directive', 'already present');
} else {
  backup('public/robots.txt');
  fix('Add Sitemap: directive to robots.txt', () => {
    const updated = robots.trimEnd() + '\n\nSitemap: https://satoshidashboard.com/sitemap.xml\n';
    write('public/robots.txt', updated);
  });
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60));
console.log('SEO FIX SUMMARY');
console.log('═'.repeat(60));
console.log(`  Applied : ${applied.length}`);
console.log(`  Skipped : ${skipped.length}`);

if (applied.length > 0) {
  console.log('\nApplied fixes:');
  applied.forEach(f => console.log(`  ✓ ${f}`));
}
if (skipped.length > 0) {
  console.log('\nSkipped (need manual review):');
  skipped.forEach(s => console.log(`  — ${s.label}: ${s.reason}`));
}
console.log('═'.repeat(60) + '\n');
