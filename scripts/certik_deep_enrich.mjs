import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.resolve('C:/Users/liber/Downloads/certik_scraper');
const STATE_PATH = path.join(OUTPUT_DIR, 'proyectos_certik.state.json');
const CSV_PATH = path.join(OUTPUT_DIR, 'proyectos_certik.csv');
const SUMMARY_PATH = path.join(OUTPUT_DIR, 'proyectos_certik.resumen.txt');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const MAX_SITE_PAGES = Number(process.argv.find((a) => a.startsWith('--max-site-pages='))?.split('=')[1] || 24);
const MAX_SITES = Number(process.argv.find((a) => a.startsWith('--max-sites='))?.split('=')[1] || 0);
const RESET = process.argv.includes('--reset');
const WAIT_MIN_MS = 150;
const WAIT_MAX_MS = 350;
const RETRIES = 3;

const PDF_TEXT_PYTHON = String.raw`
import sys
from pypdf import PdfReader
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="ignore")
except Exception:
    pass
path = sys.argv[1]
reader = PdfReader(path)
parts = []
for page in reader.pages:
    try:
        parts.append(page.extract_text() or "")
    except Exception:
        pass
sys.stdout.write("\n".join(parts))
`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function jitter(minMs, maxMs) {
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}
function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}
function escapeCsv(value) {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
function writeAtomic(filePath, content) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}
function readJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}
function canonicalize(url) {
  const u = new URL(url);
  u.hash = '';
  return u.toString();
}
function hostOf(url) {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
}
function sameSite(url, baseHost) {
  const h = hostOf(url);
  return h === baseHost || h.endsWith(`.${baseHost}`) || baseHost.endsWith(`.${h}`);
}
function isAsset(url) {
  return /\.(?:png|jpe?g|gif|webp|svg|ico|avif|mp4|mp3|zip|rar|7z|woff2?|ttf|eot|css|js|mjs|map|json)$/i.test(
    url,
  );
}
function deobfuscateEmailText(text) {
  return String(text || '')
    .replace(/\s*\[\s*at\s*\]\s*/gi, '@')
    .replace(/\s*\(\s*at\s*\)\s*/gi, '@')
    .replace(/\s+\bat\b\s+/gi, '@')
    .replace(/\s*\[\s*dot\s*\]\s*/gi, '.')
    .replace(/\s*\(\s*dot\s*\)\s*/gi, '.')
    .replace(/\s+\bdot\b\s+/gi, '.')
    .replace(/\s+/g, ' ');
}
function extractEmailsFromText(text) {
  const normalized = deobfuscateEmailText(text);
  const emails = new Set();
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
  for (const match of normalized.matchAll(emailRegex)) {
    emails.add(match[0].toLowerCase());
  }
  for (const match of normalized.matchAll(/mailto:([^"'<>\s]+)/gi)) {
    const value = decodeURIComponent(match[1].split('?')[0]).toLowerCase();
    const direct = value.match(emailRegex);
    if (direct?.[0]) {
      emails.add(direct[0].toLowerCase());
    }
  }
  return [...emails];
}
function scoreEmail(email, websiteUrl) {
  const lower = email.toLowerCase();
  const [local, domain] = lower.split('@');
  if (!domain) return -1000;
  const badDomainPatterns = [
    /\.(?:png|jpe?g|gif|webp|svg|ico|avif)$/i,
    /phantom\.solana/i,
    /window\./i,
    /mailchimp/i,
    /sendgrid/i,
    /mailgun/i,
    /amazonses/i,
    /cloudfront/i,
    /googleusercontent/i,
    /web3forms/i,
    /formspree/i,
    /typeform/i,
    /hubspot/i,
    /intercom/i,
    /zendesk/i,
    /freshdesk/i,
    /mailerlite/i,
    /brevo/i,
    /constantcontact/i,
    /sentry/i,
    /wixpress/i,
    /wix/i,
    /t\.me/i,
    /telegram/i,
    /somewhere\.com/i,
    /example\.(?:com|org|net)/i,
    /test\.(?:com|org|net)/i,
    /placeholder/i,
    /noreply/i,
    /no-reply/i,
    /donotreply/i,
  ];
  if (badDomainPatterns.some((r) => r.test(lower) || r.test(local) || r.test(domain))) return -1000;
  const badLocalPatterns = [/logo/i, /icon/i, /image/i, /img/i, /sprite/i, /banner/i, /avatar/i];
  if (badLocalPatterns.some((r) => r.test(local) || r.test(domain))) return -1000;
  let score = 0;
  if (websiteUrl) {
    const websiteHost = hostOf(websiteUrl);
    if (domain === websiteHost || domain.endsWith(`.${websiteHost}`) || websiteHost.endsWith(`.${domain}`)) {
      score += 100;
    }
  }
  if (/(contact|info|hello|support|sales|team|admin|press|media|business|careers|jobs|founder|founders|legal|privacy|partnerships|partners)/i.test(local)) {
    score += 50;
  }
  if (/(gmail|outlook|yahoo|hotmail|proton|icloud|mail)/i.test(domain)) {
    score -= 5;
  }
  return score;
}
function pickBestEmail(emails, websiteUrl) {
  const ranked = [...new Set(emails)]
    .map((email) => ({ email, score: scoreEmail(email, websiteUrl) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 0) return '';
  return ranked[0].email;
}

let browser;
let browserPage;
function findBrowserExecutablePath() {
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}
async function getBrowserPage() {
  if (browserPage) return browserPage;
  const executablePath = findBrowserExecutablePath();
  if (!executablePath) return null;
  browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 1800 },
  });
  browserPage = await browser.newPage();
  await browserPage.setUserAgent(USER_AGENT);
  return browserPage;
}
async function closeBrowser() {
  try {
    if (browser) await browser.close();
  } catch {}
  browser = undefined;
  browserPage = undefined;
}
process.on('exit', () => {
  if (browser) browser.close().catch(() => {});
});

async function fetchText(url, opts = {}) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      await sleep(jitter(WAIT_MIN_MS, WAIT_MAX_MS));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error('timeout')), opts.timeoutMs || 25000);
      let response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9,es;q=0.8',
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            'user-agent': USER_AGENT,
          },
        });
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) {
        if ([429, 500, 502, 503, 504].includes(response.status)) {
          throw new Error(`HTTP ${response.status}`);
        }
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (err) {
      lastError = err;
      if (attempt >= RETRIES) break;
      await sleep(1000 * 2 ** attempt + jitter(100, 500));
    }
  }
  if (opts.browserFallback) {
    const page = await getBrowserPage();
    if (!page) throw lastError;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opts.timeoutMs || 30000 });
    await sleep(1500);
    return await page.content();
  }
  throw lastError;
}

