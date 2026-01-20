# Wakey Email Marketing System - Technical Specification

> Klaviyo alternative built with Resend + React Email, integrated into Wakey Studio

## Overview

| Aspect             | Decision                                       |
| ------------------ | ---------------------------------------------- |
| **Email Provider** | Resend (already integrated)                    |
| **Templates**      | React Email + AI generation + component editor |
| **Flow Builder**   | React Flow (@xyflow/react) visual drag-drop    |
| **Database**       | Cloudflare D1 (existing)                       |
| **Triggers**       | Cookie tracking, Shopify webhooks              |
| **First Flow**     | Welcome Series                                 |

---

## Phase 1: Database Schema

**File:** `apps/studio/server/db/schema.ts`

Add these tables to existing schema:

```typescript
// Subscribers
subscribers: (id,
  email,
  firstName,
  lastName,
  shopifyCustomerId,
  visitorId,
  status(active | unsubscribed | bounced),
  source,
  tags,
  subscribedAt);

// Segments (synced from Shopify + custom)
segments: (id,
  name,
  type(shopify_sync | custom),
  shopifySegmentId,
  filters,
  subscriberCount);
segmentSubscribers: (segmentId, subscriberId, addedAt);

// Email Templates (JSON component structure)
emailTemplates: (id,
  name,
  subject,
  previewText,
  components(JSON),
  variables(JSON),
  category,
  status,
  createdAt);

// Email Components (pre-built library)
emailComponents: (id,
  name,
  type,
  schema(JSON),
  defaultProps(JSON),
  reactEmailCode);

// Flows
flows: (id,
  name,
  trigger,
  triggerConfig,
  status(draft | active | paused),
  entryCount);
flowSteps: (id,
  flowId,
  stepOrder,
  type(email | delay | condition),
  config(JSON),
  positionX,
  positionY);

// Flow Enrollments (subscribers in flows)
flowEnrollments: (id,
  flowId,
  subscriberId,
  currentStepId,
  status,
  nextActionAt,
  triggerData);

// Campaigns (one-off sends)
campaigns: (id,
  name,
  subject,
  templateId,
  segmentIds,
  status,
  scheduledAt,
  sentAt);

// Tracking
emailSends: (id,
  subscriberId,
  campaignId,
  flowId,
  resendId,
  status,
  sentAt,
  openedAt,
  clickedAt);
emailEvents: (id,
  subscriberId,
  visitorId,
  eventType,
  eventData,
  shopifyOrderId,
  orderTotal);
```

**Migration:** `drizzle/migrations/0005_add_email_marketing.sql`

---

## Phase 2: Email Template System

### Component Library

**Directory:** `apps/studio/server/email-components/`

| Component      | Props                                                  | Purpose                |
| -------------- | ------------------------------------------------------ | ---------------------- |
| `Header`       | logoUrl, backgroundColor                               | Brand header with logo |
| `Hero`         | headline, subheadline, imageUrl, buttonText, buttonUrl | Main visual section    |
| `ProductGrid`  | products[], columns                                    | Product showcase       |
| `TextBlock`    | content, alignment                                     | Rich text              |
| `CallToAction` | text, url, variant                                     | CTA button             |
| `Divider`      | color, spacing                                         | Visual separator       |
| `Footer`       | unsubscribeUrl, address, socialLinks                   | Legal footer           |

### Template Storage Format

```json
{
  "components": [
    { "id": "inst_1", "componentId": "header", "props": {...}, "order": 0 },
    { "id": "inst_2", "componentId": "hero", "props": {"headline": "Hey {{firstName}}"}, "order": 1 }
  ],
  "variables": [
    { "name": "firstName", "type": "string", "required": true }
  ]
}
```

### AI Generation

**Service:** `apps/studio/server/services/email-ai.ts`

- Use Gemini (existing) with design system prompt
- Enforce Wakey colors: `#1a1a1a`, `#fff5eb`, `#fad103`
- Enforce tone: cheeky, warm, real (no emojis, no exclamation marks)
- Output: JSON component structure

### Editor UI

**Pages:**

- `apps/studio/client/pages/email/Templates.tsx` - List
- `apps/studio/client/pages/email/Editor.tsx` - Visual editor

**Editor Layout:**

