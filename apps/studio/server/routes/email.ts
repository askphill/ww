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
  emailEvents,
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

// ============ Resend Webhook Handler ============

/**
 * Resend webhook event types we handle
 */
interface ResendWebhookEvent {
  type:
    | 'email.sent'
    | 'email.delivered'
    | 'email.opened'
    | 'email.clicked'
    | 'email.bounced'
    | 'email.complained';
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
  };
}

/**
 * Verify Resend webhook signature using SVix
 * Resend uses SVix for webhook signing
 * See: https://resend.com/docs/dashboard/webhooks/verify-webhooks
 */
async function verifyResendWebhook(
  body: string,
  headers: {
    svixId: string | undefined;
    svixTimestamp: string | undefined;
    svixSignature: string | undefined;
  },
  secret: string,
): Promise<boolean> {
  const {svixId, svixTimestamp, svixSignature} = headers;

  // All headers are required
  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('[Resend Webhook] Missing SVix headers');
    return false;
  }

  // Validate timestamp is within 5 minutes to prevent replay attacks
  const timestamp = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    console.error('[Resend Webhook] Timestamp too old or in the future');
    return false;
  }

  // The signed content is "msg_id.timestamp.body"
  const signedContent = `${svixId}.${svixTimestamp}.${body}`;

  // Extract the secret key (format: whsec_xxxxx)
  const secretBytes = secret.startsWith('whsec_')
    ? Uint8Array.from(atob(secret.slice(6)), (c) => c.charCodeAt(0))
    : new TextEncoder().encode(secret);

  // Create the HMAC
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedContent),
  );
  const computedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signature)),
  );

  // The signature header may contain multiple signatures (e.g., v1,xxx v1,yyy)
  const signatures = svixSignature.split(' ');
  for (const sig of signatures) {
    const [version, expectedSig] = sig.split(',');
    if (version === 'v1' && expectedSig === computedSignature) {
      return true;
    }
  }

  console.error('[Resend Webhook] Signature mismatch');
  return false;
}

/**
 * Handle Resend webhooks for email events
 * Events: email.delivered, email.opened, email.clicked, email.bounced, email.complained
 */
