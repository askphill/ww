import type {Product} from '../types/index.js';

interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  tags: string[];
}

interface ShopifyResponse {
  data: {
    products: {
      edges: Array<{
        node: ShopifyProduct;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
}

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        node {
          id
          handle
          title
          descriptionHtml
          tags
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function fetchShopifyProducts(): Promise<Product[]> {
  const store = process.env.STORE;
  const adminApiToken = process.env.ADMIN_API_TOKEN;

  if (!store || !adminApiToken) {
    throw new Error(
      'Missing Shopify credentials. Set STORE and ADMIN_API_TOKEN in .env',
    );
  }

  const products: Product[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const response = await fetch(
      `https://${store}.myshopify.com/admin/api/2024-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminApiToken,
        },
        body: JSON.stringify({
          query: PRODUCTS_QUERY,
          variables: {
            first: 50,
            after: cursor,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Shopify API error: ${response.status} ${response.statusText}`,
      );
    }

    const result = (await response.json()) as ShopifyResponse;

    for (const edge of result.data.products.edges) {
      const node = edge.node;
      products.push({
        id: node.id,
        handle: node.handle,
        title: node.title,
        description: node.descriptionHtml,
        tags: node.tags,
      });
    }

    hasNextPage = result.data.products.pageInfo.hasNextPage;
    cursor = result.data.products.pageInfo.endCursor;
  }

  return products;
}
