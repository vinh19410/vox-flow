CREATE TABLE `scoring_retry_log` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_scoring_retry_log_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_scoring_retry_log_attempt_id_attempt_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempt`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `attempt_answer` ADD `size_bytes` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `attempt_score` ADD `manual_retries` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `scoring_retry_log_userId_createdAt_idx` ON `scoring_retry_log` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `scoring_retry_log_attemptId_idx` ON `scoring_retry_log` (`attempt_id`);