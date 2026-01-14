# PRD: Production Readiness Improvements

## Introduction

The Wakey Hydrogen storefront requires hardening before production launch. A comprehensive codebase audit identified critical gaps in security, testing, type safety, performance, and code maintainability. This PRD addresses all findings to ensure the application is stable, secure, and maintainable.

## Goals

- **Security**: Eliminate credential exposure and XSS vulnerabilities
- **Reliability**: Add test coverage and proper error handling
- **Performance**: Optimize caching, images, and bundle size
- **Maintainability**: Simplify complex code and improve type safety
- **Quality**: Establish CI/CD gates to prevent regressions

## User Stories

---

### P0 - Critical (Security & Foundation)

---

**US-001: Remove credentials from repository**
As a developer, I want sensitive credentials removed from the codebase so that API tokens cannot be leaked.

- Acceptance: `apps/website/.env` is added to `.gitignore`
- Acceptance: No files containing `shpat_` or API tokens exist in git history tip
- Acceptance: `.env.example` file created with placeholder values
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-002: Generate secure SESSION_SECRET**
As a developer, I want a cryptographically secure session secret so that sessions cannot be forged.

- Acceptance: `.env.example` documents SESSION_SECRET requirement
- Acceptance: Value is minimum 32 characters of random data
- Acceptance: App fails to start if SESSION_SECRET is "foobar" or less than 32 chars
- Acceptance: Validation added to `server.ts` before app initialization

---

**US-003: Add DOMPurify dependency**
As a developer, I want an HTML sanitization library installed so that XSS attacks can be prevented.

- Acceptance: `dompurify` and `@types/dompurify` added to `apps/website/package.json`
- Acceptance: `pnpm install` completes successfully
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-004: Create sanitization utility**
As a developer, I want a reusable HTML sanitization function so that all user HTML is consistently sanitized.

- Acceptance: `apps/website/app/lib/sanitize.ts` exports `sanitizeHtml(html: string): string`
- Acceptance: Function uses DOMPurify to sanitize input
- Acceptance: Function handles null/undefined input gracefully
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-005: Sanitize TextMedia HTML**
As a user, I want product descriptions sanitized so that malicious scripts cannot execute.

- Acceptance: `TextMedia.tsx` imports and uses `sanitizeHtml` before `dangerouslySetInnerHTML`
- Acceptance: Component renders product description correctly
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-006: Sanitize ImageBanner HTML**
As a user, I want banner text sanitized so that malicious scripts cannot execute.

- Acceptance: `ImageBanner.tsx` imports and uses `sanitizeHtml` before `dangerouslySetInnerHTML`
- Acceptance: Component renders banner text correctly
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-007: Sanitize pages body HTML**
As a user, I want page content sanitized so that malicious scripts cannot execute.

- Acceptance: `pages.$handle.tsx` imports and uses `sanitizeHtml` on `page.body`
- Acceptance: Page renders content correctly
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-008: Sanitize policies body HTML**
As a user, I want policy content sanitized so that malicious scripts cannot execute.

- Acceptance: `policies.$handle.tsx` imports and uses `sanitizeHtml` on `policy.body`
- Acceptance: Policy page renders content correctly
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-009: Sanitize USPSection HTML**
As a user, I want USP section content sanitized so that malicious scripts cannot execute.

- Acceptance: `USPSection.tsx` imports and uses `sanitizeHtml` on title/body props
- Acceptance: Component renders correctly
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-010: Install Vitest testing framework**
As a developer, I want a test framework configured so that I can write automated tests.

- Acceptance: `vitest`, `@testing-library/react`, `jsdom` added to dev dependencies
- Acceptance: `vitest.config.ts` created with React and jsdom configuration
- Acceptance: `pnpm test` script added to `apps/website/package.json`
- Acceptance: `pnpm test` runs without errors (even with no tests)

---

**US-011: Add sample component test**
As a developer, I want an example test file so that the testing pattern is established.

- Acceptance: `apps/website/app/components/__tests__/Button.test.tsx` created
- Acceptance: Test renders Button component with different variants
- Acceptance: `pnpm test` passes
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-012: Add Zod dependency for validation**
As a developer, I want a schema validation library so that runtime data can be type-checked.

