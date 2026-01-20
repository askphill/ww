/**
 * Analytics Service
 *
 * Aggregates daily email and subscriber metrics for fast analytics queries.
 * Designed to be run daily via cron job.
 */

import {drizzle} from 'drizzle-orm/d1';
import {eq, and, sql, gte, lt, count} from 'drizzle-orm';
import type {D1Database} from '@cloudflare/workers-types';
import {
  emailSends,
  emailEvents,
  subscribers,
  campaigns,
  dailyEmailMetrics,
  dailySubscriberMetrics,
} from '../db/schema';

export interface DailyMetricsResult {
  date: string;
  emailMetrics: {
    campaignId: number | null;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  }[];
  subscriberMetrics: {
    newSubscribers: number;
    unsubscribed: number;
    netGrowth: number;
    totalActive: number;
  };
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Get the start of a day (00:00:00) in ISO format
 */
function getStartOfDay(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

/**
 * Get the end of a day (23:59:59.999) in ISO format
 */
function getEndOfDay(dateStr: string): string {
  return `${dateStr}T23:59:59.999Z`;
}

/**
 * Aggregate email metrics for a specific campaign on a specific date
 */
async function aggregateEmailMetricsForCampaign(
  db: ReturnType<typeof drizzle>,
  date: string,
  campaignId: number | null,
): Promise<{
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
}> {
  const startOfDay = getStartOfDay(date);
  const endOfDay = getEndOfDay(date);

  // Build the where clause based on whether we have a campaignId
  const baseCondition = campaignId
    ? and(
        eq(emailSends.campaignId, campaignId),
        gte(emailSends.sentAt, startOfDay),
        lt(emailSends.sentAt, endOfDay),
      )
    : and(gte(emailSends.sentAt, startOfDay), lt(emailSends.sentAt, endOfDay));

  // Count sent emails for this campaign on this date
  const sentResult = await db
    .select({count: count()})
    .from(emailSends)
    .where(baseCondition);
  const sent = sentResult[0]?.count ?? 0;

  // Count delivered (status is delivered, opened, or clicked)
  const deliveredResult = await db
    .select({count: count()})
    .from(emailSends)
    .where(
      and(
        baseCondition,
        sql`${emailSends.status} IN ('delivered', 'opened', 'clicked')`,
      ),
    );
  const delivered = deliveredResult[0]?.count ?? 0;

  // Count opened (status is opened or clicked)
  const openedResult = await db
    .select({count: count()})
    .from(emailSends)
    .where(
      and(baseCondition, sql`${emailSends.status} IN ('opened', 'clicked')`),
    );
  const opened = openedResult[0]?.count ?? 0;

  // Count clicked
  const clickedResult = await db
    .select({count: count()})
    .from(emailSends)
    .where(and(baseCondition, eq(emailSends.status, 'clicked')));
  const clicked = clickedResult[0]?.count ?? 0;

  // Count bounced
  const bouncedResult = await db
    .select({count: count()})
    .from(emailSends)
    .where(and(baseCondition, eq(emailSends.status, 'bounced')));
  const bounced = bouncedResult[0]?.count ?? 0;

  // Count unsubscribed from email_events on this date
  const unsubscribedResult = await db
    .select({count: count()})
    .from(emailEvents)
    .where(
      and(
        eq(emailEvents.eventType, 'unsubscribe'),
        gte(emailEvents.createdAt, startOfDay),
        lt(emailEvents.createdAt, endOfDay),
      ),
    );
  const unsubscribed = unsubscribedResult[0]?.count ?? 0;

  return {sent, delivered, opened, clicked, bounced, unsubscribed};
}

/**
 * Aggregate subscriber metrics for a specific date
 */
async function aggregateSubscriberMetrics(
  db: ReturnType<typeof drizzle>,
  date: string,
): Promise<{
  newSubscribers: number;
  unsubscribed: number;
  netGrowth: number;
  totalActive: number;
}> {
  const startOfDay = getStartOfDay(date);
  const endOfDay = getEndOfDay(date);

  // Count new subscribers on this date
  const newSubsResult = await db
    .select({count: count()})
    .from(subscribers)
    .where(
      and(
        gte(subscribers.subscribedAt, startOfDay),
        lt(subscribers.subscribedAt, endOfDay),
      ),
    );
  const newSubscribers = newSubsResult[0]?.count ?? 0;

  // Count unsubscribe events on this date
  const unsubResult = await db
    .select({count: count()})
    .from(emailEvents)
    .where(
      and(
        eq(emailEvents.eventType, 'unsubscribe'),
        gte(emailEvents.createdAt, startOfDay),
        lt(emailEvents.createdAt, endOfDay),
      ),
    );
  const unsubscribed = unsubResult[0]?.count ?? 0;

  // Calculate net growth
  const netGrowth = newSubscribers - unsubscribed;

  // Count total active subscribers as of end of day
  // This is subscribers created before end of day that are still active
  const totalActiveResult = await db
    .select({count: count()})
    .from(subscribers)
    .where(
      and(
        eq(subscribers.status, 'active'),
        lt(subscribers.subscribedAt, endOfDay),
      ),
    );
  const totalActive = totalActiveResult[0]?.count ?? 0;

  return {newSubscribers, unsubscribed, netGrowth, totalActive};
}

/**
 * Upsert daily email metrics record
 */
async function upsertDailyEmailMetrics(
  db: ReturnType<typeof drizzle>,
  date: string,
  campaignId: number | null,
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  },
): Promise<void> {
  // Check if record exists
  const existingWhere = campaignId
    ? and(
        eq(dailyEmailMetrics.date, date),
        eq(dailyEmailMetrics.campaignId, campaignId),
      )
    : and(
        eq(dailyEmailMetrics.date, date),
        sql`${dailyEmailMetrics.campaignId} IS NULL`,
      );

  const existing = await db
    .select({id: dailyEmailMetrics.id})
    .from(dailyEmailMetrics)
    .where(existingWhere)
    .limit(1);

  const now = new Date().toISOString();

  if (existing.length > 0) {
    // Update existing record
    await db
      .update(dailyEmailMetrics)
      .set({
        sent: metrics.sent,
        delivered: metrics.delivered,
        opened: metrics.opened,
        clicked: metrics.clicked,
        bounced: metrics.bounced,
        unsubscribed: metrics.unsubscribed,
        updatedAt: now,
      })
      .where(eq(dailyEmailMetrics.id, existing[0].id));
  } else {
    // Insert new record
    await db.insert(dailyEmailMetrics).values({
      date,
      campaignId,
      sent: metrics.sent,
      delivered: metrics.delivered,
      opened: metrics.opened,
      clicked: metrics.clicked,
      bounced: metrics.bounced,
      unsubscribed: metrics.unsubscribed,
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Upsert daily subscriber metrics record
 */
async function upsertDailySubscriberMetrics(
  db: ReturnType<typeof drizzle>,
  date: string,
  metrics: {
    newSubscribers: number;
    unsubscribed: number;
    netGrowth: number;
    totalActive: number;
  },
): Promise<void> {
  const existing = await db
    .select({id: dailySubscriberMetrics.id})
    .from(dailySubscriberMetrics)
    .where(eq(dailySubscriberMetrics.date, date))
    .limit(1);

  const now = new Date().toISOString();

  if (existing.length > 0) {
    // Update existing record
    await db
      .update(dailySubscriberMetrics)
      .set({
        newSubscribers: metrics.newSubscribers,
        unsubscribed: metrics.unsubscribed,
        netGrowth: metrics.netGrowth,
        totalActive: metrics.totalActive,
        updatedAt: now,
      })
      .where(eq(dailySubscriberMetrics.id, existing[0].id));
  } else {
    // Insert new record
    await db.insert(dailySubscriberMetrics).values({
      date,
      newSubscribers: metrics.newSubscribers,
      unsubscribed: metrics.unsubscribed,
      netGrowth: metrics.netGrowth,
      totalActive: metrics.totalActive,
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Get all campaigns that had email sends on a specific date
 */
async function getCampaignsWithSendsOnDate(
  db: ReturnType<typeof drizzle>,
  date: string,
): Promise<number[]> {
  const startOfDay = getStartOfDay(date);
  const endOfDay = getEndOfDay(date);

  const result = await db
    .selectDistinct({campaignId: emailSends.campaignId})
    .from(emailSends)
    .where(
      and(
        sql`${emailSends.campaignId} IS NOT NULL`,
        gte(emailSends.sentAt, startOfDay),
        lt(emailSends.sentAt, endOfDay),
      ),
    );

  return result
    .map((r) => r.campaignId)
    .filter((id): id is number => id !== null);
}

/**
 * Aggregate all daily metrics for a specific date
 *
 * This function aggregates:
 * - Email metrics per campaign (sent, delivered, opened, clicked, bounced, unsubscribed)
 * - Subscriber metrics (new, unsubscribed, net growth, total active)
 *
 * Handles re-aggregation gracefully by upserting records.
 *
 * @param d1Database - The D1 database instance
 * @param date - The date to aggregate (Date object or YYYY-MM-DD string)
 * @returns Aggregated metrics
 */
export async function aggregateDailyMetrics(
  d1Database: D1Database,
  date: Date | string,
): Promise<DailyMetricsResult> {
  const db = drizzle(d1Database);
  const dateStr = typeof date === 'string' ? date : formatDate(date);

  console.log(`[Analytics] Starting aggregation for ${dateStr}`);

  // Get all campaigns that had sends on this date
  const campaignIds = await getCampaignsWithSendsOnDate(db, dateStr);
  console.log(
    `[Analytics] Found ${campaignIds.length} campaigns with sends on ${dateStr}`,
  );

  // Aggregate email metrics for each campaign
  const emailMetricsList: DailyMetricsResult['emailMetrics'] = [];

  for (const campaignId of campaignIds) {
    const metrics = await aggregateEmailMetricsForCampaign(
      db,
      dateStr,
      campaignId,
    );
    await upsertDailyEmailMetrics(db, dateStr, campaignId, metrics);
    emailMetricsList.push({campaignId, ...metrics});
    console.log(
      `[Analytics] Campaign ${campaignId}: sent=${metrics.sent}, delivered=${metrics.delivered}, opened=${metrics.opened}, clicked=${metrics.clicked}`,
    );
  }

  // Also aggregate overall metrics (all campaigns combined, campaignId = null)
  const overallMetrics = await aggregateEmailMetricsForCampaign(
    db,
    dateStr,
    null,
  );
  await upsertDailyEmailMetrics(db, dateStr, null, overallMetrics);
  emailMetricsList.push({campaignId: null, ...overallMetrics});
  console.log(
    `[Analytics] Overall: sent=${overallMetrics.sent}, delivered=${overallMetrics.delivered}, opened=${overallMetrics.opened}`,
  );

  // Aggregate subscriber metrics
  const subscriberMetrics = await aggregateSubscriberMetrics(db, dateStr);
  await upsertDailySubscriberMetrics(db, dateStr, subscriberMetrics);
  console.log(
    `[Analytics] Subscribers: new=${subscriberMetrics.newSubscribers}, unsubscribed=${subscriberMetrics.unsubscribed}, netGrowth=${subscriberMetrics.netGrowth}, totalActive=${subscriberMetrics.totalActive}`,
  );

  console.log(`[Analytics] Aggregation complete for ${dateStr}`);

  return {
    date: dateStr,
    emailMetrics: emailMetricsList,
    subscriberMetrics,
  };
}

/**
 * Get the previous day's date
 */
export function getPreviousDay(date: Date = new Date()): Date {
  const previousDay = new Date(date);
  previousDay.setDate(previousDay.getDate() - 1);
  return previousDay;
}
