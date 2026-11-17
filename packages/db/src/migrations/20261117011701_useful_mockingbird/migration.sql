CREATE TABLE `admin_user_action` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`plan_id` text,
	`points_delta` integer,
	`detail_credits_delta` integer,
	`previous_expires_at` integer,
	`new_expires_at` integer,
	`note` text NOT NULL,
	`actor_email` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_admin_user_action_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `admin_user_action_user_id_idx` ON `admin_user_action` (`user_id`);--> statement-breakpoint
CREATE INDEX `admin_user_action_created_at_idx` ON `admin_user_action` (`created_at`);