async function fetchBuffer(url, opts = {}) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      await sleep(jitter(WAIT_MIN_MS, WAIT_MAX_MS));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error('timeout')), opts.timeoutMs || 25000);
      let response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            accept: 'application/pdf,*/*',
            'accept-language': 'en-US,en;q=0.9,es;q=0.8',
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            'user-agent': USER_AGENT,
          },
        });
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (err) {
      lastError = err;
      if (attempt >= RETRIES) break;
      await sleep(1000 * 2 ** attempt + jitter(100, 500));
    }
  }
  throw lastError;
}

async function extractPdfText(buffer) {
  const tempPath = path.join(OUTPUT_DIR, `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`);
  fs.writeFileSync(tempPath, buffer);
  try {
    return execFileSync('python', ['-c', PDF_TEXT_PYTHON, tempPath], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
  } finally {
    try {
      fs.unlinkSync(tempPath);
    } catch {}
  }
}

function parseHtmlLinks(html, baseUrl) {
  const dom = new JSDOM(html, { url: baseUrl });
  const doc = dom.window.document;
  const links = [];
  for (const anchor of doc.querySelectorAll('a[href]')) {
    links.push({
      href: anchor.href,
      text: normalizeSpace(anchor.textContent),
      title: anchor.getAttribute('title') || '',
      aria: anchor.getAttribute('aria-label') || '',
    });
  }
  const jsonLdTexts = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((node) => node.textContent || '');
  const combinedText = [doc.body?.innerText || '', ...jsonLdTexts].join('\n');
  return { links, text: combinedText };
}

function looksRelevantUrl(url) {
  return /contact|about|team|company|support|help|faq|legal|privacy|terms|press|invest|backer|whitepaper|whitepapers|litepaper|docs|documentation|blog|article|news|media|sitemap|roadmap|ecosystem|article|articles|resources|paper|pdf/i.test(
    url,
  );
}

async function crawlSite(websiteUrl, projectName) {
  const base = new URL(websiteUrl);
  const baseHost = base.hostname.toLowerCase().replace(/^www\./, '');
  const websiteBlacklist = [
    /(?:^|\.)coingecko\.com$/i,
    /(?:^|\.)coinmarketcap\.com$/i,
    /(?:^|\.)etherscan\.io$/i,
    /(?:^|\.)bscscan\.com$/i,
    /(?:^|\.)dexscreener\.com$/i,
    /(?:^|\.)dextools\.io$/i,
    /(?:^|\.)coincommunities\.org$/i,
    /(?:^|\.)x\.com$/i,
    /(?:^|\.)twitter\.com$/i,
    /(?:^|\.)t\.me$/i,
    /(?:^|\.)telegram\.me$/i,
  ];
  if (websiteBlacklist.some((pattern) => pattern.test(baseHost))) {
    return { email: '', emails: [], visited: [] };
  }
  const seeds = new Set();
  const addSeed = (u) => {
    try {
      seeds.add(canonicalize(u));
    } catch {}
  };
  addSeed(websiteUrl);
  addSeed(`${base.origin}/robots.txt`);
  addSeed(`${base.origin}/sitemap.xml`);
  addSeed(`${base.origin}/sitemap_index.xml`);
  addSeed(`${base.origin}/contact`);
  addSeed(`${base.origin}/contact-us`);
  addSeed(`${base.origin}/about`);
  addSeed(`${base.origin}/team`);
  addSeed(`${base.origin}/company`);
  addSeed(`${base.origin}/support`);
  addSeed(`${base.origin}/help`);
  addSeed(`${base.origin}/faq`);
  addSeed(`${base.origin}/legal`);
  addSeed(`${base.origin}/privacy-policy`);
  addSeed(`${base.origin}/terms`);
  addSeed(`${base.origin}/whitepaper`);
  addSeed(`${base.origin}/whitepapers`);
  addSeed(`${base.origin}/litepaper`);
  addSeed(`${base.origin}/docs`);
  addSeed(`${base.origin}/documentation`);
  addSeed(`${base.origin}/press`);
  addSeed(`${base.origin}/investors`);
  addSeed(`${base.origin}/backers`);

  const queue = [...seeds].map((url) => ({ url, depth: 0 }));
  const visited = new Set();
  const emails = new Set();
  let bestEmail = '';
  let bestScore = 0;

  while (queue.length && visited.size < MAX_SITE_PAGES) {
    const { url, depth } = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    let html = '';
    let ct = '';
    try {
      const res = await fetch(url, {
        headers: {
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'accept-language': 'en-US,en;q=0.9,es;q=0.8',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          'user-agent': USER_AGENT,
        },
      });
      if (!res.ok) continue;
      ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/pdf') || /\.pdf(?:$|\?)/i.test(url)) {
        const buffer = Buffer.from(await res.arrayBuffer());
        html = await extractPdfText(buffer);
      } else {
        html = await res.text();
      }
    } catch (err) {
      continue;
    }

    const text = normalizeSpace(
      String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' '),
    );
    const found = extractEmailsFromText(`${html}\n${text}`);
    for (const email of found) {
      emails.add(email);
      const score = scoreEmail(email, websiteUrl);
      if (score > bestScore) {
        bestScore = score;
        bestEmail = email;
      }
    }

    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('robots.txt')) {
      const sitemapUrls = [...String(html).matchAll(/sitemap:\s*(https?:\/\/[^\s]+)/gi)].map((m) => m[1]);
      for (const sitemapUrl of sitemapUrls) {
        addSeed(sitemapUrl);
      }
      continue;
    }
    if (ct.includes('xml') || lowerUrl.includes('sitemap')) {
      for (const match of String(html).matchAll(/<loc>(.*?)<\/loc>/gi)) {
        const loc = match[1].trim();
        if (sameSite(loc, baseHost) && !isAsset(loc)) {
          const relevant = looksRelevantUrl(loc);
          if (relevant || depth < 1) queue.push({ url: canonicalize(loc), depth: depth + 1 });
        }
      }
      continue;
    }

    if (depth >= 2) continue;
    const { links, text: pageText } = parseHtmlLinks(String(html), url);
    const candidates = [];
    for (const link of links) {
      const href = link.href;
      if (!href || !/^https?:\/\//i.test(href)) continue;
      if (!sameSite(href, baseHost)) continue;
      if (isAsset(href)) continue;
      const relevant = looksRelevantUrl(href) || /whitepaper|contact|about|team|policy|docs|blog|article|news|press|invest/i.test(
        `${href} ${link.text} ${link.title} ${link.aria}`,
      );
      if (relevant) candidates.push(href);
    }
    const pageEmails = extractEmailsFromText(pageText);
    for (const email of pageEmails) {
      emails.add(email);
      const score = scoreEmail(email, websiteUrl);
      if (score > bestScore) {
        bestScore = score;
        bestEmail = email;
      }
    }

    for (const href of candidates.slice(0, 15)) {
      const normalized = canonicalize(href);
      if (!visited.has(normalized)) {
        queue.push({ url: normalized, depth: depth + 1 });
      }
    }
  }

  return { email: bestEmail, emails: [...emails], visited: [...visited] };
}

