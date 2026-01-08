# Project: Wakey - Shopify Hydrogen Storefront

## Stack Overview
- **Framework**: Shopify Hydrogen 2025.7.0 (React Router 7.9.2)
- **Runtime**: Shopify Oxygen (Cloudflare workerd-based)
- **Styling**: Tailwind CSS v4.1.6
- **Build**: Vite 6
- **Language**: TypeScript 5.9

---

## Tailwind CSS v4 (Important Changes)

This project uses **Tailwind v4** which has major differences from v3:

### CSS-First Configuration
- **No `tailwind.config.js`** - Configuration is done in CSS
- All config lives in `app/styles/tailwind.css`
- Just `@import 'tailwindcss';` - no more `@tailwind base/components/utilities`

### Configure via CSS
```css
@import 'tailwindcss';

@theme {
  --color-brand: #ff6600;
  --font-display: "Inter", sans-serif;
}
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
Tailwind is configured via `@tailwindcss/vite` plugin in `vite.config.ts`:
```ts
import tailwindcss from '@tailwindcss/vite';
plugins: [tailwindcss(), ...]
```

---

## Shopify Hydrogen & Oxygen

### Hydrogen (Framework)
- React-based headless commerce framework
- Built on **React Router 7** (not Remix anymore as of 2025.5.0)
- Provides Shopify-optimized components and utilities
- Storefront API integration with codegen

### Key Files
```
app/
├── routes/          # File-based routing (React Router 7)
├── components/      # Reusable components
├── lib/             # Utilities and helpers
├── graphql/         # Storefront API queries
├── styles/          # CSS including Tailwind
├── root.tsx         # App shell
└── routes.ts        # Route configuration
server.ts            # Oxygen server entry point
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
- Deploy via GitHub Actions (`.github/workflows/oxygen.yml`)
- Free on paid Shopify plans (Basic, Shopify, Advanced, Plus)

### Development Commands
```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run preview   # Preview production build
npm run codegen   # Generate Storefront API types
```

### Environment Variables
Configured in `.env`:
- `SESSION_SECRET` - Session encryption
- `PUBLIC_STOREFRONT_API_TOKEN` - Storefront API access
- `PUBLIC_STORE_DOMAIN` - Your Shopify store domain

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
Create file in `app/routes/` following React Router 7 conventions:
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

### Add custom Tailwind theme values
Edit `app/styles/tailwind.css`:
```css
@import 'tailwindcss';

@theme {
  --color-primary: oklch(0.7 0.15 250);
  --spacing-18: 4.5rem;
}
```

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

### Structure
```
app/
├── content/
│   └── home.mdx           # Homepage content
├── components/
│   └── sections/
│       ├── Hero.tsx       # Hero with logo + tooltip
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

Font files in `public/fonts/`:
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
Custom responsive utilities defined in `tailwind.css`. **Never use standard Tailwind text sizes.**

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

If a value doesn't exist, **add it to `@theme` in `tailwind.css` first**:
```css
@theme {
  --spacing-18: 4.5rem;
  --color-newcolor: #123456;
}
```
Then use the utility: `p-18`, `bg-newcolor`

### Converting from Reference Theme
When converting CSS from the Liquid reference theme (`.sections/` files), **always use the closest standard Tailwind value** rather than exact pixel/rem conversions:

| Reference Value | Tailwind Approach |
|-----------------|-------------------|
| `calc(var(--padding) * 5)` (5rem) | Use `p-20` or closest (`p-24` if visually better) |
| `grid-template-columns: repeat(58, 1fr)` | Use `grid-cols-12` (standard 12-column grid) |
| `grid-column: span 43` (43/58 ≈ 74%) | Use `col-span-9` (9/12 = 75%) |
| `grid-column: span 15` (15/58 ≈ 26%) | Use `col-span-3` (3/12 = 25%) |
| `max-width: 14rem` | Use `max-w-56` (14rem) or closest |

**Rationale**: Standard Tailwind values are more maintainable and consistent than custom values that match exact reference measurements.

### Component Conversion Examples

**Button Component** (from `.button` in base.css):
| Reference | Tailwind |
|-----------|----------|
| `border: 0.06rem` (~1px) | `border` (1px) |
| `padding: 0.88rem 2rem 1rem` | `pt-3.5 px-8 pb-4` |
| `height: 2.69rem` | `h-11` (2.75rem) |
| Desktop `padding: 1.06rem 2rem 1.25rem` | `md:pt-4 md:px-8 md:pb-5` |
| Desktop `height: auto` | `md:h-auto` or fixed `md:h-14` |

**Section Padding** (from section CSS):
| Reference | Tailwind |
|-----------|----------|
| Mobile: `calc(var(--padding) * 2) calc(var(--padding) * 3) calc(var(--padding) * 2) calc(var(--padding) * 2)` | `pt-8 pr-12 pb-8 pl-8` |
| Desktop: `calc(var(--padding) * 1) calc(var(--padding) * 2) calc(var(--padding) * 5)` | `md:pt-8 md:px-8 md:pb-24` |
| Body text mobile push: `calc(var(--padding) * 11)` | `pt-44` (11rem) |

**Typography** (`.paragraph` in base.css):
| Reference | Tailwind |
|-----------|----------|
| Mobile: `1rem` | `text-base` or `text-paragraph` |
| Desktop: `1.25rem` | `md:text-xl` or `text-paragraph` (responsive) |

---

## API Routes Pattern

For fetching Shopify data client-side (used by MDX components):

### Create API route
```ts
// app/routes/api.product.$handle.tsx
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

1. **Link Shopify store**:
   ```bash
   npx shopify hydrogen link
   ```

2. **Pull environment variables**:
   ```bash
   npx shopify hydrogen env pull
   ```

3. **Start dev server**:
   ```bash
   npx shopify hydrogen dev
   ```

4. **Clone source theme** (if needed for reference):
   ```bash
   git clone https://github.com/askphill/wakey-site /Users/bd/Documents/GitHub/wakey-source
   ```
