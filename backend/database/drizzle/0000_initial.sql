CREATE TABLE IF NOT EXISTS `monitors` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `target` text NOT NULL,
  `port` integer,
  `username` text,
  `password` text,
  `method` text DEFAULT 'GET',
  `expected_status` integer DEFAULT 200,
  `interval` integer DEFAULT 60,
  `timeout` integer DEFAULT 30,
  `active` integer DEFAULT 1,
  `created_at` text DEFAULT (datetime('now')),
  `updated_at` text DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS `checks` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `monitor_id` integer NOT NULL,
  `status` text NOT NULL,
  `response_time_ms` integer,
  `status_code` integer,
  `error_msg` text,
  `checked_at` text DEFAULT (datetime('now')),
  FOREIGN KEY (`monitor_id`) REFERENCES `monitors`(`id`) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL
);

CREATE INDEX IF NOT EXISTS `idx_checks_monitor_id` ON `checks` (`monitor_id`);
CREATE INDEX IF NOT EXISTS `idx_checks_checked_at` ON `checks` (`checked_at`);
CREATE INDEX IF NOT EXISTS `idx_monitors_active` ON `monitors` (`active`);
