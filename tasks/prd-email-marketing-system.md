# PRD: Wakey Email Marketing System

## Introduction

Build a Klaviyo alternative integrated into Wakey Studio using Resend + React Email. The system enables marketing campaigns to subscribers synced from Shopify, with a visual template editor and full tracking/analytics.

## Goals

- Send marketing campaigns to Shopify customer segments
- Create email templates with a visual drag-drop component editor
- Track email performance (opens, clicks, conversions)
- Sync subscribers and segments from Shopify
- Provide unsubscribe functionality compliant with CAN-SPAM/GDPR

## User Stories

### Phase 1: Database Schema

US-001: Create email marketing database schema migration
As a developer, I want the database tables for the email marketing system so that I can store subscribers, templates, campaigns, and tracking data.

- Acceptance: Migration file created at `drizzle/migrations/0005_add_email_marketing.sql`
- Acceptance: Tables created: `subscribers`, `segments`, `segment_subscribers`, `email_templates`, `email_components`, `campaigns`, `email_sends`, `email_events`
- Acceptance: `subscribers` table has columns: id, email, firstName, lastName, shopifyCustomerId, visitorId, status (enum: active/unsubscribed/bounced), source, tags (JSON), subscribedAt, createdAt, updatedAt
- Acceptance: `segments` table has columns: id, name, type (enum: shopify_sync/custom), shopifySegmentId, filters (JSON), subscriberCount, createdAt, updatedAt
- Acceptance: `segment_subscribers` table has columns: segmentId, subscriberId, addedAt (composite primary key)
- Acceptance: `email_templates` table has columns: id, name, subject, previewText, components (JSON), variables (JSON), category, status (enum: draft/active), createdAt, updatedAt
- Acceptance: `email_components` table has columns: id, name, type, schema (JSON), defaultProps (JSON), reactEmailCode (text), createdAt
- Acceptance: `campaigns` table has columns: id, name, subject, templateId, segmentIds (JSON), status (enum: draft/scheduled/sending/sent/cancelled), scheduledAt, sentAt, createdAt, updatedAt
- Acceptance: `email_sends` table has columns: id, subscriberId, campaignId, flowId, resendId, status (enum: pending/sent/delivered/opened/clicked/bounced/complained), sentAt, deliveredAt, openedAt, clickedAt
- Acceptance: `email_events` table has columns: id, subscriberId, visitorId, eventType, eventData (JSON), shopifyOrderId, orderTotal, attributionType, attributionWindow, createdAt
- Acceptance: All foreign key relationships properly defined
- Acceptance: Indexes on frequently queried columns (email, shopifyCustomerId, status, campaignId)
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-002: Add Drizzle schema definitions for email marketing tables
As a developer, I want TypeScript schema definitions so that I can interact with the email marketing tables using Drizzle ORM.

- Acceptance: Schema added to `apps/studio/server/db/schema.ts`
- Acceptance: All tables from migration have corresponding Drizzle table definitions
- Acceptance: Enums defined for status fields using `sqliteTable` and proper column types
- Acceptance: Relations defined between tables (subscribers to sends, campaigns to sends, etc.)
- Acceptance: Export types for each table (Subscriber, Segment, EmailTemplate, Campaign, EmailSend, EmailEvent)
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

### Phase 2: Subscriber Management

US-003: Create subscriber CRUD API routes
As a developer, I want API endpoints for managing subscribers so that the UI can display and manage the subscriber list.

- Acceptance: Routes added to `apps/studio/server/routes/email.ts`
- Acceptance: `GET /api/email/subscribers` returns paginated list with filters (status, search, segmentId)
- Acceptance: `GET /api/email/subscribers/:id` returns single subscriber with segment memberships
- Acceptance: `POST /api/email/subscribers` creates subscriber (validates email format, checks for duplicates)
- Acceptance: `PATCH /api/email/subscribers/:id` updates subscriber fields
- Acceptance: `DELETE /api/email/subscribers/:id` soft-deletes by setting status to 'unsubscribed'
- Acceptance: All routes require authentication
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-004: Implement Shopify customer sync service
As a marketer, I want subscribers automatically synced from Shopify so that I can email my existing customers.

