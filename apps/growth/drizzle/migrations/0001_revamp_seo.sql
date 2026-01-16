-- Drop articles-related tables
DROP TABLE IF EXISTS article_performance;
DROP TABLE IF EXISTS articles;

-- Create opportunity insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS opportunity_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_queries TEXT,
  potential_impact REAL,
  recommended_action TEXT,
  status TEXT DEFAULT 'new',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_insights_status ON opportunity_insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_type ON opportunity_insights(insight_type);
