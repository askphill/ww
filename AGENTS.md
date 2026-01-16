# Codebase Patterns for AI Agents

This file is maintained by Ralph and contains patterns discovered during autonomous development iterations. It helps future iterations understand codebase conventions.

> **Note**: See `CLAUDE.md` for project-specific instructions and setup details.

## Architecture

### Monorepo Structure

- `apps/website/` - Shopify Hydrogen storefront
- `packages/ui/` - Shared React components (@wakey/ui)
- `packages/hooks/` - Shared React hooks (@wakey/hooks)
- `packages/tailwind-config/` - Shared Tailwind theme

### Key Conventions

- Use `@wakey/ui` components instead of creating new ones
- Follow existing patterns in `apps/website/app/components/`
- MDX content lives in `apps/website/app/content/`

## Common Gotchas

### Tailwind v4

- No `tailwind.config.js` - use CSS `@theme` directive
- Use type scale utilities (`text-h1`, `text-paragraph`) not standard Tailwind sizes
- Check `packages/tailwind-config/theme.css` for available tokens

### React Router 7 (Not Remix)

- Import from `react-router` not `@remix-run/react`
- Use `data()` not `json()` for loader responses
- Route types come from `./+types/[route-name]`

### Storefront API

- Always run `pnpm codegen` after changing GraphQL queries
- Metafields need Storefront API access enabled in Shopify Admin

## Testing Patterns

### Quality Checks

```bash
pnpm typecheck  # TypeScript validation
pnpm build      # Production build
```

### Browser Verification

Use chrome-devtools MCP for UI testing:

- `mcp__chrome-devtools__take_snapshot` - Get page state
- `mcp__chrome-devtools__click` - Interact with elements
- `mcp__chrome-devtools__take_screenshot` - Visual verification

## Patterns Discovered by Ralph

<!-- Ralph will add patterns here during iterations -->

---

_Last updated by Ralph: Never_