emailRoutes.post('/webhooks/resend', async (c) => {
  // Get SVix headers for verification
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  // Get raw body for signature validation
  const body = await c.req.text();

  // Validate webhook signature
  const isValid = await verifyResendWebhook(
    body,
    {svixId, svixTimestamp, svixSignature},
    c.env.RESEND_WEBHOOK_SECRET,
  );

  if (!isValid) {
    console.error('[Resend Webhook] Invalid webhook signature');
    return c.json({error: 'Invalid webhook signature'}, 401);
  }

  // Parse the payload
  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    console.error('[Resend Webhook] Invalid JSON payload');
    return c.json({error: 'Invalid JSON payload'}, 400);
  }

  const db = createDb(c.env.DB);
  const emailId = event.data.email_id;

  console.log(`[Resend Webhook] Received ${event.type} for email ${emailId}`);

  try {
    // Find the email send record by resendId
    const [emailSend] = await db
      .select({
        id: emailSends.id,
        subscriberId: emailSends.subscriberId,
        status: emailSends.status,
      })
      .from(emailSends)
      .where(eq(emailSends.resendId, emailId))
      .limit(1);

    if (!emailSend) {
      // Email not found - might be a test email or one we didn't track
      console.log(
        `[Resend Webhook] Email send record not found for Resend ID: ${emailId}`,
      );
      return c.json({success: true, message: 'Email send record not found'});
    }

    const now = new Date().toISOString();

    switch (event.type) {
      case 'email.sent': {
        // Update status to sent if currently pending
        if (emailSend.status === 'pending') {
          await db
            .update(emailSends)
            .set({status: 'sent', sentAt: now})
            .where(eq(emailSends.id, emailSend.id));
          console.log(
            `[Resend Webhook] Updated email ${emailSend.id} status to sent`,
          );
        }
        break;
      }

      case 'email.delivered': {
        // Update status to delivered
        await db
          .update(emailSends)
          .set({status: 'delivered', deliveredAt: now})
          .where(eq(emailSends.id, emailSend.id));
        console.log(
          `[Resend Webhook] Updated email ${emailSend.id} status to delivered`,
        );
        break;
      }

      case 'email.opened': {
        // Update status to opened if not already clicked
        // (clicked is a "higher" status than opened)
        if (emailSend.status !== 'clicked') {
          // Get existing record to check if this is first open
          const [existingEmail] = await db
            .select({openedAt: emailSends.openedAt})
            .from(emailSends)
            .where(eq(emailSends.id, emailSend.id))
            .limit(1);

          // Only set openedAt if this is the first open
          if (!existingEmail?.openedAt) {
            await db
              .update(emailSends)
              .set({status: 'opened' as const, openedAt: now})
              .where(eq(emailSends.id, emailSend.id));
          } else {
            await db
              .update(emailSends)
              .set({status: 'opened' as const})
              .where(eq(emailSends.id, emailSend.id));
          }

          console.log(
            `[Resend Webhook] Updated email ${emailSend.id} status to opened`,
          );
        }
        break;
      }

      case 'email.clicked': {
        // Get existing record to check if this is first click
        const [existingEmail] = await db
          .select({clickedAt: emailSends.clickedAt})
          .from(emailSends)
          .where(eq(emailSends.id, emailSend.id))
          .limit(1);

        // Only set clickedAt if this is the first click
        if (!existingEmail?.clickedAt) {
          await db
            .update(emailSends)
            .set({status: 'clicked' as const, clickedAt: now})
            .where(eq(emailSends.id, emailSend.id));
        } else {
          await db
            .update(emailSends)
            .set({status: 'clicked' as const})
            .where(eq(emailSends.id, emailSend.id));
        }

        console.log(
          `[Resend Webhook] Updated email ${emailSend.id} status to clicked`,
        );
        break;
      }

      case 'email.bounced': {
        // Update email send status to bounced
        await db
          .update(emailSends)
          .set({status: 'bounced'})
          .where(eq(emailSends.id, emailSend.id));

        // Mark subscriber as bounced
        await db
          .update(subscribers)
          .set({
            status: 'bounced',
            updatedAt: now,
          })
          .where(eq(subscribers.id, emailSend.subscriberId));

        console.log(
          `[Resend Webhook] Marked email ${emailSend.id} as bounced and subscriber ${emailSend.subscriberId} as bounced`,
        );
        break;
      }

      case 'email.complained': {
        // Update email send status to complained
        await db
          .update(emailSends)
          .set({status: 'complained'})
          .where(eq(emailSends.id, emailSend.id));

        // Mark subscriber as complained (spam complaint)
        await db
          .update(subscribers)
          .set({
            status: 'complained',
            updatedAt: now,
          })
          .where(eq(subscribers.id, emailSend.subscriberId));

        console.log(
          `[Resend Webhook] Marked email ${emailSend.id} as complained and subscriber ${emailSend.subscriberId} as complained`,
        );
        break;
      }

      default:
        console.log(`[Resend Webhook] Unknown event type: ${event.type}`);
    }

    return c.json({success: true});
  } catch (error) {
    console.error('[Resend Webhook] Error processing webhook:', error);
    // Return 200 to prevent Resend from retrying
    return c.json({success: false, error: 'Internal error'}, 200);
  }
});

// ============ Tracking Endpoints (No Auth - Public for Email Clients) ============

/**
 * Click tracking endpoint
 * Records click event and redirects to the original URL with UTM parameters
 */
emailRoutes.get('/track/click', async (c) => {
  const emailSendId = c.req.query('eid');
  const targetUrl = c.req.query('url');

  // Validate required parameters
  if (!emailSendId || !targetUrl) {
    console.error(
      '[Click Tracking] Missing parameters - eid:',
      emailSendId,
      'url:',
      targetUrl,
    );
    // Redirect to homepage if URL is missing
    return c.redirect(targetUrl || 'https://www.wakey.care');
  }

  const eid = parseInt(emailSendId, 10);
  if (isNaN(eid)) {
    console.error('[Click Tracking] Invalid email send ID:', emailSendId);
    return c.redirect(targetUrl);
  }

  const db = createDb(c.env.DB);

  try {
    // Find the email send record
    const [emailSend] = await db
      .select({
        id: emailSends.id,
        subscriberId: emailSends.subscriberId,
        campaignId: emailSends.campaignId,
        clickedAt: emailSends.clickedAt,
      })
      .from(emailSends)
      .where(eq(emailSends.id, eid))
      .limit(1);

    if (emailSend) {
      const now = new Date().toISOString();

      // Record the click event in email_events
      await db.insert(emailEvents).values({
        subscriberId: emailSend.subscriberId,
        eventType: 'click',
        eventData: JSON.stringify({
          emailSendId: eid,
          campaignId: emailSend.campaignId,
          url: targetUrl,
        }),
      });

      // Update email_sends.clickedAt if this is the first click
      if (!emailSend.clickedAt) {
        await db
          .update(emailSends)
          .set({
            status: 'clicked',
            clickedAt: now,
          })
          .where(eq(emailSends.id, eid));

        console.log(
          `[Click Tracking] First click recorded for email send ${eid}`,
        );
      } else {
        console.log(
          `[Click Tracking] Repeat click recorded for email send ${eid}`,
        );
      }
    } else {
      console.log(
        `[Click Tracking] Email send not found for ID ${eid}, redirecting anyway`,
      );
    }
  } catch (error) {
    console.error('[Click Tracking] Error recording click:', error);
    // Don't fail the redirect even if tracking fails
  }

  // Always redirect to the target URL
  return c.redirect(targetUrl);
});

