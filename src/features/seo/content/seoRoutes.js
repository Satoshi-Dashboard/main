export const SEO_HUB_PATH = '/landingpage';
export const SEO_BLOG_PATH = `${SEO_HUB_PATH}/blog`;

export function getBlogPostPath(slug) {
  return `${SEO_BLOG_PATH}/${slug}`;
}
