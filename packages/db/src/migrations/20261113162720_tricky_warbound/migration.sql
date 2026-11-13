ALTER TABLE `attempt` ADD `retake_of_attempt_id` text;--> statement-breakpoint
CREATE INDEX `attempt_retakeOfAttemptId_idx` ON `attempt` (`retake_of_attempt_id`);