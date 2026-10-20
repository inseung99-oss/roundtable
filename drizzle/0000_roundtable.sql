CREATE TABLE `workspaces` (`owner` text PRIMARY KEY NOT NULL, `data` text NOT NULL, `revision` integer NOT NULL, `write_id` text NOT NULL);
--> statement-breakpoint
CREATE TABLE `jobs` (`id` text NOT NULL, `owner` text NOT NULL, `room_id` text NOT NULL, `agent_id` text NOT NULL, `payload` text NOT NULL, `status` text NOT NULL DEFAULT 'pending', `created_at` integer NOT NULL, `lease` text, `lease_until` integer, `reply` text, `reply_at` text, `model` text, PRIMARY KEY(`owner`,`id`));
--> statement-breakpoint
CREATE INDEX `jobs_queue` ON `jobs` (`owner`,`agent_id`,`status`,`created_at`);
