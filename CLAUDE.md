# Wakey Monorepo

## Domain

- **Website**: https://www.wakey.care
- **Studio**: https://studio.wakey.care
- **Shopify Store**: wakeycare.myshopify.com

---

## Stack Overview

- **Monorepo**: Turborepo + pnpm workspaces
- **Styling**: Tailwind CSS v4
- **Build**: Vite 6
- **Language**: TypeScript 5.9

---

## Structure

```
wakey/
├── apps/
│   ├── website/          # Hydrogen storefront → Oxygen
│   └── studio/           # Admin dashboard → Cloudflare Workers
│
├── packages/
│   ├── ui/               # Shared React components (@wakey/ui)
│   ├── tailwind-config/  # Shared Tailwind v4 theme (@wakey/tailwind-config)
│   └── hooks/            # Shared React hooks (@wakey/hooks)
│
├── turbo.json            # Turborepo pipeline
├── pnpm-workspace.yaml   # Workspace definitions
└── .mcp.json             # MCP servers config
```

### App-Specific Documentation

- **Website**: See `apps/website/CLAUDE.md` for Hydrogen, MDX, Storefront API
- **Studio**: See `apps/studio/CLAUDE.md` for Hono, D1 database, API routes

---

## Development Commands

```bash
# Install all dependencies
pnpm install

# Start all apps
pnpm dev

# Start specific app
pnpm dev:website
pnpm dev:studio

# Build all packages and apps
pnpm build

# Type check all packages
pnpm typecheck
```

---

## Shared Packages

### `@wakey/ui` - Component Library

```tsx
import {Button, Stars, Accordion, Tooltip, AddedToBagPopup} from '@wakey/ui';
import {BagIcon, AddBagIcon, CheckoutIcon, HamburgerIcon, CrossIcon} from '@wakey/ui';
```

