import {Hono} from 'hono';
import {zValidator} from '@hono/zod-validator';
import {z} from 'zod';
import {createDb} from '../db';
import {subscribers, segmentSubscribers, segments} from '../db/schema';
import {authMiddleware} from '../middleware/auth';
import {eq, desc, like, or, sql, and, inArray} from 'drizzle-orm';
import type {AppVariables, Env} from '../index';

const emailRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

// All email routes require authentication
emailRoutes.use('*', authMiddleware);

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

export {emailRoutes};