/**
 * Open tracking endpoint
 * Returns a 1x1 transparent GIF and records the open event
 */
emailRoutes.get('/track/open', async (c) => {
  const emailSendId = c.req.query('eid');

  // 1x1 transparent GIF (smallest valid GIF)
  const transparentGif = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
    0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
    0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b,
  ]);

  // Return the GIF with proper headers regardless of tracking success
  const gifResponse = () =>
    new Response(transparentGif, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });

  if (!emailSendId) {
    return gifResponse();
  }

  const eid = parseInt(emailSendId, 10);
  if (isNaN(eid)) {
    return gifResponse();
  }

  const db = createDb(c.env.DB);

  try {
    // Find the email send record
    const [emailSend] = await db
      .select({
        id: emailSends.id,
        subscriberId: emailSends.subscriberId,
        campaignId: emailSends.campaignId,
        openedAt: emailSends.openedAt,
        status: emailSends.status,
      })
      .from(emailSends)
      .where(eq(emailSends.id, eid))
      .limit(1);

    if (emailSend) {
      const now = new Date().toISOString();

      // Record the open event in email_events
      await db.insert(emailEvents).values({
        subscriberId: emailSend.subscriberId,
        eventType: 'open',
        eventData: JSON.stringify({
          emailSendId: eid,
          campaignId: emailSend.campaignId,
        }),
      });

      // Update email_sends.openedAt if this is the first open
      // Don't downgrade status if already clicked
      if (!emailSend.openedAt) {
        const newStatus = emailSend.status === 'clicked' ? 'clicked' : 'opened';
        await db
          .update(emailSends)
          .set({
            status: newStatus,
            openedAt: now,
          })
          .where(eq(emailSends.id, eid));

        console.log(
          `[Open Tracking] First open recorded for email send ${eid}`,
        );
      }
    }
  } catch (error) {
    console.error('[Open Tracking] Error recording open:', error);
    // Don't fail the response even if tracking fails
  }

  return gifResponse();
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

  if (
    status &&
    ['active', 'unsubscribed', 'bounced', 'complained'].includes(status)
  ) {
    conditions.push(
      eq(
        subscribers.status,
        status as 'active' | 'unsubscribed' | 'bounced' | 'complained',
      ),
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
      status: z
        .enum(['active', 'unsubscribed', 'bounced', 'complained'])
        .optional(),
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

// Get campaign recipients (paginated)
emailRoutes.get('/campaigns/:id/recipients', async (c) => {
  const id = parseInt(c.req.param('id'));
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
  const offset = (page - 1) * limit;

  const db = createDb(c.env.DB);

  // Verify campaign exists
  const [campaign] = await db
    .select({id: campaigns.id})
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);

  if (!campaign) {
    return c.json({error: 'Campaign not found'}, 404);
  }

  // Get total count
  const [countResult] = await db
    .select({count: count()})
    .from(emailSends)
    .where(eq(emailSends.campaignId, id));

  const total = countResult?.count || 0;

  // Get recipients with subscriber info
  const recipientsResult = await db
    .select({
      id: emailSends.id,
      subscriberId: emailSends.subscriberId,
      email: subscribers.email,
      firstName: subscribers.firstName,
      lastName: subscribers.lastName,
      status: emailSends.status,
      sentAt: emailSends.sentAt,
      deliveredAt: emailSends.deliveredAt,
      openedAt: emailSends.openedAt,
      clickedAt: emailSends.clickedAt,
    })
    .from(emailSends)
    .innerJoin(subscribers, eq(emailSends.subscriberId, subscribers.id))
    .where(eq(emailSends.campaignId, id))
    .orderBy(emailSends.sentAt)
    .limit(limit)
    .offset(offset);

  return c.json({
    recipients: recipientsResult,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
