CREATE TABLE `forecast_report` (
	`id` text PRIMARY KEY,
	`topic_id` text NOT NULL,
	`user_id` text NOT NULL,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_forecast_report_topic_id_forecast_topic_id_fk` FOREIGN KEY (`topic_id`) REFERENCES `forecast_topic`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_forecast_report_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `forecast_source` (
	`id` text PRIMARY KEY,
	`topic_id` text NOT NULL,
	`source_type` text NOT NULL,
	`source_url` text,
	`raw_content` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_forecast_source_topic_id_forecast_topic_id_fk` FOREIGN KEY (`topic_id`) REFERENCES `forecast_topic`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `forecast_topic` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`quarter` text NOT NULL,
	`part` integer DEFAULT 1 NOT NULL,
	`questions` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_forecast_topic_reviewed_by_user_id_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `forecast_report_user_topic_idx` ON `forecast_report` (`user_id`,`topic_id`);--> statement-breakpoint
CREATE INDEX `forecast_report_topic_id_idx` ON `forecast_report` (`topic_id`);--> statement-breakpoint
CREATE INDEX `forecast_report_user_id_idx` ON `forecast_report` (`user_id`);--> statement-breakpoint
CREATE INDEX `forecast_source_topic_id_idx` ON `forecast_source` (`topic_id`);--> statement-breakpoint
CREATE INDEX `forecast_source_type_idx` ON `forecast_source` (`source_type`);--> statement-breakpoint
CREATE INDEX `forecast_topic_quarter_idx` ON `forecast_topic` (`quarter`);--> statement-breakpoint
CREATE INDEX `forecast_topic_status_idx` ON `forecast_topic` (`status`);--> statement-breakpoint
CREATE INDEX `forecast_topic_reviewed_by_idx` ON `forecast_topic` (`reviewed_by`);