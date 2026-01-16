import {Hono} from 'hono';
import {zValidator} from '@hono/zod-validator';
import {z} from 'zod';
import {createDb} from '../db';
import {gscQueries} from '../db/schema';
import {fetchGscQueries} from '../services/gsc';
import {authMiddleware} from '../middleware/auth';
import {desc, sql} from 'drizzle-orm';
import type {Env} from '../index';

const gscRoutes = new Hono<{Bindings: Env}>();

// All GSC routes require authentication
gscRoutes.use('*', authMiddleware);

// Get GSC data summary
gscRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);

  // Get aggregated data for last 30 days
  const data = await db
    .select({
      date: gscQueries.date,
      totalClicks: sql<number>`SUM(${gscQueries.clicks})`,
      totalImpressions: sql<number>`SUM(${gscQueries.impressions})`,
      avgPosition: sql<number>`AVG(${gscQueries.position})`,
    })
    .from(gscQueries)
    .where(sql`${gscQueries.date} >= date('now', '-30 days')`)
    .groupBy(gscQueries.date)
    .orderBy(desc(gscQueries.date));

  // Calculate totals
  const totals = {
    clicks: data.reduce((sum, d) => sum + (d.totalClicks || 0), 0),
    impressions: data.reduce((sum, d) => sum + (d.totalImpressions || 0), 0),
    avgPosition:
      data.length > 0
        ? data.reduce((sum, d) => sum + (d.avgPosition || 0), 0) / data.length
        : 0,
  };

  return c.json({
    daily: data,
    totals,
  });
});

// Get top queries
gscRoutes.get('/queries', async (c) => {
  const db = createDb(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '50');

  const data = await db
    .select({
      query: gscQueries.query,
      totalClicks: sql<number>`SUM(${gscQueries.clicks})`,
      totalImpressions: sql<number>`SUM(${gscQueries.impressions})`,
      avgPosition: sql<number>`AVG(${gscQueries.position})`,
      avgCtr: sql<number>`AVG(${gscQueries.ctr})`,
    })
    .from(gscQueries)
    .where(sql`${gscQueries.date} >= date('now', '-30 days')`)
    .groupBy(gscQueries.query)
    .orderBy(desc(sql`SUM(${gscQueries.impressions})`))
    .limit(limit);

  return c.json({queries: data});
});

// Sync GSC data
gscRoutes.post(
  '/sync',
  zValidator(
    'json',
    z.object({
      days: z.number().min(1).max(90).default(30),
      country: z.string().default('all'),
    }),
  ),
  async (c) => {
    const {days, country} = c.req.valid('json');

    const credentials = {
      clientId: c.env.GSC_CLIENT_ID,
      clientSecret: c.env.GSC_CLIENT_SECRET,
      refreshToken: c.env.GSC_REFRESH_TOKEN,
      siteUrl: c.env.GSC_SITE_URL,
    };

    // Fetch data from GSC
    const queries = await fetchGscQueries(credentials, days, country);

    if (queries.length === 0) {
      return c.json({success: true, imported: 0});
    }

    const db = createDb(c.env.DB);

    // Upsert data (insert or replace)
    let imported = 0;
    for (const query of queries) {
      try {
        await db
          .insert(gscQueries)
          .values({
            query: query.query,
            country: query.country,
            clicks: query.clicks,
            impressions: query.impressions,
            ctr: query.ctr,
            position: query.position,
            date: query.date,
          })
          .onConflictDoUpdate({
            target: [gscQueries.query, gscQueries.country, gscQueries.date],
            set: {
              clicks: query.clicks,
              impressions: query.impressions,
              ctr: query.ctr,
              position: query.position,
            },
          });
        imported++;
      } catch {
        // Skip duplicates or errors
        continue;
      }
    }

    return c.json({success: true, imported});
  },
);

export {gscRoutes};
