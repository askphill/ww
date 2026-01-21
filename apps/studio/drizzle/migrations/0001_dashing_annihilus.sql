CREATE TABLE `email_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sections` text NOT NULL,
	`created_at` text DEFAULT 'datetime(''now'')',
	`updated_at` text
);
