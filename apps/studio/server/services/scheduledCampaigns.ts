/**
 * Scheduled Campaigns Service
 *
 * Processes scheduled campaigns that are due to be sent.
 * Used by the cron job that runs every 5 minutes.
 */

import {drizzle} from 'drizzle-orm/d1';
import {eq, and, lte} from 'drizzle-orm';
import type {D1Database} from '@cloudflare/workers-types';
import {campaigns} from '../db/schema';
import {sendCampaign} from './campaignSender';

export interface ProcessResult {
  found: number;
  processed: number;
  failed: number;
  errors: string[];
}

/**
 * Find and process all campaigns that are scheduled and due
 */
export async function processScheduledCampaigns(
  db: D1Database,
  resendApiKey: string,
  authSecret?: string,
): Promise<ProcessResult> {
  const drizzleDb = drizzle(db);
  const now = new Date().toISOString();

  const result: ProcessResult = {
    found: 0,
    processed: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Find all scheduled campaigns where scheduledAt <= now
    const dueCampaigns = await drizzleDb
      .select({
        id: campaigns.id,
        name: campaigns.name,
        scheduledAt: campaigns.scheduledAt,
      })
      .from(campaigns)
      .where(
        and(eq(campaigns.status, 'scheduled'), lte(campaigns.scheduledAt, now)),
      );

    result.found = dueCampaigns.length;

    if (dueCampaigns.length === 0) {
      console.log('[ScheduledCampaigns] No campaigns due for processing');
      return result;
    }

    console.log(
      `[ScheduledCampaigns] Found ${dueCampaigns.length} campaigns to process`,
    );

    // Process each campaign
    for (const campaign of dueCampaigns) {
      try {
        console.log(
          `[ScheduledCampaigns] Processing campaign ${campaign.id}: "${campaign.name}"`,
        );

        await sendCampaign(
          db,
          resendApiKey,
          campaign.id,
          'Wakey <hello@wakey.care>',
          authSecret,
        );

        result.processed++;
        console.log(
          `[ScheduledCampaigns] Campaign ${campaign.id} sent successfully`,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        result.failed++;
        result.errors.push(`Campaign ${campaign.id}: ${errorMessage}`);
        console.error(
          `[ScheduledCampaigns] Campaign ${campaign.id} failed: ${errorMessage}`,
        );
      }
    }

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[ScheduledCampaigns] Error: ${errorMessage}`);
    result.errors.push(`Fatal error: ${errorMessage}`);
    return result;
  }
}