function loadState() {
  const state = readJsonSafe(STATE_PATH, null);
  if (!state?.rows || !Array.isArray(state.rows)) {
    throw new Error(`Unable to read state from ${STATE_PATH}`);
  }
  return state;
}

function renderCsv(rows) {
  const lines = ['nombre_empresa,nombre_fondo,correo_electronico'];
  for (const row of rows) {
    lines.push([
      escapeCsv(row.nombre_empresa || ''),
      escapeCsv(row.nombre_fondo || ''),
      escapeCsv(row.correo_electronico || ''),
    ].join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const state = loadState();
  const extra = state.extra || {};
  const rows = state.rows;
  const missing = rows.filter((row) => !normalizeSpace(row.correo_electronico));
  const toProcess = missing.filter((row) => extra[row.__id]?.website);
  const limit = MAX_SITES > 0 ? Math.min(MAX_SITES, toProcess.length) : toProcess.length;
  console.log(`[start] missing=${missing.length} withWebsite=${toProcess.length} processing=${limit}`);

  let updated = 0;
  let processed = 0;
  for (const row of toProcess.slice(0, limit)) {
    const website = extra[row.__id]?.website;
    if (!website) continue;
    processed += 1;
    console.log(`[site ${processed}/${limit}] ${row.nombre_empresa} -> ${website}`);
    try {
      const { email, emails, visited } = await crawlSite(website, row.nombre_empresa);
      if (email && !normalizeSpace(row.correo_electronico)) {
        row.correo_electronico = email;
        updated += 1;
        console.log(`  found: ${email} (candidates: ${emails.join(', ')})`);
      } else {
        console.log(`  none found; visited=${visited.length}`);
      }
      state.rows = rows;
      state.updatedAt = new Date().toISOString();
      state.summary = {
        processed: rows.length,
        incomplete: rows.filter((r) => !normalizeSpace(r.nombre_fondo) || !normalizeSpace(r.correo_electronico)).length,
      };
      writeAtomic(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
      writeAtomic(CSV_PATH, renderCsv(rows.map((r) => ({
        nombre_empresa: r.nombre_empresa || '',
        nombre_fondo: r.nombre_fondo || '',
        correo_electronico: r.correo_electronico || '',
      }))));
    } catch (err) {
      console.warn(`  error: ${err.message}`);
    }
  }
  const incomplete = rows.filter((r) => !normalizeSpace(r.nombre_fondo) || !normalizeSpace(r.correo_electronico)).length;
  const summary = [
    `Proyectos procesados: ${rows.length}`,
    `Proyectos con datos incompletos: ${incomplete}`,
    `Correos nuevos encontrados: ${updated}`,
    `CSV: ${CSV_PATH}`,
    `Estado: ${STATE_PATH}`,
  ].join('\n');
  writeAtomic(SUMMARY_PATH, `${summary}\n`);
  await closeBrowser();
  console.log(summary);
}

await main();
