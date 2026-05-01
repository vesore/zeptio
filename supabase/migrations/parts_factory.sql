-- Parts Factory: world_points + user_parts tables
-- Run in Supabase SQL editor

-- Tracks cumulative points earned per world per user
CREATE TABLE IF NOT EXISTS world_points (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  world   TEXT NOT NULL,
  points  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, world)
);

ALTER TABLE world_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own world_points"
  ON world_points FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tracks parts owned (and equipped status) per user
CREATE TABLE IF NOT EXISTS user_parts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_id     TEXT NOT NULL,
  equipped    BOOLEAN NOT NULL DEFAULT false,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, part_id)
);

ALTER TABLE user_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own user_parts"
  ON user_parts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_world_points_user ON world_points (user_id);
CREATE INDEX IF NOT EXISTS idx_user_parts_user   ON user_parts  (user_id);
