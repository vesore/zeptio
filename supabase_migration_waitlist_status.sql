-- Add status column to waitlist table
ALTER TABLE waitlist
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Index for filtering pending approvals quickly
CREATE INDEX IF NOT EXISTS waitlist_status_idx ON waitlist (status);
