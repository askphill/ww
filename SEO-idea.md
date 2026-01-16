# SEO Content Engine for Wakey

## Overview

A CLI tool for generating AI-powered SEO articles based on Google Search Console data and Shopify products, with performance tracking. Focused on the NL (Netherlands) market and optimized for LLM discoverability.

---

## Architecture

```
wakey/
├── apps/
│   ├── website/              # Existing Hydrogen storefront
│   └── seo-engine/           # NEW: SEO CLI tool
├── packages/
│   └── (existing packages)
```

**Tech Stack:**

- Node.js CLI with Commander.js
- Google Search Console API for rankings/traffic
- Claude API for article generation
- SQLite for local tracking data
- MDX output for version-controlled articles

---

## Directory Structure

```
apps/seo-engine/
├── package.json
├── tsconfig.json
├── .env.example
├── src/
│   ├── index.ts                 # CLI entry (commander)
│   ├── commands/
│   │   ├── fetch.ts             # Fetch GSC data
│   │   ├── analyze.ts           # Find content opportunities
│   │   ├── generate.ts          # Generate article drafts
│   │   ├── track.ts             # Track article performance
│   │   └── sync.ts              # Sync Shopify products
│   ├── services/
│   │   ├── gsc.ts               # Google Search Console client
│   │   ├── shopify.ts           # Shopify Admin API client
│   │   ├── claude.ts            # Claude API for generation
│   │   └── db.ts                # SQLite database
│   ├── generators/
│   │   ├── article.ts           # MDX article generator
│   │   ├── frontmatter.ts       # Article metadata
│   │   └── jsonld.ts            # Structured data for LLM discoverability
│   ├── analyzers/
│   │   ├── opportunities.ts     # Content opportunity detection
│   │   └── keywords.ts          # Keyword clustering
│   ├── templates/
│   │   ├── article.mdx.ts       # MDX template
│   │   └── prompts.ts           # Claude prompt templates
│   ├── db/
│   │   └── schema.ts            # SQLite schema
│   └── types/
│       └── index.ts             # TypeScript types
└── data/
    └── .gitkeep                 # SQLite DB stored here (gitignored)
```

---

## CLI Commands

```bash
# From monorepo root
pnpm seo:fetch              # Fetch GSC data for NL market
pnpm seo:analyze            # Analyze content opportunities
pnpm seo:generate           # Generate article drafts
pnpm seo:track              # Track published article performance
pnpm seo:sync               # Sync Shopify products to local DB

# Command options
seo-engine fetch --days 30 --country NL
seo-engine analyze --min-impressions 100 --max-position 20
seo-engine generate --topic "natuurlijke deodorant" --product deodorant
seo-engine track --all --period 7
```

---

## Database Schema (SQLite)

```sql
-- GSC search data
CREATE TABLE gsc_queries (
  id INTEGER PRIMARY KEY,
  query TEXT NOT NULL,
  country TEXT DEFAULT 'NL',
  clicks INTEGER,
  impressions INTEGER,
  ctr REAL,
  position REAL,
  date TEXT NOT NULL,
  UNIQUE(query, country, date)
);

-- Synced Shopify products
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  handle TEXT UNIQUE,
  title TEXT,
  description TEXT,
  tags TEXT,
  synced_at TEXT
);

-- Content opportunities (analyzed)
CREATE TABLE opportunities (
  id INTEGER PRIMARY KEY,
  keyword TEXT NOT NULL,
  impressions_30d INTEGER,
  clicks_30d INTEGER,
  current_position REAL,
  related_product_id TEXT,
  opportunity_score REAL,
  status TEXT DEFAULT 'identified'
);

-- Generated articles
CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT,
  target_keyword TEXT,
  related_product_id TEXT,
  status TEXT DEFAULT 'draft',
  mdx_path TEXT,
  generated_at TEXT,
  published_at TEXT
);

-- Performance tracking over time
CREATE TABLE article_performance (
  id INTEGER PRIMARY KEY,
  article_id INTEGER,
  date TEXT,
  impressions INTEGER,
  clicks INTEGER,
  avg_position REAL,
  UNIQUE(article_id, date)
);
```

---

