import {Hono} from 'hono';
import {zValidator} from '@hono/zod-validator';
import {z} from 'zod';
import {createDb} from '../db';
import {
  subscribers,
  segmentSubscribers,
  segments,
  emailTemplates,
  campaigns,
  emailSends,
} from '../db/schema';
import {authMiddleware} from '../middleware/auth';
import {eq, desc, like, or, sql, and, inArray, count} from 'drizzle-orm';
import type {AppVariables, Env} from '../index';
import {
  syncCustomersFromShopify,
  syncSegmentsFromShopify,
} from '../services/shopifySync';
import {renderTemplate, getDefaultVariables} from '../services/emailRenderer';

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
emailRoutes.use('/templates/*', authMiddleware);
emailRoutes.use('/templates', authMiddleware);
emailRoutes.use('/campaigns/*', authMiddleware);
emailRoutes.use('/campaigns', authMiddleware);

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

// ============ Templates Endpoints ============

// Get all templates with metadata
emailRoutes.get('/templates', async (c) => {
  const db = createDb(c.env.DB);

  // Optional query param to include archived templates
  const includeArchived = c.req.query('includeArchived') === 'true';

  // Build query - exclude archived templates by default
  let query = db
    .select({
      id: emailTemplates.id,
      name: emailTemplates.name,
      subject: emailTemplates.subject,
      previewText: emailTemplates.previewText,
      category: emailTemplates.category,
      status: emailTemplates.status,
      createdAt: emailTemplates.createdAt,
      updatedAt: emailTemplates.updatedAt,
    })
    .from(emailTemplates);

  if (!includeArchived) {
    query = query.where(
      or(
        eq(emailTemplates.status, 'draft'),
        eq(emailTemplates.status, 'active'),
      ),
    ) as typeof query;
  }

  const data = await query.orderBy(desc(emailTemplates.updatedAt));

  return c.json({templates: data});
});

// Get single template with full component data
emailRoutes.get('/templates/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id))
    .limit(1);

  if (!template) {
    return c.json({error: 'Template not found'}, 404);
  }

  // Parse JSON fields for response
  return c.json({
    template: {
      ...template,
      components: template.components ? JSON.parse(template.components) : [],
      variables: template.variables ? JSON.parse(template.variables) : [],
    },
  });
});

// Create template
emailRoutes.post(
  '/templates',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'Name is required'),
      subject: z.string().min(1, 'Subject is required'),
      previewText: z.string().optional(),
      category: z.string().optional(),
    }),
  ),
  async (c) => {
    const db = createDb(c.env.DB);
    const data = c.req.valid('json');

    // Insert new template with empty components
    const [template] = await db
      .insert(emailTemplates)
      .values({
        name: data.name,
        subject: data.subject,
        previewText: data.previewText || null,
        components: JSON.stringify([]),
        variables: JSON.stringify([]),
        category: data.category || null,
        status: 'draft',
      })
      .returning();

    return c.json({template}, 201);
  },
);

// Update template
emailRoutes.patch(
  '/templates/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'Name is required').optional(),
      subject: z.string().min(1, 'Subject is required').optional(),
      previewText: z.string().optional(),
      components: z.array(z.record(z.unknown())).optional(),
      variables: z.array(z.string()).optional(),
      category: z.string().optional(),
      status: z.enum(['draft', 'active', 'archived']).optional(),
    }),
  ),
  async (c) => {
    const db = createDb(c.env.DB);
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    // Check template exists
    const [existing] = await db
      .select({id: emailTemplates.id})
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!existing) {
      return c.json({error: 'Template not found'}, 404);
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.subject !== undefined) {
      updateData.subject = data.subject;
    }
    if (data.previewText !== undefined) {
      updateData.previewText = data.previewText;
    }
    if (data.components !== undefined) {
      updateData.components = JSON.stringify(data.components);
    }
    if (data.variables !== undefined) {
      updateData.variables = JSON.stringify(data.variables);
    }
    if (data.category !== undefined) {
      updateData.category = data.category;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const [template] = await db
      .update(emailTemplates)
      .set(updateData)
      .where(eq(emailTemplates.id, id))
      .returning();

    return c.json({
      template: {
        ...template,
        components: template.components ? JSON.parse(template.components) : [],
        variables: template.variables ? JSON.parse(template.variables) : [],
      },
    });
  },
);

