# Project: Wakey - Monorepo

## Domain
- **Production**: https://www.wakey.care (primary domain)
- **Shopify Store**: wakeycare.myshopify.com

## Stack Overview
- **Monorepo**: Turborepo + pnpm workspaces
- **Framework**: Shopify Hydrogen 2025.7.0 (React Router 7.9.2)
- **Runtime**: Shopify Oxygen (Cloudflare workerd-based)
- **Styling**: Tailwind CSS v4.1.6
- **Build**: Vite 6
- **Language**: TypeScript 5.9

---

## Monorepo Structure

```
wakey/
├── apps/
│   └── website/              # Shopify Hydrogen storefront → Oxygen
│
├── packages/
│   ├── ui/                   # Shared React components (@wakey/ui)
│   ├── tailwind-config/      # Shared Tailwind v4 theme (@wakey/tailwind-config)
│   └── hooks/                # Shared React hooks (@wakey/hooks)
│
├── turbo.json                # Turborepo pipeline config
├── pnpm-workspace.yaml       # Workspace definitions
├── package.json              # Root package.json
└── .github/workflows/        # CI/CD
```

### Development Commands
```bash
# From root
pnpm install              # Install all dependencies
pnpm dev                  # Start all apps in dev mode
pnpm dev:website          # Start only the website
pnpm build                # Build all packages and apps
pnpm typecheck            # Type check all packages

# From apps/website/
pnpm dev                  # Start website dev server
pnpm build                # Build for production
pnpm codegen              # Generate Storefront API types
```

### Shared Packages

