/**
 * Shopify Customer Sync Service
 * Syncs customers from Shopify Admin API to the subscribers table
 */

import {createDb} from '../db';
import {subscribers} from '../db/schema';
import {eq} from 'drizzle-orm';
import type {D1Database} from '@cloudflare/workers-types';

export interface SyncStats {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}

interface ShopifyCustomer {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  emailMarketingConsent: {
    marketingState: string;
  } | null;
}

interface ShopifyCustomersResponse {
  data: {
    customers: {
      edges: Array<{
        node: ShopifyCustomer;
        cursor: string;
      }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
  errors?: Array<{message: string}>;
}

const CUSTOMERS_QUERY = `
  query getCustomers($first: Int!, $after: String) {
    customers(first: $first, after: $after) {
      edges {
        node {
          id
          email
          firstName
          lastName
          emailMarketingConsent {
            marketingState
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/**
 * Extract the numeric ID from a Shopify global ID (gid://shopify/Customer/123)
 */
function extractShopifyId(globalId: string): string {
  const parts = globalId.split('/');
  return parts[parts.length - 1];
}

/**
 * Fetch customers from Shopify Admin GraphQL API
 */
async function fetchShopifyCustomers(
  storeDomain: string,
  accessToken: string,
  after?: string,
): Promise<ShopifyCustomersResponse> {
  const url = `https://${storeDomain}/admin/api/2024-01/graphql.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: CUSTOMERS_QUERY,
      variables: {
        first: 250, // Maximum allowed by Shopify
        after: after || null,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Shopify API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data as ShopifyCustomersResponse;
}

/**
 * Sync customers from Shopify to the subscribers table
 * - Creates new subscribers for new customers
 * - Updates existing subscribers (email, name) if changed
 * - Does NOT overwrite subscribers who have unsubscribed
 * - Sets source to 'shopify_sync'
 */
export async function syncCustomersFromShopify(
  db: D1Database,
  storeDomain: string,
  accessToken: string,
): Promise<SyncStats> {
  const drizzleDb = createDb(db);
  const stats: SyncStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    total: 0,
  };

  let hasNextPage = true;
  let cursor: string | undefined;

  while (hasNextPage) {
    const response = await fetchShopifyCustomers(
      storeDomain,
      accessToken,
      cursor,
    );

    if (response.errors && response.errors.length > 0) {
      throw new Error(
        `Shopify GraphQL errors: ${response.errors.map((e) => e.message).join(', ')}`,
      );
    }

    const customers = response.data.customers.edges;
    const pageInfo = response.data.customers.pageInfo;

    for (const edge of customers) {
      const customer = edge.node;
      stats.total++;

      // Skip customers without email
      if (!customer.email) {
        stats.skipped++;
        continue;
      }

      const shopifyId = extractShopifyId(customer.id);
      const email = customer.email.toLowerCase();

      // Check if subscriber already exists (by shopifyCustomerId or email)
      const [existingByShopifyId] = await drizzleDb
        .select()
        .from(subscribers)
        .where(eq(subscribers.shopifyCustomerId, shopifyId))
        .limit(1);

      const [existingByEmail] = existingByShopifyId
        ? [existingByShopifyId]
        : await drizzleDb
            .select()
            .from(subscribers)
            .where(eq(subscribers.email, email))
            .limit(1);

      const existing = existingByShopifyId || existingByEmail;

      if (existing) {
        // Skip if subscriber has unsubscribed - don't re-subscribe them
        if (
          existing.status === 'unsubscribed' ||
          existing.status === 'bounced'
        ) {
          stats.skipped++;
          continue;
        }

        // Update existing subscriber if any details changed
        const needsUpdate =
          existing.email !== email ||
          existing.firstName !== customer.firstName ||
          existing.lastName !== customer.lastName ||
          existing.shopifyCustomerId !== shopifyId;

        if (needsUpdate) {
          await drizzleDb
            .update(subscribers)
            .set({
              email,
              firstName: customer.firstName,
              lastName: customer.lastName,
              shopifyCustomerId: shopifyId,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(subscribers.id, existing.id));
          stats.updated++;
        } else {
          stats.skipped++;
        }
      } else {
        // Create new subscriber
        // Determine initial status based on Shopify marketing consent
        const marketingState = customer.emailMarketingConsent?.marketingState;
        const status =
          marketingState === 'UNSUBSCRIBED' ||
          marketingState === 'NOT_SUBSCRIBED'
            ? 'unsubscribed'
            : 'active';

        await drizzleDb.insert(subscribers).values({
          email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          shopifyCustomerId: shopifyId,
          source: 'shopify_sync',
          status,
        });
        stats.created++;
      }
    }

    // Handle pagination
    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor || undefined;
  }

  console.log(
    `[ShopifySync] Sync complete - Created: ${stats.created}, Updated: ${stats.updated}, Skipped: ${stats.skipped}, Total: ${stats.total}`,
  );

  return stats;
}
