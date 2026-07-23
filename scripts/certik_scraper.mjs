import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve('C:/Users/liber/Downloads/certik_scraper');
const CSV_PATH = path.join(OUTPUT_DIR, 'proyectos_certik.csv');
const STATE_PATH = path.join(OUTPUT_DIR, 'proyectos_certik.state.json');
const SUMMARY_PATH = path.join(OUTPUT_DIR, 'proyectos_certik.resumen.txt');
const BASE_URL = 'https://skynet.certik.com';
const LEADERBOARD_API = `${BASE_URL}/api/leaderboard-all-projects/query-leaderboard-new-launch-projects`;
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const CSV_COLUMNS = ['nombre_empresa', 'nombre_fondo', 'correo_electronico'];
const COMMON_PATHS = [
  'contact',
  'contact-us',
  'about',
  'team',
  'company',
  'support',
  'faq',
  'legal',
  'privacy-policy',
  'terms',
  'whitepaper',
  'litepaper',
  'docs',
  'documentation',
  'investors',
  'backers',
  'press',
];

const MAX_RETRIES = 4;
const REQUEST_DELAY_MIN_MS = 150;
const REQUEST_DELAY_MAX_MS = 350;
const PDF_TEXT_PYTHON = String.raw`
import sys
from pypdf import PdfReader

path = sys.argv[1]
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="ignore")
except Exception:
    pass
reader = PdfReader(path)
parts = []
for page in reader.pages:
    try:
        parts.append(page.extract_text() or "")
    except Exception:
        pass
sys.stdout.write("\n".join(parts))
`;

const RESET = process.argv.includes('--reset');
const MAX_PROJECTS_ARG = process.argv.find((arg) => arg.startsWith('--max-projects='));
const MAX_PROJECTS = MAX_PROJECTS_ARG ? Number(MAX_PROJECTS_ARG.split('=')[1]) : 0;

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(minMs, maxMs) {
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

function normalizeSpace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function canonicalUrl(url) {
  const parsed = new URL(url);
  parsed.hash = '';
  return parsed.toString();
}

function normalizeHost(url) {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
}

function sameSite(urlA, urlB) {
  const a = normalizeHost(urlA);
  const b = normalizeHost(urlB);
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

function looksLikeSocialUrl(url) {
  return /(?:x\.com|twitter\.com|t\.me|telegram\.me|discord\.gg|discord\.com|linkedin\.com|facebook\.com|instagram\.com|youtube\.com|github\.com)/i.test(
    url,
  );
}

function looksLikeDocsUrl(url, text = '') {
  return /whitepaper|litepaper|docs?|documentation|paper|deck|pdf/i.test(`${url} ${text}`);
}

function looksLikeOfficialWebsiteUrl(url) {
  return /^https?:\/\//i.test(url) && !/certik\.com/i.test(url) && !looksLikeSocialUrl(url);
}

function stripHtml(html) {
  return normalizeSpace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' '),
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
  let score = 0;
  const domainBlacklist = [
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
  const localBlacklist = [
    /logo/i,
    /icon/i,
    /image/i,
    /img/i,
    /sprite/i,
    /banner/i,
    /avatar/i,
  ];
  if (localBlacklist.some((pattern) => pattern.test(local) || pattern.test(domain))) {
    return -1000;
  }
  if (domainBlacklist.some((pattern) => pattern.test(domain) || pattern.test(local))) {
    return -1000;
  }
  if (websiteUrl) {
    const host = normalizeHost(websiteUrl);
    if (domain === host || domain.endsWith(`.${host}`) || host.endsWith(`.${domain}`)) {
      score += 100;
    }
  }
  if (/(contact|info|hello|support|sales|team|admin|press|media|business|careers|jobs|founder|founders)/i.test(local)) {
    score += 50;
  }
  if (/(noreply|no-reply|donotreply|example)/i.test(local)) {
    score -= 50;
  }
  if (/(gmail|outlook|yahoo|hotmail|proton|icloud|mail)/i.test(domain)) {
    score -= 5;
  }
  return score;
}

function pickBestEmail(emails, websiteUrl) {
  if (!emails.length) return '';
  const ranked = [...emails]
    .map((email) => ({ email, score: scoreEmail(email, websiteUrl) }))
    .sort((a, b) => b.score - a.score);
  if (!ranked.length || ranked[0].score < 0) {
    return '';
  }
  return ranked[0].email || '';
}

function escapeCsv(value) {
  const text = String(value ?? '');
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
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

function renderCsv(rows) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const row of rows) {
    lines.push(
      CSV_COLUMNS.map((column) => escapeCsv(row[column] ?? '')).join(','),
    );
  }
  return `${lines.join('\n')}\n`;
}

function writeState(state) {
  const serializable = {
    ...state,
    updatedAt: new Date().toISOString(),
  };
  writeAtomic(STATE_PATH, `${JSON.stringify(serializable, null, 2)}\n`);
  writeAtomic(CSV_PATH, renderCsv(serializable.rows || []));
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
  if (!executablePath) {
    throw new Error('No Chrome/Edge executable found for browser fallback.');
  }
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
    if (browser) {
      await browser.close();
    }
  } catch {
    // ignore shutdown errors
  }
  browser = undefined;
  browserPage = undefined;
}

