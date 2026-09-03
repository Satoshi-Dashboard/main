// scripts/prerender-seo.js
// Generates a static index.html per indexable route (landing, blog index,
// blog posts, live modules) with the correct <title>/meta/canonical/OG/
// Twitter/JSON-LD baked in at build time.
//
// Why: this is a client-side-only React SPA (no SSR). vercel.json rewrites
// every non-file route to the same dist/index.html, and per-route metadata
// is only applied client-side via usePageSEO's useEffect. Any crawler that
// does not execute JavaScript — including several AI/answer-engine bots
// (GPTBot, ClaudeBot, PerplexityBot fetch raw HTML, no JS execution) — sees
// the root dashboard's title/description/canonical/schema on every route.
// This script closes that gap without introducing a full SSR framework:
// Vercel serves a matching static file before falling back to a rewrite, so
// dropping dist/module/<slug>/index.html (etc.) makes each route correct
// for non-JS fetches while the SPA still hydrates and works normally for
// real browsers.
//
// Usage: node scripts/prerender-seo.js   (run after `vite build`)
//
// NOTE: the live-module slug list here must stay in sync with the explicit
// rewrite rules in vercel.json (the "/module/(s02-...|s03-...|...)" pattern)
// — when a module moves from under-construction to live (or vice versa),
// update both NOINDEX_PREVIEW_SLUGS below and the matching vercel.json entry.

import { createServer } from 'vite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const SITE_URL = 'https://satoshidashboard.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/modulos-referencia/foto-metadata.png`;
const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

// Same list as ModulePage.jsx's NOINDEX_PREVIEW_SLUGS — under-construction
// modules stay noindex and keep serving the root SPA shell (unchanged).
const NOINDEX_PREVIEW_SLUGS = new Set([
  'bitcoin-power-law-model',
  'bitcoin-stock-to-flow-model',
  'bitcoin-seasonality-heatmap',
  'bitcoin-big-mac-index',
  'bitcoin-network-activity',
  'bitcoin-log-regression-channel',
  'bitcoin-mvrv-score',
  'bitcoin-google-trends',
  'bitcoin-dominance-chart',
  'bitcoin-utxo-distribution',
]);

function absoluteUrl(p = '/') {
  return !p || p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderHead(template, {
  title,
  description,
  keywords,
  canonicalPath,
  robots = DEFAULT_ROBOTS,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
  schema = [],
}) {
  const canonicalUrl = absoluteUrl(canonicalPath);
  const kw = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  let html = template;

  html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`);
  if (kw) html = html.replace(/<meta name="keywords" content=".*?" \/>/, `<meta name="keywords" content="${escapeHtml(kw)}" />`);
  html = html.replace(/<meta name="robots" content=".*?" \/>/, `<meta name="robots" content="${escapeHtml(robots)}" />`);
  html = html.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonicalUrl}" />`);
  html = html.replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`);
  html = html.replace(/<meta property="og:image:alt" content=".*?" \/>/, `<meta property="og:image:alt" content="${escapeHtml(imageAlt || title)}" />`);
  html = html.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  html = html.replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${image}" />`);
  html = html.replace(/<meta name="twitter:image:alt" content=".*?" \/>/, `<meta name="twitter:image:alt" content="${escapeHtml(imageAlt || title)}" />`);

  const schemaBlock = schema.length
    ? `<script type="application/ld+json">${JSON.stringify(schema.length === 1 ? schema[0] : schema)}</script>`
    : '';
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, schemaBlock);

  return html;
}

