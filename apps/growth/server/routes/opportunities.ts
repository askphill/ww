import {Hono} from 'hono';
import {zValidator} from '@hono/zod-validator';
import {z} from 'zod';
import {createDb} from '../db';
import {opportunities, opportunityInsights, gscQueries} from '../db/schema';
import {analyzeOpportunities} from '../analyzers/opportunities';
import {authMiddleware} from '../middleware/auth';
import {desc, eq, sql} from 'drizzle-orm';
import type {AppVariables, Env} from '../index';
import {fetchWebsiteContent} from '../services/website';
import {
  analyzeOpportunitiesWithAI,
  generatePlanForInsight,
  generateBlogPostForInsight,
  type GscQueryData,
} from '../services/gemini';

const opportunitiesRoutes = new Hono<{
  Bindings: Env;
  Variables: AppVariables;
}>();

// All opportunities routes require authentication
opportunitiesRoutes.use('*', authMiddleware);

// ============ AI Insights Endpoints ============
// NOTE: These must come BEFORE /:id routes to avoid "insights" being matched as an ID

// Get all insights
opportunitiesRoutes.get('/insights', async (c) => {
  const db = createDb(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '50');

  const data = await db
    .select()
    .from(opportunityInsights)
    .orderBy(desc(opportunityInsights.potentialImpact))
    .limit(limit);

  // Parse JSON fields
  const insights = data.map((insight) => ({
    ...insight,
    relatedQueries: insight.relatedQueries
      ? JSON.parse(insight.relatedQueries)
      : [],
    matchingExistingContent: insight.matchingExistingContent
      ? JSON.parse(insight.matchingExistingContent)
      : [],
  }));

  return c.json({insights});
});