- Acceptance: Service created at `apps/studio/server/services/shopifySync.ts`
- Acceptance: Function `syncCustomersFromShopify` fetches customers via Shopify Admin GraphQL API
- Acceptance: Creates/updates subscribers with shopifyCustomerId mapping
- Acceptance: Handles pagination for stores with >250 customers
- Acceptance: Sets source field to 'shopify_sync'
- Acceptance: Does not overwrite subscribers who have unsubscribed
- Acceptance: Returns sync stats (created, updated, skipped counts)
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-005: Add Shopify customer webhooks endpoint
As a developer, I want to receive Shopify customer webhooks so that new customers are automatically added as subscribers.

- Acceptance: Route added at `POST /api/email/webhooks/shopify`
- Acceptance: Validates HMAC signature using SHOPIFY_WEBHOOK_SECRET
- Acceptance: Handles `customers/create` topic - creates new subscriber
- Acceptance: Handles `customers/update` topic - updates subscriber email/name if changed
- Acceptance: Handles `customers/delete` topic - marks subscriber as unsubscribed
- Acceptance: Returns 200 OK quickly, processes async if needed
- Acceptance: Logs webhook events for debugging
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-006: Create subscribers list page UI
As a marketer, I want to view my subscriber list so that I can see who I can email.

- Acceptance: Page created at `apps/studio/client/pages/email/Subscribers.tsx`
- Acceptance: Displays table with columns: Email, Name, Status, Source, Subscribed Date
- Acceptance: Shows total subscriber count and active count
- Acceptance: Search input filters by email or name
- Acceptance: Status filter dropdown (All, Active, Unsubscribed, Bounced)
- Acceptance: Pagination with 50 subscribers per page
- Acceptance: Empty state when no subscribers
- Acceptance: Loading state while fetching
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-007: Add navigation for email marketing section
As a user, I want to navigate to email marketing features so that I can access the new functionality.

- Acceptance: Sidebar updated in `apps/studio/client/components/layout/Sidebar.tsx`
- Acceptance: New "Email" section added with icon
- Acceptance: Sub-items: Subscribers, Templates, Campaigns (Flows added later)
- Acceptance: Active state highlights current page
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

### Phase 3: Segment Management

US-008: Create segment CRUD API routes
As a developer, I want API endpoints for managing segments so that marketers can organize subscribers.

- Acceptance: `GET /api/email/segments` returns all segments with subscriber counts
- Acceptance: `GET /api/email/segments/:id` returns segment with subscriber list (paginated)
- Acceptance: `POST /api/email/segments` creates custom segment
- Acceptance: `PATCH /api/email/segments/:id` updates segment (name, filters)
- Acceptance: `DELETE /api/email/segments/:id` deletes segment (only custom type)
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-009: Implement Shopify segments sync
As a marketer, I want Shopify segments synced so that I can target the same customer groups.

- Acceptance: Function `syncSegmentsFromShopify` added to shopifySync service
- Acceptance: Fetches segments via `segments` GraphQL query
- Acceptance: Creates/updates segments with type 'shopify_sync' and shopifySegmentId
- Acceptance: Syncs segment members via `customerSegmentMembers` query
- Acceptance: Updates subscriberCount after member sync
- Acceptance: Handles segments with >1000 members via pagination
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-010: Add manual segment sync trigger endpoint
As a marketer, I want to manually trigger a Shopify sync so that I can get the latest data.

- Acceptance: `POST /api/email/segments/sync` triggers full Shopify sync (customers + segments)
- Acceptance: Returns immediately with job acknowledgment
- Acceptance: Sync runs async and updates database
- Acceptance: Rate limited to prevent abuse (max once per 5 minutes)
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

### Phase 4: Email Component Library

US-011: Create Header email component
As a template creator, I want a Header component so that emails have consistent branding.