- Acceptance: `zod` added to `apps/website/package.json`
- Acceptance: `pnpm install` completes successfully
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-013: Add type-safe JSON parse utility**
As a developer, I want a safe JSON parsing function so that malformed data doesn't crash the app.

- Acceptance: `apps/website/app/lib/parse.ts` exports `safeJsonParse<T>(json: string, schema: ZodSchema<T>): T | null`
- Acceptance: Function returns null on parse errors instead of throwing
- Acceptance: Function validates parsed data against Zod schema
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-014: Fix unsafe JSON.parse in api.product route**
As a developer, I want product API JSON parsing to be safe so that malformed metafields don't crash requests.

- Acceptance: `api.product.$handle.tsx` uses `safeJsonParse` with Zod schema for reviews
- Acceptance: Invalid JSON returns empty array instead of crashing
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-015: Add CI workflow with validation**
As a developer, I want CI to validate code before deployment so that broken code cannot reach production.

- Acceptance: `.github/workflows/ci.yml` created with lint, typecheck, test jobs
- Acceptance: Workflow runs on pull requests to main branch
- Acceptance: Deployment workflow depends on CI passing
- Acceptance: Workflow file is valid YAML

---

### P1 - High Priority (Performance & Error Handling)

---

**US-016: Add cache strategy to product page loader**
As a user, I want product pages cached so that they load faster on repeat visits.

- Acceptance: `products.$handle.tsx` loader uses `cache: storefront.CacheShort()`
- Acceptance: Response includes appropriate Cache-Control headers
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-017: Add cache headers to product API route**
As a developer, I want product tooltip data cached so that redundant API calls are avoided.

- Acceptance: `api.product.$handle.tsx` returns response with `Cache-Control: public, max-age=3600`
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-018: Add cache headers to reviews API route**
As a developer, I want review data cached so that redundant API calls are avoided.

- Acceptance: `api.reviews.$handle.tsx` returns response with `Cache-Control: public, max-age=3600`
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-019: Add AggregateRating to product schema**
As a search engine, I want product pages to include rating schema so that rich snippets display stars.

- Acceptance: Product page JSON-LD includes `aggregateRating` object
- Acceptance: `ratingValue` populated from `reviewRating` metafield
- Acceptance: `reviewCount` populated from reviews metafield length
- Acceptance: Schema validates at schema.org/validator
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-020: Create graceful ErrorBoundary component**
As a user, I want to see a friendly error page so that crashes don't show technical details.

- Acceptance: `apps/website/app/components/ErrorFallback.tsx` created
- Acceptance: Component shows user-friendly message with "Go Home" button
- Acceptance: Component logs error details to console (for debugging)
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-021: Update root ErrorBoundary to use graceful fallback**
As a user, I want app crashes to show a friendly page so that I can navigate away.

- Acceptance: `root.tsx` ErrorBoundary uses `ErrorFallback` component
- Acceptance: Error details not exposed to user in production
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP (trigger error to test)

---

**US-022: Type StickyAddToCart cart data**
As a developer, I want cart data properly typed so that type errors are caught at compile time.

- Acceptance: `StickyAddToCart.tsx` line 226 `cart: unknown` replaced with proper Cart type
- Acceptance: FetcherWithComponents uses correct generic type
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-023: Add environment variable validation**
As a developer, I want all required env vars validated at startup so that missing config fails fast.

- Acceptance: `apps/website/app/lib/env.ts` exports validated env object using Zod
- Acceptance: Validates: SESSION_SECRET, PUBLIC_STOREFRONT_API_TOKEN, PUBLIC_STORE_DOMAIN
- Acceptance: App fails to start with clear error if validation fails
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-024: Add fetchPriority to FeaturedProduct hero**
As a user, I want the hero image to load quickly so that LCP is optimized.

- Acceptance: `FeaturedProduct.tsx` background image has `fetchPriority="high"`
- Acceptance: Image also has `decoding="async"` attribute
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-025: Fix search loader error handling**
As a developer, I want search errors properly handled so that failed searches don't break the page.