```
┌─────────────────────────────────────────────────────┐
│ Toolbar: Name | Save | Preview | Send Test          │
├──────────┬────────────────────────┬─────────────────┤
│ Component│     Canvas/Preview     │   Properties    │
│ Library  │   (drag-drop reorder)  │     Panel       │
│  (left)  │       (center)         │    (right)      │
└──────────┴────────────────────────┴─────────────────┘
```

**Dependencies:** `@dnd-kit/core`, `@dnd-kit/sortable`

---

## Phase 3: Flow Builder

### Library

**Choice:** `@xyflow/react` (React Flow)

Reasons: Built-in drag/zoom/pan, custom nodes, MIT license, TypeScript

### Node Types

| Node            | Config                 | Handles                     |
| --------------- | ---------------------- | --------------------------- |
| `TriggerNode`   | triggerType, filters   | 1 output                    |
| `DelayNode`     | duration, unit         | 1 input, 1 output           |
| `ConditionNode` | field, operator, value | 1 input, 2 outputs (yes/no) |
| `SendEmailNode` | templateId, subject    | 1 input, 1 output           |

### State Management

```typescript
// Context + useReducer for undo/redo
interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  history: {nodes; edges}[];
  historyIndex: number;
}
```

### Flow Engine (Backend)

**Service:** `apps/studio/server/services/flowEngine.ts`

```typescript
// Cron job every 5 minutes
async function processFlowEnrollments(db, env) {
  // 1. Get enrollments where nextActionAt <= now
  // 2. For each: execute current step
  //    - email: send via Resend, advance
  //    - delay: set nextActionAt, advance
  //    - condition: evaluate, jump to branch
  // 3. Mark completed when no more steps
}
```

### Pages

- `apps/studio/client/pages/email/Flows.tsx` - List
- `apps/studio/client/pages/email/FlowBuilder.tsx` - Visual builder

**Mobile:** Show "Desktop Required" message (flow builder is desktop-only)

---

## Phase 4: Campaigns

### Workflow

1. Create campaign: name, subject, select template, select segment(s)
2. Preview with sample data
3. Schedule or send immediately
4. Track: sent, delivered, opened, clicked, conversions

### Pages

- `apps/studio/client/pages/email/Campaigns.tsx` - List
- `apps/studio/client/pages/email/CampaignEditor.tsx` - Create/edit

---

## Phase 5: Integrations

### Shopify Webhooks

**Endpoint:** `apps/studio/server/routes/shopify-webhooks.ts`

| Webhook            | Action                                                             |
| ------------------ | ------------------------------------------------------------------ |
| `customers/create` | Create subscriber, enroll in welcome flow                          |
| `orders/create`    | Record purchase event, exit cart abandonment, enroll post-purchase |
| `checkouts/update` | Track for abandonment detection                                    |

### Shopify Segments Sync

```typescript
// Cron: sync segments via GraphQL Admin API
const segments = await shopifyAdmin.query(`
  query { segments(first: 50) { nodes { id name query } } }
`);
// Upsert to segments table
// Sync members via customerSegmentMembers query
```

### Website Tracking

**File:** `apps/website/app/components/EmailTracking.tsx`

```typescript
// Set wk_visitor cookie (UUID)
// Track events: page_view, add_to_cart
// POST to studio.wakey.care/api/email/events
```

### Newsletter Signup

**Route:** `apps/website/app/routes/api.newsletter.tsx`

- Receive email from form
- POST to studio subscriber API
- Set wk_subscriber cookie
- Trigger welcome flow enrollment

### Resend Webhooks

**Endpoint:** `apps/studio/server/routes/resend-webhooks.ts`

Handle: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`

Update emailSends status, mark subscribers bounced/complained

---

## Phase 6: Unsubscribe

### Requirements (CAN-SPAM/GDPR)

- 1-2 clicks max, no login
- Immediate effect
- Physical address in footer

### Implementation

**Public route:** `/unsubscribe?token=xxx`

- Token = signed JWT with subscriberId
- GET: Show confirmation page
- POST: Update subscriber status to 'unsubscribed'

**Email header:** `List-Unsubscribe: <https://studio.wakey.care/unsubscribe?email=xxx>`

---

## Phase 7: Analytics

### Revenue Attribution (Cookie + UTM Tracking)

**How it works:**

