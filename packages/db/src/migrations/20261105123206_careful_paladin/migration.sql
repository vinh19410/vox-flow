CREATE TABLE `score_dispute` (
	`id` text PRIMARY KEY,
	`attempt_id` text NOT NULL,
	`user_id` text NOT NULL,
	`target_criterion` text NOT NULL,
	`expected_band` text NOT NULL,
	`reason` text,
	`share_consent` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`due_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_score_dispute_attempt_id_attempt_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempt`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_score_dispute_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `score_dispute_userId_idx` ON `score_dispute` (`user_id`);--> statement-breakpoint
CREATE INDEX `score_dispute_attemptId_idx` ON `score_dispute` (`attempt_id`);--> statement-breakpoint
CREATE INDEX `score_dispute_status_idx` ON `score_dispute` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `score_dispute_active_attempt_unique` ON `score_dispute` (`attempt_id`) WHERE status IN ('open', 'reviewing');