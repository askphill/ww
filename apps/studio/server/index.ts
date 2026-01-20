import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {logger} from 'hono/logger';
import {authRoutes} from './routes/auth';
import {gscRoutes} from './routes/gsc';
import {opportunitiesRoutes} from './routes/opportunities';
import {trackingRoutes, checkAllKeywordPositions} from './routes/tracking';
import {emailRoutes} from './routes/email';
import {processScheduledCampaigns} from './services/scheduledCampaigns';
import type {AuthUser} from './middleware/auth';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  GSC_CLIENT_ID: string;
  GSC_CLIENT_SECRET: string;
  GSC_REFRESH_TOKEN: string;
  GSC_SITE_URL: string;
  GEMINI_API_KEY: string;
  RESEND_API_KEY: string;
  AUTH_SECRET: string;
  VITE_APP_URL: string;
  DATAFORSEO_LOGIN: string;
  DATAFORSEO_PASSWORD: string;
  SHOPIFY_ADMIN_API_TOKEN: string;
  SHOPIFY_STORE_DOMAIN: string;
  SHOPIFY_WEBHOOK_SECRET: string;
  RESEND_WEBHOOK_SECRET: string;
}

export interface AppVariables {
  user: AuthUser;
}

const app = new Hono<{Bindings: Env; Variables: AppVariables}>();

// Global error handler - ensure all errors return JSON
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json(
    {
      error: err.message || 'Internal Server Error',
    },
    500,
  );
});

// Middleware
app.use('*', logger());

// Prevent search engine indexing
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('X-Robots-Tag', 'noindex, nofollow');
});

app.use(
  '/api/*',
  cors({
    origin: (origin) => origin,
    credentials: true,
  }),
);

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/gsc', gscRoutes);
app.route('/api/opportunities', opportunitiesRoutes);
app.route('/api/tracking', trackingRoutes);
app.route('/api/email', emailRoutes);

// Health check
app.get('/api/health', (c) => {
  return c.json({status: 'ok', timestamp: new Date().toISOString()});
});

// Robots.txt - disallow all crawlers
app.get('/robots.txt', (c) => {
  return c.text('User-agent: *\nDisallow: /');
});

// Serve static assets (React app)
app.get('*', async (c) => {
  // Try to serve static asset
  const response = await c.env.ASSETS.fetch(c.req.raw);

  // If not found, serve index.html for client-side routing
  if (response.status === 404) {
    const indexResponse = await c.env.ASSETS.fetch(
      new Request(new URL('/index.html', c.req.url)),
    );
    return new Response(indexResponse.body, {
      status: 200,
      headers: {
        'content-type': 'text/html',
      },
    });
  }

  return response;
});

export default {
  fetch: app.fetch,
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    console.log('[Cron] Scheduled event triggered:', event.cron);

    // Daily keyword ranking check (0 6 * * *)
    if (event.cron === '0 6 * * *') {
      ctx.waitUntil(
        (async () => {
          try {
            console.log('[Cron] Starting daily keyword ranking check');
            const result = await checkAllKeywordPositions(env);
            if (result.success) {
              console.log(
                `[Cron] Keyword check complete. Checked: ${result.checked}, Stored: ${result.stored}`,
              );
            } else {
              console.error('[Cron] Keyword check failed:', result.error);
            }
          } catch (err) {
            console.error('[Cron] Unexpected error during keyword check:', err);
          }
        })(),
      );
    }

    // Process scheduled campaigns every 5 minutes (*/5 * * * *)
    if (event.cron === '*/5 * * * *') {
      ctx.waitUntil(
        (async () => {
          try {
            console.log('[Cron] Processing scheduled campaigns');
            const result = await processScheduledCampaigns(
              env.DB,
              env.RESEND_API_KEY,
              env.AUTH_SECRET,
            );
            console.log(
              `[Cron] Campaign processing complete. Found: ${result.found}, Processed: ${result.processed}, Failed: ${result.failed}`,
            );
          } catch (err) {
            console.error(
              '[Cron] Unexpected error during campaign processing:',
              err,
            );
          }
        })(),
      );
    }
  },
};