- Acceptance: Component created at `apps/studio/server/email-components/Header.tsx`
- Acceptance: Uses @react-email/components (Img, Section, Row, Column)
- Acceptance: Props: logoUrl (string), backgroundColor (string, default #1a1a1a)
- Acceptance: Logo centered with 40px height
- Acceptance: Padding: 24px top/bottom
- Acceptance: Schema JSON exported for editor
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-012: Create Hero email component
As a template creator, I want a Hero component so that emails have impactful visuals.

- Acceptance: Component created at `apps/studio/server/email-components/Hero.tsx`
- Acceptance: Props: headline (string), subheadline (string), imageUrl (string), buttonText (string), buttonUrl (string), backgroundColor (string)
- Acceptance: Headline uses Founders font fallback, 32px size
- Acceptance: Button styled with Wakey yellow (#FAD103) background
- Acceptance: Image responsive with max-width 100%
- Acceptance: Supports variable interpolation in text (e.g., `{{firstName}}`)
- Acceptance: Schema JSON exported for editor
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-013: Create TextBlock email component
As a template creator, I want a TextBlock component for body content.

- Acceptance: Component created at `apps/studio/server/email-components/TextBlock.tsx`
- Acceptance: Props: content (string), alignment (left/center/right), fontSize (paragraph/small)
- Acceptance: Uses ITC font fallback
- Acceptance: Supports basic HTML (bold, italic, links) in content
- Acceptance: Line height 1.6 for readability
- Acceptance: Schema JSON exported for editor
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-014: Create CallToAction email component
As a template creator, I want a CTA button component for driving clicks.

- Acceptance: Component created at `apps/studio/server/email-components/CallToAction.tsx`
- Acceptance: Props: text (string), url (string), variant (primary/secondary)
- Acceptance: Primary: #FAD103 background, #1a1a1a text
- Acceptance: Secondary: transparent background, #FAD103 border and text
- Acceptance: Padding: 16px 32px, border-radius 8px
- Acceptance: Centered by default
- Acceptance: Schema JSON exported for editor
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-015: Create ProductGrid email component
As a template creator, I want a ProductGrid component to showcase products.

- Acceptance: Component created at `apps/studio/server/email-components/ProductGrid.tsx`
- Acceptance: Props: products (array of {imageUrl, title, price, url}), columns (2 or 3)
- Acceptance: Responsive: 1 column on mobile, specified columns on desktop
- Acceptance: Each product shows image, title, price, and links to URL
- Acceptance: Max 6 products supported
- Acceptance: Schema JSON exported for editor
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-016: Create Footer email component
As a template creator, I want a Footer component for legal compliance.

- Acceptance: Component created at `apps/studio/server/email-components/Footer.tsx`
- Acceptance: Props: unsubscribeUrl (string), address (string), socialLinks (array of {platform, url})
- Acceptance: Unsubscribe link prominent and clickable
- Acceptance: Physical address displayed (CAN-SPAM requirement)
- Acceptance: Social icons for Instagram, TikTok if provided
- Acceptance: Muted text color (#666)
- Acceptance: Schema JSON exported for editor
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-017: Create Divider email component
As a template creator, I want a Divider component for visual separation.

- Acceptance: Component created at `apps/studio/server/email-components/Divider.tsx`
- Acceptance: Props: color (string, default #e0e0e0), spacing (small/medium/large)
- Acceptance: Horizontal line with specified color
- Acceptance: Spacing maps to padding (8px/16px/32px)
- Acceptance: Schema JSON exported for editor
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-018: Create component registry and renderer service
As a developer, I want a central registry so that components can be loaded dynamically.

- Acceptance: Registry created at `apps/studio/server/email-components/index.ts`
- Acceptance: Exports all components with their schemas
- Acceptance: Renderer service at `apps/studio/server/services/emailRenderer.ts`
- Acceptance: Function `renderTemplate(templateId, variables)` returns HTML string
- Acceptance: Uses @react-email/render to convert React to HTML
- Acceptance: Interpolates variables into component props (e.g., `{{firstName}}` → "John")
- Acceptance: Handles missing variables gracefully (empty string)
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-019: Seed default components into database
As a developer, I want components seeded into the database so that the editor can use them.

- Acceptance: Seed script at `apps/studio/server/db/seed-email-components.ts`
- Acceptance: Inserts all 7 components into `email_components` table
- Acceptance: Stores schema JSON and default props for each
- Acceptance: Idempotent (can run multiple times without duplicates)
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

### Phase 5: Template System

US-020: Create template CRUD API routes
As a developer, I want API endpoints for managing templates so that marketers can create email designs.

- Acceptance: `GET /api/email/templates` returns all templates with metadata
- Acceptance: `GET /api/email/templates/:id` returns template with full component data
- Acceptance: `POST /api/email/templates` creates template with name, subject, empty components
- Acceptance: `PATCH /api/email/templates/:id` updates template fields including components JSON
- Acceptance: `DELETE /api/email/templates/:id` soft-deletes by setting status to 'archived'
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-021: Add template preview endpoint
As a template creator, I want to preview my template so that I can see how it looks.

- Acceptance: `POST /api/email/templates/:id/preview` returns rendered HTML
- Acceptance: Accepts optional `variables` object for interpolation
- Acceptance: Uses sample data if variables not provided (firstName: "Friend")
- Acceptance: Returns both HTML and plain text versions
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-022: Add send test email endpoint
As a template creator, I want to send a test email so that I can verify rendering in real clients.

- Acceptance: `POST /api/email/templates/:id/test` sends test email via Resend
- Acceptance: Requires `to` email address in request body
- Acceptance: Subject prefixed with "[TEST] "
- Acceptance: Uses sample variables for interpolation
- Acceptance: Returns Resend message ID on success
- Acceptance: Rate limited to 10 test emails per hour
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-023: Create template list page UI
As a marketer, I want to view my templates so that I can manage my email designs.

- Acceptance: Page created at `apps/studio/client/pages/email/Templates.tsx`
- Acceptance: Displays grid of template cards with name, subject preview, last modified
- Acceptance: "Create Template" button in header
- Acceptance: Click card navigates to editor
- Acceptance: Status badge (Draft/Active)
- Acceptance: Empty state with call to action
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-024: Create template editor page layout
As a template creator, I want a visual editor so that I can build emails without code.

- Acceptance: Page created at `apps/studio/client/pages/email/Editor.tsx`
- Acceptance: Three-panel layout: Component Library (left), Canvas (center), Properties (right)
- Acceptance: Toolbar with: Template name (editable), Save button, Preview button, Send Test button
- Acceptance: Subject line input above canvas
- Acceptance: Preview text input below subject
- Acceptance: Responsive: collapses to single panel on mobile with warning
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-025: Implement component library panel in editor
As a template creator, I want to drag components from a library into my template.

- Acceptance: Left panel shows all available components from `email_components` table
- Acceptance: Components displayed as draggable cards with icon and name
- Acceptance: Uses @dnd-kit/core for drag functionality
- Acceptance: Dragging component shows ghost preview
- Acceptance: Components grouped by category if applicable
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-026: Implement canvas panel with sortable components
As a template creator, I want to arrange components in my template by dragging.

- Acceptance: Center panel shows current template components in order
- Acceptance: Uses @dnd-kit/sortable for reordering
- Acceptance: Drop zone visible when dragging new component
- Acceptance: Each component instance shows rendered preview
- Acceptance: Click component to select (shows blue border)
- Acceptance: Delete button (X) on hover to remove component
- Acceptance: Empty state prompts to drag first component
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-027: Implement properties panel in editor
As a template creator, I want to edit component properties so that I can customize my template.

- Acceptance: Right panel shows properties for selected component
- Acceptance: Properties form generated from component schema JSON
- Acceptance: Supports input types: text, textarea, color picker, select, number
- Acceptance: Changes update component instance in real-time
- Acceptance: Shows "Select a component" when nothing selected
- Acceptance: Variable hint shown for text fields (e.g., "Use {{firstName}} for personalization")
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-028: Implement template save functionality
As a template creator, I want to save my template so that my work is persisted.

- Acceptance: Save button triggers PATCH request with current components JSON
- Acceptance: Auto-save after 5 seconds of inactivity (debounced)
- Acceptance: Save indicator shows "Saving..." during request
- Acceptance: Save indicator shows "Saved" with timestamp on success
- Acceptance: Error toast on save failure
- Acceptance: Unsaved changes warning when navigating away
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-029: Implement preview modal in editor
As a template creator, I want to preview my email so that I can see the final result.

- Acceptance: Preview button opens modal
- Acceptance: Modal shows rendered HTML in iframe
- Acceptance: Toggle between desktop (600px) and mobile (375px) widths
- Acceptance: Sample variables applied to preview
- Acceptance: Close button and escape key dismiss modal
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-030: Implement send test modal in editor
As a template creator, I want to send a test email from the editor.

- Acceptance: Send Test button opens modal
- Acceptance: Email input field (pre-filled with user's email if available)
- Acceptance: Send button triggers test email endpoint
- Acceptance: Loading state during send
- Acceptance: Success message with "Check your inbox"
- Acceptance: Error message on failure
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

### Phase 6: AI Template Generation

US-031: Create AI template generation service
As a template creator, I want to generate templates with AI so that I can start quickly.

- Acceptance: Service at `apps/studio/server/services/email-ai.ts`
- Acceptance: Function `generateTemplate(prompt, brandContext)` returns components JSON
- Acceptance: Uses existing Gemini integration
- Acceptance: System prompt enforces Wakey brand: colors (#1a1a1a, #fff5eb, #fad103), tone (cheeky, warm, no emojis, no exclamation marks)
- Acceptance: Output validated against component schemas
- Acceptance: Falls back to basic template if AI fails
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-032: Add AI generation endpoint
As a developer, I want an API endpoint for AI template generation.

- Acceptance: `POST /api/email/templates/generate` accepts prompt in request body
- Acceptance: Returns generated components JSON and suggested subject line
- Acceptance: Rate limited to 20 generations per day per user
- Acceptance: Logs generation requests for monitoring
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-033: Add AI generation UI to template editor
As a template creator, I want to generate a template from a description.

- Acceptance: "Generate with AI" button in editor toolbar (or empty state)
- Acceptance: Opens modal with textarea for prompt
- Acceptance: Example prompts shown: "Welcome email for new subscribers", "Product launch announcement"
- Acceptance: Generate button triggers API call
- Acceptance: Loading state with "Generating..." message
- Acceptance: Success replaces current canvas content (with confirmation if not empty)
- Acceptance: Error message on failure
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

### Phase 7: Campaign Management

US-034: Create campaign CRUD API routes
As a developer, I want API endpoints for managing campaigns so that marketers can send emails.

- Acceptance: `GET /api/email/campaigns` returns all campaigns with status and stats
- Acceptance: `GET /api/email/campaigns/:id` returns campaign with full details and send stats
- Acceptance: `POST /api/email/campaigns` creates campaign (name, subject, templateId required)
- Acceptance: `PATCH /api/email/campaigns/:id` updates campaign (only if status is draft)
- Acceptance: `DELETE /api/email/campaigns/:id` deletes campaign (only if status is draft)
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-035: Create campaigns list page UI
As a marketer, I want to view my campaigns so that I can manage email sends.

- Acceptance: Page created at `apps/studio/client/pages/email/Campaigns.tsx`
- Acceptance: Table with columns: Name, Status, Segment(s), Sent Date, Open Rate, Click Rate
- Acceptance: "Create Campaign" button in header
- Acceptance: Status badges: Draft (gray), Scheduled (blue), Sending (yellow), Sent (green), Cancelled (red)
- Acceptance: Click row navigates to campaign editor/detail
- Acceptance: Filter by status dropdown
- Acceptance: Empty state with call to action
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-036: Create campaign editor page
As a marketer, I want to create and configure a campaign so that I can send emails.

- Acceptance: Page created at `apps/studio/client/pages/email/CampaignEditor.tsx`
- Acceptance: Form fields: Campaign name, Subject line (can override template), Preview text
- Acceptance: Template selector dropdown showing available templates
- Acceptance: Segment multi-select for choosing recipients
- Acceptance: Shows estimated recipient count based on selected segments
- Acceptance: Preview button shows template with sample data
- Acceptance: Save as Draft button
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-037: Implement campaign scheduling
As a marketer, I want to schedule a campaign for later so that I can plan my sends.

- Acceptance: Schedule options in campaign editor: Send Now, Schedule for Later
- Acceptance: Date/time picker for scheduled sends (min: 15 minutes from now)
- Acceptance: Timezone shown (defaults to user's timezone)
- Acceptance: "Schedule Campaign" button sets status to 'scheduled' and scheduledAt
- Acceptance: Scheduled campaigns show countdown on list page
- Acceptance: Cancel button for scheduled campaigns (sets status to 'cancelled')
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-038: Implement campaign sending service
As a developer, I want a service to send campaigns via Resend so that emails are delivered.

- Acceptance: Service at `apps/studio/server/services/campaignSender.ts`
- Acceptance: Function `sendCampaign(campaignId)` processes entire campaign
- Acceptance: Fetches all subscribers in selected segments (active status only)
- Acceptance: Deduplicates subscribers across multiple segments
- Acceptance: Renders template with subscriber-specific variables
- Acceptance: Sends via Resend batch API (max 100 per batch)
- Acceptance: Creates `email_sends` record for each recipient
- Acceptance: Updates campaign status to 'sending' then 'sent'
- Acceptance: Handles Resend rate limits with exponential backoff
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-039: Add send now endpoint
As a marketer, I want to send a campaign immediately so that I can reach subscribers now.

- Acceptance: `POST /api/email/campaigns/:id/send` triggers immediate send
- Acceptance: Validates campaign is in 'draft' status
- Acceptance: Validates template and segments are set
- Acceptance: Returns immediately with "Campaign sending started"
- Acceptance: Send happens async via queue/scheduled handler
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-040: Implement cron job for scheduled campaigns and processing
As a developer, I want a cron job to process scheduled campaigns.

- Acceptance: Cron handler added to `apps/studio/server/index.ts`
- Acceptance: Runs every 5 minutes (`*/5 * * * *`)
- Acceptance: Finds campaigns where status='scheduled' and scheduledAt <= now
- Acceptance: Triggers `sendCampaign` for each
- Acceptance: Logs processed campaigns
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-041: Create campaign detail/analytics page
As a marketer, I want to see campaign performance so that I can measure success.

- Acceptance: Page created at `apps/studio/client/pages/email/CampaignDetail.tsx`
- Acceptance: Shows campaign name, subject, sent date, template used
- Acceptance: Stats cards: Sent, Delivered, Opened, Clicked, Bounced, Unsubscribed
- Acceptance: Rates displayed as percentages (e.g., "45% opened")
- Acceptance: List of recipients with individual status
- Acceptance: Pagination for recipient list
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

### Phase 8: Email Tracking

US-042: Add Resend webhook handler for email events
As a developer, I want to receive Resend webhooks so that I can track email events.

- Acceptance: Route at `POST /api/email/webhooks/resend`
- Acceptance: Validates webhook signature using RESEND_WEBHOOK_SECRET
- Acceptance: Handles events: email.delivered, email.opened, email.clicked, email.bounced, email.complained
- Acceptance: Updates corresponding `email_sends` record status and timestamp
- Acceptance: For bounced: marks subscriber status as 'bounced'
- Acceptance: For complained: marks subscriber status as 'complained' (add to enum if needed)
- Acceptance: Returns 200 OK quickly
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-043: Add click tracking to email links
As a marketer, I want link clicks tracked so that I can measure engagement.

- Acceptance: Email renderer wraps all links with tracking redirect
- Acceptance: Tracking URL format: `https://studio.wakey.care/api/email/track/click?eid={{emailSendId}}&url={{encodedUrl}}`
- Acceptance: Click tracking endpoint logs click event and redirects to original URL
- Acceptance: Records click in `email_events` table
- Acceptance: Updates `email_sends.clickedAt` if first click
- Acceptance: Adds UTM parameters to destination URL: utm_source=wakey_email, utm_medium=email, utm_campaign={{campaignId}}
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-044: Add open tracking pixel to emails
As a marketer, I want email opens tracked so that I can measure engagement.

- Acceptance: Email renderer appends 1x1 transparent tracking pixel
- Acceptance: Pixel URL format: `https://studio.wakey.care/api/email/track/open?eid={{emailSendId}}`
- Acceptance: Open tracking endpoint returns 1x1 transparent GIF
- Acceptance: Records open in `email_events` table
- Acceptance: Updates `email_sends.openedAt` if first open
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

### Phase 9: Unsubscribe

US-045: Create unsubscribe token generation utility
As a developer, I want signed unsubscribe tokens so that links can't be forged.

- Acceptance: Utility at `apps/studio/server/utils/unsubscribe.ts`
- Acceptance: Function `generateUnsubscribeToken(subscriberId)` returns signed JWT
- Acceptance: Token includes subscriberId, issued timestamp
- Acceptance: Token expires after 1 year
- Acceptance: Function `verifyUnsubscribeToken(token)` returns subscriberId or throws
- Acceptance: Uses existing JWT secret from environment
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-046: Create unsubscribe page and API
As a subscriber, I want to unsubscribe easily so that I stop receiving emails.

- Acceptance: Public route at `GET /unsubscribe` (no auth required)
- Acceptance: Query param `token` required
- Acceptance: Invalid/expired token shows error message
- Acceptance: Valid token shows confirmation page with "Unsubscribe" button
- Acceptance: Page styled with Wakey branding
- Acceptance: `POST /unsubscribe` with token processes unsubscribe
- Acceptance: Updates subscriber status to 'unsubscribed'
- Acceptance: Shows "You've been unsubscribed" confirmation
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

US-047: Add List-Unsubscribe header to sent emails
As a developer, I want proper unsubscribe headers for email client support.

- Acceptance: Email renderer adds `List-Unsubscribe` header with mailto and https options
- Acceptance: Format: `List-Unsubscribe: <mailto:unsubscribe@wakey.care?subject=unsubscribe>, <https://studio.wakey.care/unsubscribe?token=xxx>`
- Acceptance: Adds `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header
- Acceptance: Footer component automatically includes unsubscribe link
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

### Phase 10: Analytics Dashboard

US-048: Create daily metrics aggregation service
As a developer, I want metrics aggregated daily so that analytics queries are fast.

- Acceptance: Service at `apps/studio/server/services/analytics.ts`
- Acceptance: Function `aggregateDailyMetrics(date)` aggregates previous day's data
- Acceptance: Creates records in `daily_email_metrics` (sent, delivered, opened, clicked, bounced, unsubscribed per campaign)
- Acceptance: Creates records in `daily_subscriber_metrics` (new, unsubscribed, net growth, total active)
- Acceptance: Handles re-aggregation gracefully (upserts)
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-049: Add analytics aggregation to daily cron
As a developer, I want analytics aggregated automatically each day.

- Acceptance: Cron trigger added for 2 AM daily (`0 2 * * *`)
- Acceptance: Cron handler calls `aggregateDailyMetrics` for previous day
- Acceptance: Logs aggregation completion
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-050: Create analytics API endpoints
As a developer, I want analytics API endpoints for the dashboard.

- Acceptance: `GET /api/email/analytics/overview` returns: total subscribers, active subscribers, growth rate (7d), total sent (30d), avg open rate, avg click rate
- Acceptance: `GET /api/email/analytics/engagement?period=7d|30d|90d` returns daily open/click rates for chart
- Acceptance: `GET /api/email/analytics/campaigns` returns campaign performance comparison
- Acceptance: All endpoints use aggregated tables for performance
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-051: Create email analytics dashboard page
As a marketer, I want an analytics dashboard so that I can monitor email performance.

- Acceptance: Page created at `apps/studio/client/pages/email/Dashboard.tsx`
- Acceptance: Overview cards: Total Subscribers, Active Subscribers, Emails Sent (30d), Avg Open Rate, Avg Click Rate
- Acceptance: Line chart showing engagement over time (opens/clicks)
- Acceptance: Period selector: Last 7 days, 30 days, 90 days
- Acceptance: Campaign performance table showing recent campaigns with stats
- Acceptance: Loading states for all sections
- Acceptance: Typecheck passes (`pnpm typecheck`)
- Acceptance: Verify in browser using chrome-devtools MCP

---

### Phase 11: Routing and Polish

US-052: Add email routes to router configuration
As a developer, I want all email pages routed correctly.

- Acceptance: Routes added to `apps/studio/client/router.tsx` (or equivalent)
- Acceptance: `/email` redirects to `/email/dashboard`
- Acceptance: `/email/dashboard` → Dashboard page
- Acceptance: `/email/subscribers` → Subscribers page
- Acceptance: `/email/templates` → Templates list page
- Acceptance: `/email/templates/new` → Editor with new template
- Acceptance: `/email/templates/:id` → Editor with existing template
- Acceptance: `/email/campaigns` → Campaigns list page
- Acceptance: `/email/campaigns/new` → Campaign editor (new)
- Acceptance: `/email/campaigns/:id` → Campaign detail page
- Acceptance: `/email/campaigns/:id/edit` → Campaign editor (existing)
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-053: Add required environment variables documentation
As a developer, I want environment variables documented so that setup is clear.

- Acceptance: Variables added to `apps/studio/.dev.vars.example`: SHOPIFY_ADMIN_API_TOKEN, SHOPIFY_STORE_DOMAIN, SHOPIFY_WEBHOOK_SECRET, RESEND_WEBHOOK_SECRET
- Acceptance: README or CLAUDE.md updated with setup instructions for Shopify webhooks
- Acceptance: Typecheck passes (`pnpm typecheck`)

US-054: Install required dependencies
As a developer, I want all dependencies installed.

- Acceptance: `pnpm add @xyflow/react @dnd-kit/core @dnd-kit/sortable @react-email/components @react-email/render` run in apps/studio
- Acceptance: package.json updated
- Acceptance: pnpm-lock.yaml updated
- Acceptance: Typecheck passes (`pnpm typecheck`)

---

## Non-Goals

- Flow builder (automated email sequences) - deferred to Phase 2
- Website cookie tracking and attribution - deferred to Phase 2
- Newsletter signup widget - deferred to Phase 2
- Revenue attribution and conversion tracking - deferred to Phase 2
- A/B testing - future feature
- Custom segment builder with complex filters - future feature
- Email preference center (manage subscription topics) - future feature

## Design Considerations

- Template editor should follow existing Studio patterns (similar to other editors in the app)
- Use Wakey brand colors consistently in email components
- Mobile-first consideration: editor should show "Desktop recommended" on mobile
- Accessibility: email templates should work without images (alt text required)

## Technical Considerations

- Resend batch API limited to 100 recipients per request
- Shopify Admin API rate limit: 2 requests/second (need backoff)
- Email tracking pixels may be blocked by privacy features (accept undercount)
- Store all times in UTC, display in user's timezone
- Use existing Hono auth middleware for protected routes

## Success Metrics

- Successfully send a campaign to 100+ subscribers
- Template editor usable without documentation
- Open tracking working (verify in email client)
- Click tracking working (verify redirect and UTM params)
- Unsubscribe completes in < 2 clicks

## Open Questions

1. Should we support multiple email sender identities/from addresses?
2. What's the physical address to include in email footers (CAN-SPAM requirement)?
3. Should draft templates be visible to all team members or per-user?
4. Do we need approval workflow for campaigns before sending?
