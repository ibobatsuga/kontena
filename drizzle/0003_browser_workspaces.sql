CREATE TABLE `asset_owners` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `owner_id` text DEFAULT 'owner' NOT NULL;