// Delete template (soft-delete by setting status to 'archived')
emailRoutes.delete('/templates/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  // Check template exists
  const [existing] = await db
    .select({id: emailTemplates.id})
    .from(emailTemplates)
    .where(eq(emailTemplates.id, id))
    .limit(1);

  if (!existing) {
    return c.json({error: 'Template not found'}, 404);
  }

  // Soft delete by setting status to 'archived'
  await db
    .update(emailTemplates)
    .set({
      status: 'archived',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(emailTemplates.id, id));

  return c.json({success: true});
});

// Preview template - renders HTML and plain text
emailRoutes.post(
  '/templates/:id/preview',
  zValidator(
    'json',
    z
      .object({
        variables: z.record(z.string()).optional(),
      })
      .optional(),
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const data = c.req.valid('json');

    // Check template exists
    const db = createDb(c.env.DB);
    const [existing] = await db
      .select({id: emailTemplates.id})
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!existing) {
      return c.json({error: 'Template not found'}, 404);
    }

    try {
      // Render the template with provided variables or defaults
      const variables = data?.variables || {};
      const result = await renderTemplate(c.env.DB, id, variables);

      return c.json({
        html: result.html,
        text: result.text,
        variables: {
          ...getDefaultVariables(),
          ...variables,
        },
      });
    } catch (error) {
      console.error('[Template Preview] Error rendering template:', error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to render template',
        },
        500,
      );
    }
  },
);

// Rate limiting for test emails (10 per hour)
const TEST_EMAIL_RATE_LIMIT = 10;
const TEST_EMAIL_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const testEmailRateLimit: Map<string, {count: number; windowStart: number}> =
  new Map();

/**
 * Check if test email rate limit exceeded for a user
 */
function isTestEmailRateLimited(userEmail: string): {
  limited: boolean;
  remaining: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const userLimit = testEmailRateLimit.get(userEmail);

  if (!userLimit || now - userLimit.windowStart >= TEST_EMAIL_RATE_WINDOW_MS) {
    // New window or expired - reset
    testEmailRateLimit.set(userEmail, {count: 1, windowStart: now});
    return {limited: false, remaining: TEST_EMAIL_RATE_LIMIT - 1};
  }

  if (userLimit.count >= TEST_EMAIL_RATE_LIMIT) {
    const retryAfterSeconds = Math.ceil(
      (TEST_EMAIL_RATE_WINDOW_MS - (now - userLimit.windowStart)) / 1000,
    );
    return {limited: true, remaining: 0, retryAfterSeconds};
  }

  // Increment count
  userLimit.count += 1;
  return {limited: false, remaining: TEST_EMAIL_RATE_LIMIT - userLimit.count};
}

// Send test email via Resend
emailRoutes.post(
  '/templates/:id/test',
  zValidator(
    'json',
    z.object({
      to: z.string().email('Invalid email address'),
    }),
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const {to} = c.req.valid('json');
    const user = c.get('user');

    // Rate limit check using authenticated user's email
    const rateCheck = isTestEmailRateLimited(user.email);
    if (rateCheck.limited) {
      return c.json(
        {
          error: 'Rate limit exceeded. Maximum 10 test emails per hour.',
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        429,
      );
    }

    // Get template with subject
    const db = createDb(c.env.DB);
    const [template] = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        subject: emailTemplates.subject,
      })
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!template) {
      return c.json({error: 'Template not found'}, 404);
    }

    try {
      // Render the template with default sample variables
      const variables = getDefaultVariables();
      const result = await renderTemplate(c.env.DB, id, variables);

      // Send via Resend with [TEST] prefix
      const {Resend} = await import('resend');
      const resend = new Resend(c.env.RESEND_API_KEY);

      const sendResult = await resend.emails.send({
        from: 'Wakey Studio <wakey@send.paul.studio>',
        to: to,
        subject: `[TEST] ${template.subject}`,
        html: result.html,
        text: result.text,
      });

      if (sendResult.error) {
        console.error('[Test Email] Resend error:', sendResult.error);
        return c.json(
          {error: `Failed to send email: ${sendResult.error.message}`},
          500,
        );
      }

      console.log(
        `[Test Email] Sent test email for template ${id} to ${to}. Resend ID: ${sendResult.data?.id}`,
      );

      return c.json({
        success: true,
        messageId: sendResult.data?.id,
        remainingTestEmails: rateCheck.remaining,
      });
    } catch (error) {
      console.error('[Test Email] Error sending test email:', error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to send test email',
        },
        500,
      );
    }
  },
);

