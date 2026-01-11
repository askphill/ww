import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/seo.db');

export function initializeDatabase(): Database.Database {
  const db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    -- GSC search data
    CREATE TABLE IF NOT EXISTS gsc_queries (
      id INTEGER PRIMARY KEY,
      query TEXT NOT NULL,
      country TEXT DEFAULT 'NL',
      clicks INTEGER,
      impressions INTEGER,
      ctr REAL,
      position REAL,
      date TEXT NOT NULL,
      UNIQUE(query, country, date)
    );

    -- Synced Shopify products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      handle TEXT UNIQUE,
      title TEXT,
      description TEXT,
      tags TEXT,
      synced_at TEXT
    );

    -- Content opportunities (analyzed)
    CREATE TABLE IF NOT EXISTS opportunities (
      id INTEGER PRIMARY KEY,
      keyword TEXT NOT NULL,
      impressions_30d INTEGER,
      clicks_30d INTEGER,
      current_position REAL,
      related_product_id TEXT,
      opportunity_score REAL,
      status TEXT DEFAULT 'identified',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (related_product_id) REFERENCES products(id)
    );

    -- Generated articles
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY,
      slug TEXT UNIQUE,
      title TEXT,
      target_keyword TEXT,
      related_product_id TEXT,
      status TEXT DEFAULT 'draft',
      mdx_path TEXT,
      generated_at TEXT,
      published_at TEXT,
      FOREIGN KEY (related_product_id) REFERENCES products(id)
    );

    -- Performance tracking over time
    CREATE TABLE IF NOT EXISTS article_performance (
      id INTEGER PRIMARY KEY,
      article_id INTEGER,
      date TEXT,
      impressions INTEGER,
      clicks INTEGER,
      avg_position REAL,
      UNIQUE(article_id, date),
      FOREIGN KEY (article_id) REFERENCES articles(id)
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_gsc_queries_date ON gsc_queries(date);
    CREATE INDEX IF NOT EXISTS idx_gsc_queries_country ON gsc_queries(country);
    CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
    CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
  `);

  return db;
}

export function getDatabase(): Database.Database {
  return new Database(DB_PATH);
}
