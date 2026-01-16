import {Hono} from 'hono';
import {cors} from 'hono/cors';
import {logger} from 'hono/logger';
import {authRoutes} from './routes/auth';
import {gscRoutes} from './routes/gsc';
import {opportunitiesRoutes} from './routes/opportunities';
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
}

export interface AppVariables {
  user: AuthUser;
}

const app = new Hono<{Bindings: Env; Variables: AppVariables}>();

// Middleware
app.use('*', logger());
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

// Health check
app.get('/api/health', (c) => {
  return c.json({status: 'ok', timestamp: new Date().toISOString()});
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

export default app;