process.on('exit', () => {
  if (browser) {
    browser.close().catch(() => {});
  }
});
process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(130);
});
process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(143);
});

async function fetchWithRetry(url, { kind = 'text', timeoutMs = 25000, headers = {}, browserFallback = false } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await sleep(jitter(REQUEST_DELAY_MIN_MS, REQUEST_DELAY_MAX_MS));
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
      let response;
      try {
        response = await fetch(url, {
          headers: {
            accept:
              kind === 'json'
                ? 'application/json, text/plain, */*'
                : 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'accept-language': 'en-US,en;q=0.9,es;q=0.8',
            'cache-control': 'no-cache',
            pragma: 'no-cache',
            'user-agent': USER_AGENT,
            ...headers,
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!response.ok) {
        if ([429, 500, 502, 503, 504].includes(response.status)) {
          const retryAfter = Number(response.headers.get('retry-after') || '0');
          const wait = retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt;
          throw new Error(`HTTP ${response.status} for ${url}; retrying in ${wait}ms`);
        }
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      if (kind === 'json') {
        return await response.json();
      }
      if (kind === 'buffer') {
        return Buffer.from(await response.arrayBuffer());
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_RETRIES) break;
      const wait = 1000 * 2 ** attempt + jitter(100, 500);
      console.warn(`[retry] ${url} attempt ${attempt + 1} failed: ${error.message}`);
      await sleep(wait);
    }
  }

  if (browserFallback && kind === 'text') {
    try {
      const page = await getBrowserPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
      await sleep(1500);
      return await page.content();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function fetchJson(url, opts = {}) {
  return await fetchWithRetry(url, { ...opts, kind: 'json' });
}

async function fetchText(url, opts = {}) {
  return await fetchWithRetry(url, { ...opts, kind: 'text' });
}

async function fetchBuffer(url, opts = {}) {
  return await fetchWithRetry(url, { ...opts, kind: 'buffer' });
}

function classifyAnchor(href, text = '', aria = '', title = '') {
  const value = `${href} ${text} ${aria} ${title}`.toLowerCase();
  if (/mailto:/.test(href)) return 'email';
  if (/t\.me|telegram/i.test(value)) return 'telegram';
  if (/x\.com|twitter\.com/i.test(value)) return 'twitter';
  if (/whitepaper|litepaper|docs?|documentation|paper|deck|pdf/i.test(value)) return 'docs';
  return 'other';
}

function extractProjectLinks(html, baseUrl) {
  const dom = new JSDOM(html, { url: baseUrl });
  const document = dom.window.document;
  const anchors = [...document.querySelectorAll('a[href]')].map((anchor) => ({
    href: anchor.href,
    text: normalizeSpace(anchor.textContent),
    aria: anchor.getAttribute('aria-label') || '',
    title: anchor.getAttribute('title') || '',
  }));

  let website = '';
  const labelCandidates = [...document.querySelectorAll('div,span,p,strong,b')].filter(
    (el) => normalizeSpace(el.textContent) === 'Website',
  );
  for (const label of labelCandidates) {
    const parent = label.parentElement;
    const candidates = parent ? [...parent.querySelectorAll('a[href]')] : [];
    const chosen = candidates.find((anchor) => {
      const href = anchor.href || '';
      return looksLikeOfficialWebsiteUrl(href) && !/etherscan|certik/i.test(href);
    });
    if (chosen) {
      website = chosen.href;
      break;
    }
    const next = label.nextElementSibling;
    if (next?.tagName === 'A' && looksLikeOfficialWebsiteUrl(next.href)) {
      website = next.href;
      break;
    }
  }
  if (!website) {
    const fallback = anchors.find((anchor) => {
      const href = anchor.href || '';
      return (
        looksLikeOfficialWebsiteUrl(href) &&
        !/etherscan|certik|github|x\.com|twitter\.com|t\.me/i.test(href)
      );
    });
    if (fallback) {
      website = fallback.href;
    }
  }

  const twitter =
    anchors.find((anchor) => {
      const href = anchor.href || '';
      return /x\.com|twitter\.com/i.test(href) && !/certikcommunity/i.test(href);
    })?.href || '';
  const telegram =
    anchors.find((anchor) => {
      const href = anchor.href || '';
      return /t\.me/i.test(href) && !/certikcommunity/i.test(href);
    })?.href || '';

  const docs = [];
  for (const anchor of anchors) {
    if (classifyAnchor(anchor.href, anchor.text, anchor.aria, anchor.title) === 'docs') {
      if (!docs.includes(anchor.href)) docs.push(anchor.href);
    }
  }

  return { website, twitter, telegram, docs, anchors };
}

function cleanFundCandidate(candidate) {
  const cleaned = normalizeSpace(
    candidate
      .replace(/\b(?:website|twitter|telegram|contact|about|team|docs?|whitepaper|litepaper|funding history|investors?|backers?)\b/gi, ' ')
      .replace(/[|/\\]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s:,-]+|[\s:,-]+$/g, ''),
  );
  return cleaned
    .split(/[.;\n|]/)[0]
    .replace(/[,:-]+$/g, '')
    .trim();
}

function looksLikeFundName(candidate, rawMatch = '') {
  const lower = candidate.toLowerCase();
  const blacklist = new Set([
    'private',
    'public',
    'seed',
    'series a',
    'series b',
    'series c',
    'round',
    'fund',
    'funds',
    'investor',
    'investors',
    'backer',
    'backers',
    'n/a',
    'na',
    'none',
    'available',
    'history',
    'history:',
    'private sale',
    'public sale',
  ]);
  const noiseWords = [
    'platform',
    'users',
    'tokenomics',
    'designed',
    'democratize',
    'enables',
    'enable',
    'solution',
    'protocol',
    'network',
    'token',
    'launch',
    'project',
    'game',
    'wallet',
    'market',
    'decentralized',
    'ecosystem',
    'app',
    'community',
    'experience',
    'industry',
    'leader',
    'leaders',
    'base',
    'usdc',
    'usdt',
    'eth',
    'sol',
    'btc',
    'bnb',
    'sui',
    'aptos',
    'avax',
    'matic',
    'arb',
    'op',
    'blast',
    'ton',
    'polygon',
    'stablecoin',
  ];
  const positiveSignals = [
    'capital',
    'venture',
    'ventures',
    'labs',
    'partner',
    'partners',
    'fund',
    'funds',
    'invest',
    'investor',
    'investors',
    'investment',
    'investments',
    'holding',
    'holdings',
    'management',
    'equity',
    'group',
    'franklin templeton',
    'templeton',
    'blackrock',
    'polychain',
    'pantera',
    'binance labs',
    'coinbase ventures',
    'dragonfly',
    'multicoin',
    'framework',
    'delphi',
    'jump',
    'galaxy',
    'paradigm',
    'animoca',
    'a16z',
  ];
  if (!candidate || candidate.length < 2 || candidate.length > 120) return false;
  if (blacklist.has(lower)) return false;
  if (/^(?:private|public|seed|round|fund|investor|investors|backer|backers)$/i.test(lower)) return false;
  const words = candidate.split(/\s+/).filter(Boolean);
  if (words.length > 5) return false;
  if (words.length === 1 && !/[A-Z0-9&]/.test(rawMatch)) return false;
  if (!/[A-Z0-9&]/.test(rawMatch) && words.length < 2) return false;
  if (noiseWords.some((word) => lower.includes(word))) return false;
  if (!positiveSignals.some((signal) => lower.includes(signal))) return false;
  return true;
}

function extractFundNameFromText(text) {
  const patterns = [
    /backed by[:\s\-]*([A-Z][A-Za-z0-9&().,'/-]*(?:\s+[A-Z][A-Za-z0-9&().,'/-]*){0,5})/i,
    /funded by[:\s\-]*([A-Z][A-Za-z0-9&().,'/-]*(?:\s+[A-Z][A-Za-z0-9&().,'/-]*){0,5})/i,
    /investors?[:\s\-]*([A-Z][A-Za-z0-9&().,'/-]*(?:\s+[A-Z][A-Za-z0-9&().,'/-]*){0,5})/i,
    /backers?[:\s\-]*([A-Z][A-Za-z0-9&().,'/-]*(?:\s+[A-Z][A-Za-z0-9&().,'/-]*){0,5})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const candidate = cleanFundCandidate(match[1]);
      if (looksLikeFundName(candidate, match[1]) && !/certik|website|twitter|telegram|contact|team|about|funding history|n\/a/i.test(candidate)) {
        return candidate;
      }
    }
  }
  return '';
}

