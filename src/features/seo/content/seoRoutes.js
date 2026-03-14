export const SEO_HUB_PATH = '/landingpage';
export const SEO_BLOG_PATH = `${SEO_HUB_PATH}/blog`;

export const loadSeoLandingPage = () => import('@/features/seo/pages/SeoLandingPage.jsx');
export const loadSeoBlogIndexPage = () => import('@/features/seo/pages/SeoBlogIndexPage.jsx');
export const loadSeoBlogPostPage = () => import('@/features/seo/pages/SeoBlogPostPage.jsx');

export function getBlogPostPath(slug) {
  return `${SEO_BLOG_PATH}/${slug}`;
}

export function preloadSeoHubRoute() {
  return loadSeoLandingPage();
}

export function preloadSeoBlogIndexRoute() {
  return loadSeoBlogIndexPage();
}

export function preloadSeoBlogPostRoute() {
  return loadSeoBlogPostPage();
}
