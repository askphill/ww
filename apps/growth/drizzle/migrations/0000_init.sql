-- Auth tables
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS magic_link_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

-- GSC data
CREATE TABLE IF NOT EXISTS gsc_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  country TEXT DEFAULT 'NL',
  clicks INTEGER,
  impressions INTEGER,
  ctr REAL,
  position REAL,
  date TEXT NOT NULL,
  UNIQUE(query, country, date)
);

-- Content management
CREATE TABLE IF NOT EXISTS opportunities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  impressions_30d INTEGER,
  clicks_30d INTEGER,
  current_position REAL,
  opportunity_score REAL,
  status TEXT DEFAULT 'identified',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  title TEXT,
  target_keyword TEXT,
  status TEXT DEFAULT 'draft',
  mdx_content TEXT,
  generated_at TEXT,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS article_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER REFERENCES articles(id),
  date TEXT,
  impressions INTEGER,
  clicks INTEGER,
  avg_position REAL,
  UNIQUE(article_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gsc_queries_date ON gsc_queries(date);
CREATE INDEX IF NOT EXISTS idx_gsc_queries_country ON gsc_queries(country);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
