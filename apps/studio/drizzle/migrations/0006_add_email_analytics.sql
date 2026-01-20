-- Add email analytics aggregation tables

-- Daily email metrics per campaign
CREATE TABLE `daily_email_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`campaign_id` integer,
	`sent` integer DEFAULT 0 NOT NULL,
	`delivered` integer DEFAULT 0 NOT NULL,
	`opened` integer DEFAULT 0 NOT NULL,
	`clicked` integer DEFAULT 0 NOT NULL,
	`bounced` integer DEFAULT 0 NOT NULL,
	`unsubscribed` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_email_metrics_date_campaign` ON `daily_email_metrics` (`date`, `campaign_id`);
--> statement-breakpoint
CREATE INDEX `idx_daily_email_metrics_date` ON `daily_email_metrics` (`date`);
--> statement-breakpoint
CREATE INDEX `idx_daily_email_metrics_campaign_id` ON `daily_email_metrics` (`campaign_id`);

-- Daily subscriber metrics
--> statement-breakpoint
CREATE TABLE `daily_subscriber_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`new_subscribers` integer DEFAULT 0 NOT NULL,
	`unsubscribed` integer DEFAULT 0 NOT NULL,
	`net_growth` integer DEFAULT 0 NOT NULL,
	`total_active` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_daily_subscriber_metrics_date` ON `daily_subscriber_metrics` (`date`);
