import type Database from 'better-sqlite3';
import type {AnalyzeOptions, Opportunity} from '../types/index.js';
import {clusterKeywords} from './keywords.js';

interface GscQueryRow {
  query: string;
  total_impressions: number;
  total_clicks: number;
  avg_position: number;
}

interface ProductRow {
  id: string;
  handle: string;
  title: string;
  tags: string;
}

export async function analyzeOpportunities(
  db: Database.Database,
  options: AnalyzeOptions,
): Promise<Opportunity[]> {
  // Get aggregated query data from last 30 days
  const queries = db
    .prepare(
      `
      SELECT
        query,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        AVG(position) as avg_position
      FROM gsc_queries
      WHERE date >= date('now', '-30 days')
      GROUP BY query
      HAVING total_impressions >= ?
        AND avg_position <= ?
      ORDER BY total_impressions DESC
    `,
    )
    .all(options.minImpressions, options.maxPosition) as GscQueryRow[];

  if (queries.length === 0) {
    return [];
  }

  // Get products for matching
  const products = db.prepare('SELECT * FROM products').all() as ProductRow[];

  // Cluster similar keywords
  const clusters = clusterKeywords(queries.map((q) => q.query));

  // Analyze each cluster for opportunities
  const opportunities: Opportunity[] = [];

  for (const cluster of clusters) {
    // Find the best query in the cluster (highest impressions)
    const clusterQueries = queries.filter((q) =>
      cluster.keywords.includes(q.query),
    );
    const primaryQuery = clusterQueries.reduce((best, current) =>
      current.total_impressions > best.total_impressions ? current : best,
    );

    // Sum up all impressions and clicks in the cluster
    const totalImpressions = clusterQueries.reduce(
      (sum, q) => sum + q.total_impressions,
      0,
    );
    const totalClicks = clusterQueries.reduce(
      (sum, q) => sum + q.total_clicks,
      0,
    );
    const avgPosition =
      clusterQueries.reduce((sum, q) => sum + q.avg_position, 0) /
      clusterQueries.length;

    // Match to a product if possible
    const relatedProduct = findRelatedProduct(cluster.keywords, products);

    // Calculate opportunity score
    const score = calculateOpportunityScore(
      totalImpressions,
      avgPosition,
      relatedProduct !== null,
    );

    opportunities.push({
      keyword: primaryQuery.query,
      impressions30d: totalImpressions,
      clicks30d: totalClicks,
      currentPosition: avgPosition,
      relatedProductId: relatedProduct?.id ?? null,
      opportunityScore: score,
      status: 'identified',
    });
  }

  // Sort by opportunity score
  return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

function findRelatedProduct(
  keywords: string[],
  products: ProductRow[],
): ProductRow | null {
  const keywordText = keywords.join(' ').toLowerCase();

  for (const product of products) {
    const productTerms = [
      product.title.toLowerCase(),
      product.handle.toLowerCase(),
      ...(JSON.parse(product.tags) as string[]).map((t: string) =>
        t.toLowerCase(),
      ),
    ];

    // Check if any product term appears in the keywords
    for (const term of productTerms) {
      if (
        keywordText.includes(term) ||
        term.includes(keywordText.split(' ')[0] ?? '')
      ) {
        return product;
      }
    }
  }

  return null;
}

function calculateOpportunityScore(
  impressions: number,
  position: number,
  hasProduct: boolean,
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

  // Product match bonus
  const productBonus = hasProduct ? 15 : 0;

  // CTR potential (lower positions have more room to improve CTR)
  const ctrPotential = position > 3 ? 10 : 0;

  return Math.min(
    100,
    impressionScore + positionScore + productBonus + ctrPotential,
  );
}