// Generate new AI insights
opportunitiesRoutes.post('/insights/generate', async (c) => {
  const db = createDb(c.env.DB);

  // 1. Fetch GSC query data from database
  const gscData = (await db
    .select({
      query: gscQueries.query,
      impressions: sql<number>`SUM(${gscQueries.impressions})`,
      clicks: sql<number>`SUM(${gscQueries.clicks})`,
      position: sql<number>`AVG(${gscQueries.position})`,
      ctr: sql<number>`AVG(${gscQueries.ctr})`,
    })
    .from(gscQueries)
    .where(sql`${gscQueries.date} >= date('now', '-30 days')`)
    .groupBy(gscQueries.query)
    .orderBy(desc(sql`SUM(${gscQueries.impressions})`))
    .limit(100)) as GscQueryData[];

  if (gscData.length === 0) {
    return c.json(
      {error: 'No GSC data available. Please sync GSC data first.'},
      400,
    );
  }

  // 2. Fetch website content
  const websiteContent = await fetchWebsiteContent();

  // 3. Prepare content for AI
  const contentSummary = {
    products: websiteContent.products.map((p) => ({
      title: p.title,
      handle: p.handle,
      description: p.description,
    })),
    pages: websiteContent.pages.map((p) => ({
      title: p.title,
      type: p.type,
      content: p.textContent.slice(0, 500),
    })),
  };

  // 4. Call Gemini AI for analysis
  try {
    const generatedInsights = await analyzeOpportunitiesWithAI(
      c.env.GEMINI_API_KEY,
      gscData,
      contentSummary,
    );

    // 5. Store insights in database
    let created = 0;
    for (const insight of generatedInsights) {
      try {
        await db.insert(opportunityInsights).values({
          insightType: insight.insightType,
          title: insight.title,
          description: insight.description,
          relatedQueries: JSON.stringify(insight.relatedQueries),
          potentialImpact: insight.potentialImpact,
          recommendedAction: insight.recommendedAction,
          matchingExistingContent: insight.matchingExistingContent
            ? JSON.stringify(insight.matchingExistingContent)
            : null,
        });
        created++;
      } catch (error) {
        console.error('Error inserting insight:', error);
      }
    }

    return c.json({
      success: true,
      created,
      totalGenerated: generatedInsights.length,
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate insights';
    return c.json({error: message}, 500);
  }
});

// Generate plan for a specific insight
opportunitiesRoutes.post('/insights/:id/plan', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  // Get the insight
  const [insight] = await db
    .select()
    .from(opportunityInsights)
    .where(eq(opportunityInsights.id, id))
    .limit(1);

  if (!insight) {
    return c.json({error: 'Insight not found'}, 404);
  }

  // Fetch website content
  const websiteContent = await fetchWebsiteContent();

  const contentSummary = {
    products: websiteContent.products.map((p) => ({
      title: p.title,
      handle: p.handle,
      description: p.description,
    })),
    pages: websiteContent.pages.map((p) => ({
      title: p.title,
      type: p.type,
      content: p.textContent.slice(0, 500),
    })),
  };

  try {
    const plan = await generatePlanForInsight(
      c.env.GEMINI_API_KEY,
      {
        insightType: insight.insightType,
        title: insight.title,
        description: insight.description,
        relatedQueries: insight.relatedQueries
          ? JSON.parse(insight.relatedQueries)
          : [],
        potentialImpact: insight.potentialImpact || 0,
      },
      contentSummary,
    );

    // Save the plan
    await db
      .update(opportunityInsights)
      .set({
        plan,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(opportunityInsights.id, id));

    return c.json({success: true, plan});
  } catch (error) {
    console.error('Error generating plan:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate plan';
    return c.json({error: message}, 500);
  }
});

// Generate blog post for a specific insight
opportunitiesRoutes.post('/insights/:id/blog-post', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  // Get the insight
  const [insight] = await db
    .select()
    .from(opportunityInsights)
    .where(eq(opportunityInsights.id, id))
    .limit(1);

  if (!insight) {
    return c.json({error: 'Insight not found'}, 404);
  }

  // Fetch website content for product references
  const websiteContent = await fetchWebsiteContent();

  const products = websiteContent.products.map((p) => ({
    title: p.title,
    handle: p.handle,
    description: p.description,
  }));

  try {
    const blogPost = await generateBlogPostForInsight(
      c.env.GEMINI_API_KEY,
      {
        title: insight.title,
        description: insight.description,
        relatedQueries: insight.relatedQueries
          ? JSON.parse(insight.relatedQueries)
          : [],
      },
      products,
    );

    // Save the blog post
    await db
      .update(opportunityInsights)
      .set({
        blogPost,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(opportunityInsights.id, id));

    return c.json({success: true, blogPost});
  } catch (error) {
    console.error('Error generating blog post:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to generate blog post';
    return c.json({error: message}, 500);
  }
});

// Delete insight
opportunitiesRoutes.delete('/insights/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  await db.delete(opportunityInsights).where(eq(opportunityInsights.id, id));

  return c.json({success: true});
});

// ============ Opportunities Endpoints ============

// Get all opportunities
opportunitiesRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const status = c.req.query('status');
  const limit = parseInt(c.req.query('limit') || '50');

  let query = db.select().from(opportunities);

  if (status) {
    query = query.where(eq(opportunities.status, status)) as typeof query;
  }

  const data = await query
    .orderBy(desc(opportunities.opportunityScore))
    .limit(limit);

  return c.json({opportunities: data});
});

// Analyze opportunities
opportunitiesRoutes.post(
  '/analyze',
  zValidator(
    'json',
    z.object({
      minImpressions: z.number().min(0).default(1),
      maxPosition: z.number().min(1).max(100).default(50),
    }),
  ),
  async (c) => {
    const options = c.req.valid('json');
    const db = createDb(c.env.DB);

    const created = await analyzeOpportunities(db, options);

    return c.json({success: true, created});
  },
);

// Get single opportunity - MUST be after /insights and /analyze routes
opportunitiesRoutes.get('/:id', async (c) => {
  const db = createDb(c.env.DB);
  const id = parseInt(c.req.param('id'));

  const [opportunity] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!opportunity) {
    return c.json({error: 'Opportunity not found'}, 404);
  }

  return c.json({opportunity});
});

// Update opportunity status
opportunitiesRoutes.patch(
  '/:id',
  zValidator(
    'json',
    z.object({
      status: z.enum(['identified', 'in_progress', 'completed', 'skipped']),
    }),
  ),
  async (c) => {
    const db = createDb(c.env.DB);
    const id = parseInt(c.req.param('id'));
    const {status} = c.req.valid('json');

    await db
      .update(opportunities)
      .set({status})
      .where(eq(opportunities.id, id));

    return c.json({success: true});
  },
);

export {opportunitiesRoutes};
