-- Custom demo workspace for Neon / production Postgres.
-- Run AFTER schema.sql (or on an existing DB when you want to replace all app data).
-- Safe RESET: truncates app tables and re-seeds IDs from 1.

BEGIN;

TRUNCATE TABLE
  activity_logs,
  card_labels,
  card_members,
  checklist_items,
  cards,
  lists,
  labels,
  boards,
  users
RESTART IDENTITY CASCADE;

INSERT INTO users (name, avatar_url, initials) VALUES
  ('Alex Kim', '', 'AK'),
  ('Jordan Lee', '', 'JL');

INSERT INTO boards (title, is_starred) VALUES
  ('Product roadmap demo', TRUE);

INSERT INTO labels (name, color, board_id) VALUES
  ('Done', 'green', 1),
  ('Design', 'purple', 1),
  ('Urgent', 'red', 1),
  ('Engineering', 'blue', 1);

INSERT INTO lists (title, board_id, position) VALUES
  ('This week', 1, 0),
  ('In progress', 1, 1),
  ('Later', 1, 2);

INSERT INTO cards (title, description, list_id, position, due_date, completed) VALUES
  ('Kickoff discovery', 'Align on scope and success metrics.', 1, 0, CURRENT_DATE + 2, FALSE),
  ('Design review', 'Review mobile navigation patterns.', 1, 1, CURRENT_DATE + 5, FALSE),
  ('API contract', 'Document boards/lists/cards endpoints.', 2, 0, CURRENT_DATE + 7, FALSE),
  ('Ship MVP checklist', 'Smoke tests on staging.', 2, 1, NULL, FALSE),
  ('Quarterly planning', 'Backlog grooming for next cycle.', 3, 0, NULL, FALSE);

INSERT INTO checklist_items (card_id, text, is_completed, position) VALUES
  (2, 'Collect reference screenshots', TRUE, 0),
  (2, 'Prep Figma deck', FALSE, 1);

INSERT INTO card_labels (card_id, label_id) VALUES
  (1, 3),
  (2, 2),
  (2, 3),
  (3, 4),
  (4, 1);

INSERT INTO card_members (card_id, user_id) VALUES
  (1, 1),
  (2, 1),
  (2, 2),
  (3, 2);

COMMIT;
