CREATE TABLE `consent_event` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`granted` integer NOT NULL,
	`policy_version` text DEFAULT 'v1' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_consent_event_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `consent_event_userId_idx` ON `consent_event` (`user_id`);--> statement-breakpoint
CREATE INDEX `consent_event_userId_kind_idx` ON `consent_event` (`user_id`,`kind`);