CREATE TABLE `attempt_score` (
	`attempt_id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`overall` real,
	`criteria_json` text,
	`one_liner` text,
	`model` text,
	`tries` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`cost_usd` real,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer,
	`scored_at` integer,
	CONSTRAINT `fk_attempt_score_attempt_id_attempt_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempt`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_attempt_score_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `score_run` (
	`id` text PRIMARY KEY,
	`attempt_id` text NOT NULL,
	`run_index` integer NOT NULL,
	`fc` real NOT NULL,
	`lr` real NOT NULL,
	`gra` real NOT NULL,
	`p` real NOT NULL,
	`overall` real NOT NULL,
	`payload_json` text NOT NULL,
	`model` text NOT NULL,
	`audio_used` integer DEFAULT false NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`cost_usd` real,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_score_run_attempt_id_attempt_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempt`(`id`) ON DELETE CASCADE,
	CONSTRAINT `score_run_attempt_run_unique` UNIQUE(`attempt_id`,`run_index`)
);
--> statement-breakpoint
ALTER TABLE `attempt_answer` ADD `transcript` text;--> statement-breakpoint
CREATE INDEX `attempt_score_userId_idx` ON `attempt_score` (`user_id`);--> statement-breakpoint
CREATE INDEX `attempt_score_status_idx` ON `attempt_score` (`status`);--> statement-breakpoint
CREATE INDEX `score_run_attemptId_idx` ON `score_run` (`attempt_id`);