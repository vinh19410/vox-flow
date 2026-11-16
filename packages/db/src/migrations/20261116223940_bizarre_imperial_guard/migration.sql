CREATE TABLE `payment_action` (
	`id` text PRIMARY KEY,
	`event_id` text NOT NULL,
	`order_id` text,
	`action` text NOT NULL,
	`note` text NOT NULL,
	`actor_email` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_payment_action_event_id_payment_event_id_fk` FOREIGN KEY (`event_id`) REFERENCES `payment_event`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_payment_action_order_id_payment_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `payment_order`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
ALTER TABLE `payment_event` ADD `sepay_uuid` text;--> statement-breakpoint
ALTER TABLE `payment_event` ADD `classification` text DEFAULT 'matched' NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_event` ADD `resolution_status` text DEFAULT 'resolved' NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_event` ADD `source` text DEFAULT 'webhook' NOT NULL;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_payment_event` (
	`id` text PRIMARY KEY,
	`sepay_id` integer,
	`sepay_uuid` text,
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
	`classification` text DEFAULT 'matched' NOT NULL,
	`resolution_status` text DEFAULT 'resolved' NOT NULL,
	`source` text DEFAULT 'webhook' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_payment_event_order_id_payment_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `payment_order`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
INSERT INTO `__new_payment_event`(`id`, `sepay_id`, `transfer_type`, `gateway`, `account_number`, `sub_account`, `transfer_amount`, `extracted_code`, `reference_code`, `transaction_date`, `order_id`, `match_status`, `created_at`) SELECT `id`, `sepay_id`, `transfer_type`, `gateway`, `account_number`, `sub_account`, `transfer_amount`, `extracted_code`, `reference_code`, `transaction_date`, `order_id`, `match_status`, `created_at` FROM `payment_event`;--> statement-breakpoint
DROP TABLE `payment_event`;--> statement-breakpoint
ALTER TABLE `__new_payment_event` RENAME TO `payment_event`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `payment_event_sepay_id_unique` ON `payment_event` (`sepay_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `payment_event_sepay_uuid_unique` ON `payment_event` (`sepay_uuid`);--> statement-breakpoint
CREATE INDEX `payment_event_order_id_idx` ON `payment_event` (`order_id`);--> statement-breakpoint
CREATE INDEX `payment_event_match_status_idx` ON `payment_event` (`match_status`);--> statement-breakpoint
CREATE INDEX `payment_event_resolution_status_idx` ON `payment_event` (`resolution_status`);--> statement-breakpoint
CREATE INDEX `payment_event_ref_idx` ON `payment_event` (`reference_code`);--> statement-breakpoint
CREATE INDEX `payment_action_event_id_idx` ON `payment_action` (`event_id`);--> statement-breakpoint
CREATE INDEX `payment_action_created_at_idx` ON `payment_action` (`created_at`);