```
1. Email CTA links include tracking params:
   https://wakey.care/products/deo?utm_source=wakey_email&utm_medium=email
   &utm_campaign={{campaignId}}&eid={{emailSendId}}

2. Website captures `eid` param on landing:
   - Store in cookie: wk_email_attr = {eid, timestamp}
   - Cookie expires after 5 days

3. On purchase (Shopify orders/create webhook):
   - Check for wk_email_attr cookie via website API call
   - If exists and within 5-day window → attribute order to that emailSendId
   - Store: emailEvents.eventType = 'conversion', shopifyOrderId, orderTotal

4. For opens (1-day window):
   - If no click attribution exists
   - Check if customer email received email in past 24hrs
   - Attribute as "open-attributed" (lower confidence)
```

**Database additions to emailEvents:**

```typescript
emailEvents: {
  // ... existing fields
  attributionType: text('attribution_type'), // 'click' | 'open' | null
  attributionWindow: integer('attribution_window'), // days since email
}
```

### Daily Aggregation Cron

**File:** `apps/studio/server/services/analytics.ts`

```typescript
// Cron: 0 2 * * * (2:00 AM daily)
async function aggregateDailyMetrics(db, env) {
  const yesterday = getYesterdayDateRange();

  // 1. Aggregate email metrics per campaign/flow
  await db.insert(dailyEmailMetrics).values({
    date: yesterday.date,
    campaignId: ...,
    sent: countSent,
    delivered: countDelivered,
    opened: countOpened,
    clicked: countClicked,
    bounced: countBounced,
    unsubscribed: countUnsubscribed,
  });

  // 2. Aggregate revenue attribution
  await db.insert(dailyRevenueMetrics).values({
    date: yesterday.date,
    campaignId: ...,
    conversions: countConversions,
    revenue: sumRevenue,
    avgOrderValue: avgOrderValue,
  });

  // 3. Aggregate subscriber growth
  await db.insert(dailySubscriberMetrics).values({
    date: yesterday.date,
    newSubscribers: countNew,
    unsubscribes: countUnsubscribed,
    netGrowth: countNew - countUnsubscribed,
    totalActive: countTotalActive,
  });
}
```

**New aggregation tables:**

```typescript
dailyEmailMetrics: (date,
  campaignId,
  flowId,
  sent,
  delivered,
  opened,
  clicked,
  bounced,
  unsubscribed);

dailyRevenueMetrics: (date,
  campaignId,
  flowId,
  conversions,
  revenue,
  avgOrderValue,
  attributionType);

dailySubscriberMetrics: (date,
  newSubscribers,
  unsubscribes,
  netGrowth,
  totalActive,
  bySource(JSON));
```

### Dashboard Metrics

| Section          | Metrics                                        | Source                                |
| ---------------- | ---------------------------------------------- | ------------------------------------- |
| **Overview**     | Total subscribers, growth rate, active flows   | dailySubscriberMetrics                |
| **Email Health** | Delivery rate, bounce rate, complaint rate     | dailyEmailMetrics                     |
| **Engagement**   | Open rate, click rate, click-to-open rate      | dailyEmailMetrics                     |
| **Revenue**      | Total attributed, per email, per subscriber    | dailyRevenueMetrics                   |
| **Flows**        | Enrollments, completion rate, revenue per flow | flowEnrollments + dailyRevenueMetrics |
| **Campaigns**    | Send count, performance comparison             | campaigns + dailyEmailMetrics         |

### Dashboard API Endpoints

```
GET /api/email/analytics/overview
    → subscriber count, growth, email health summary

GET /api/email/analytics/engagement?period=30d
    → open/click rates over time (chart data)

GET /api/email/analytics/revenue?period=30d
    → attributed revenue over time, by campaign/flow

GET /api/email/analytics/campaigns/:id
    → detailed campaign performance

GET /api/email/analytics/flows/:id
    → detailed flow performance + funnel
```

### Cron Schedule Update

```jsonc
"triggers": {
  "crons": [
    "0 6 * * *",    // Daily SEO check (existing)
    "*/5 * * * *",  // Flow processing + campaign sending
    "0 2 * * *"     // Daily analytics aggregation (2 AM)
  ]
}
```

### Known Limitations

| Issue                       | Impact                                                | Mitigation                                       |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------------ |
| iOS Mail Privacy Protection | ~40-50% of opens are pre-fetched (fake)               | Focus on click rate as primary engagement metric |
| Cross-device tracking       | User clicks on phone, buys on laptop = no attribution | Email-matching fallback for known customers      |
| Ad blockers                 | May block tracking pixels                             | Accept ~10-15% undercount                        |
| Cookie expiry               | Attribution lost after 5 days                         | Industry standard, acceptable trade-off          |

