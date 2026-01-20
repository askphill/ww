# Wakey Website (Hydrogen Storefront)

> See root `CLAUDE.md` for monorepo overview, shared packages, and design system.

## Overview

- **Production**: https://www.wakey.care
- **Shopify Store**: wakeycare.myshopify.com
- **Framework**: Shopify Hydrogen 2025.7.0 (React Router 7.9.2)
- **Runtime**: Shopify Oxygen (Cloudflare workerd-based)
- **Changelog**: https://github.com/Shopify/hydrogen/blob/main/packages/hydrogen/CHANGELOG.md

---

## Design System First (STRICT RULE)

**ALWAYS use the shared design system from `@wakey/tailwind-config`.** This project uses Tailwind CSS v4 with a custom theme. Consistency is critical.

### NEVER Use Arbitrary Values

```tsx
// WRONG - Arbitrary values
<h1 className="text-[32px]">        // Use text-h1, text-h2, etc.
<p className="text-sm">             // Use text-paragraph, text-small, etc.
<div className="p-[20px]">          // Use p-5 (standard spacing)
<div className="bg-[#ff6600]">      // Add to theme first
<div className="rounded-[12px]">    // Use rounded-card

// CORRECT - Design system utilities
<h1 className="text-h1">
<p className="text-paragraph">
<div className="p-5">
<div className="bg-softorange">
<div className="rounded-card">
```

### Type Scale (ONLY Use These)

| Utility           | Use for              |
| ----------------- | -------------------- |
| `text-display`    | Hero headlines       |
| `text-h1`         | Page titles          |
| `text-h2`         | Section headings     |
| `text-h3`         | Subsection headings  |
| `text-s1`         | Large UI text        |
| `text-s2`         | Medium UI text       |
| `text-paragraph`  | Body text            |
| `text-body-small` | Secondary body text  |
| `text-small`      | Captions, fine print |
| `text-label`      | Form labels, buttons |

**Never use `text-sm`, `text-lg`, `text-xl`, `text-base`, etc.**

### Colors (Theme Only)

`sand`, `softorange`, `ocher`, `skyblue`, `black`, `white`, `text`, `blue`

### Fonts

`font-display` (Founders), `font-body` (ITC)

### Custom Utilities

`rounded-card`, `max-w-section`, `scrollbar-hide`, `blur-bg`, `hover-scale`

> For complete design system reference, see root `CLAUDE.md`

---

## Directory Structure

```
apps/website/
├── app/
│   ├── routes/          # File-based routing (React Router 7)
│   ├── components/      # Website-specific components
│   │   └── sections/    # MDX section components
│   ├── content/         # MDX content files
│   ├── lib/             # Utilities and helpers
│   ├── graphql/         # Storefront API queries
│   ├── styles/          # CSS including Tailwind
│   ├── root.tsx         # App shell
│   └── routes.ts        # Route configuration
├── server.ts            # Oxygen server entry point
├── public/fonts/        # Font files
└── package.json
```

---

## Development Commands

```bash
# From this directory (apps/website/)
pnpm dev                  # Start dev server
pnpm build                # Build for production
pnpm codegen              # Generate Storefront API types
pnpm typecheck            # Type check

# From monorepo root
pnpm dev:website          # Start only website
```

---

## React Router 7 (Not Remix)

As of Hydrogen 2025.5.0, the framework uses React Router 7 directly (not Remix).

### Imports

```ts
// OLD (Remix) - Don't use
import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';

// NEW (React Router 7) - Use this
import {data} from 'react-router';
import {useLoaderData} from 'react-router';
```

### Route Pattern

```ts
// app/routes/my-page.tsx
import type { Route } from './+types/my-page';

export async function loader({ context }: Route.LoaderArgs) {
  return { data: 'hello' };
}

export default function MyPage({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.data}</div>;
}
```

---

## Content Architecture (MDX)

This app uses MDX for content-as-code.

### Structure

- Content files: `app/content/*.mdx`
- Section components: `app/components/sections/`
- API routes for data: `app/routes/api.*.tsx`

