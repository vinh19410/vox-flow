CREATE TABLE `detail_credit` (
	`user_id` text PRIMARY KEY,
	`remaining` integer DEFAULT 0 NOT NULL,
	`last_unlock_attempt_id` text,
	`last_order_id` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_detail_credit_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `detail_unlock` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`attempt_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_detail_unlock_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_detail_unlock_attempt_id_attempt_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempt`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `payment_event` (
	`id` text PRIMARY KEY,
	`sepay_id` integer NOT NULL,
	`transfer_type` text NOT NULL,
	`gateway` text NOT NULL,
	`account_number` text NOT NULL,
	`sub_account` text DEFAULT '' NOT NULL,
	`transfer_amount` integer NOT NULL,
	`extracted_code` text,
	`reference_code` text DEFAULT '' NOT NULL,
	`transaction_date` text NOT NULL,
	`order_id` text,
	`match_status` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_payment_event_order_id_payment_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `payment_order`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `payment_order` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`amount_vnd` integer NOT NULL,
	`transfer_code` text NOT NULL,
	`exam_date_snapshot` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`sepay_id` integer,
	`expires_at` integer NOT NULL,
	`paid_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_payment_order_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `subscription` (
	`user_id` text PRIMARY KEY,
	`plan_id` text NOT NULL,
	`points_remaining` integer NOT NULL,
	`plan_points_total` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`last_reservation_id` text,
	`last_refund_token` text,
	`last_order_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_subscription_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `quota_reservation` ADD `source` text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `quota_reservation` ADD `last_refund_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `detail_unlock_user_attempt_unique` ON `detail_unlock` (`user_id`,`attempt_id`);--> statement-breakpoint
CREATE INDEX `detail_unlock_attempt_id_idx` ON `detail_unlock` (`attempt_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_event_sepay_id_unique` ON `payment_event` (`sepay_id`);--> statement-breakpoint
CREATE INDEX `payment_event_order_id_idx` ON `payment_event` (`order_id`);--> statement-breakpoint
CREATE INDEX `payment_event_match_status_idx` ON `payment_event` (`match_status`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_order_transfer_code_unique` ON `payment_order` (`transfer_code`);--> statement-breakpoint
CREATE INDEX `payment_order_user_status_idx` ON `payment_order` (`user_id`,`status`);