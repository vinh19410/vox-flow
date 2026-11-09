CREATE TABLE `user_profile` (
	`user_id` text PRIMARY KEY,
	`target_band` real NOT NULL,
	`exam_date` text,
	`onboarded_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer,
	CONSTRAINT `fk_user_profile_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
