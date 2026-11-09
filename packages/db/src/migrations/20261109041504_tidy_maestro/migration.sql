ALTER TABLE `attempt` ADD `topic_id` text;--> statement-breakpoint
ALTER TABLE `attempt` ADD `question_key` text;--> statement-breakpoint
CREATE INDEX `attempt_topicId_idx` ON `attempt` (`topic_id`);