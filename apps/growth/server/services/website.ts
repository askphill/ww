/**
 * Website Content Fetcher Service
 * Fetches and parses content from wakey.care for AI analysis
 */

export interface ProductContent {
  handle: string;
  title: string;
  description: string;
  tags: string[];
  type: string;
  url: string;
}

export interface PageContent {
  url: string;
  title: string;
  type: 'product' | 'collection' | 'page' | 'article';
  textContent: string;
}

export interface WebsiteContent {
  products: ProductContent[];
  pages: PageContent[];
  fetchedAt: string;
}

const WEBSITE_URL = 'https://www.wakey.care';

// Cache for website content (in-memory for now)
let contentCache: WebsiteContent | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Fetch products from the Shopify storefront
 */
async function fetchProducts(): Promise<ProductContent[]> {
  try {
    // Fetch from the products.json endpoint (standard Shopify)
    const response = await fetch(`${WEBSITE_URL}/products.json?limit=250`);
    if (!response.ok) {
      console.error('Failed to fetch products:', response.status);
      return [];
    }

    const data = (await response.json()) as {
      products: Array<{
        handle: string;
        title: string;
        body_html: string;
        tags: string[];
        product_type: string;
      }>;
    };

    return data.products.map((p) => ({
      handle: p.handle,
      title: p.title,
      description: stripHtml(p.body_html || ''),
      tags: p.tags || [],
      type: p.product_type || '',
      url: `${WEBSITE_URL}/products/${p.handle}`,
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Fetch blog articles from Shopify
 */
async function fetchBlogArticles(): Promise<PageContent[]> {
  const articles: PageContent[] = [];

  // Common blog handles in Shopify stores
  const blogHandles = ['news', 'blog', 'articles', 'journal'];

  for (const blogHandle of blogHandles) {
    try {
      const response = await fetch(
        `${WEBSITE_URL}/blogs/${blogHandle}/articles.json?limit=50`,
      );
      if (!response.ok) continue;

      const data = (await response.json()) as {
        articles: Array<{
          handle: string;
          title: string;
          body_html: string;
          summary_html?: string;
          tags: string[];
        }>;
      };

      for (const article of data.articles) {
        const textContent = stripHtml(
          article.body_html || article.summary_html || '',
        );
        articles.push({
          url: `${WEBSITE_URL}/blogs/${blogHandle}/${article.handle}`,
          title: article.title,
          type: 'article',
          textContent: textContent.slice(0, 2000), // Limit content size
        });
      }
    } catch (error) {
      // Blog handle doesn't exist, skip silently
    }
  }

  return articles;
}

/**
 * Fetch main pages from the sitemap or known URLs
 */
async function fetchPages(): Promise<PageContent[]> {
  const pages: PageContent[] = [];

  // Known important pages
  const knownPages = [
    {url: '/', type: 'page' as const, title: 'Home'},
    {
      url: '/collections/all',
      type: 'collection' as const,
      title: 'All Products',
    },
  ];

  for (const page of knownPages) {
    try {
      const response = await fetch(`${WEBSITE_URL}${page.url}`);
      if (response.ok) {
        const html = await response.text();
        const textContent = extractMainContent(html);
        pages.push({
          url: `${WEBSITE_URL}${page.url}`,
          title: page.title,
          type: page.type,
          textContent,
        });
      }
    } catch (error) {
      console.error(`Error fetching page ${page.url}:`, error);
    }
  }

  return pages;
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract main content from HTML page
 */
function extractMainContent(html: string): string {
  // Remove script and style tags
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  // Find main content area
  const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    content = mainMatch[1];
  }

  return stripHtml(content).slice(0, 5000); // Limit to 5000 chars
}

/**
 * Fetch all website content
 */
export async function fetchWebsiteContent(
  forceRefresh = false,
): Promise<WebsiteContent> {
  const now = Date.now();

  // Return cached content if still valid
  if (!forceRefresh && contentCache && now - cacheTimestamp < CACHE_TTL) {
    return contentCache;
  }

  // Fetch fresh content including blog articles
  const [products, pages, articles] = await Promise.all([
    fetchProducts(),
    fetchPages(),
    fetchBlogArticles(),
  ]);

  const content: WebsiteContent = {
    products,
    pages: [...pages, ...articles], // Combine pages and articles
    fetchedAt: new Date().toISOString(),
  };

  // Update cache
  contentCache = content;
  cacheTimestamp = now;

  return content;
}

/**
 * Get a summary of website content for AI analysis
 */
export function getContentSummary(content: WebsiteContent): string {
  const productSummaries = content.products
    .map(
      (p) =>
        `- ${p.title} (${p.handle}): ${p.description.slice(0, 200)}${p.description.length > 200 ? '...' : ''}`,
    )
    .join('\n');

  const pageSummaries = content.pages
    .map(
      (p) =>
        `- ${p.title} (${p.type}): ${p.textContent.slice(0, 300)}${p.textContent.length > 300 ? '...' : ''}`,
    )
    .join('\n');

  return `
## Products (${content.products.length} total)
${productSummaries}

## Pages
${pageSummaries}
`.trim();
}
