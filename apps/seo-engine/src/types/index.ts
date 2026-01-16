import {z} from 'zod';

// GSC Query data
export const GscQuerySchema = z.object({
  query: z.string(),
  country: z.string().default('NL'),
  clicks: z.number(),
  impressions: z.number(),
  ctr: z.number(),
  position: z.number(),
  date: z.string(),
});

export type GscQuery = z.infer<typeof GscQuerySchema>;

// Shopify product
export const ProductSchema = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  tags: z.array(z.string()),
  syncedAt: z.string().optional(),
});

export type Product = z.infer<typeof ProductSchema>;

// Content opportunity
export const OpportunitySchema = z.object({
  id: z.number().optional(),
  keyword: z.string(),
  impressions30d: z.number(),
  clicks30d: z.number(),
  currentPosition: z.number(),
  relatedProductId: z.string().nullable(),
  opportunityScore: z.number(),
  status: z
    .enum(['identified', 'in_progress', 'completed', 'skipped'])
    .default('identified'),
});

export type Opportunity = z.infer<typeof OpportunitySchema>;

// Generated article
export const ArticleSchema = z.object({
  id: z.number().optional(),
  slug: z.string(),
  title: z.string(),
  targetKeyword: z.string(),
  relatedProductId: z.string().nullable(),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
  mdxPath: z.string().nullable(),
  generatedAt: z.string().optional(),
  publishedAt: z.string().nullable(),
});

export type Article = z.infer<typeof ArticleSchema>;

// Article performance
export const ArticlePerformanceSchema = z.object({
  id: z.number().optional(),
  articleId: z.number(),
  date: z.string(),
  impressions: z.number(),
  clicks: z.number(),
  avgPosition: z.number(),
});

export type ArticlePerformance = z.infer<typeof ArticlePerformanceSchema>;

// Article frontmatter for MDX
export interface ArticleFrontmatter {
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage?: {
    url: string;
    alt: string;
  };
  relatedProduct?: {
    handle: string;
  };
}

// CLI options
export interface FetchOptions {
  days: number;
  country: string;
}

export interface AnalyzeOptions {
  minImpressions: number;
  maxPosition: number;
}

export interface GenerateOptions {
  topic: string;
  product?: string;
  dryRun: boolean;
}

export interface TrackOptions {
  all: boolean;
  period: number;
}
