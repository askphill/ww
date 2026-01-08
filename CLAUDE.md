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
