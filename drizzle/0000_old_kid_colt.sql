CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`scheduled_at` text NOT NULL,
	`platform` text NOT NULL,
	`status` text NOT NULL,
	`auto_post` integer DEFAULT 0 NOT NULL,
	`mode` text NOT NULL,
	`error` text,
	`published_id` text,
	`payload` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_schedules_due` ON `schedules` (`status`,`scheduled_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);
