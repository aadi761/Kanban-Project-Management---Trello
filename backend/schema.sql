-- Reset (run on empty DB or dev reset). Order avoids FK issues.
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS card_labels CASCADE;
DROP TABLE IF EXISTS card_members CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS labels CASCADE;
DROP TABLE IF EXISTS boards CASCADE;
DROP TABLE IF EXISTS users CASCADE;

 
CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

 
CREATE TABLE lists (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- =========================
-- CARDS
-- =========================
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  due_date DATE,
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(list_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- =========================
-- USERS (simple, no auth complexity)
-- =========================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT DEFAULT '',
  initials VARCHAR(10) DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE labels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE
);

-- =========================
-- CARD MEMBERS (many-to-many)
-- =========================
CREATE TABLE card_members (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(card_id, user_id)
);

-- =========================
-- CARD LABELS (many-to-many)
-- =========================
CREATE TABLE card_labels (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id INTEGER NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  UNIQUE(card_id, label_id)
);

-- =========================
-- CHECKLIST ITEMS
-- =========================
CREATE TABLE checklist_items (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  text VARCHAR(500) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(card_id, position) DEFERRABLE INITIALLY DEFERRED
);

-- =========================
-- ACTIVITY LOGS
-- =========================
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- INDEXES (performance)
-- =========================
CREATE INDEX idx_lists_board_id ON lists(board_id);
CREATE INDEX idx_cards_list_id ON cards(list_id);
CREATE INDEX idx_checklist_items_card_id ON checklist_items(card_id);
CREATE INDEX idx_activity_logs_card_id ON activity_logs(card_id);
CREATE INDEX idx_card_members_card_id ON card_members(card_id);
CREATE INDEX idx_card_labels_card_id ON card_labels(card_id);

INSERT INTO users (name, avatar_url, initials) VALUES
  ('Aadi', '', 'AA'),
  ('Savn', '', 'SV');

INSERT INTO boards (title) VALUES ('My First Board');

INSERT INTO labels (name, color, board_id) VALUES
  ('Done', 'green', 1),
  ('Design', 'purple', 1),
  ('Urgent', 'red', 1),
  ('DevOps', 'blue', 1),
  ('Bug', 'orange', 1),
  ('Feature', 'yellow', 1);
