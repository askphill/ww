import {Hono} from 'hono';
import {zValidator} from '@hono/zod-validator';
import {z} from 'zod';
import {createDb} from '../db';
import {trackedKeywords, keywordPositions, gscQueries} from '../db/schema';
import {checkMultipleKeywordPositions} from '../services/dataforseo';
import {authMiddleware} from '../middleware/auth';
import {desc, eq, sql, like} from 'drizzle-orm';
import type {AppVariables, Env} from '../index';

const trackingRoutes = new Hono<{Bindings: Env; Variables: AppVariables}>();

// All tracking routes require authentication
trackingRoutes.use('*', authMiddleware);

// List all tracked keywords with latest position
trackingRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);

  // Get all tracked keywords
  const keywords = await db
    .select()
    .from(trackedKeywords)
    .orderBy(trackedKeywords.keyword);

  // Get the latest position for each keyword
  const keywordsWithPositions = await Promise.all(
    keywords.map(async (kw) => {
      const latestPosition = await db
        .select()
        .from(keywordPositions)
        .where(eq(keywordPositions.keywordId, kw.id))
        .orderBy(desc(keywordPositions.date))
        .limit(1);

      // Get position from 7 days ago for comparison
      const weekAgoPosition = await db
        .select()
        .from(keywordPositions)
        .where(
          sql`${keywordPositions.keywordId} = ${kw.id} AND ${keywordPositions.date} <= date('now', '-7 days')`,
        )
        .orderBy(desc(keywordPositions.date))
        .limit(1);

      const current = latestPosition[0];
      const weekAgo = weekAgoPosition[0];

      // Calculate change (negative means improvement, positive means worse)
      let change: number | null = null;
      if (current?.position && weekAgo?.position) {
        change = current.position - weekAgo.position;
      }

      return {
        ...kw,
        currentPosition: current?.position ?? null,
        currentUrl: current?.url ?? null,
        lastChecked: current?.date ?? null,
        change,
      };
    }),
  );

  return c.json({keywords: keywordsWithPositions});
});

// Add a keyword to track
trackingRoutes.post(
  '/',
  zValidator(
    'json',
    z.object({
      keyword: z.string().min(1).max(200),
    }),
  ),
  async (c) => {
    const {keyword} = c.req.valid('json');
    const db = createDb(c.env.DB);

    try {
      const result = await db
        .insert(trackedKeywords)
        .values({keyword: keyword.toLowerCase().trim()})
        .returning();

      return c.json({success: true, keyword: result[0]});
    } catch {
      // Likely duplicate keyword
      return c.json({error: 'Keyword already being tracked'}, 400);
    }
  },
);

// Delete a tracked keyword
trackingRoutes.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = createDb(c.env.DB);

  await db.delete(trackedKeywords).where(eq(trackedKeywords.id, id));

  return c.json({success: true});
});

// Get position history for a keyword
trackingRoutes.get('/:id/history', async (c) => {
  const id = parseInt(c.req.param('id'));
  const days = parseInt(c.req.query('days') || '30');
  const db = createDb(c.env.DB);

  const history = await db
    .select({
      position: keywordPositions.position,
      url: keywordPositions.url,
      date: keywordPositions.date,
    })
    .from(keywordPositions)
    .where(
      sql`${keywordPositions.keywordId} = ${id} AND ${keywordPositions.date} >= date('now', '-' || ${days} || ' days')`,
    )
    .orderBy(keywordPositions.date);

  return c.json({history});
});

// Check positions for all tracked keywords (calls DataForSEO)
trackingRoutes.post('/check', async (c) => {
  const db = createDb(c.env.DB);

  // Get all tracked keywords
  const keywords = await db.select().from(trackedKeywords);
  console.log(
    'Checking positions for keywords:',
    keywords.map((k) => k.keyword),
  );

  if (keywords.length === 0) {
    return c.json({success: true, checked: 0});
  }

  const credentials = {
    login: c.env.DATAFORSEO_LOGIN,
    password: c.env.DATAFORSEO_PASSWORD,
  };

  // Check all keywords
  let results;
  try {
    console.log('Calling DataForSEO API...');
    results = await checkMultipleKeywordPositions(
      credentials,
      keywords.map((k) => k.keyword),
    );
    console.log('DataForSEO results:', results);
  } catch (err) {
    console.error('DataForSEO API error:', err);
    return c.json(
      {error: 'Failed to check positions', details: String(err)},
      500,
    );
  }

  // Store results
  const today = new Date().toISOString().split('T')[0];
  let stored = 0;

  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    const result = results[i];

    if (!keyword || !result) continue;

    try {
      // Check if we already have a record for today
      const existing = await db
        .select()
        .from(keywordPositions)
        .where(
          sql`${keywordPositions.keywordId} = ${keyword.id} AND ${keywordPositions.date} = ${today}`,
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(keywordPositions)
          .set({
            position: result.position,
            url: result.url,
          })
          .where(eq(keywordPositions.id, existing[0]!.id));
      } else {
        // Insert new record
        await db.insert(keywordPositions).values({
          keywordId: keyword.id,
          position: result.position,
          url: result.url,
          date: today ?? '',
        });
      }
      stored++;
    } catch (err) {
      console.error(`Failed to store position for ${keyword.keyword}:`, err);
    }
  }

  return c.json({
    success: true,
    checked: keywords.length,
    stored,
    results: results.map((r, i) => ({
      keyword: keywords[i]?.keyword,
      position: r.position,
      url: r.url,
    })),
  });
});

// Search GSC queries for suggestions
trackingRoutes.get('/suggestions', async (c) => {
  const query = c.req.query('q') || '';
  const db = createDb(c.env.DB);

  if (query.length < 2) {
    return c.json({suggestions: []});
  }

  // Search GSC queries that match the search term
  const suggestions = await db
    .select({
      query: gscQueries.query,
      totalImpressions: sql<number>`SUM(${gscQueries.impressions})`,
      avgPosition: sql<number>`AVG(${gscQueries.position})`,
    })
    .from(gscQueries)
    .where(like(gscQueries.query, `%${query}%`))
    .groupBy(gscQueries.query)
    .orderBy(desc(sql`SUM(${gscQueries.impressions})`))
    .limit(10);

  return c.json({suggestions});
});

export {trackingRoutes};