---

## API Routes Summary

**File:** `apps/studio/server/routes/email.ts`

```
GET/POST   /api/email/subscribers
GET/PATCH  /api/email/subscribers/:id
POST       /api/email/subscribers/import

GET/POST   /api/email/segments
POST       /api/email/segments/:id/sync

GET/POST   /api/email/templates
GET/PATCH  /api/email/templates/:id
POST       /api/email/templates/:id/preview
POST       /api/email/templates/generate

GET/POST   /api/email/flows
GET/PATCH  /api/email/flows/:id
POST       /api/email/flows/:id/activate
POST       /api/email/flows/:id/pause

GET/POST   /api/email/campaigns
POST       /api/email/campaigns/:id/send
POST       /api/email/campaigns/:id/schedule

POST       /api/email/events
GET        /api/email/analytics/overview

POST       /api/email/webhooks/resend
POST       /api/email/webhooks/shopify

GET/POST   /api/email/unsubscribe/:token
```

---

## Cron Jobs

**File:** `apps/studio/wrangler.jsonc`

```jsonc
"triggers": {
  "crons": [
    "0 6 * * *",    // Daily SEO check (existing)
    "*/5 * * * *"   // Flow processing + campaign sending
  ]
}
```

---

## Environment Variables

Add to `apps/studio/.dev.vars`:

```
SHOPIFY_ADMIN_API_TOKEN=
SHOPIFY_STORE_DOMAIN=wakeycare.myshopify.com
SHOPIFY_WEBHOOK_SECRET=
RESEND_WEBHOOK_SECRET=
```

---

## Dependencies to Add

```bash
pnpm add @xyflow/react @dnd-kit/core @dnd-kit/sortable @react-email/components @react-email/render
```

---

## Implementation Order

### Week 1: Foundation

1. [ ] Add database schema migration
2. [ ] Create subscriber CRUD API
3. [ ] Implement unsubscribe page
4. [ ] Set up Resend webhook handler

### Week 2: Templates

5. [ ] Create email component library (React Email)
6. [ ] Build template storage/render service
7. [ ] Implement template CRUD API
8. [ ] Build template editor UI with AI generation

### Week 3: Campaigns

9. [ ] Implement campaign CRUD API
10. [ ] Build campaign editor UI
11. [ ] Add scheduling + immediate send
12. [ ] Connect Resend sending

### Week 4-5: Flows

13. [ ] Implement flow engine core
14. [ ] Create flow CRUD API + step management
15. [ ] Build visual flow builder with React Flow
16. [ ] Add cron job for flow processing

### Week 6: Integrations

17. [ ] Set up Shopify webhooks
18. [ ] Implement segment sync
19. [ ] Add website cookie tracking
20. [ ] Build newsletter signup component

### Week 7: Analytics + First Flow

21. [ ] Build analytics dashboard
22. [ ] Implement revenue attribution
23. [ ] Create Welcome Series flow template
24. [ ] End-to-end testing

---

## Verification Plan

1. **Subscriber flow:** Sign up on website → appears in studio → receives welcome email
2. **Template creation:** AI generate → edit components → preview → send test
3. **Campaign send:** Create → select segment → schedule → verify delivery + tracking
4. **Flow execution:** Trigger signup → delay → send email → verify timing
5. **Unsubscribe:** Click link → confirm → verify no more emails
6. **Attribution:** Click email → purchase → verify revenue tracked

---

## Critical Files

| Purpose                | Path                                             |
| ---------------------- | ------------------------------------------------ |
| DB Schema              | `apps/studio/server/db/schema.ts`                |
| Email Routes           | `apps/studio/server/routes/email.ts`             |
| Flow Engine            | `apps/studio/server/services/flowEngine.ts`      |
| Email Renderer         | `apps/studio/server/services/emailRenderer.ts`   |
| React Email Components | `apps/studio/server/email-components/`           |
| Template Editor        | `apps/studio/client/pages/email/Editor.tsx`      |
| Flow Builder           | `apps/studio/client/pages/email/FlowBuilder.tsx` |
| Website Tracking       | `apps/website/app/components/EmailTracking.tsx`  |
| Newsletter Signup      | `apps/website/app/routes/api.newsletter.tsx`     |
