import type {Database} from '../db';
import {gscQueries, opportunities} from '../db/schema';
import {sql, desc} from 'drizzle-orm';
import {clusterKeywords} from './keywords';

interface GscQueryRow {
  query: string;
  totalImpressions: number;
  totalClicks: number;
  avgPosition: number;
}

export interface AnalyzeOptions {
  minImpressions: number;
  maxPosition: number;
}

export async function analyzeOpportunities(
  db: Database,
  options: AnalyzeOptions,
): Promise<number> {
  // Get aggregated query data from last 30 days
  const queries = (await db
    .select({
      query: gscQueries.query,
      totalImpressions: sql<number>`SUM(${gscQueries.impressions})`,
      totalClicks: sql<number>`SUM(${gscQueries.clicks})`,
      avgPosition: sql<number>`AVG(${gscQueries.position})`,
    })
    .from(gscQueries)
    .where(sql`${gscQueries.date} >= date('now', '-30 days')`)
    .groupBy(gscQueries.query)
    .having(
      sql`SUM(${gscQueries.impressions}) >= ${options.minImpressions} AND AVG(${gscQueries.position}) <= ${options.maxPosition}`,
    )
    .orderBy(desc(sql`SUM(${gscQueries.impressions})`))) as GscQueryRow[];

  if (queries.length === 0) {
    return 0;
  }

  // Cluster similar keywords
  const clusters = clusterKeywords(queries.map((q) => q.query));

  // Analyze each cluster for opportunities
  let created = 0;

  for (const cluster of clusters) {
    // Find the best query in the cluster (highest impressions)
    const clusterQueries = queries.filter((q) =>
      cluster.keywords.includes(q.query),
    );
    const primaryQuery = clusterQueries.reduce((best, current) =>
      current.totalImpressions > best.totalImpressions ? current : best,
    );

    // Sum up all impressions and clicks in the cluster
    const totalImpressions = clusterQueries.reduce(
      (sum, q) => sum + q.totalImpressions,
      0,
    );
    const totalClicks = clusterQueries.reduce(
      (sum, q) => sum + q.totalClicks,
      0,
    );
    const avgPosition =
      clusterQueries.reduce((sum, q) => sum + q.avgPosition, 0) /
      clusterQueries.length;

    // Calculate opportunity score
    const score = calculateOpportunityScore(totalImpressions, avgPosition);

    try {
      await db
        .insert(opportunities)
        .values({
          keyword: primaryQuery.query,
          impressions30d: totalImpressions,
          clicks30d: totalClicks,
          currentPosition: avgPosition,
          opportunityScore: score,
          status: 'identified',
        })
        .onConflictDoNothing();
      created++;
    } catch {
      continue;
    }
  }

  return created;
}

function calculateOpportunityScore(
  impressions: number,
  position: number,
): number {
  // Base score from impressions (logarithmic scale)
  const impressionScore = Math.log10(impressions + 1) * 10;

  // Position bonus (better position = higher score, but we want positions 5-15)
  let positionScore = 0;
  if (position >= 5 && position <= 15) {
    // Sweet spot: high impressions but not #1 yet
    positionScore = 30;
  } else if (position > 15 && position <= 20) {
    // Still has potential
    positionScore = 20;
  } else if (position < 5) {
    // Already ranking well, less opportunity
    positionScore = 10;
  }

  // CTR potential (lower positions have more room to improve CTR)
  const ctrPotential = position > 3 ? 10 : 0;

  return Math.min(100, impressionScore + positionScore + ctrPotential);
}