function buildCandidateUrls(websiteUrl, docsUrls = []) {
  const urls = new Set();
  if (websiteUrl) {
    urls.add(canonicalUrl(websiteUrl));
    const parsed = new URL(websiteUrl);
    const baseOrigin = parsed.origin;
    const basePath = parsed.pathname.replace(/\/+$/, '');
    const pathSegments = basePath
      .split('/')
      .filter(Boolean)
      .filter((segment) => !/\.[a-z0-9]{2,5}$/i.test(segment));
    const rootPath = pathSegments.length > 0 ? `/${pathSegments[0]}` : '';

    for (const keyword of COMMON_PATHS) {
      urls.add(canonicalUrl(`${baseOrigin}/${keyword}`));
      if (rootPath) {
        urls.add(canonicalUrl(`${baseOrigin}${rootPath}/${keyword}`));
      }
      if (basePath && basePath !== rootPath) {
        urls.add(canonicalUrl(`${baseOrigin}${basePath}/${keyword}`));
      }
    }
  }

  for (const doc of docsUrls) {
    try {
      urls.add(canonicalUrl(doc));
    } catch {
      // ignore malformed URLs
    }
  }

  return [...urls];
}

async function extractPdfTextFromBuffer(buffer, tag) {
  const tempPath = path.join(
    OUTPUT_DIR,
    `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}-${tag}.pdf`,
  );
  fs.writeFileSync(tempPath, buffer);
  try {
    const stdout = execFileSync('python', ['-c', PDF_TEXT_PYTHON, tempPath], {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
    return stdout;
  } finally {
    try {
      fs.unlinkSync(tempPath);
    } catch {
      // ignore cleanup issues
    }
  }
}

async function crawlWebsiteForContacts(websiteUrl, docsUrls = [], seedText = '') {
  const candidateUrls = buildCandidateUrls(websiteUrl, docsUrls);
  const visited = new Set();
  const texts = [stripHtml(seedText || '')];
  const foundEmails = new Set(extractEmailsFromText(seedText || ''));
  let fundName = extractFundNameFromText(stripHtml(seedText || ''));

  for (const url of candidateUrls) {
    if (visited.has(url)) continue;
    visited.add(url);

    let responseText = '';
    let responseBuffer = null;
    let contentType = '';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(new Error('timeout')), 25000);
      let res;
      try {
        res = await fetch(url, {
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
      if (!res.ok) {
        continue;
      }
      contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/pdf') || /\.pdf(?:$|\?)/i.test(url)) {
        responseBuffer = Buffer.from(await res.arrayBuffer());
        responseText = await extractPdfTextFromBuffer(responseBuffer, 'doc');
      } else {
        responseText = await res.text();
      }
    } catch (error) {
      console.warn(`[site] failed ${url}: ${error.message}`);
      continue;
    }

    const text = stripHtml(responseText);
    texts.push(text);
    for (const email of extractEmailsFromText(responseText)) {
      foundEmails.add(email);
    }
    if (!fundName) {
      fundName = extractFundNameFromText(text);
    }

    const shouldBrowserFallback =
      !foundEmails.size &&
      websiteUrl &&
      url === canonicalUrl(websiteUrl) &&
      (text.length < 2000 || /enable javascript|just a moment|access denied|captcha/i.test(text));
    if (shouldBrowserFallback) {
      try {
        const page = await getBrowserPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(2000);
        const rendered = await page.content();
        const renderedText = stripHtml(rendered);
        texts.push(renderedText);
        for (const email of extractEmailsFromText(rendered)) {
          foundEmails.add(email);
        }
        if (!fundName) {
          fundName = extractFundNameFromText(renderedText);
        }
      } catch (error) {
        console.warn(`[browser] failed ${url}: ${error.message}`);
      }
    }

    if (foundEmails.size && fundName) {
      // keep gathering a little more context only through current candidate list,
      // but stop early once we have the key data and have inspected a useful page.
      if (visited.size > 3) {
        break;
      }
    }
  }

  const email = pickBestEmail([...foundEmails], websiteUrl);
  if (!fundName) {
    fundName = '';
  }
  return { email, fundName, texts: texts.filter(Boolean) };
}

async function fetchLeaderboardProjects() {
  const projects = [];
  let skip = 0;
  let page = 1;
  let total = null;

  while (true) {
    const url = `${LEADERBOARD_API}?limit=50&skip=${skip}`;
    const payload = await fetchJson(url, { timeoutMs: 30000 });
    const items = payload.items || [];
    total = payload.page?.total ?? total ?? projects.length;
    console.log(`[leaderboard] page ${page} skip=${skip} items=${items.length} total=${total}`);
    for (const item of items) {
      projects.push({
        id: item.id,
        name: normalizeSpace(item.name),
        detailUrl: `${BASE_URL}/projects/${item.id}`,
      });
    }
    if (items.length < 50 || projects.length >= total) {
      break;
    }
    skip += 50;
    page += 1;
  }

  const deduped = [];
  const seen = new Set();
  for (const project of projects) {
    if (seen.has(project.id)) continue;
    seen.add(project.id);
    deduped.push(project);
  }
  return deduped;
}

async function processProject(project, index, total) {
  const detailHtml = await fetchText(project.detailUrl, {
    timeoutMs: 30000,
    browserFallback: false,
  });
  const { website, twitter, telegram, docs } = extractProjectLinks(detailHtml, project.detailUrl);
  const detailText = stripHtml(detailHtml);
  let fundName = extractFundNameFromText(detailText);

  const websiteData =
    website || docs.length
      ? await crawlWebsiteForContacts(website, docs, detailText)
      : { email: '', fundName: '', texts: [detailText] };

  const finalEmail = websiteData.email || '';
  if (!fundName && websiteData.fundName) {
    fundName = websiteData.fundName;
  }

  const row = {
    nombre_empresa: project.name,
    nombre_fondo: fundName || '',
    correo_electronico: finalEmail || '',
  };

  return {
    row,
    extra: {
      id: project.id,
      detailUrl: project.detailUrl,
      website: website || '',
      twitter: twitter || '',
      telegram: telegram || '',
      docs,
      processedAt: new Date().toISOString(),
    },
  };
}

function loadState() {
  if (RESET) {
    return { version: 1, projects: [], rows: [], processedIds: [], extra: {} };
  }
  const state = readJsonSafe(STATE_PATH, null);
  if (state && Array.isArray(state.rows) && Array.isArray(state.projects)) {
    return state;
  }
  return { version: 1, projects: [], rows: [], processedIds: [], extra: {} };
}

async function main() {
  const state = loadState();
  if (!state.projects.length) {
    state.projects = await fetchLeaderboardProjects();
    state.rows = [];
    state.processedIds = [];
    state.extra = state.extra || {};
    writeState(state);
  }

  const processedIds = new Set(state.processedIds || []);
  const rowsById = new Map((state.rows || []).map((row) => [row.__id, row]));
  const projects = state.projects;
  const totalProjects = projects.length;

  let processedCount = processedIds.size;
  let incompleteCount = (state.rows || []).filter(
    (row) => !normalizeSpace(row.nombre_fondo) || !normalizeSpace(row.correo_electronico),
  ).length;

  console.log(`[start] projects=${totalProjects} already_processed=${processedCount}`);
  if (MAX_PROJECTS > 0) {
    console.log(`[limit] max-projects=${MAX_PROJECTS}`);
  }

  for (let i = 0; i < projects.length; i += 1) {
    if (MAX_PROJECTS > 0 && processedCount >= MAX_PROJECTS) {
      console.log(`[stop] max-projects reached: ${MAX_PROJECTS}`);
      break;
    }
    const project = projects[i];
    if (processedIds.has(project.id)) {
      continue;
    }

    console.log(`[project ${processedCount + 1}/${totalProjects}] ${project.name}`);
    try {
      const result = await processProject(project, processedCount + 1, totalProjects);
      const storedRow = { __id: project.id, ...result.row };
      state.rows = [...(state.rows || []).filter((row) => row.__id !== project.id), storedRow];
      state.processedIds = [...processedIds, project.id];
      processedIds.add(project.id);
      rowsById.set(project.id, storedRow);
      processedCount += 1;
      if (!normalizeSpace(result.row.nombre_fondo) || !normalizeSpace(result.row.correo_electronico)) {
        incompleteCount += 1;
      }
      state.extra = state.extra || {};
      state.extra[project.id] = result.extra;
      writeState(state);
      console.log(
        `[done ${processedCount}/${totalProjects}] fund=${result.row.nombre_fondo || ''} email=${result.row.correo_electronico || ''}`,
      );
    } catch (error) {
      console.warn(`[error] ${project.name}: ${error.message}`);
      const fallbackRow = {
        __id: project.id,
        nombre_empresa: project.name,
        nombre_fondo: '',
        correo_electronico: '',
      };
      state.rows = [...(state.rows || []).filter((row) => row.__id !== project.id), fallbackRow];
      state.processedIds = [...processedIds, project.id];
      processedIds.add(project.id);
      rowsById.set(project.id, fallbackRow);
      processedCount += 1;
      incompleteCount += 1;
      state.extra = state.extra || {};
      state.extra[project.id] = {
        id: project.id,
        detailUrl: project.detailUrl,
        error: error.message,
        processedAt: new Date().toISOString(),
      };
      writeState(state);
      console.log(`[done ${processedCount}/${totalProjects}] blank row due to error`);
    }
  }

  const finalRows = projects
    .map((project) => rowsById.get(project.id))
    .filter(Boolean)
    .map((row) => ({
      nombre_empresa: row.nombre_empresa || '',
      nombre_fondo: row.nombre_fondo || '',
      correo_electronico: row.correo_electronico || '',
    }));

  const finalIncomplete = finalRows.filter(
    (row) => !normalizeSpace(row.nombre_fondo) || !normalizeSpace(row.correo_electronico),
  ).length;
  const summary = [
    `Proyectos procesados: ${finalRows.length}`,
    `Proyectos con datos incompletos: ${finalIncomplete}`,
    `CSV: ${CSV_PATH}`,
    `Estado: ${STATE_PATH}`,
  ].join('\n');
  writeAtomic(SUMMARY_PATH, `${summary}\n`);
  writeAtomic(CSV_PATH, renderCsv(finalRows));
  writeAtomic(
    STATE_PATH,
    `${JSON.stringify(
      {
        ...state,
        projects,
        rows: projects
          .map((project) => {
            const row = rowsById.get(project.id);
            return row ? { __id: project.id, ...row } : null;
          })
          .filter(Boolean),
        processedIds: [...processedIds],
        updatedAt: new Date().toISOString(),
        summary: {
          processed: finalRows.length,
          incomplete: finalIncomplete,
        },
      },
      null,
      2,
    )}\n`,
  );
  await closeBrowser();
  console.log(summary);
}

await main();
