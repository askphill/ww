-- Add email marketing tables

-- Subscribers table
CREATE TABLE `subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`first_name` text,
	`last_name` text,
	`shopify_customer_id` text,
	`visitor_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text,
	`tags` text,
	`subscribed_at` text DEFAULT (datetime('now')),
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_email_unique` ON `subscribers` (`email`);
--> statement-breakpoint
CREATE INDEX `idx_subscribers_email` ON `subscribers` (`email`);
--> statement-breakpoint
CREATE INDEX `idx_subscribers_shopify_customer_id` ON `subscribers` (`shopify_customer_id`);
--> statement-breakpoint
CREATE INDEX `idx_subscribers_status` ON `subscribers` (`status`);

-- Segments table
--> statement-breakpoint
CREATE TABLE `segments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'custom' NOT NULL,
	`shopify_segment_id` text,
	`filters` text,
	`subscriber_count` integer DEFAULT 0,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX `idx_segments_type` ON `segments` (`type`);

-- Segment subscribers join table
--> statement-breakpoint
CREATE TABLE `segment_subscribers` (
	`segment_id` integer NOT NULL,
	`subscriber_id` integer NOT NULL,
	`added_at` text DEFAULT (datetime('now')),
	PRIMARY KEY (`segment_id`, `subscriber_id`),
	FOREIGN KEY (`segment_id`) REFERENCES `segments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Email templates table
--> statement-breakpoint
CREATE TABLE `email_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`preview_text` text,
	`components` text,
	`variables` text,
	`category` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX `idx_email_templates_status` ON `email_templates` (`status`);

-- Email components table
--> statement-breakpoint
CREATE TABLE `email_components` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`schema` text,
	`default_props` text,
	`react_email_code` text,
	`created_at` text DEFAULT (datetime('now'))
);

-- Campaigns table
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`template_id` integer,
	`segment_ids` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`scheduled_at` text,
	`sent_at` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_campaigns_status` ON `campaigns` (`status`);

-- Email sends table
--> statement-breakpoint
CREATE TABLE `email_sends` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subscriber_id` integer NOT NULL,
	`campaign_id` integer,
	`flow_id` integer,
	`resend_id` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`sent_at` text,
	`delivered_at` text,
	`opened_at` text,
	`clicked_at` text,
	FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_email_sends_subscriber_id` ON `email_sends` (`subscriber_id`);
--> statement-breakpoint
CREATE INDEX `idx_email_sends_campaign_id` ON `email_sends` (`campaign_id`);
--> statement-breakpoint
CREATE INDEX `idx_email_sends_status` ON `email_sends` (`status`);

-- Email events table
--> statement-breakpoint
CREATE TABLE `email_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subscriber_id` integer,
	`visitor_id` text,
	`event_type` text NOT NULL,
	`event_data` text,
	`shopify_order_id` text,
	`order_total` real,
	`attribution_type` text,
	`attribution_window` text,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_email_events_subscriber_id` ON `email_events` (`subscriber_id`);
--> statement-breakpoint
CREATE INDEX `idx_email_events_event_type` ON `email_events` (`event_type`);
--> statement-breakpoint
CREATE INDEX `idx_email_events_created_at` ON `email_events` (`created_at`);
