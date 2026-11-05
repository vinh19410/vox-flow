ALTER TABLE `score_dispute` ADD `previous_band` text;--> statement-breakpoint
ALTER TABLE `score_dispute` ADD `resolved_band` text;--> statement-breakpoint
ALTER TABLE `score_dispute` ADD `reply_text` text;--> statement-breakpoint
ALTER TABLE `score_dispute` ADD `resolved_at` integer;--> statement-breakpoint
ALTER TABLE `score_dispute` ADD `warned_at` integer;--> statement-breakpoint
CREATE INDEX `score_dispute_dueAt_idx` ON `score_dispute` (`due_at`);