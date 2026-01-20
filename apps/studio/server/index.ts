import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {logger} from 'hono/logger';
import {authRoutes} from './routes/auth';
import {gscRoutes} from './routes/gsc';
import {opportunitiesRoutes} from './routes/opportunities';
import {trackingRoutes, checkAllKeywordPositions} from './routes/tracking';
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
    console.log('[Cron] Keyword ranking check triggered at:', event.cron);

    ctx.waitUntil(
      (async () => {
        try {
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
  },
};