## MDX Article Output

Articles are generated to: `apps/website/app/content/blog/`

**Example frontmatter:**

```yaml
---
title: 'Beste Natuurlijke Deodorant 2024: Complete Gids'
slug: 'beste-natuurlijke-deodorant'
description: 'Ontdek de beste natuurlijke deodorant voor jouw huid.'
publishedAt: '2024-01-15'
author: 'Wakey Team'
category: 'deodorant'
tags: ['natuurlijke deodorant', 'aluminium-vrij', 'duurzaam']
featuredImage:
  url: 'https://cdn.shopify.com/...'
  alt: 'Natuurlijke deodorant'
relatedProduct:
  handle: 'deodorant'
---
```

**Includes JSON-LD structured data** for LLM discoverability:

- Article schema (author, dates, publisher)
- FAQ schema for question sections
- Product mentions linking to Shopify products

---

## Website Integration

### New blog route for MDX articles

```
apps/website/app/routes/blog.$slug.tsx
```

### New section components

```
apps/website/app/components/sections/
├── BlogArticle.tsx          # Article wrapper/styling
├── TableOfContents.tsx      # Auto-generated TOC
└── AuthorBio.tsx            # Author info for E-E-A-T
```

---

## Required Packages

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.32.0",
    "better-sqlite3": "^11.6.0",
    "commander": "^13.0.0",
    "googleapis": "^144.0.0",
    "chalk": "^5.3.0",
    "ora": "^8.1.1",
    "dotenv": "^16.4.7",
    "zod": "^3.24.0"
  }
}
```

---

## Environment Variables

```bash
# apps/seo-engine/.env
GSC_CLIENT_ID=xxx
GSC_CLIENT_SECRET=xxx
GSC_REFRESH_TOKEN=xxx
GSC_SITE_URL=https://wakey.care

STORE=wakeycare
ADMIN_API_TOKEN=shpat_xxx

ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## Implementation Steps

### Phase 1: Setup

1. Create `apps/seo-engine/` directory structure
2. Create package.json with dependencies
3. Set up tsconfig.json for Node.js
4. Initialize SQLite database with schema
5. Add root package.json scripts for CLI

### Phase 2: Data Collection

6. Implement Google Search Console OAuth flow
7. Create GSC fetch command (NL market filter)
8. Implement Shopify product sync command
9. Store data in SQLite

### Phase 3: Analysis

10. Build opportunity analyzer (cross-reference GSC + products)
11. Create keyword clustering logic
12. Implement opportunity scoring algorithm

### Phase 4: Generation

13. Create Claude API service with prompt templates
14. Build MDX article generator with frontmatter
15. Add JSON-LD structured data generation
16. Implement dry-run preview mode

### Phase 5: Website Integration

17. Create blog.$slug.tsx route for MDX articles
18. Build BlogArticle section component
19. Add sitemap integration for blog articles

### Phase 6: Tracking

20. Implement performance tracking command
21. Create historical data comparison
22. Build simple CLI reporting

---

## Verification

1. **CLI works**: Run `pnpm seo:fetch --days 7` and verify GSC data in SQLite
2. **Analysis works**: Run `pnpm seo:analyze` and see opportunity list
3. **Generation works**: Run `pnpm seo:generate --topic "test" --dry-run` and verify MDX preview
4. **Article renders**: Create test article, visit `/blog/test-slug` on dev server
5. **Structured data**: Check JSON-LD in page source / Google Rich Results Test
6. **Tracking works**: Run `pnpm seo:track` after publishing and verify data

---

## Files to Modify

| File                  | Change                                       |
| --------------------- | -------------------------------------------- |
| `package.json` (root) | Add `seo:*` scripts                          |
| `turbo.json`          | Add `cli` task for seo-engine                |
| `.gitignore`          | Add `apps/seo-engine/data/*.db`              |
| `pnpm-workspace.yaml` | Already includes `apps/*` (no change needed) |

---

## Future Enhancements

- GitHub Actions for scheduled data fetching
- Competitor content analysis
- Multi-language support (DE, BE markets)
- Integration with SEMrush/Ahrefs APIs
- Simple web dashboard for non-technical users
