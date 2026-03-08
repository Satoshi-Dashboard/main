import { useEffect } from 'react';

export const SITE_URL = 'https://satoshidashboard.com';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/modulos-referencia/001-main-dashboard.png`;
export const DEFAULT_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

function upsertMeta(attributeName, attributeValue, content) {
  if (!attributeValue) return;

  let node = document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attributeName, attributeValue);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function upsertLink(rel, href) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement('link');
    node.setAttribute('rel', rel);
    document.head.appendChild(node);
  }
  node.setAttribute('href', href);
}

function clearDynamicSchema() {
  document.head.querySelectorAll('script[data-dynamic-seo="true"]').forEach((node) => node.remove());
}

export function absoluteUrl(path = '/') {
  if (!path || path === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${path}`;
}

export function usePageSEO({
  title,
  description,
  canonicalPath = '/',
  keywords,
  robots = DEFAULT_ROBOTS,
  ogType = 'website',
  image = DEFAULT_OG_IMAGE,
  imageAlt = 'Satoshi Dashboard preview',
  schema,
}) {
  const schemaKey = JSON.stringify(schema || []);

  useEffect(() => {
    const canonicalUrl = absoluteUrl(canonicalPath);
    const keywordContent = Array.isArray(keywords) ? keywords.join(', ') : keywords;
    const schemaList = schemaKey ? JSON.parse(schemaKey) : [];

    document.title = title;

    upsertMeta('name', 'description', description);
    if (keywordContent) upsertMeta('name', 'keywords', keywordContent);
    upsertMeta('name', 'robots', robots);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:site_name', 'Satoshi Dashboard');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:image:alt', imageAlt);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);
    upsertMeta('name', 'twitter:image:alt', imageAlt);
    upsertLink('canonical', canonicalUrl);

    clearDynamicSchema();
    schemaList.forEach((item) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.dynamicSeo = 'true';
      script.text = JSON.stringify(item);
      document.head.appendChild(script);
    });
  }, [canonicalPath, description, image, imageAlt, keywords, ogType, robots, schemaKey, title]);
}
