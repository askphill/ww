-- Add keyword tracking tables
CREATE TABLE `tracked_keywords` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`keyword` text NOT NULL,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tracked_keywords_keyword_unique` ON `tracked_keywords` (`keyword`);
--> statement-breakpoint
CREATE INDEX `idx_tracked_keywords_keyword` ON `tracked_keywords` (`keyword`);
--> statement-breakpoint
CREATE TABLE `keyword_positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`keyword_id` integer NOT NULL,
	`position` integer,
	`url` text,
	`date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	FOREIGN KEY (`keyword_id`) REFERENCES `tracked_keywords`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_positions_keyword_date` ON `keyword_positions` (`keyword_id`,`date`);