// ============ AI Template Generation ============

// Rate limit for AI generation: 20 per day per user
const AI_GENERATION_RATE_LIMIT = 20;
const aiGenerationLimits = new Map<
  string,
  {count: number; windowStart: number}
>();

function isAIGenerationRateLimited(userEmail: string): {
  limited: boolean;
  remaining?: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  const userLimit = aiGenerationLimits.get(userEmail);

  if (!userLimit) {
    // First request - start tracking
    aiGenerationLimits.set(userEmail, {count: 1, windowStart: now});
    return {limited: false, remaining: AI_GENERATION_RATE_LIMIT - 1};
  }

  // Check if window has expired
  if (now - userLimit.windowStart > oneDay) {
    // Reset the window
    aiGenerationLimits.set(userEmail, {count: 1, windowStart: now});
    return {limited: false, remaining: AI_GENERATION_RATE_LIMIT - 1};
  }

  // Within window - check count
  if (userLimit.count >= AI_GENERATION_RATE_LIMIT) {
    const retryAfterSeconds = Math.ceil(
      (userLimit.windowStart + oneDay - now) / 1000,
    );
    return {limited: true, retryAfterSeconds};
  }

  // Increment count
  userLimit.count++;
  return {
    limited: false,
    remaining: AI_GENERATION_RATE_LIMIT - userLimit.count,
  };
}

// Generate email template with AI
emailRoutes.post(
  '/templates/generate',
  zValidator(
    'json',
    z.object({
      prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
    }),
  ),
  async (c) => {
    const {prompt} = c.req.valid('json');
    const user = c.get('user');

    // Rate limit check
    const rateCheck = isAIGenerationRateLimited(user.email);
    if (rateCheck.limited) {
      return c.json(
        {
          error: 'Rate limit exceeded. Maximum 20 AI generations per day.',
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        429,
      );
    }

    console.log(
      `[AI Template Generation] User ${user.email} requested: "${prompt.substring(0, 50)}..."`,
    );

    try {
      const {generateTemplate, getDefaultBrandContext} =
        await import('../services/email-ai');

      const brandContext = getDefaultBrandContext();
      const result = await generateTemplate(
        c.env.GEMINI_API_KEY,
        prompt,
        brandContext,
      );

      console.log(
        `[AI Template Generation] Generated template with ${result.components.length} components`,
      );

      return c.json({
        success: true,
        template: result,
        remainingGenerations: rateCheck.remaining,
      });
    } catch (error) {
      console.error('[AI Template Generation] Error:', error);
      return c.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to generate template',
        },
        500,
      );
    }
  },
);

// ============ Campaigns Endpoints ============

// List all campaigns with stats
emailRoutes.get('/campaigns', async (c) => {
  const db = createDb(c.env.DB);

  const campaignsList = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      subject: campaigns.subject,
      templateId: campaigns.templateId,
      segmentIds: campaigns.segmentIds,
      status: campaigns.status,
      scheduledAt: campaigns.scheduledAt,
      sentAt: campaigns.sentAt,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
    })
    .from(campaigns)
    .orderBy(desc(campaigns.createdAt));

  // Get send stats for each campaign
  const campaignsWithStats = await Promise.all(
    campaignsList.map(async (campaign) => {
      const [stats] = await db
        .select({
          total: count(),
          sent: sql<number>`SUM(CASE WHEN ${emailSends.status} IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained') THEN 1 ELSE 0 END)`,
          delivered: sql<number>`SUM(CASE WHEN ${emailSends.status} IN ('delivered', 'opened', 'clicked') THEN 1 ELSE 0 END)`,
          opened: sql<number>`SUM(CASE WHEN ${emailSends.status} IN ('opened', 'clicked') THEN 1 ELSE 0 END)`,
          clicked: sql<number>`SUM(CASE WHEN ${emailSends.status} = 'clicked' THEN 1 ELSE 0 END)`,
          bounced: sql<number>`SUM(CASE WHEN ${emailSends.status} = 'bounced' THEN 1 ELSE 0 END)`,
        })
        .from(emailSends)
        .where(eq(emailSends.campaignId, campaign.id));

      return {
        ...campaign,
        stats: {
          total: stats?.total || 0,
          sent: Number(stats?.sent) || 0,
          delivered: Number(stats?.delivered) || 0,
          opened: Number(stats?.opened) || 0,
          clicked: Number(stats?.clicked) || 0,
          bounced: Number(stats?.bounced) || 0,
        },
      };
    }),
  );

  return c.json({campaigns: campaignsWithStats});
});