| Component         | Description                                    |
| ----------------- | ---------------------------------------------- |
| `Button`          | Primary/secondary/outline variants, icon prop  |
| `Stars`           | Rating display with half-star support          |
| `Accordion`       | Expandable sections                            |
| `Tooltip`         | Positioned tooltips                            |
| `AddedToBagPopup` | Cart notification popup                        |
| Icons             | SVG icons from [Centralicons](https://centralicons.com/) |

### `@wakey/hooks` - React Hooks

```tsx
import {useContinuousCarousel, useLazyFetch} from '@wakey/hooks';
```

| Hook                    | Description                       |
| ----------------------- | --------------------------------- |
| `useContinuousCarousel` | Physics-based carousel scrolling  |
| `useLazyFetch`          | Lazy data fetching utility        |

### `@wakey/tailwind-config` - Design System

Import in app's Tailwind CSS:

```css
@import 'tailwindcss';
@import '../../../../packages/tailwind-config/theme.css';
```

---

## Tailwind CSS v4

This project uses **Tailwind v4** with CSS-first configuration.

### Key Differences from v3

| v3                      | v4                        |
| ----------------------- | ------------------------- |
| `tailwind.config.js`    | `@theme` directive in CSS |
| `@tailwind base;`       | `@import 'tailwindcss';`  |
| `h-[100px]` (arbitrary) | `h-100` (works directly)  |
| Separate PostCSS        | Built-in Lightning CSS    |
| `autoprefixer` needed   | Automatic prefixing       |

### Vite Plugin

```ts
import tailwindcss from '@tailwindcss/vite';
plugins: [tailwindcss(), ...]
```

---

## Design System (Strict Rules)

### NEVER Use Arbitrary Values

Always use design system utilities:

```tsx
// Wrong
<h1 className="text-[14px]">         // Use type scale
<div className="p-[20px]">           // Use Tailwind spacing
<div className="bg-[#ff6600]">       // Add to @theme first

// Correct
<h1 className="text-h1">
<div className="p-5">
<div className="bg-softorange">
```

### Type Scale (ONLY Use These)

| Utility           | Mobile  | Desktop  | Use for              |
| ----------------- | ------- | -------- | -------------------- |
| `text-display`    | 2.56rem | 8.75rem  | Hero headlines       |
| `text-h1`         | 2.5rem  | 5rem     | Page titles          |
| `text-h2`         | 1.88rem | 3.75rem  | Section headings     |
| `text-h3`         | 1.63rem | 2.5rem   | Subsection headings  |
| `text-s1`         | 1.5rem  | 1.88rem  | Large UI text        |
| `text-s2`         | 1.13rem | 1.44rem  | Medium UI text       |
| `text-paragraph`  | 1rem    | 1.25rem  | Body text            |
| `text-body-small` | 0.81rem | 1.06rem  | Secondary body text  |
| `text-small`      | 0.75rem | 0.88rem  | Captions, fine print |
| `text-label`      | 0.88rem | 0.94rem  | Form labels, buttons |

**Never use `text-sm`, `text-lg`, `text-xl`, etc.**

### Colors

| Name         | Hex       | Usage                          |
| ------------ | --------- | ------------------------------ |
| `sand`       | `#FFF5EB` | Light background, text on dark |
| `softorange` | `#FAD103` | Logo, accents                  |
| `ocher`      | `#E3B012` | Secondary accent               |
| `skyblue`    | `#99BDFF` | Links, highlights              |
| `black`      | `#1A1A1A` | Body background                |

### Fonts

| Class          | Font     | Usage               |
| -------------- | -------- | ------------------- |
| `font-display` | Founders | Headings, UI        |
| `font-body`    | ITC      | Body text, prose    |

### Border Radius

Use `rounded-card` for cards and panels. Never use arbitrary rounded values.

### Grid System

| Breakpoint | Columns | Padding      |
| ---------- | ------- | ------------ |
| Mobile     | 1       | `px-4`       |
| Desktop    | 24      | `md:px-8`    |

```tsx
<div className="grid grid-cols-1 md:grid-cols-24 gap-6 md:gap-8">
  <div className="md:col-span-16">Main (66%)</div>
  <div className="md:col-span-8">Sidebar (33%)</div>
</div>
```

### Custom Utilities

| Utility          | Description                        |
| ---------------- | ---------------------------------- |
| `rounded-card`   | Responsive border radius           |
| `max-w-section`  | Max section width with auto margin |
| `scrollbar-hide` | Hide scrollbar                     |
| `blur-bg`        | Frosted glass effect               |
| `hover-scale`    | Scale on hover (desktop only)      |

### Theme Variable Rules

- **NEVER add theme variables without asking first**
- Use semantic names (e.g., `--min-height-section` not `--spacing-125`)
- Prefer existing Tailwind values over custom variables

---

## Spacing Conversion (from Reference CSS)

Reference CSS uses `--padding` multipliers. Quick formula:

- Mobile: multiplier × 4 (Tailwind units)
- Desktop: multiplier × 6 (Tailwind units, rounded)

| Multiplier | Mobile TW | Desktop TW |
| ---------- | --------- | ---------- |
| 1          | `p-4`     | `md:p-6`   |
| 2          | `p-8`     | `md:p-12`  |
| 3          | `p-12`    | `md:p-20`  |
| 4          | `p-16`    | `md:p-24`  |
| 5          | `p-20`    | `md:p-32`  |

---

## Adding Shared Components/Hooks

### Add a shared UI component

1. Create component in `packages/ui/src/MyComponent.tsx`
2. Export from `packages/ui/src/index.ts`
3. Import in apps: `import {MyComponent} from '@wakey/ui';`

### Add shared Tailwind theme values

Edit `packages/tailwind-config/theme.css`:

```css
@theme {
  --color-newcolor: oklch(0.7 0.15 250);
}
```

---

## MCP Servers

Configured in `.mcp.json`:

### Chrome DevTools

- Inspect live Chrome, run DevTools commands
- Debug issues, analyze network and performance

### Figma

- Requires Figma Desktop app running
- Select frame in Figma → ask Claude to implement
- Or paste Figma frame URL

---

## Content Upload (Shopify)

**Always upload content to Shopify** using the `/shopify-admin` skill:

```bash
# Upload image/video
bash .claude/skills/shopify-admin/scripts/upload-file.sh ./image.jpg "Alt text"

# Get CDN URL
bash .claude/skills/shopify-admin/scripts/fetch-files.sh --type IMAGE --limit 5
```

Supported formats: jpg, png, gif, webp, svg, mp4, mov, webm, pdf

---

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. For website - link Shopify store:
   ```bash
   cd apps/website
   npx shopify hydrogen link
   npx shopify hydrogen env pull
   ```

3. For studio - set up `.dev.vars` with required secrets

4. Start development:
   ```bash
   pnpm dev
   ```
