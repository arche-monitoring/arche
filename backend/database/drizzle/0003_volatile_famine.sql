ALTER TABLE `checks` ADD `response_body` text;--> statement-breakpoint
CREATE UNIQUE INDEX `status_pages_slug_unique` ON `status_pages` (`slug`);