// Get a single campaign by ID with full details
emailRoutes.get('/campaigns/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = createDb(c.env.DB);

  const [campaign] = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      subject: campaigns.subject,
      templateId: campaigns.templateId,
      segmentIds: campaigns.segmentIds,
      status: campaigns.status,
      scheduledAt: campaigns.scheduledAt,
      sentAt: campaigns.sentAt,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
    })
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!campaign) {
    return c.json({error: 'Campaign not found'}, 404);
  }

  // Get template info if set
  let template = null;
  if (campaign.templateId) {
    const [templateData] = await db
      .select({
        id: emailTemplates.id,
        name: emailTemplates.name,
        subject: emailTemplates.subject,
      })
      .from(emailTemplates)
      .where(eq(emailTemplates.id, campaign.templateId))
      .limit(1);
    template = templateData;
  }

  // Get segments info if set (segmentIds is a JSON array)
  let segmentsList: Array<{id: number; name: string | null}> = [];
  if (campaign.segmentIds) {
    const segmentIdArray = JSON.parse(campaign.segmentIds) as number[];
    if (segmentIdArray.length > 0) {
      segmentsList = await db
        .select({
          id: segments.id,
          name: segments.name,
        })
        .from(segments)
        .where(inArray(segments.id, segmentIdArray));
    }
  }

  // Get send stats
  const [stats] = await db
    .select({
      total: count(),
      sent: sql<number>`SUM(CASE WHEN ${emailSends.status} IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained') THEN 1 ELSE 0 END)`,
      delivered: sql<number>`SUM(CASE WHEN ${emailSends.status} IN ('delivered', 'opened', 'clicked') THEN 1 ELSE 0 END)`,
      opened: sql<number>`SUM(CASE WHEN ${emailSends.status} IN ('opened', 'clicked') THEN 1 ELSE 0 END)`,
      clicked: sql<number>`SUM(CASE WHEN ${emailSends.status} = 'clicked' THEN 1 ELSE 0 END)`,
      bounced: sql<number>`SUM(CASE WHEN ${emailSends.status} = 'bounced' THEN 1 ELSE 0 END)`,
    })
    .from(emailSends)
    .where(eq(emailSends.campaignId, campaign.id));

  return c.json({
    campaign: {
      ...campaign,
      template,
      segments: segmentsList,
      stats: {
        total: stats?.total || 0,
        sent: Number(stats?.sent) || 0,
        delivered: Number(stats?.delivered) || 0,
        opened: Number(stats?.opened) || 0,
        clicked: Number(stats?.clicked) || 0,
        bounced: Number(stats?.bounced) || 0,
      },
    },
  });
});

// Create a new campaign
emailRoutes.post(
  '/campaigns',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1, 'Name is required'),
      subject: z.string().min(1, 'Subject is required'),
      templateId: z.number().int().positive('Template ID is required'),
      segmentIds: z.array(z.number().int().positive()).optional(),
    }),
  ),
  async (c) => {
    const {name, subject, templateId, segmentIds} = c.req.valid('json');
    const db = createDb(c.env.DB);

    // Verify template exists
    const [template] = await db
      .select({id: emailTemplates.id})
      .from(emailTemplates)
      .where(eq(emailTemplates.id, templateId))
      .limit(1);

    if (!template) {
      return c.json({error: 'Template not found'}, 404);
    }

    // Verify segments exist if provided
    if (segmentIds && segmentIds.length > 0) {
      const existingSegments = await db
        .select({id: segments.id})
        .from(segments)
        .where(inArray(segments.id, segmentIds));

      if (existingSegments.length !== segmentIds.length) {
        return c.json({error: 'One or more segments not found'}, 404);
      }
    }

    const [newCampaign] = await db
      .insert(campaigns)
      .values({
        name,
        subject,
        templateId,
        segmentIds: segmentIds ? JSON.stringify(segmentIds) : null,
        status: 'draft',
      })
      .returning({
        id: campaigns.id,
        name: campaigns.name,
        subject: campaigns.subject,
        templateId: campaigns.templateId,
        segmentIds: campaigns.segmentIds,
        status: campaigns.status,
        createdAt: campaigns.createdAt,
      });

    return c.json({campaign: newCampaign}, 201);
  },
);