**`@wakey/ui`** - Design system components:
- `Button` - Primary/secondary/outline variants, supports `icon` prop
- `Stars` - Rating display with half-star support
- `Accordion` - Expandable sections
- `Tooltip` - Positioned tooltips
- `AddedToBagPopup` - Cart notification popup
- `Icons` - SVG icons from [Centralicons](https://centralicons.com/) (BagIcon, AddBagIcon, CheckoutIcon, HamburgerIcon, CrossIcon, etc.)

**`@wakey/hooks`** - React hooks:
- `useContinuousCarousel` - Carousel with physics-based scrolling

**`@wakey/tailwind-config`** - Shared theme:
- Color tokens (sand, softorange, ocher, skyblue)
- Font families (Founders, ITC)
- Type scale utilities (text-h1, text-paragraph, etc.)
- Custom utilities (rounded-card, animations)

### Using Shared Packages
```tsx
// In apps/website/
import {Button, Stars, Accordion} from '@wakey/ui';
import {useContinuousCarousel} from '@wakey/hooks';

// Tailwind theme is imported in tailwind.css:
// @import '../../../../packages/tailwind-config/theme.css';
```

---

## Tailwind CSS v4 (Important Changes)

This project uses **Tailwind v4** which has major differences from v3:

### CSS-First Configuration
- **No `tailwind.config.js`** - Configuration is done in CSS
- Website config: `apps/website/app/styles/tailwind.css`
- Shared theme: `packages/tailwind-config/theme.css`
- Just `@import 'tailwindcss';` - no more `@tailwind base/components/utilities`

### Website Tailwind Setup
```css
/* apps/website/app/styles/tailwind.css */
@import 'tailwindcss';
@import '../../../../packages/tailwind-config/theme.css';

/* Tell Tailwind to scan packages for classes */
@source "../../../../packages/ui/src";
```

### Key Differences from v3
| v3 | v4 |
|----|-----|
| `tailwind.config.js` | `@theme` directive in CSS |
| `@tailwind base;` | `@import 'tailwindcss';` |
| `h-[100px]` (arbitrary) | `h-100` (works directly) |
| `grid-cols-[15]` | `grid-cols-15` |
| Separate PostCSS plugins | Built-in Lightning CSS |
| `autoprefixer` needed | Automatic vendor prefixing |

### New Features in v4
- **Container queries**: `@container` support built-in
- **`not-*` variant**: Style when condition is NOT met
- **P3 colors**: Modern `oklch` color space
- **5x faster builds**: Oxide engine (Rust-based)
- **@property support**: Animate gradients and custom properties

### Vite Plugin
Tailwind is configured via `@tailwindcss/vite` plugin in `apps/website/vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite';
plugins: [tailwindcss(), ...]
```

---

## Shopify Hydrogen & Oxygen

**Changelog**: https://github.com/Shopify/hydrogen/blob/main/packages/hydrogen/CHANGELOG.md

### Hydrogen (Framework)
- React-based headless commerce framework
- Built on **React Router 7** (not Remix anymore as of 2025.5.0)
- Provides Shopify-optimized components and utilities
- Storefront API integration with codegen

### Key Files (Website)
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
└── package.json
```

### Imports Changed (v2025.5.0+)
```ts
// OLD (Remix)
import { json } from '@shopify/remix-oxygen';
import { useLoaderData } from '@remix-run/react';

// NEW (React Router 7)
import { data } from 'react-router';
import { useLoaderData } from 'react-router';
```

### Oxygen (Hosting)
- Cloudflare `workerd`-based JavaScript runtime
- Supports: Fetch, Cache, Streams, Web Crypto APIs
- Deploy via GitHub Actions (`.github/workflows/oxygen-deployment-*.yml`)
- Free on paid Shopify plans (Basic, Shopify, Advanced, Plus)

### Environment Variables
Configured in `.env` (root):
- `SESSION_SECRET` - Session encryption
- `PUBLIC_STOREFRONT_API_TOKEN` - Storefront API access
- `PUBLIC_STORE_DOMAIN` - Your Shopify store domain
- `STORE` - Shopify store name (for Admin API)
- `ADMIN_API_TOKEN` - Shopify Admin API access token

---

## Content Upload (Images/Videos)

**Always upload content to Shopify** using the `/shopify-admin` skill. Never use external hosting or local files for production content.

### Upload Process
```bash
# Upload an image
bash .claude/skills/shopify-admin/scripts/upload-file.sh ./image.jpg "Alt text description"

# Upload a video
bash .claude/skills/shopify-admin/scripts/upload-file.sh ./video.mp4 "Video description"
```

### Get the CDN URL
After upload, query for the file URL:
```bash
bash .claude/skills/shopify-admin/scripts/fetch-files.sh --type IMAGE --limit 5
```

### Use in MDX/Components
```mdx
![Alt text](https://cdn.shopify.com/s/files/1/0609/8747/4152/files/your-image.jpg)
```

Supported formats: jpg, png, gif, webp, svg, mp4, mov, webm, pdf

---

## MCP Servers (Model Context Protocol)

Configured in `.mcp.json`:

### Chrome DevTools MCP
- **Purpose**: Browser automation, debugging, performance analysis
- **Capabilities**: Inspect live Chrome, run DevTools commands, analyze network
- **Usage**: Ask Claude to inspect the running app, debug issues, check performance

### Figma MCP
- **Purpose**: Design-to-code workflow
- **Requires**: Figma Desktop app running
- **URL**: `http://127.0.0.1:3845/sse`
- **Usage**:
  1. Select a frame in Figma Desktop
  2. Ask Claude to implement the selected design
  3. Or paste a Figma frame URL and ask Claude to build it

### MCP Capabilities
- Convert Figma designs to Tailwind/React components
- Access Figma variables, components, and design tokens
- Debug running application in Chrome
- Analyze network requests and performance

---

## Common Tasks

### Add a new route
Create file in `apps/website/app/routes/` following React Router 7 conventions:
```ts
// apps/website/app/routes/my-page.tsx
import type { Route } from './+types/my-page';

export async function loader({ context }: Route.LoaderArgs) {
  return { data: 'hello' };
}

export default function MyPage({ loaderData }: Route.ComponentProps) {
  return <div>{loaderData.data}</div>;
}
```

### Add shared Tailwind theme values
Edit `packages/tailwind-config/theme.css`:
```css
@theme {
  --color-newcolor: oklch(0.7 0.15 250);
}
```

### Add app-specific Tailwind values
Edit `apps/website/app/styles/tailwind.css` (after the theme import):
```css
@theme {
  --color-app-specific: #123456;
}
```

### Add a shared UI component
1. Create component in `packages/ui/src/MyComponent.tsx`
2. Export from `packages/ui/src/index.ts`
3. Import in apps: `import {MyComponent} from '@wakey/ui';`

### Query Storefront API
```ts
const { storefront } = context;
const { product } = await storefront.query(PRODUCT_QUERY, {
  variables: { handle: 'my-product' }
});
```

---

## Source Theme Reference

The original Shopify Liquid theme is used as reference for styling and structure.

**Location**: `/Users/bd/Documents/GitHub/wakey-source`

If not found, clone it:
```bash
git clone https://github.com/askphill/wakey-site /Users/bd/Documents/GitHub/wakey-source
```

**Useful reference files:**
- `snippets/` - Reusable Liquid components (tooltip, stars, icons)
- `blocks/` - Section blocks with positioning logic
- `assets/base.css` - CSS styling reference
- `templates/index.json` - Homepage structure and tooltip positions

---

## Content Architecture (MDX)

This project uses MDX for content-as-code (inspired by Lee Robinson's approach).

### Before Creating New Sections (IMPORTANT)
**Always review existing sections first** before creating a new one:
1. Read `apps/website/app/components/sections/` to see existing patterns
2. Check `TextMedia.tsx`, `IntroSection.tsx`, `Hero.tsx`, `FeaturedProduct.tsx` for structure examples
3. Look at how they handle:
   - Wrapper divs for content grouping
   - Button variants (outline on light backgrounds, primary on dark)
   - Responsive classes and breakpoints
   - Props interface patterns
4. Follow the same patterns for consistency

### Structure
```
apps/website/app/
├── content/
│   └── home.mdx           # Homepage content
├── components/
│   └── sections/
│       ├── Hero.tsx       # Hero with logo + tooltip
│       ├── IntroSection.tsx
│       ├── FeaturedProduct.tsx
│       ├── TextMedia.tsx
│       ├── index.ts       # Section exports
│       └── ...
└── routes/
    └── api.product.$handle.tsx  # Product data API
```

### How it works
1. MDX files import section components
2. Components receive props (e.g., `productHandle="deodorant"`)
3. Components fetch data from Shopify via API routes
4. API routes query Storefront API with metafields

### Example MDX
```mdx
import {Hero, TextSection} from '~/components/sections'

<Hero
  backgroundImage="https://cdn.shopify.com/..."
  productHandle="deodorant"
  tooltipPosition={{ top: '33%', left: '19%' }}
/>

<TextSection>
# Morning *essentials*
</TextSection>
```

---

## Shopify Metafields

Product metafields used in this project:

| Namespace | Key | Type | Description |
|-----------|-----|------|-------------|
| `ask_phill` | `subtitle` | Single line text | Product subtitle (e.g., "Mighty Citrus") |
| `ask_phill` | `review_average_rating` | Number | Star rating (e.g., 4.8) |
| `askphill` | `reviews` | List of metaobjects | Array of review IDs (count for total) |

**Important**: Metafields need **Storefront API access enabled** in Shopify Admin:
Settings → Custom data → Metafield definitions → Enable Storefront access

### Querying metafields
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

## Theme Styling

### Fonts
- **`font-display`**: Founders - Used for headings, titles, UI elements
- **`font-body`**: ITC - Used for body text, prose content

Font files in `apps/website/public/fonts/`:
- `founders.woff2`
- `itc-std.woff2`
- `itc-italic.woff2`

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| `sand` | `#FFF5EB` | Light background, text on dark |
| `softorange` | `#FAD103` | Logo, accents |
| `ocher` | `#E3B012` | Secondary accent |
| `skyblue` | `#99BDFF` | Links, highlights |
| `black` | `#1A1A1A` | Body background |

### Usage
```tsx
// Tailwind classes
<div className="bg-black text-sand font-display">
<p className="font-body text-softorange">
```

### Grid System
| Breakpoint | Columns | Padding (left/right) |
|------------|---------|----------------------|
| Mobile | 1 | `px-4` (16px) |
| Desktop (≥768px) | 24 | `md:px-8` (32px) |

**Usage:**
```tsx
// Desktop 24-column grid
<div className="grid grid-cols-1 md:grid-cols-24 gap-6 md:gap-8">
  <div className="md:col-span-16">Main content (16/24 = 66%)</div>
  <div className="md:col-span-8">Sidebar (8/24 = 33%)</div>
</div>

// Common column spans on desktop (24-col grid)
// col-span-24 = 100%
// col-span-16 = 66%
// col-span-12 = 50%
// col-span-8  = 33%
// col-span-6  = 25%
```

### Design System First (STRICT RULE)
**NEVER use arbitrary Tailwind values.** Always use design system utilities.

Forbidden (arbitrary values):
- `text-[14px]`, `text-[1.25rem]` → Use type scale utilities (see below)
- `text-sm`, `text-lg`, `text-xl` → Use type scale utilities (see below)
- `p-[20px]`, `m-[1.5rem]` → Use `p-5`, `m-6` (standard spacing scale)
- `w-[300px]`, `h-[50vh]` → Use `w-72`, `w-80`, `h-screen/2`
- `bg-[#ff6600]` → Add to `@theme` first, then use `bg-mycolor`
- `grid-cols-[repeat(5,1fr)]` → Use `grid-cols-5`

### Type Scale (ONLY use these for text sizing)
Custom responsive utilities defined in `packages/tailwind-config/theme.css`. **Never use standard Tailwind text sizes.**

| Utility | Mobile | Desktop (≥768px) | Use for |
|---------|--------|------------------|---------|
| `text-display` | 2.56rem | 8.75rem | Hero headlines |
| `text-h1` | 2.5rem | 5rem | Page titles |
| `text-h2` | 1.88rem | 3.75rem | Section headings |
| `text-h3` | 1.63rem | 2.5rem | Subsection headings |
| `text-s1` | 1.5rem | 1.88rem | Large UI text |
| `text-s2` | 1.13rem | 1.44rem | Medium UI text |
| `text-paragraph` | 1rem | 1.25rem | Body text |
| `text-body-small` | 0.81rem | 1.06rem | Secondary body text |
| `text-small` | 0.75rem | 0.88rem | Captions, fine print |
| `text-label` | 0.88rem | 0.94rem | Form labels, buttons |

```tsx
// Correct - type scale utilities (have built-in responsive sizing)
<h1 className="text-h1">Title</h1>
<p className="text-paragraph">Body text</p>

// Correct - can override at breakpoints with other type scale utilities
<span className="text-s2 md:text-h1">Responsive text</span>

// Wrong - never use standard Tailwind text sizes
<h1 className="text-4xl md:text-6xl">Title</h1>
<p className="text-base md:text-lg">Body text</p>
```

### Border Radius
Use `rounded-card` for cards, panels, and contained items. **Never use arbitrary rounded values.**

| Utility | Mobile | Desktop (≥768px) |
|---------|--------|------------------|
| `rounded-card` | 1.25rem | 1.875rem |

```tsx
// Correct
<div className="rounded-card bg-sand">Card content</div>

// Wrong
<div className="rounded-[20px]">Card content</div>
<div className="rounded-2xl md:rounded-3xl">Card content</div>
```

### Other Design System Rules
Required:
- Theme colors: `text-sand`, `bg-softorange`, `border-ocher`
- Theme fonts: `font-display`, `font-body`
- Tailwind spacing: `p-4`, `gap-2`, `mt-8`

### Theme Variable Rules (STRICT)
- **NEVER add theme variables without asking first**
- If a value doesn't exist in Tailwind, ask: "Can I add `--variable-name: value` to the theme?"
- Use semantic names (e.g., `--min-height-section` not `--spacing-125`)
- Prefer existing Tailwind values over custom variables when possible

### Converting from Reference Theme
When converting CSS from the Liquid reference theme (`.sections/` files), **always use the closest standard Tailwind value** rather than exact pixel/rem conversions.

### Spacing Conversion (--padding multipliers)

The reference CSS uses `--padding` with multipliers:
- **Mobile**: `--padding: 0.94rem` ≈ 1rem
- **Desktop**: `--padding: 1.56rem` ≈ 1.5rem

**Quick Formula**:
- Mobile: `calc(var(--padding) * N)` → Tailwind spacing `N × 4`
- Desktop: `calc(var(--padding) * N)` → Tailwind spacing `N × 6` (rounded to nearest)

**Lookup Table** (use this for all spacing conversions):

| Multiplier | CSS Reference | Mobile TW | Desktop TW |
|------------|---------------|-----------|------------|
| 1 | `var(--padding) * 1` | `p-4` | `md:p-6` |
| 2 | `var(--padding) * 2` | `p-8` | `md:p-12` |
| 3 | `var(--padding) * 3` | `p-12` | `md:p-20` |
| 4 | `var(--padding) * 4` | `p-16` | `md:p-24` |
| 5 | `var(--padding) * 5` | `p-20` | `md:p-32` |
| 6 | `var(--padding) * 6` | `p-24` | `md:p-36` |
| 8 | `var(--padding) * 8` | `p-32` | `md:p-48` |
| 11 | `var(--padding) * 11` | `p-44` | `md:p-72` |

**Example conversion**:
```css
/* Reference CSS */
.founder--col:last-child {
  padding: calc(var(--padding) * 2);  /* Mobile */
}
@media (width >= 47rem) {
  .founder--col:last-child {
    padding: calc(var(--padding) * 2) calc(var(--padding) * 5);  /* Desktop */
  }
}

/* Tailwind conversion */
className="p-8 md:py-12 md:px-32"
/*         ↑     ↑       ↑
           2×4   2×6     5×6 (rounded) */
```

**Important**: The formula gives a **starting point**. Visual adjustments are often needed after the initial conversion because:
- Tailwind's spacing scale has fixed steps (not continuous)
- The reference theme may have been visually tuned beyond the formula
- Context matters (adjacent elements, overall rhythm)

Workflow: Apply formula → preview in browser → adjust up/down one step if needed.

### Grid Conversion
| Reference Value | Tailwind Approach |
|-----------------|-------------------|
| `grid-template-columns: repeat(58, 1fr)` | Use `grid-cols-12` (standard 12-column grid) |
| `grid-column: span 43` (43/58 ≈ 74%) | Use `col-span-9` (9/12 = 75%) |
| `grid-column: span 15` (15/58 ≈ 26%) | Use `col-span-3` (3/12 = 25%) |
| `max-width: 14rem` | Use `max-w-56` (14rem) or closest |

**Rationale**: Standard Tailwind values are more maintainable and consistent than custom values that match exact reference measurements.

---

## API Routes Pattern

For fetching Shopify data client-side (used by MDX components):

### Create API route
```ts
// apps/website/app/routes/api.product.$handle.tsx
export async function loader({params, context}: Route.LoaderArgs) {
  const {product} = await context.storefront.query(QUERY, {
    variables: {handle: params.handle},
  });
  return {product};
}
```

### Use in component with useFetcher
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

## Setup Checklist

After cloning this repo:

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Link Shopify store** (from apps/website/):
   ```bash
   cd apps/website
   npx shopify hydrogen link
   ```

3. **Pull environment variables**:
   ```bash
   npx shopify hydrogen env pull
   ```

4. **Symlink .env to apps/website** (required for mini-oxygen):
   ```bash
   ln -s ../../.env apps/website/.env
   ```
   > **Note**: The `.env` file lives at the monorepo root, but Shopify's mini-oxygen runtime loads env vars from the app's working directory. This symlink makes the root `.env` available to the Hydrogen dev server.

5. **Start dev server** (from root):
   ```bash
   pnpm dev:website
   ```

6. **Clone source theme** (if needed for reference):
   ```bash
   git clone https://github.com/askphill/wakey-site /Users/bd/Documents/GitHub/wakey-source
   ```
