import {Hono} from 'hono';
import {zValidator} from '@hono/zod-validator';
import {z} from 'zod';
import {createDb} from '../db';
import {subscribers, segmentSubscribers, segments} from '../db/schema';
import {authMiddleware} from '../middleware/auth';
import {eq, desc, like, or, sql, and, inArray} from 'drizzle-orm';
import type {AppVariables, Env} from '../index';
import {
  syncCustomersFromShopify,
  syncSegmentsFromShopify,
} from '../services/shopifySync';

const emailRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

// ============ Webhook Endpoints (No Auth - Uses HMAC Validation) ============

interface ShopifyCustomerWebhookPayload {
  id: number;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  email_marketing_consent?: {
    state: string;
  } | null;
}

/**
 * Verify Shopify webhook HMAC signature
 */
async function verifyShopifyWebhook(
  body: string,
  hmacHeader: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!hmacHeader) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));

  // Convert to base64
  const computedHmac = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return hmacHeader === computedHmac;
}

/**
 * Handle Shopify customer webhooks
 * Topics: customers/create, customers/update, customers/delete
 */
emailRoutes.post('/webhooks/shopify', async (c) => {
  const topic = c.req.header('X-Shopify-Topic');
  const hmac = c.req.header('X-Shopify-Hmac-Sha256');

  // Get raw body for HMAC validation
  const body = await c.req.text();

  // Validate HMAC signature
  const isValid = await verifyShopifyWebhook(
    body,
    hmac,
    c.env.SHOPIFY_WEBHOOK_SECRET,
  );

  if (!isValid) {
    console.error('[Shopify Webhook] Invalid HMAC signature');
    return c.json({error: 'Invalid webhook signature'}, 401);
  }

  // Parse the payload
  let payload: ShopifyCustomerWebhookPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    console.error('[Shopify Webhook] Invalid JSON payload');
    return c.json({error: 'Invalid JSON payload'}, 400);
  }

  const db = createDb(c.env.DB);
  const shopifyId = String(payload.id);

  console.log(`[Shopify Webhook] Received ${topic} for customer ${shopifyId}`);

  try {
    switch (topic) {
      case 'customers/create': {
        // Skip if no email
        if (!payload.email) {
          console.log(
            `[Shopify Webhook] Skipping customer ${shopifyId} - no email`,
          );
          return c.json({success: true, message: 'Skipped - no email'});
        }

        const email = payload.email.toLowerCase();

        // Check if subscriber already exists
        const [existing] = await db
          .select({id: subscribers.id})
          .from(subscribers)
          .where(
            or(
              eq(subscribers.shopifyCustomerId, shopifyId),
              eq(subscribers.email, email),
            ),
          )
          .limit(1);

        if (existing) {
          // Update existing subscriber with Shopify ID if not set
          await db
            .update(subscribers)
            .set({
              shopifyCustomerId: shopifyId,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(subscribers.id, existing.id));

          console.log(
            `[Shopify Webhook] Updated existing subscriber ${existing.id} with Shopify ID`,
          );
          return c.json({success: true, message: 'Subscriber updated'});
        }

        // Determine initial status based on marketing consent
        const marketingState = payload.email_marketing_consent?.state;
        const status =
          marketingState === 'not_subscribed' ||
          marketingState === 'unsubscribed'
            ? 'unsubscribed'
            : 'active';

        // Create new subscriber
        const [newSubscriber] = await db
          .insert(subscribers)
          .values({
            email,
            firstName: payload.first_name,
            lastName: payload.last_name,
            shopifyCustomerId: shopifyId,
            source: 'shopify_webhook',
            status,
          })
          .returning();

        console.log(
          `[Shopify Webhook] Created new subscriber ${newSubscriber.id}`,
        );
        return c.json({success: true, message: 'Subscriber created'});
      }

      case 'customers/update': {
        // Find existing subscriber by Shopify ID
        const [existing] = await db
          .select()
          .from(subscribers)
          .where(eq(subscribers.shopifyCustomerId, shopifyId))
          .limit(1);

        if (!existing) {
          // If not found by Shopify ID and has email, try to find by email
          if (payload.email) {
            const [existingByEmail] = await db
              .select()
              .from(subscribers)
              .where(eq(subscribers.email, payload.email.toLowerCase()))
              .limit(1);

            if (existingByEmail) {
              // Link this subscriber to the Shopify customer
              await db
                .update(subscribers)
                .set({
                  shopifyCustomerId: shopifyId,
                  firstName: payload.first_name ?? existingByEmail.firstName,
                  lastName: payload.last_name ?? existingByEmail.lastName,
                  updatedAt: new Date().toISOString(),
                })
                .where(eq(subscribers.id, existingByEmail.id));

              console.log(
                `[Shopify Webhook] Linked subscriber ${existingByEmail.id} to Shopify customer`,
              );
              return c.json({success: true, message: 'Subscriber linked'});
            }
          }

          console.log(
            `[Shopify Webhook] Subscriber not found for Shopify customer ${shopifyId}`,
          );
          return c.json({success: true, message: 'Subscriber not found'});
        }

        // Don't re-subscribe users who have unsubscribed
        if (
          existing.status === 'unsubscribed' ||
          existing.status === 'bounced'
        ) {
          // Only update name if changed
          if (
            existing.firstName !== payload.first_name ||
            existing.lastName !== payload.last_name
          ) {
            await db
              .update(subscribers)
              .set({
                firstName: payload.first_name,
                lastName: payload.last_name,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(subscribers.id, existing.id));
          }
          console.log(
            `[Shopify Webhook] Updated name only for unsubscribed subscriber ${existing.id}`,
          );
          return c.json({
            success: true,
            message: 'Subscriber name updated (status preserved)',
          });
        }

        // Update subscriber email and name if changed
        const updateData: Record<string, unknown> = {
          updatedAt: new Date().toISOString(),
        };

        if (payload.email && payload.email.toLowerCase() !== existing.email) {
          updateData.email = payload.email.toLowerCase();
        }
        if (payload.first_name !== existing.firstName) {
          updateData.firstName = payload.first_name;
        }
        if (payload.last_name !== existing.lastName) {
          updateData.lastName = payload.last_name;
        }

        if (Object.keys(updateData).length > 1) {
          await db
            .update(subscribers)
            .set(updateData)
            .where(eq(subscribers.id, existing.id));
          console.log(`[Shopify Webhook] Updated subscriber ${existing.id}`);
        }

        return c.json({success: true, message: 'Subscriber updated'});
      }

      case 'customers/delete': {
        // Find existing subscriber by Shopify ID
        const [existing] = await db
          .select()
          .from(subscribers)
          .where(eq(subscribers.shopifyCustomerId, shopifyId))
          .limit(1);

        if (!existing) {
          console.log(
            `[Shopify Webhook] Subscriber not found for deleted Shopify customer ${shopifyId}`,
          );
          return c.json({success: true, message: 'Subscriber not found'});
        }

        // Mark as unsubscribed (soft delete)
        await db
          .update(subscribers)
          .set({
            status: 'unsubscribed',
            updatedAt: new Date().toISOString(),
          })
          .where(eq(subscribers.id, existing.id));

        console.log(
          `[Shopify Webhook] Marked subscriber ${existing.id} as unsubscribed`,
        );
        return c.json({success: true, message: 'Subscriber unsubscribed'});
      }

      default:
        console.log(`[Shopify Webhook] Unknown topic: ${topic}`);
        return c.json({success: true, message: 'Unknown topic ignored'});
    }
  } catch (error) {
    console.error('[Shopify Webhook] Error processing webhook:', error);
    // Return 200 to prevent Shopify from retrying
    return c.json({success: false, error: 'Internal error'}, 200);
  }
});

// ============ Authenticated Routes ============
// All routes below require authentication
emailRoutes.use('/subscribers/*', authMiddleware);
emailRoutes.use('/segments/*', authMiddleware);

// ============ Subscribers Endpoints ============

// Get paginated list of subscribers with filters
emailRoutes.get('/subscribers', async (c) => {
  const db = createDb(c.env.DB);

  // Query parameters
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const status = c.req.query('status');
  const search = c.req.query('search');
  const segmentId = c.req.query('segmentId');

  const offset = (page - 1) * limit;

  // Build conditions array
  const conditions = [];

  if (status && ['active', 'unsubscribed', 'bounced'].includes(status)) {
    conditions.push(
      eq(subscribers.status, status as 'active' | 'unsubscribed' | 'bounced'),
    );
  }

  if (search) {
    conditions.push(
      or(
        like(subscribers.email, `%${search}%`),
        like(subscribers.firstName, `%${search}%`),
        like(subscribers.lastName, `%${search}%`),
      ),
    );
  }

  // If filtering by segment, we need to join
  if (segmentId) {
    const segmentIdNum = parseInt(segmentId);

    // Get subscriber IDs in segment
    const segmentMembers = await db
      .select({subscriberId: segmentSubscribers.subscriberId})
      .from(segmentSubscribers)
      .where(eq(segmentSubscribers.segmentId, segmentIdNum));

    const subscriberIds = segmentMembers.map((m) => m.subscriberId);

    if (subscriberIds.length === 0) {
      return c.json({
        subscribers: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    conditions.push(inArray(subscribers.id, subscriberIds));
  }

  // Build base query
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [countResult] = await db
    .select({count: sql<number>`count(*)`})
    .from(subscribers)
    .where(whereClause);

  const total = countResult?.count || 0;

  // Get subscribers
  const data = await db
    .select()
    .from(subscribers)
    .where(whereClause)
    .orderBy(desc(subscribers.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    subscribers: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get single subscriber with segment memberships
emailRoutes.get('/subscribers/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.id, id))
    .limit(1);

  if (!subscriber) {
    return c.json({error: 'Subscriber not found'}, 404);
  }

  // Get segment memberships
  const memberships = await db
    .select({
      segmentId: segmentSubscribers.segmentId,
      segmentName: segments.name,
      addedAt: segmentSubscribers.addedAt,
    })
    .from(segmentSubscribers)
    .innerJoin(segments, eq(segmentSubscribers.segmentId, segments.id))
    .where(eq(segmentSubscribers.subscriberId, id));

  return c.json({
    subscriber,
    segments: memberships,
  });
});

// Create subscriber
emailRoutes.post(
  '/subscribers',
  zValidator(
    'json',
    z.object({
      email: z.string().email('Invalid email format'),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      source: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  ),
  async (c) => {
    const db = createDb(c.env.DB);
    const data = c.req.valid('json');

    // Check for duplicate email
    const [existing] = await db
      .select({id: subscribers.id})
      .from(subscribers)
      .where(eq(subscribers.email, data.email.toLowerCase()))
      .limit(1);

    if (existing) {
      return c.json(
        {error: 'A subscriber with this email already exists'},
        409,
      );
    }

    // Insert new subscriber
    const [subscriber] = await db
      .insert(subscribers)
      .values({
        email: data.email.toLowerCase(),
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        source: data.source || 'manual',
        tags: data.tags ? JSON.stringify(data.tags) : null,
        status: 'active',
      })
      .returning();

    return c.json({subscriber}, 201);
  },
);

// Update subscriber
emailRoutes.patch(
  '/subscribers/:id',
  zValidator(
    'json',
    z.object({
      email: z.string().email('Invalid email format').optional(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      status: z.enum(['active', 'unsubscribed', 'bounced']).optional(),
      source: z.string().optional(),
      tags: z.array(z.string()).optional(),
    }),
  ),
  async (c) => {
    const db = createDb(c.env.DB);
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    // Check subscriber exists
    const [existing] = await db
      .select({id: subscribers.id})
      .from(subscribers)
      .where(eq(subscribers.id, id))
      .limit(1);

    if (!existing) {
      return c.json({error: 'Subscriber not found'}, 404);
    }

    // If email is being changed, check for duplicates
    if (data.email) {
      const [duplicate] = await db
        .select({id: subscribers.id})
        .from(subscribers)
        .where(
          and(
            eq(subscribers.email, data.email.toLowerCase()),
            sql`${subscribers.id} != ${id}`,
          ),
        )
        .limit(1);

      if (duplicate) {
        return c.json(
          {error: 'A subscriber with this email already exists'},
          409,
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.email !== undefined) {
      updateData.email = data.email.toLowerCase();
    }
    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.source !== undefined) {
      updateData.source = data.source;
    }
    if (data.tags !== undefined) {
      updateData.tags = JSON.stringify(data.tags);
    }

    const [subscriber] = await db
      .update(subscribers)
      .set(updateData)
      .where(eq(subscribers.id, id))
      .returning();

    return c.json({subscriber});
  },
);

// Delete subscriber (soft delete - set status to unsubscribed)
emailRoutes.delete('/subscribers/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  // Check subscriber exists
  const [existing] = await db
    .select({id: subscribers.id})
    .from(subscribers)
    .where(eq(subscribers.id, id))
    .limit(1);

  if (!existing) {
    return c.json({error: 'Subscriber not found'}, 404);
  }

  // Soft delete by setting status to unsubscribed
  await db
    .update(subscribers)
    .set({
      status: 'unsubscribed',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(subscribers.id, id));

  return c.json({success: true});
});

// ============ Segments Endpoints ============

// Get all segments with subscriber counts
emailRoutes.get('/segments', async (c) => {
  const db = createDb(c.env.DB);

  const data = await db
    .select()
    .from(segments)
    .orderBy(desc(segments.createdAt));

  return c.json({segments: data});
});

// Get single segment with subscriber list (paginated)
emailRoutes.get('/segments/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  // Query parameters for pagination
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = (page - 1) * limit;

  // Get segment
  const [segment] = await db
    .select()
    .from(segments)
    .where(eq(segments.id, id))
    .limit(1);

  if (!segment) {
    return c.json({error: 'Segment not found'}, 404);
  }

  // Get total subscriber count for this segment
  const [countResult] = await db
    .select({count: sql<number>`count(*)`})
    .from(segmentSubscribers)
    .where(eq(segmentSubscribers.segmentId, id));

  const total = countResult?.count || 0;

  // Get paginated subscriber list
  const segmentMembers = await db
    .select({
      subscriberId: segmentSubscribers.subscriberId,
      addedAt: segmentSubscribers.addedAt,
      email: subscribers.email,
      firstName: subscribers.firstName,
      lastName: subscribers.lastName,
      status: subscribers.status,
    })
    .from(segmentSubscribers)
    .innerJoin(subscribers, eq(segmentSubscribers.subscriberId, subscribers.id))
    .where(eq(segmentSubscribers.segmentId, id))
    .orderBy(desc(segmentSubscribers.addedAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    segment,
    subscribers: segmentMembers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Create custom segment
emailRoutes.post(
  '/segments',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'Name is required'),
      filters: z.record(z.unknown()).optional(),
    }),
  ),
  async (c) => {
    const db = createDb(c.env.DB);
    const data = c.req.valid('json');

    // Insert new segment
    const [segment] = await db
      .insert(segments)
      .values({
        name: data.name,
        type: 'custom',
        filters: data.filters ? JSON.stringify(data.filters) : null,
        subscriberCount: 0,
      })
      .returning();

    return c.json({segment}, 201);
  },
);

// Update segment (name, filters)
emailRoutes.patch(
  '/segments/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'Name is required').optional(),
      filters: z.record(z.unknown()).optional(),
    }),
  ),
  async (c) => {
    const db = createDb(c.env.DB);
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    // Check segment exists
    const [existing] = await db
      .select()
      .from(segments)
      .where(eq(segments.id, id))
      .limit(1);

    if (!existing) {
      return c.json({error: 'Segment not found'}, 404);
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.filters !== undefined) {
      updateData.filters = JSON.stringify(data.filters);
    }

    const [segment] = await db
      .update(segments)
      .set(updateData)
      .where(eq(segments.id, id))
      .returning();

    return c.json({segment});
  },
);

// Delete segment (only custom type)
emailRoutes.delete('/segments/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  // Check segment exists
  const [existing] = await db
    .select()
    .from(segments)
    .where(eq(segments.id, id))
    .limit(1);

  if (!existing) {
    return c.json({error: 'Segment not found'}, 404);
  }

  // Only allow deleting custom segments
  if (existing.type !== 'custom') {
    return c.json(
      {
        error:
          'Cannot delete Shopify-synced segments. Remove the segment from Shopify instead.',
      },
      403,
    );
  }

  // Delete segment (cascade will remove segment_subscribers entries)
  await db.delete(segments).where(eq(segments.id, id));

  return c.json({success: true});
});

// Rate limit tracking for sync (5 minutes between syncs)
const SYNC_RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes
let lastSyncTime: number | null = null;

// Trigger full Shopify sync (customers + segments)
emailRoutes.post('/segments/sync', async (c) => {
  // Check rate limit
  const now = Date.now();
  if (lastSyncTime && now - lastSyncTime < SYNC_RATE_LIMIT_MS) {
    const remainingSeconds = Math.ceil(
      (SYNC_RATE_LIMIT_MS - (now - lastSyncTime)) / 1000,
    );
    return c.json(
      {
        error: 'Rate limited. Please wait before syncing again.',
        retryAfterSeconds: remainingSeconds,
      },
      429,
    );
  }

  // Update last sync time immediately to prevent concurrent syncs
  lastSyncTime = now;

  // Validate required environment variables
  if (!c.env.SHOPIFY_ADMIN_API_TOKEN || !c.env.SHOPIFY_STORE_DOMAIN) {
    return c.json(
      {
        error:
          'Shopify credentials not configured. Please set SHOPIFY_ADMIN_API_TOKEN and SHOPIFY_STORE_DOMAIN.',
      },
      500,
    );
  }

  // Return immediately with acknowledgment, run sync async
  // Using waitUntil to run the sync in the background
  c.executionCtx.waitUntil(
    (async () => {
      try {
        console.log('[ShopifySync] Starting full sync...');

        // Sync customers first
        const customerStats = await syncCustomersFromShopify(
          c.env.DB,
          c.env.SHOPIFY_STORE_DOMAIN,
          c.env.SHOPIFY_ADMIN_API_TOKEN,
        );

        console.log('[ShopifySync] Customer sync complete:', customerStats);

        // Then sync segments
        const segmentStats = await syncSegmentsFromShopify(
          c.env.DB,
          c.env.SHOPIFY_STORE_DOMAIN,
          c.env.SHOPIFY_ADMIN_API_TOKEN,
        );

        console.log('[ShopifySync] Segment sync complete:', segmentStats);
        console.log('[ShopifySync] Full sync complete');
      } catch (error) {
        console.error('[ShopifySync] Sync failed:', error);
        // Reset rate limit on failure so user can retry sooner
        lastSyncTime = null;
      }
    })(),
  );

  return c.json({
    success: true,
    message: 'Sync started. This may take a few minutes to complete.',
  });
});

export {emailRoutes};