// Update a campaign (only if draft)
emailRoutes.patch(
  '/campaigns/:id',
  zValidator(
    'json',
    z.object({
      name: z.string().min(1).optional(),
      subject: z.string().min(1).optional(),
      templateId: z.number().int().positive().optional(),
      segmentIds: z.array(z.number().int().positive()).nullable().optional(),
    }),
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const {segmentIds, ...otherUpdates} = c.req.valid('json');
    const db = createDb(c.env.DB);

    // Check if campaign exists and is draft
    const [campaign] = await db
      .select({id: campaigns.id, status: campaigns.status})
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);

    if (!campaign) {
      return c.json({error: 'Campaign not found'}, 404);
    }

    if (campaign.status !== 'draft') {
      return c.json({error: 'Only draft campaigns can be updated'}, 400);
    }

    // Verify template exists if updating
    if (otherUpdates.templateId) {
      const [template] = await db
        .select({id: emailTemplates.id})
        .from(emailTemplates)
        .where(eq(emailTemplates.id, otherUpdates.templateId))
        .limit(1);

      if (!template) {
        return c.json({error: 'Template not found'}, 404);
      }
    }

    // Verify segments exist if updating
    if (segmentIds && segmentIds.length > 0) {
      const existingSegments = await db
        .select({id: segments.id})
        .from(segments)
        .where(inArray(segments.id, segmentIds));

      if (existingSegments.length !== segmentIds.length) {
        return c.json({error: 'One or more segments not found'}, 404);
      }
    }

    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        ...otherUpdates,
        segmentIds:
          segmentIds !== undefined
            ? segmentIds
              ? JSON.stringify(segmentIds)
              : null
            : undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, id))
      .returning({
        id: campaigns.id,
        name: campaigns.name,
        subject: campaigns.subject,
        templateId: campaigns.templateId,
        segmentIds: campaigns.segmentIds,
        status: campaigns.status,
        updatedAt: campaigns.updatedAt,
      });

    return c.json({campaign: updatedCampaign});
  },
);

// Schedule a campaign (or send immediately)
emailRoutes.post(
  '/campaigns/:id/schedule',
  zValidator(
    'json',
    z.object({
      scheduledAt: z.string().datetime().optional(),
    }),
  ),
  async (c) => {
    const id = parseInt(c.req.param('id'));
    const {scheduledAt} = c.req.valid('json');
    const db = createDb(c.env.DB);

    // Check if campaign exists and is draft
    const [campaign] = await db
      .select({
        id: campaigns.id,
        status: campaigns.status,
        templateId: campaigns.templateId,
        segmentIds: campaigns.segmentIds,
      })
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);

    if (!campaign) {
      return c.json({error: 'Campaign not found'}, 404);
    }

    if (campaign.status !== 'draft') {
      return c.json({error: 'Only draft campaigns can be scheduled'}, 400);
    }

    // Validate campaign has template and segments
    if (!campaign.templateId) {
      return c.json({error: 'Campaign must have a template selected'}, 400);
    }

    if (!campaign.segmentIds) {
      return c.json(
        {error: 'Campaign must have at least one segment selected'},
        400,
      );
    }

    // Validate scheduledAt is at least 15 minutes in the future if provided
    if (scheduledAt) {
      const scheduledTime = new Date(scheduledAt);
      const minTime = new Date();
      minTime.setMinutes(minTime.getMinutes() + 15);

      if (scheduledTime < minTime) {
        return c.json(
          {error: 'Scheduled time must be at least 15 minutes from now'},
          400,
        );
      }
    }

    // If no scheduledAt, this is a "send now" - set status to scheduled with current time
    // The cron job will pick it up immediately
    const newStatus = 'scheduled';
    const newScheduledAt = scheduledAt || new Date().toISOString();

    const [updatedCampaign] = await db
      .update(campaigns)
      .set({
        status: newStatus,
        scheduledAt: newScheduledAt,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, id))
      .returning({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        scheduledAt: campaigns.scheduledAt,
      });

    console.log(
      `[Campaign] Campaign ${id} scheduled for ${newScheduledAt} (${scheduledAt ? 'scheduled' : 'send now'})`,
    );

    return c.json({campaign: updatedCampaign});
  },
);

