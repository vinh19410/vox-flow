CREATE TABLE `attempt` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`in_history` integer DEFAULT true NOT NULL,
	`calibration_granted` integer DEFAULT false NOT NULL,
	`started_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`submitted_at` integer,
	CONSTRAINT `fk_attempt_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `attempt_answer` (
	`id` text PRIMARY KEY,
	`attempt_id` text NOT NULL,
	`question_key` text NOT NULL,
	`question_text` text NOT NULL,
	`part_number` integer NOT NULL,
	`order_index` integer NOT NULL,
	`audio_key` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`mime_type` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_attempt_answer_attempt_id_attempt_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempt`(`id`) ON DELETE CASCADE,
	CONSTRAINT `attempt_answer_attempt_question_unique` UNIQUE(`attempt_id`,`question_key`)
);
--> statement-breakpoint
CREATE INDEX `attempt_userId_idx` ON `attempt` (`user_id`);--> statement-breakpoint
CREATE INDEX `attempt_status_idx` ON `attempt` (`status`);--> statement-breakpoint
CREATE INDEX `attempt_answer_attemptId_idx` ON `attempt_answer` (`attempt_id`);