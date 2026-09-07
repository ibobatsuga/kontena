CREATE TABLE `oauth_states` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`browser_hash` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `social_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`platform` text NOT NULL,
	`remote_id` text NOT NULL,
	`name` text NOT NULL,
	`username` text,
	`token` text NOT NULL,
	`expires_at` text,
	`status` text NOT NULL,
	`permissions` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_social_owner` ON `social_accounts` (`owner_id`,`status`);--> statement-breakpoint
CREATE TABLE `social_config` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`app_id` text NOT NULL,
	`secret` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `schedules` ADD `owner_id` text;--> statement-breakpoint
ALTER TABLE `schedules` ADD `account_id` text;--> statement-breakpoint
ALTER TABLE `schedules` ADD `account_name` text;