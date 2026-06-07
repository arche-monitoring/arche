CREATE TABLE IF NOT EXISTS `status_pages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `title` text NOT NULL,
  `slug` text NOT NULL UNIQUE,
  `show_all` integer DEFAULT 0,
  `monitor_ids` text DEFAULT '[]',
  `created_at` text DEFAULT (datetime('now')),
  `updated_at` text DEFAULT (datetime('now'))
);