// Cancel a scheduled campaign
emailRoutes.post('/campaigns/:id/cancel', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = createDb(c.env.DB);

  // Check if campaign exists and is scheduled
  const [campaign] = await db
    .select({id: campaigns.id, status: campaigns.status})
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!campaign) {
    return c.json({error: 'Campaign not found'}, 404);
  }

  if (campaign.status !== 'scheduled') {
    return c.json({error: 'Only scheduled campaigns can be cancelled'}, 400);
  }

  // Set status back to draft and clear scheduledAt
  const [updatedCampaign] = await db
    .update(campaigns)
    .set({
      status: 'draft',
      scheduledAt: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(campaigns.id, id))
    .returning({
      id: campaigns.id,
      name: campaigns.name,
      status: campaigns.status,
    });

  console.log(`[Campaign] Campaign ${id} cancelled and returned to draft`);

  return c.json({campaign: updatedCampaign});
});

// Send a campaign immediately
emailRoutes.post('/campaigns/:id/send', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = createDb(c.env.DB);

  // Check if campaign exists and validate
  const [campaign] = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      status: campaigns.status,
      templateId: campaigns.templateId,
      segmentIds: campaigns.segmentIds,
    })
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!campaign) {
    return c.json({error: 'Campaign not found'}, 404);
  }

  if (campaign.status !== 'draft') {
    return c.json(
      {
        error:
          'Only draft campaigns can be sent. Cancel the scheduled campaign first.',
      },
      400,
    );
  }

  if (!campaign.templateId) {
    return c.json({error: 'Campaign must have a template selected'}, 400);
  }

  if (!campaign.segmentIds) {
    return c.json(
      {error: 'Campaign must have at least one segment selected'},
      400,
    );
  }

  // Validate segmentIds is valid JSON array with at least one segment
  try {
    const segmentIds = JSON.parse(campaign.segmentIds) as number[];
    if (!Array.isArray(segmentIds) || segmentIds.length === 0) {
      return c.json(
        {error: 'Campaign must have at least one segment selected'},
        400,
      );
    }
  } catch {
    return c.json({error: 'Campaign has invalid segment configuration'}, 400);
  }

  // Update status to scheduled (will be picked up immediately by async handler)
  await db
    .update(campaigns)
    .set({
      status: 'scheduled',
      scheduledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(campaigns.id, id));

  // Trigger async send using waitUntil
  const {sendCampaign} = await import('../services/campaignSender');

  c.executionCtx.waitUntil(
    (async () => {
      try {
        console.log(`[Campaign] Starting immediate send for campaign ${id}`);
        await sendCampaign(
          c.env.DB,
          c.env.RESEND_API_KEY,
          id,
          'Wakey <hello@wakey.care>',
        );
        console.log(`[Campaign] Campaign ${id} send completed`);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Campaign] Campaign ${id} send failed: ${errorMessage}`);
      }
    })(),
  );

  console.log(`[Campaign] Campaign ${id} send triggered (async)`);

  return c.json({
    message: 'Campaign sending started',
    campaignId: id,
    campaignName: campaign.name,
  });
});

// Delete a campaign (only if draft)
emailRoutes.delete('/campaigns/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = createDb(c.env.DB);

  // Check if campaign exists and is draft
  const [campaign] = await db
    .select({id: campaigns.id, status: campaigns.status})
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!campaign) {
    return c.json({error: 'Campaign not found'}, 404);
  }

  if (campaign.status !== 'draft') {
    return c.json({error: 'Only draft campaigns can be deleted'}, 400);
  }

  await db.delete(campaigns).where(eq(campaigns.id, id));

  return c.json({success: true});
});

export {emailRoutes};
