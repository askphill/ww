-- Add plan column for detailed action plans
ALTER TABLE opportunity_insights ADD COLUMN plan TEXT;

-- Drop the status index BEFORE dropping the column
DROP INDEX IF EXISTS idx_insights_status;

-- Drop status column (no longer needed)
-- Note: SQLite doesn't support DROP COLUMN directly in older versions,
-- but D1 uses a newer SQLite that supports it
ALTER TABLE opportunity_insights DROP COLUMN status;
