import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import {relations} from 'drizzle-orm';

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
    plan: text('plan'), // AI-generated detailed action plan
    blogPost: text('blog_post'), // AI-generated blog post content
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

// Email marketing tables
export const subscribers = sqliteTable(
  'subscribers',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    email: text('email').notNull().unique(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    shopifyCustomerId: text('shopify_customer_id'),
    visitorId: text('visitor_id'),
    status: text('status', {enum: ['active', 'unsubscribed', 'bounced']})
      .notNull()
      .default('active'),
    source: text('source'),
    tags: text('tags'), // JSON array
    subscribedAt: text('subscribed_at').default("datetime('now')"),
    createdAt: text('created_at').default("datetime('now')"),
    updatedAt: text('updated_at').default("datetime('now')"),
  },
  (table) => [
    index('idx_subscribers_email').on(table.email),
    index('idx_subscribers_shopify_customer_id').on(table.shopifyCustomerId),
    index('idx_subscribers_status').on(table.status),
  ],
);

export const segments = sqliteTable(
  'segments',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    name: text('name').notNull(),
    type: text('type', {enum: ['shopify_sync', 'custom']})
      .notNull()
      .default('custom'),
    shopifySegmentId: text('shopify_segment_id'),
    filters: text('filters'), // JSON
    subscriberCount: integer('subscriber_count').default(0),
    createdAt: text('created_at').default("datetime('now')"),
    updatedAt: text('updated_at').default("datetime('now')"),
  },
  (table) => [index('idx_segments_type').on(table.type)],
);

export const segmentSubscribers = sqliteTable(
  'segment_subscribers',
  {
    segmentId: integer('segment_id')
      .notNull()
      .references(() => segments.id, {onDelete: 'cascade'}),
    subscriberId: integer('subscriber_id')
      .notNull()
      .references(() => subscribers.id, {onDelete: 'cascade'}),
    addedAt: text('added_at').default("datetime('now')"),
  },
  (table) => [primaryKey({columns: [table.segmentId, table.subscriberId]})],
);

export const emailTemplates = sqliteTable(
  'email_templates',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    name: text('name').notNull(),
    subject: text('subject').notNull(),
    previewText: text('preview_text'),
    components: text('components'), // JSON
    variables: text('variables'), // JSON
    category: text('category'),
    status: text('status', {enum: ['draft', 'active', 'archived']})
      .notNull()
      .default('draft'),
    createdAt: text('created_at').default("datetime('now')"),
    updatedAt: text('updated_at').default("datetime('now')"),
  },
  (table) => [index('idx_email_templates_status').on(table.status)],
);

export const emailComponents = sqliteTable('email_components', {
  id: integer('id').primaryKey({autoIncrement: true}),
  name: text('name').notNull(),
  type: text('type').notNull(),
  schema: text('schema'), // JSON
  defaultProps: text('default_props'), // JSON
  reactEmailCode: text('react_email_code'),
  createdAt: text('created_at').default("datetime('now')"),
});

export const campaigns = sqliteTable(
  'campaigns',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    name: text('name').notNull(),
    subject: text('subject').notNull(),
    templateId: integer('template_id').references(() => emailTemplates.id, {
      onDelete: 'set null',
    }),
    segmentIds: text('segment_ids'), // JSON array
    status: text('status', {
      enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
    })
      .notNull()
      .default('draft'),
    scheduledAt: text('scheduled_at'),
    sentAt: text('sent_at'),
    createdAt: text('created_at').default("datetime('now')"),
    updatedAt: text('updated_at').default("datetime('now')"),
  },
  (table) => [index('idx_campaigns_status').on(table.status)],
);

export const emailSends = sqliteTable(
  'email_sends',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    subscriberId: integer('subscriber_id')
      .notNull()
      .references(() => subscribers.id, {onDelete: 'cascade'}),
    campaignId: integer('campaign_id').references(() => campaigns.id, {
      onDelete: 'cascade',
    }),
    flowId: integer('flow_id'),
    resendId: text('resend_id'),
    status: text('status', {
      enum: [
        'pending',
        'sent',
        'delivered',
        'opened',
        'clicked',
        'bounced',
        'complained',
      ],
    })
      .notNull()
      .default('pending'),
    sentAt: text('sent_at'),
    deliveredAt: text('delivered_at'),
    openedAt: text('opened_at'),
    clickedAt: text('clicked_at'),
  },
  (table) => [
    index('idx_email_sends_subscriber_id').on(table.subscriberId),
    index('idx_email_sends_campaign_id').on(table.campaignId),
    index('idx_email_sends_status').on(table.status),
  ],
);

export const emailEvents = sqliteTable(
  'email_events',
  {
    id: integer('id').primaryKey({autoIncrement: true}),
    subscriberId: integer('subscriber_id').references(() => subscribers.id, {
      onDelete: 'set null',
    }),
    visitorId: text('visitor_id'),
    eventType: text('event_type').notNull(),
    eventData: text('event_data'), // JSON
    shopifyOrderId: text('shopify_order_id'),
    orderTotal: real('order_total'),
    attributionType: text('attribution_type'),
    attributionWindow: text('attribution_window'),
    createdAt: text('created_at').default("datetime('now')"),
  },
  (table) => [
    index('idx_email_events_subscriber_id').on(table.subscriberId),
    index('idx_email_events_event_type').on(table.eventType),
    index('idx_email_events_created_at').on(table.createdAt),
  ],
);

// Email marketing relations
export const subscribersRelations = relations(subscribers, ({many}) => ({
  segmentSubscribers: many(segmentSubscribers),
  emailSends: many(emailSends),
  emailEvents: many(emailEvents),
}));

export const segmentsRelations = relations(segments, ({many}) => ({
  segmentSubscribers: many(segmentSubscribers),
}));

export const segmentSubscribersRelations = relations(
  segmentSubscribers,
  ({one}) => ({
    segment: one(segments, {
      fields: [segmentSubscribers.segmentId],
      references: [segments.id],
    }),
    subscriber: one(subscribers, {
      fields: [segmentSubscribers.subscriberId],
      references: [subscribers.id],
    }),
  }),
);

export const emailTemplatesRelations = relations(emailTemplates, ({many}) => ({
  campaigns: many(campaigns),
}));

export const campaignsRelations = relations(campaigns, ({one, many}) => ({
  template: one(emailTemplates, {
    fields: [campaigns.templateId],
    references: [emailTemplates.id],
  }),
  emailSends: many(emailSends),
}));

export const emailSendsRelations = relations(emailSends, ({one}) => ({
  subscriber: one(subscribers, {
    fields: [emailSends.subscriberId],
    references: [subscribers.id],
  }),
  campaign: one(campaigns, {
    fields: [emailSends.campaignId],
    references: [campaigns.id],
  }),
}));

export const emailEventsRelations = relations(emailEvents, ({one}) => ({
  subscriber: one(subscribers, {
    fields: [emailEvents.subscriberId],
    references: [subscribers.id],
  }),
}));

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

// Email marketing types
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;
export type Segment = typeof segments.$inferSelect;
export type NewSegment = typeof segments.$inferInsert;
export type SegmentSubscriber = typeof segmentSubscribers.$inferSelect;
export type NewSegmentSubscriber = typeof segmentSubscribers.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;
export type EmailComponent = typeof emailComponents.$inferSelect;
export type NewEmailComponent = typeof emailComponents.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type EmailSend = typeof emailSends.$inferSelect;
export type NewEmailSend = typeof emailSends.$inferInsert;
export type EmailEvent = typeof emailEvents.$inferSelect;
export type NewEmailEvent = typeof emailEvents.$inferInsert;
