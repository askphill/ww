/**
 * Shopify Customer Sync Service
 * Syncs customers from Shopify Admin API to the subscribers table
 */

import {createDb} from '../db';
import {subscribers, segments, segmentSubscribers} from '../db/schema';
import {eq, and} from 'drizzle-orm';
import type {D1Database} from '@cloudflare/workers-types';

export interface SyncStats {
  created: number;
  updated: number;
  skipped: number;
  total: number;
}

export interface SegmentSyncStats {
  segmentsCreated: number;
  segmentsUpdated: number;
  membersAdded: number;
  membersRemoved: number;
  totalSegments: number;
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

interface ShopifySegment {
  id: string;
  name: string;
  creationDate: string;
  lastEditDate: string;
}

interface ShopifySegmentsResponse {
  data: {
    segments: {
      edges: Array<{
        node: ShopifySegment;
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

interface ShopifySegmentMember {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

interface ShopifySegmentMembersResponse {
  data: {
    customerSegmentMembers: {
      edges: Array<{
        node: ShopifySegmentMember;
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

const SEGMENTS_QUERY = `
  query getSegments($first: Int!, $after: String) {
    segments(first: $first, after: $after) {
      edges {
        node {
          id
          name
          creationDate
          lastEditDate
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

const SEGMENT_MEMBERS_QUERY = `
  query getSegmentMembers($segmentId: ID!, $first: Int!, $after: String) {
    customerSegmentMembers(segmentId: $segmentId, first: $first, after: $after) {
      edges {
        node {
          id
          email
          firstName
          lastName
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
 * Fetch segments from Shopify Admin GraphQL API
 */
async function fetchShopifySegments(
  storeDomain: string,
  accessToken: string,
  after?: string,
): Promise<ShopifySegmentsResponse> {
  const url = `https://${storeDomain}/admin/api/2024-01/graphql.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: SEGMENTS_QUERY,
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
  return data as ShopifySegmentsResponse;
}

/**
 * Fetch segment members from Shopify Admin GraphQL API
 */
async function fetchShopifySegmentMembers(
  storeDomain: string,
  accessToken: string,
  segmentId: string,
  after?: string,
): Promise<ShopifySegmentMembersResponse> {
  const url = `https://${storeDomain}/admin/api/2024-01/graphql.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': accessToken,
    },
    body: JSON.stringify({
      query: SEGMENT_MEMBERS_QUERY,
      variables: {
        segmentId,
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
  return data as ShopifySegmentMembersResponse;
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

/**
 * Sync segments from Shopify to the segments table
 * - Creates/updates segments with type 'shopify_sync'
 * - Syncs segment members via customerSegmentMembers query
 * - Updates subscriberCount after member sync
 * - Handles pagination for segments with >1000 members
 */
export async function syncSegmentsFromShopify(
  db: D1Database,
  storeDomain: string,
  accessToken: string,
): Promise<SegmentSyncStats> {
  const drizzleDb = createDb(db);
  const stats: SegmentSyncStats = {
    segmentsCreated: 0,
    segmentsUpdated: 0,
    membersAdded: 0,
    membersRemoved: 0,
    totalSegments: 0,
  };

  // Step 1: Fetch all segments from Shopify
  let hasNextPage = true;
  let cursor: string | undefined;
  const shopifySegments: ShopifySegment[] = [];

  while (hasNextPage) {
    const response = await fetchShopifySegments(
      storeDomain,
      accessToken,
      cursor,
    );

    if (response.errors && response.errors.length > 0) {
      throw new Error(
        `Shopify GraphQL errors: ${response.errors.map((e) => e.message).join(', ')}`,
      );
    }

    const segmentsData = response.data.segments.edges;
    const pageInfo = response.data.segments.pageInfo;

    for (const edge of segmentsData) {
      shopifySegments.push(edge.node);
    }

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor || undefined;
  }

  stats.totalSegments = shopifySegments.length;
  console.log(
    `[ShopifySync] Found ${shopifySegments.length} segments in Shopify`,
  );

  // Step 2: Process each segment
  for (const shopifySegment of shopifySegments) {
    const shopifySegmentId = extractShopifyId(shopifySegment.id);

    // Check if segment already exists
    const [existingSegment] = await drizzleDb
      .select()
      .from(segments)
      .where(eq(segments.shopifySegmentId, shopifySegmentId))
      .limit(1);

    let segmentId: number;

    if (existingSegment) {
      // Update existing segment
      const needsUpdate = existingSegment.name !== shopifySegment.name;

      if (needsUpdate) {
        await drizzleDb
          .update(segments)
          .set({
            name: shopifySegment.name,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(segments.id, existingSegment.id));
        stats.segmentsUpdated++;
      }

      segmentId = existingSegment.id;
    } else {
      // Create new segment
      const result = await drizzleDb
        .insert(segments)
        .values({
          name: shopifySegment.name,
          type: 'shopify_sync',
          shopifySegmentId,
        })
        .returning({id: segments.id});

      segmentId = result[0].id;
      stats.segmentsCreated++;
    }

    // Step 3: Sync segment members
    const memberStats = await syncSegmentMembers(
      drizzleDb,
      storeDomain,
      accessToken,
      shopifySegment.id,
      segmentId,
    );

    stats.membersAdded += memberStats.added;
    stats.membersRemoved += memberStats.removed;
  }

  console.log(
    `[ShopifySync] Segment sync complete - Created: ${stats.segmentsCreated}, Updated: ${stats.segmentsUpdated}, Members Added: ${stats.membersAdded}, Members Removed: ${stats.membersRemoved}`,
  );

  return stats;
}

/**
 * Sync members for a specific segment
 * Returns counts of members added and removed
 */
async function syncSegmentMembers(
  drizzleDb: ReturnType<typeof createDb>,
  storeDomain: string,
  accessToken: string,
  shopifySegmentGid: string,
  localSegmentId: number,
): Promise<{added: number; removed: number}> {
  const stats = {added: 0, removed: 0};

  // Fetch all current members from Shopify (handles pagination)
  const shopifyMemberIds = new Set<string>();
  let hasNextPage = true;
  let cursor: string | undefined;

  while (hasNextPage) {
    const response = await fetchShopifySegmentMembers(
      storeDomain,
      accessToken,
      shopifySegmentGid,
      cursor,
    );

    if (response.errors && response.errors.length > 0) {
      console.error(
        `[ShopifySync] Error fetching segment members: ${response.errors.map((e) => e.message).join(', ')}`,
      );
      break;
    }

    const membersData = response.data.customerSegmentMembers.edges;
    const pageInfo = response.data.customerSegmentMembers.pageInfo;

    for (const edge of membersData) {
      const customerId = extractShopifyId(edge.node.id);
      shopifyMemberIds.add(customerId);
    }

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor || undefined;
  }

  // Get current segment members from local DB
  const currentMembers = await drizzleDb
    .select({
      subscriberId: segmentSubscribers.subscriberId,
      shopifyCustomerId: subscribers.shopifyCustomerId,
    })
    .from(segmentSubscribers)
    .innerJoin(subscribers, eq(segmentSubscribers.subscriberId, subscribers.id))
    .where(eq(segmentSubscribers.segmentId, localSegmentId));

  const currentMemberShopifyIds = new Set(
    currentMembers
      .filter((m) => m.shopifyCustomerId !== null)
      .map((m) => m.shopifyCustomerId as string),
  );
  const currentMemberMap = new Map(
    currentMembers
      .filter((m) => m.shopifyCustomerId !== null)
      .map((m) => [m.shopifyCustomerId as string, m.subscriberId]),
  );

  // Find members to add (in Shopify but not in local)
  const membersToAdd: string[] = [];
  for (const shopifyId of shopifyMemberIds) {
    if (!currentMemberShopifyIds.has(shopifyId)) {
      membersToAdd.push(shopifyId);
    }
  }

  // Find members to remove (in local but not in Shopify)
  const membersToRemove: number[] = [];
  for (const [shopifyId, subscriberId] of currentMemberMap) {
    if (!shopifyMemberIds.has(shopifyId)) {
      membersToRemove.push(subscriberId);
    }
  }

  // Add new members
  for (const shopifyId of membersToAdd) {
    // Find the subscriber by Shopify ID
    const [subscriber] = await drizzleDb
      .select({id: subscribers.id})
      .from(subscribers)
      .where(eq(subscribers.shopifyCustomerId, shopifyId))
      .limit(1);

    if (subscriber) {
      // Check if membership already exists (edge case)
      const [existingMembership] = await drizzleDb
        .select()
        .from(segmentSubscribers)
        .where(
          and(
            eq(segmentSubscribers.segmentId, localSegmentId),
            eq(segmentSubscribers.subscriberId, subscriber.id),
          ),
        )
        .limit(1);

      if (!existingMembership) {
        await drizzleDb.insert(segmentSubscribers).values({
          segmentId: localSegmentId,
          subscriberId: subscriber.id,
        });
        stats.added++;
      }
    }
  }

  // Remove members no longer in Shopify segment
  for (const subscriberId of membersToRemove) {
    await drizzleDb
      .delete(segmentSubscribers)
      .where(
        and(
          eq(segmentSubscribers.segmentId, localSegmentId),
          eq(segmentSubscribers.subscriberId, subscriberId),
        ),
      );
    stats.removed++;
  }

  // Update subscriber count
  const [countResult] = await drizzleDb
    .select({count: segmentSubscribers.subscriberId})
    .from(segmentSubscribers)
    .where(eq(segmentSubscribers.segmentId, localSegmentId));

  // Count the actual number of members
  const memberCount = await drizzleDb
    .select({subscriberId: segmentSubscribers.subscriberId})
    .from(segmentSubscribers)
    .where(eq(segmentSubscribers.segmentId, localSegmentId));

  await drizzleDb
    .update(segments)
    .set({
      subscriberCount: memberCount.length,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(segments.id, localSegmentId));

  return stats;
}
