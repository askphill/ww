import {sqliteTable, text, integer, real, index} from 'drizzle-orm/sqlite-core';

// Auth tables
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').default("datetime('now')"),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, {onDelete: 'cascade'}),
  expiresAt: text('expires_at').notNull(),
});

export const magicLinkTokens = sqliteTable('magic_link_tokens', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
});

// GSC data
export const gscQueries = sqliteTable(
  'gsc_queries',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    query: text('query').notNull(),
    country: text('country').default('NL'),
    clicks: integer('clicks'),
    impressions: integer('impressions'),
    ctr: real('ctr'),
    position: real('position'),
    date: text('date').notNull(),
  },
  (table) => [
    index('idx_gsc_queries_date').on(table.date),
    index('idx_gsc_queries_country').on(table.country),
  ],
);

// Content management
export const opportunities = sqliteTable(
  'opportunities',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    keyword: text('keyword').notNull(),
    impressions30d: integer('impressions_30d'),
    clicks30d: integer('clicks_30d'),
    currentPosition: real('current_position'),
    opportunityScore: real('opportunity_score'),
    status: text('status').default('identified'),
    createdAt: text('created_at').default("datetime('now')"),
  },
  (table) => [index('idx_opportunities_status').on(table.status)],
);

// AI-generated insights
export const opportunityInsights = sqliteTable(
  'opportunity_insights',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    insightType: text('insight_type').notNull(), // 'content_gap', 'position_opportunity', 'ctr_improvement'
    title: text('title').notNull(),
    description: text('description').notNull(),
    relatedQueries: text('related_queries'), // JSON array of queries
    potentialImpact: real('potential_impact'), // Score 0-100
    recommendedAction: text('recommended_action'),
    matchingExistingContent: text('matching_existing_content'), // JSON array of existing content titles
    createdAt: text('created_at').default("datetime('now')"),
    updatedAt: text('updated_at'),
  },
  (table) => [index('idx_insights_type').on(table.insightType)],
);

// Keyword tracking
export const trackedKeywords = sqliteTable(
  'tracked_keywords',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    keyword: text('keyword').notNull().unique(),
    createdAt: text('created_at').default("datetime('now')"),
  },
  (table) => [index('idx_tracked_keywords_keyword').on(table.keyword)],
);

export const keywordPositions = sqliteTable(
  'keyword_positions',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    keywordId: integer('keyword_id')
      .notNull()
      .references(() => trackedKeywords.id, {onDelete: 'cascade'}),
    position: integer('position'), // null if not in top 100
    url: text('url'), // which page ranks
    date: text('date').notNull(),
    createdAt: text('created_at').default("datetime('now')"),
  },
  (table) => [
    index('idx_positions_keyword_date').on(table.keywordId, table.date),
  ],
);

// Email templates
export const emailTemplates = sqliteTable('email_templates', {
  id: integer('id').primaryKey({autoIncrement: true}),
  name: text('name').notNull(),
  description: text('description'),
  sections: text('sections').notNull(), // JSON array of section configs
  createdAt: text('created_at').default("datetime('now')"),
  updatedAt: text('updated_at'),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type MagicLinkToken = typeof magicLinkTokens.$inferSelect;
export type NewMagicLinkToken = typeof magicLinkTokens.$inferInsert;
export type GscQuery = typeof gscQueries.$inferSelect;
export type NewGscQuery = typeof gscQueries.$inferInsert;
export type Opportunity = typeof opportunities.$inferSelect;
export type NewOpportunity = typeof opportunities.$inferInsert;
export type OpportunityInsight = typeof opportunityInsights.$inferSelect;
export type NewOpportunityInsight = typeof opportunityInsights.$inferInsert;
export type TrackedKeyword = typeof trackedKeywords.$inferSelect;
export type NewTrackedKeyword = typeof trackedKeywords.$inferInsert;
export type KeywordPosition = typeof keywordPositions.$inferSelect;
export type NewKeywordPosition = typeof keywordPositions.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