async function writeRoute(template, routePath, seo) {
  const html = renderHead(template, seo);
  const outDir = routePath === '/' ? DIST : path.join(DIST, routePath.replace(/^\//, ''));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), html, 'utf8');
  console.log(`  wrote ${path.relative(ROOT, path.join(outDir, 'index.html'))}`);
}

async function loadDataModules() {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  try {
    const modReg = await vite.ssrLoadModule('/src/features/module-registry/modules.js');
    const modSeo = await vite.ssrLoadModule('/src/features/module-registry/moduleSEO.js');
    const seoContent = await vite.ssrLoadModule('/src/features/seo/content/seoContent.js');
    const seoRoutes = await vite.ssrLoadModule('/src/features/seo/content/seoRoutes.js');
    return { modReg, modSeo, seoContent, seoRoutes };
  } finally {
    await vite.close();
  }
}

async function main() {
  const template = await readFile(path.join(DIST, 'index.html'), 'utf8');
  const { modReg, modSeo, seoContent, seoRoutes } = await loadDataModules();

  const { MODULES, FIRST_MODULE } = modReg;
  const { getModuleSEO } = modSeo;
  const { BLOG_POSTS, SEO_HUB_FAQS } = seoContent;
  const { SEO_HUB_PATH, SEO_BLOG_PATH, getBlogPostPath } = seoRoutes;

  console.log('Prerendering per-route <head> metadata into dist/ ...');
  let count = 0;

  for (const mod of MODULES) {
    if (mod.code === FIRST_MODULE.code) continue; // root: dist/index.html already correct
    if (NOINDEX_PREVIEW_SLUGS.has(mod.slugBase)) continue; // under construction: stays noindex SPA shell

    const seo = getModuleSEO(mod.slugBase);
    const canonicalPath = `/module/${mod.slug}`;
    const schema = [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: seo.title,
        description: seo.description,
        url: absoluteUrl(canonicalPath),
        isPartOf: `${SITE_URL}/`,
        primaryImageOfPage: DEFAULT_OG_IMAGE,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Dashboard', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: mod.title, item: absoluteUrl(canonicalPath) },
        ],
      },
    ];
    await writeRoute(template, canonicalPath, {
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      canonicalPath,
      imageAlt: mod.title,
      schema,
    });
    count += 1;
  }

  await writeRoute(template, SEO_HUB_PATH, {
    title: 'Satoshi Dashboard Landing Page | Bitcoin Price, Nodes, Tools and Blog',
    description: 'A minimal landing page and editorial index for Satoshi Dashboard, built to explain the product, surface high-intent Bitcoin topics, and route visitors into the live dashboard.',
    keywords: ['free bitcoin dashboard', 'bitcoin landing page', 'bitcoin nodes map', 'bitcoin analytics tools', 'bitcoin blog', 'live bitcoin price'],
    canonicalPath: SEO_HUB_PATH,
    imageAlt: 'Satoshi Dashboard landing page and blog',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Satoshi Dashboard landing page',
        url: absoluteUrl(SEO_HUB_PATH),
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web Browser',
        isAccessibleForFree: true,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: SEO_HUB_FAQS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Dashboard', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Landing', item: absoluteUrl(SEO_HUB_PATH) },
        ],
      },
    ],
  });
  count += 1;

  await writeRoute(template, SEO_BLOG_PATH, {
    title: 'Satoshi Dashboard Blog | Bitcoin Price, Nodes, Tools and Merchant Guides',
    description: 'A minimal blog index for Satoshi Dashboard articles about Bitcoin price tracking, node monitoring, free tools, and merchant workflows.',
    canonicalPath: SEO_BLOG_PATH,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Satoshi Dashboard blog',
        url: absoluteUrl(SEO_BLOG_PATH),
        description: 'A minimal blog index for Satoshi Dashboard articles about Bitcoin price tracking, node monitoring, free tools, and merchant workflows.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Landing', item: absoluteUrl(SEO_HUB_PATH) },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl(SEO_BLOG_PATH) },
        ],
      },
    ],
  });
  count += 1;

  for (const post of BLOG_POSTS) {
    const canonicalPath = getBlogPostPath(post.slug);
    const schema = [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.metaDescription,
        datePublished: post.publishedDate,
        dateModified: post.publishedDate,
        mainEntityOfPage: absoluteUrl(canonicalPath),
        url: absoluteUrl(canonicalPath),
        image: DEFAULT_OG_IMAGE,
        author: { '@type': 'Organization', name: 'Satoshi Dashboard' },
        publisher: {
          '@type': 'Organization',
          name: 'Satoshi Dashboard',
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.svg` },
        },
        keywords: post.keywords.join(', '),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Landing', item: absoluteUrl(SEO_HUB_PATH) },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl(SEO_BLOG_PATH) },
          { '@type': 'ListItem', position: 3, name: post.title, item: absoluteUrl(canonicalPath) },
        ],
      },
    ];
    await writeRoute(template, canonicalPath, {
      title: post.metaTitle,
      description: post.metaDescription,
      keywords: post.keywords,
      canonicalPath,
      imageAlt: post.title,
      schema,
    });
    count += 1;
  }

  console.log(`Prerender complete: ${count} route(s) written.`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