- Acceptance: `search.tsx` loader uses async/await instead of promise chain
- Acceptance: Errors return structured error response, not undefined
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

### P2 - Medium Priority (SEO, Accessibility, Simplification)

---

**US-026: Add breadcrumb schema to product pages**
As a search engine, I want breadcrumb schema so that navigation hierarchy appears in search results.

- Acceptance: Product page JSON-LD includes `BreadcrumbList` schema
- Acceptance: Breadcrumbs show: Home > Products > [Product Name]
- Acceptance: Schema validates at schema.org/validator
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-027: Add og:image dimensions to homepage**
As a social platform, I want image dimensions in meta tags so that previews render correctly.

- Acceptance: `_index.tsx` meta includes `og:image:width` and `og:image:height`
- Acceptance: Dimensions match actual image size
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-028: Add og:image dimensions to product pages**
As a social platform, I want image dimensions in meta tags so that previews render correctly.

- Acceptance: `products.$handle.tsx` meta includes `og:image:width` and `og:image:height`
- Acceptance: Dimensions match actual image size
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-029: Add noindex to account routes**
As a search engine, I want private pages excluded from indexing so that user data isn't crawled.

- Acceptance: All `account.*.tsx` routes include `{name: 'robots', content: 'noindex, nofollow'}` in meta
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-030: Add aria-label support to Button component**
As a screen reader user, I want icon-only buttons to have labels so that I know what they do.

- Acceptance: `packages/ui/src/Button.tsx` accepts `aria-label` prop
- Acceptance: Prop is passed to rendered element
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-031: Add label to search input**
As a screen reader user, I want the search input to have a label so that I know what it's for.

- Acceptance: `search.tsx` input has associated label (visually hidden is OK)
- Acceptance: Label has `htmlFor` matching input `id`
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-032: Create useLazyFetch custom hook**
As a developer, I want a reusable lazy fetch hook so that the fetcher pattern isn't duplicated.

- Acceptance: `packages/hooks/src/useLazyFetch.ts` created
- Acceptance: Hook accepts path and returns fetcher with auto-load on mount
- Acceptance: Exported from `packages/hooks/src/index.ts`
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-033: Refactor ProductTooltip to use useLazyFetch**
As a developer, I want ProductTooltip to use the shared hook so that code is DRY.

- Acceptance: `ProductTooltip.tsx` uses `useLazyFetch` instead of inline fetcher logic
- Acceptance: Component behavior unchanged
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-034: Refactor ProductReviews to use useLazyFetch**
As a developer, I want ProductReviews to use the shared hook so that code is DRY.

- Acceptance: `ProductReviews.tsx` uses `useLazyFetch` instead of inline fetcher logic
- Acceptance: Component behavior unchanged
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-035: Extract MediaItem component from ProductCarousel**
As a developer, I want media rendering extracted so that ProductCarousel is simpler.

- Acceptance: `apps/website/app/components/MediaItem.tsx` created
- Acceptance: Component handles MediaImage and Video types
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-036: Refactor ProductCarousel to use MediaItem**
As a developer, I want ProductCarousel simplified so that it's easier to maintain.

- Acceptance: `ProductCarousel.tsx` uses `MediaItem` for both mobile and desktop
- Acceptance: Duplicate media rendering logic removed (~100 lines reduction)
- Acceptance: Component behavior unchanged
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-037: Extract generic SearchResultList component**
As a developer, I want a reusable search result list so that SearchResults is simpler.

- Acceptance: `apps/website/app/components/SearchResultList.tsx` created
- Acceptance: Component accepts title, items, and getPath function
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-038: Refactor SearchResults to use SearchResultList**
As a developer, I want SearchResults simplified so that it's easier to maintain.

- Acceptance: `SearchResults.tsx` uses `SearchResultList` for articles, pages, products, queries
- Acceptance: 4 similar components replaced with single reusable component
- Acceptance: Component behavior unchanged
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-039: Combine Header useEffect hooks**
As a developer, I want Header effects combined so that related logic is together.

- Acceptance: `Header.tsx` has single useEffect for menu-open side effects
- Acceptance: Click-outside handler and body scroll in same effect
- Acceptance: Component behavior unchanged
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

