/**
 * Campaign Sender Service
 *
 * Handles sending email campaigns via Resend.
 * Fetches subscribers, deduplicates across segments, renders templates,
 * and sends emails in batches with rate limiting.
 */

import {drizzle} from 'drizzle-orm/d1';
import {eq, inArray, and} from 'drizzle-orm';
import type {D1Database} from '@cloudflare/workers-types';
import {Resend} from 'resend';
import {
  campaigns,
  subscribers,
  segments,
  segmentSubscribers,
  emailSends,
  emailTemplates,
} from '../db/schema';
import {renderTemplate} from './emailRenderer';
import {applyEmailTracking} from './emailTracking';

// Maximum emails per Resend batch API call
const BATCH_SIZE = 100;

// Delay between batches to respect rate limits (in ms)
const BATCH_DELAY_MS = 1000;

// Maximum retries for rate-limited requests
const MAX_RETRIES = 3;

// Base delay for exponential backoff (in ms)
const BASE_RETRY_DELAY_MS = 1000;

export interface CampaignSendResult {
  campaignId: number;
  totalRecipients: number;
  sent: number;
  failed: number;
  errors: string[];
}

export interface SubscriberForSend {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Fetch all active subscribers for the campaign's segments
 * Deduplicates subscribers who are in multiple segments
 */
async function fetchSubscribersForCampaign(
  db: ReturnType<typeof drizzle>,
  segmentIds: number[],
): Promise<SubscriberForSend[]> {
  if (segmentIds.length === 0) {
    return [];
  }

  // Get all subscriber IDs in the selected segments
  const segmentMemberships = await db
    .select({
      subscriberId: segmentSubscribers.subscriberId,
    })
    .from(segmentSubscribers)
    .where(inArray(segmentSubscribers.segmentId, segmentIds));

  // Deduplicate subscriber IDs
  const uniqueSubscriberIds = [
    ...new Set(segmentMemberships.map((m) => m.subscriberId)),
  ];

  if (uniqueSubscriberIds.length === 0) {
    return [];
  }

  // Fetch subscriber details (only active subscribers)
  const subscribersList = await db
    .select({
      id: subscribers.id,
      email: subscribers.email,
      firstName: subscribers.firstName,
      lastName: subscribers.lastName,
    })
    .from(subscribers)
    .where(
      and(
        inArray(subscribers.id, uniqueSubscriberIds),
        eq(subscribers.status, 'active'),
      ),
    );

  return subscribersList;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send a batch of emails via Resend with retry logic
 */
async function sendBatchWithRetry(
  resend: Resend,
  batch: Array<{
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
    headers?: Record<string, string>;
  }>,
  retryCount = 0,
): Promise<{
  success: boolean;
  data?: Array<{id: string}>;
  error?: string;
}> {
  try {
    const result = await resend.batch.send(batch);

    if (result.error) {
      // Check if rate limited
      if (
        result.error.message?.includes('rate') ||
        result.error.name === 'rate_limit_exceeded'
      ) {
        if (retryCount < MAX_RETRIES) {
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
          console.log(
            `[CampaignSender] Rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`,
          );
          await sleep(delay);
          return sendBatchWithRetry(resend, batch, retryCount + 1);
        }
      }
      return {success: false, error: result.error.message};
    }

    // Extract IDs from the batch response
    const data = result.data as unknown as {data: Array<{id: string}>};
    return {success: true, data: data.data || []};
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[CampaignSender] Batch send error: ${errorMessage}`);
    return {success: false, error: errorMessage};
  }
}

/**
 * Send a campaign to all subscribers in its segments
 */
export async function sendCampaign(
  db: D1Database,
  resendApiKey: string,
  campaignId: number,
  fromEmail: string = 'Wakey <hello@wakey.care>',
): Promise<CampaignSendResult> {
  const drizzleDb = drizzle(db);
  const resend = new Resend(resendApiKey);

  const result: CampaignSendResult = {
    campaignId,
    totalRecipients: 0,
    sent: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Fetch the campaign
    const [campaign] = await drizzleDb
      .select({
        id: campaigns.id,
        name: campaigns.name,
        subject: campaigns.subject,
        templateId: campaigns.templateId,
        segmentIds: campaigns.segmentIds,
        status: campaigns.status,
      })
      .from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status !== 'scheduled') {
      throw new Error(
        `Campaign ${campaignId} is not in scheduled status (current: ${campaign.status})`,
      );
    }

    if (!campaign.templateId) {
      throw new Error(`Campaign ${campaignId} has no template assigned`);
    }

    if (!campaign.segmentIds) {
      throw new Error(`Campaign ${campaignId} has no segments assigned`);
    }

    // Parse segment IDs
    let segmentIds: number[];
    try {
      segmentIds = JSON.parse(campaign.segmentIds) as number[];
    } catch {
      throw new Error(`Campaign ${campaignId} has invalid segmentIds JSON`);
    }

    if (segmentIds.length === 0) {
      throw new Error(`Campaign ${campaignId} has empty segments list`);
    }

    // Update status to 'sending'
    await drizzleDb
      .update(campaigns)
      .set({
        status: 'sending',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, campaignId));

    console.log(
      `[CampaignSender] Starting campaign ${campaignId}: "${campaign.name}"`,
    );

    // Fetch subscribers
    const subscriberList = await fetchSubscribersForCampaign(
      drizzleDb,
      segmentIds,
    );
    result.totalRecipients = subscriberList.length;

    console.log(
      `[CampaignSender] Found ${subscriberList.length} active subscribers`,
    );

    if (subscriberList.length === 0) {
      // No subscribers to send to
      await drizzleDb
        .update(campaigns)
        .set({
          status: 'sent',
          sentAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(campaigns.id, campaignId));

      console.log(
        `[CampaignSender] Campaign ${campaignId} completed (no recipients)`,
      );
      return result;
    }

    // Tracking base URL for link/open tracking
    const trackingBaseUrl = 'https://studio.wakey.care';

    // Process subscribers in batches
    for (let i = 0; i < subscriberList.length; i += BATCH_SIZE) {
      const batch = subscriberList.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(subscriberList.length / BATCH_SIZE);

      console.log(
        `[CampaignSender] Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`,
      );

      // Step 1: Create email_sends records first to get IDs for tracking
      const emailSendRecords: Array<{
        id: number;
        subscriberId: number;
        email: string;
        firstName: string | null;
        lastName: string | null;
      }> = [];

      for (const subscriber of batch) {
        try {
          const [emailSendRecord] = await drizzleDb
            .insert(emailSends)
            .values({
              subscriberId: subscriber.id,
              campaignId: campaignId,
              status: 'pending',
            })
            .returning({id: emailSends.id});

          emailSendRecords.push({
            id: emailSendRecord.id,
            subscriberId: subscriber.id,
            email: subscriber.email,
            firstName: subscriber.firstName,
            lastName: subscriber.lastName,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Unknown DB error';
          console.error(
            `[CampaignSender] Failed to create email_send for ${subscriber.email}: ${errorMessage}`,
          );
          result.failed++;
          result.errors.push(
            `DB insert failed for ${subscriber.email}: ${errorMessage}`,
          );
        }
      }

      if (emailSendRecords.length === 0) {
        continue;
      }

      // Step 2: Render and apply tracking to each email
      const batchEmails: Array<{
        from: string;
        to: string;
        subject: string;
        html: string;
        text: string;
        emailSendId: number;
      }> = [];

      for (const record of emailSendRecords) {
        try {
          // Render template with subscriber-specific variables
          const variables = {
            firstName: record.firstName || 'Friend',
            lastName: record.lastName || '',
            email: record.email,
          };

          const rendered = await renderTemplate(
            db,
            campaign.templateId,
            variables,
          );

          // Apply click and open tracking
          const trackedHtml = applyEmailTracking(rendered.html, {
            baseUrl: trackingBaseUrl,
            emailSendId: record.id,
            campaignId: campaignId,
          });

          batchEmails.push({
            from: fromEmail,
            to: record.email,
            subject: campaign.subject,
            html: trackedHtml,
            text: rendered.text, // Plain text doesn't have tracking
            emailSendId: record.id,
          });
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : 'Unknown render error';
          console.error(
            `[CampaignSender] Failed to render for ${record.email}: ${errorMessage}`,
          );
          result.failed++;
          result.errors.push(
            `Render failed for ${record.email}: ${errorMessage}`,
          );
        }
      }

      if (batchEmails.length === 0) {
        continue;
      }

      // Step 3: Send the batch
      const sendResult = await sendBatchWithRetry(
        resend,
        batchEmails.map(({from, to, subject, html, text}) => ({
          from,
          to,
          subject,
          html,
          text,
        })),
      );

      if (sendResult.success && sendResult.data) {
        // Update email_sends records with resendId and sent status
        const now = new Date().toISOString();

        for (let j = 0; j < batchEmails.length; j++) {
          const email = batchEmails[j];
          const resendData = sendResult.data[j];

          try {
            await drizzleDb
              .update(emailSends)
              .set({
                resendId: resendData?.id || null,
                status: 'sent',
                sentAt: now,
              })
              .where(eq(emailSends.id, email.emailSendId));
            result.sent++;
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : 'Unknown DB error';
            console.error(
              `[CampaignSender] Failed to update send for ${email.to}: ${errorMessage}`,
            );
            result.failed++;
            result.errors.push(
              `DB update failed for ${email.to}: ${errorMessage}`,
            );
          }
        }

        console.log(`[CampaignSender] Batch ${batchNumber} sent successfully`);
      } else {
        // Batch failed - records stay in pending status
        result.failed += batchEmails.length;
        result.errors.push(
          `Batch ${batchNumber} failed: ${sendResult.error || 'Unknown error'}`,
        );
        console.error(
          `[CampaignSender] Batch ${batchNumber} failed: ${sendResult.error}`,
        );
      }

      // Delay between batches to respect rate limits
      if (i + BATCH_SIZE < subscriberList.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    // Update campaign status to 'sent'
    await drizzleDb
      .update(campaigns)
      .set({
        status: 'sent',
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(campaigns.id, campaignId));

    console.log(
      `[CampaignSender] Campaign ${campaignId} completed: ${result.sent} sent, ${result.failed} failed`,
    );

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      `[CampaignSender] Campaign ${campaignId} error: ${errorMessage}`,
    );

    // Update campaign status back to draft on error
    try {
      await drizzleDb
        .update(campaigns)
        .set({
          status: 'draft',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(campaigns.id, campaignId));
    } catch {
      console.error(
        `[CampaignSender] Failed to reset campaign ${campaignId} status`,
      );
    }

    result.errors.push(errorMessage);
    throw new Error(`Campaign send failed: ${errorMessage}`);
  }
}
