CREATE TABLE `quota_reservation` (
	`attempt_id` text PRIMARY KEY,
	`reservation_id` text NOT NULL,
	`user_id` text,
	`vn_day` text NOT NULL,
	`points` integer NOT NULL,
	`cost_vnd` integer NOT NULL,
	`sunk_cost_vnd` integer DEFAULT 0 NOT NULL,
	`refund_count` integer DEFAULT 0 NOT NULL,
	`retake_of_attempt_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_quota_reservation_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX `quota_reservation_vn_day_status_idx` ON `quota_reservation` (`vn_day`,`status`);--> statement-breakpoint
CREATE INDEX `quota_reservation_user_vn_day_status_idx` ON `quota_reservation` (`user_id`,`vn_day`,`status`);--> statement-breakpoint
CREATE INDEX `quota_reservation_retake_of_idx` ON `quota_reservation` (`retake_of_attempt_id`);