**US-040: Change video preload to metadata**
As a user, I want videos to load efficiently so that page load is faster.

- Acceptance: `TextMedia.tsx` video uses `preload="metadata"` instead of `preload="auto"`
- Acceptance: `ProductCarousel.tsx` videos use `preload="metadata"`
- Acceptance: Videos still play correctly when scrolled into view
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

### P3 - Nice to Have (Polish)

---

**US-041: Add font preload links**
As a user, I want fonts to load quickly so that text doesn't flash.

- Acceptance: `root.tsx` adds `<link rel="preload">` for founders.woff2 and itc-std.woff2
- Acceptance: Links include `as="font"` and `crossorigin` attributes
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-042: Remove unused @wakey/utils package**
As a developer, I want unused code removed so that the codebase is cleaner.

- Acceptance: `packages/utils/` directory deleted
- Acceptance: Reference removed from `apps/website/package.json`
- Acceptance: Reference removed from `pnpm-workspace.yaml` if present
- Acceptance: `pnpm install` completes successfully

---

**US-043: Verify and document Hero component status**
As a developer, I want unused components documented so that their status is clear.

- Acceptance: `Hero.tsx` either deleted (if unused) or documented with TODO comment explaining planned use
- Acceptance: If kept, add comment: `// TODO: Planned for [specific use case]`
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-044: Add decoding="async" to hero images**
As a user, I want hero images to decode efficiently so that the main thread isn't blocked.

- Acceptance: `Hero.tsx` background image has `decoding="async"`
- Acceptance: `ImageBanner.tsx` background images have `decoding="async"`
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

**US-045: Add prefetch to hero CTA buttons**
As a user, I want linked pages to prefetch so that navigation feels instant.

- Acceptance: `FeaturedProduct.tsx` CTA Link has `prefetch="intent"`
- Acceptance: `Hero.tsx` CTA Link has `prefetch="intent"` (if component is used)
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

## Non-Goals

- **Feature changes**: No new user-facing features, only stability/quality improvements
- **Design changes**: No visual or UX modifications
- **Database migrations**: No schema changes required
- **Third-party integrations**: No new external services (except Sentry in future)
- **Full test coverage**: Target is foundation + critical paths, not 100% coverage

## Technical Considerations

- **DOMPurify**: Use `isomorphic-dompurify` if SSR sanitization needed, or standard `dompurify` for client-only
- **Zod schemas**: Create shared schemas in `app/lib/schemas/` for reuse across loaders
- **Vitest**: Configure with `@vitejs/plugin-react` for JSX support in tests
- **CI timing**: Keep CI under 5 minutes by running lint/typecheck/test in parallel

## Success Metrics

| Metric | Target |
|--------|--------|
| Typecheck errors | 0 |
| Test coverage | >30% on critical paths |
| Lighthouse Performance | >90 |
| Lighthouse SEO | >95 |
| Security vulnerabilities | 0 critical/high |
| CI pipeline pass rate | >95% |

## Open Questions

1. **Error logging**: Should we add Sentry or similar in this phase, or defer to future PRD?
2. **E2E tests**: Should Playwright E2E tests be included, or separate PRD?
3. **Bundle analysis**: Should we add bundle size tracking/limits in CI?

---

## Story Dependency Order

```
US-001 (credentials) ─┬─► US-002 (session secret)
                      └─► US-015 (CI workflow)

US-003 (dompurify) ───► US-004 (sanitize util) ───┬─► US-005 (TextMedia)
                                                   ├─► US-006 (ImageBanner)
                                                   ├─► US-007 (pages)
                                                   ├─► US-008 (policies)
                                                   └─► US-009 (USPSection)

US-010 (vitest) ──────► US-011 (sample test)

US-012 (zod) ─────────► US-013 (parse util) ─────► US-014 (api.product)

US-032 (useLazyFetch) ─┬─► US-033 (ProductTooltip)
                       └─► US-034 (ProductReviews)

US-035 (MediaItem) ───► US-036 (ProductCarousel)

US-037 (SearchResultList) ► US-038 (SearchResults)
```