### Before Creating New Sections

**Always review existing sections first**:

1. Read `app/components/sections/` to see existing patterns
2. Check `TextMedia.tsx`, `IntroSection.tsx`, `Hero.tsx`, `FeaturedProduct.tsx`
3. Follow the same patterns for consistency

### Example MDX

```mdx
import {Hero, TextSection} from '~/components/sections';

<Hero
  backgroundImage="https://cdn.shopify.com/..."
  productHandle="deodorant"
  tooltipPosition={{top: '33%', left: '19%'}}
/>

<TextSection># Morning *essentials*</TextSection>
```

### Data Fetching in Components

Use `useFetcher` with API routes:

```tsx
const fetcher = useFetcher();

useEffect(() => {
  if (fetcher.state === 'idle' && !fetcher.data) {
    fetcher.load(`/api/product/${handle}`);
  }
}, [handle, fetcher]);

const product = fetcher.data?.product;
```

---

## Shopify Storefront API

### Query Pattern

```ts
const {storefront} = context;
const {product} = await storefront.query(PRODUCT_QUERY, {
  variables: {handle: 'my-product'},
});
```

### Metafields Used

| Namespace   | Key                     | Type                | Description                              |
| ----------- | ----------------------- | ------------------- | ---------------------------------------- |
| `ask_phill` | `subtitle`              | Single line text    | Product subtitle (e.g., "Mighty Citrus") |
| `ask_phill` | `review_average_rating` | Number              | Star rating (e.g., 4.8)                  |
| `askphill`  | `reviews`               | List of metaobjects | Array of review IDs (count for total)    |

**Important**: Metafields need **Storefront API access enabled** in Shopify Admin:
Settings → Custom data → Metafield definitions → Enable Storefront access

### Querying Metafields

```graphql
product(handle: $handle) {
  subtitle: metafield(namespace: "ask_phill", key: "subtitle") {
    value
  }
  reviewRating: metafield(namespace: "ask_phill", key: "review_average_rating") {
    value
  }
  reviews: metafield(namespace: "askphill", key: "reviews") {
    value
  }
}
```

---

## Content Upload

**Always upload content to Shopify** using the `/shopify-admin` skill. Never use external hosting.

```bash
# Upload an image
bash .claude/skills/shopify-admin/scripts/upload-file.sh ./image.jpg "Alt text"

# Upload a video
bash .claude/skills/shopify-admin/scripts/upload-file.sh ./video.mp4 "Description"

# Get CDN URL
bash .claude/skills/shopify-admin/scripts/fetch-files.sh --type IMAGE --limit 5
```

---

## Environment Variables

Configured in `.env`:

- `SESSION_SECRET` - Session encryption
- `PUBLIC_STOREFRONT_API_TOKEN` - Storefront API access
- `PUBLIC_STORE_DOMAIN` - Your Shopify store domain
- `STORE` - Shopify store name (for Admin API)
- `ADMIN_API_TOKEN` - Shopify Admin API access token

---

## Tailwind Configuration

Website-specific config is in `app/styles/tailwind.css`:

```css
@import 'tailwindcss';
@import '../../../../packages/tailwind-config/theme.css';

/* Tell Tailwind to scan packages for classes */
@source "../../../../packages/ui/src";
```

Add app-specific values (after the theme import):

```css
@theme {
  --color-app-specific: #123456;
}
```

---

## Oxygen (Hosting)

- Cloudflare `workerd`-based JavaScript runtime
- Supports: Fetch, Cache, Streams, Web Crypto APIs
- Deploy via GitHub Actions (`.github/workflows/oxygen-deployment-*.yml`)
- Free on paid Shopify plans

---

## Setup

After cloning the monorepo:

1. Install dependencies from root: `pnpm install`
2. Link Shopify store:
   ```bash
   npx shopify hydrogen link
   ```
3. Pull environment variables:
   ```bash
   npx shopify hydrogen env pull
   ```
4. Start dev server: `pnpm dev`
