# Wakey Studio (Admin Dashboard)

> See root `CLAUDE.md` for monorepo overview and shared packages.

## Overview

- **Production**: https://studio.wakey.care
- **Purpose**: Internal admin dashboard for marketing analytics and SEO
- **Runtime**: Cloudflare Workers

---

## Tech Stack

| Layer    | Technology                             |
| -------- | -------------------------------------- |
| Frontend | React 18, React Router 7, TanStack Query |
| Backend  | Hono (TypeScript HTTP framework)       |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM   |
| Runtime  | Cloudflare Workers (wrangler)          |
| Styling  | Tailwind CSS v4                        |
| Build    | Vite 6                                 |

---

## Directory Structure

```
apps/studio/
├── client/                 # React frontend
│   ├── pages/              # Route pages
│   │   ├── Login.tsx
│   │   ├── Klaviyo.tsx
│   │   ├── Meta.tsx
│   │   └── seo/
│   │       ├── Tracking.tsx
│   │       └── Opportunities.tsx
│   ├── components/
│   │   └── layout/         # DashboardLayout, Header, Sidebar
│   ├── hooks/              # useAuth, useDarkMode
│   ├── lib/                # api.ts, utils.ts
│   ├── App.tsx             # Client router
│   ├── main.tsx            # Entry point
│   └── globals.css         # Tailwind config
│
├── server/                 # Hono backend
│   ├── routes/             # API endpoints
│   │   ├── auth.ts         # Authentication
│   │   ├── gsc.ts          # Google Search Console
│   │   ├── opportunities.ts
│   │   └── tracking.ts
│   ├── services/           # External integrations
│   │   ├── gemini.ts       # Gemini AI
│   │   ├── gsc.ts          # Google Search Console API
│   │   ├── dataforseo.ts   # DataForSEO API
│   │   ├── resend.ts       # Email service
│   │   └── website.ts      # Website data fetching
│   ├── analyzers/          # Business logic
│   │   ├── keywords.ts
│   │   └── opportunities.ts
│   ├── db/
│   │   ├── schema.ts       # Drizzle schema
│   │   └── index.ts        # DB connection
│   ├── middleware/
│   │   └── auth.ts         # Auth middleware
│   └── index.ts            # Hono app entry
│
├── drizzle/
│   └── migrations/         # D1 migrations
├── drizzle.config.ts
├── wrangler.jsonc          # Cloudflare config
├── vite.config.ts
└── package.json
```

---

## Development Commands

```bash
# From this directory (apps/studio/)
pnpm dev                    # Start client + server concurrently
pnpm dev:client             # Start Vite dev server only
pnpm dev:server             # Start wrangler dev only
pnpm build                  # Build for production (dry-run)
pnpm deploy                 # Build and deploy to Cloudflare
pnpm typecheck              # Type check

# Database
pnpm db:generate            # Generate migrations from schema
pnpm db:migrate             # Apply migrations locally
pnpm db:migrate:prod        # Apply migrations to production
```

---

## API Routes

All API routes are prefixed with `/api/`:

| Route                     | Description                    |
| ------------------------- | ------------------------------ |
| `/api/auth/*`             | Authentication (login, logout) |
| `/api/gsc/*`              | Google Search Console data     |
| `/api/opportunities/*`    | SEO opportunities analysis     |
| `/api/tracking/*`         | Keyword tracking               |
| `/api/health`             | Health check                   |

### Authentication

Routes are protected. Use the `authMiddleware` from `server/middleware/auth.ts`:

```ts
import {authMiddleware} from '../middleware/auth';

const app = new Hono();
app.use('*', authMiddleware);
```

---

## Frontend Routes

| Path                 | Page           | Description                |
| -------------------- | -------------- | -------------------------- |
| `/login`             | Login          | Authentication (public)    |
| `/seo/tracking`      | Tracking       | Keyword position tracking  |
| `/seo/opportunities` | Opportunities  | SEO improvement suggestions |
| `/klaviyo`           | Klaviyo        | Email marketing stats      |
| `/meta`              | Meta           | Meta ads integration       |

All routes except `/login` require authentication via `ProtectedRoute`.

---

## External Services

| Service          | Purpose                        | Config Key            |
| ---------------- | ------------------------------ | --------------------- |
| Google Search Console | Search analytics          | `GSC_*`               |
| Gemini AI        | Content analysis               | `GEMINI_API_KEY`      |
| DataForSEO       | Keyword research               | `DATAFORSEO_*`        |
| Resend           | Email notifications            | `RESEND_API_KEY`      |

---

## Environment Variables

Set in Cloudflare dashboard or `.dev.vars` for local development:

```bash
# Authentication
AUTH_SECRET=

# Google Search Console
GSC_CLIENT_ID=
GSC_CLIENT_SECRET=
GSC_REFRESH_TOKEN=
GSC_SITE_URL=

# AI
GEMINI_API_KEY=

# Email
RESEND_API_KEY=

# SEO Data
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
```

---

## Database (Drizzle + D1)

### Schema Location

`server/db/schema.ts`

### Making Schema Changes

1. Edit `server/db/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply locally: `pnpm db:migrate`
4. Test locally
5. Apply to production: `pnpm db:migrate:prod`

### Querying

```ts
import {db} from '../db';
import {users} from '../db/schema';

const allUsers = await db(c.env.DB).select().from(users);
```

---

## Styling

Studio has its own Tailwind config in `client/globals.css` (not shared with website).

### Color System

Uses semantic color tokens that support light/dark mode:

- `bg-background`, `text-foreground` - Base colors
- `bg-card`, `text-card-foreground` - Card surfaces
- `bg-primary`, `text-primary-foreground` - Primary actions
- `bg-muted`, `text-muted-foreground` - Subdued elements
- `bg-destructive` - Error states

### Dark Mode

Toggle via `useDarkMode` hook. Classes are applied to document root:

```tsx
const {isDark, toggle} = useDarkMode();
```

---

## Adding a New Page

1. Create page component in `client/pages/`
2. Add route in `client/App.tsx` inside `ProtectedRoute`
3. Add sidebar link in `client/components/layout/Sidebar.tsx`

---

## Adding a New API Route

1. Create route file in `server/routes/`
2. Register in `server/index.ts`:
   ```ts
   import {myRoutes} from './routes/my-route';
   app.route('/api/my-route', myRoutes);
   ```
3. Add auth middleware if needed

---

## Deployment

```bash
pnpm deploy  # Builds client + deploys to Cloudflare Workers
```

Deployed to `studio.wakey.care` via custom domain in `wrangler.jsonc`.
