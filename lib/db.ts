import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'lampstand.db');
const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    description TEXT,
    published_at TEXT,
    source_name TEXT,
    fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
    full_content TEXT,
    extraction_failed INTEGER DEFAULT 0,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    ollama_response TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    user_note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id)
  );

  CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);
  CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
  CREATE INDEX IF NOT EXISTS idx_analyses_article ON analyses(article_id);
`);

// Article type matching database schema
export interface Article {
  id?: number;
  url: string;
  category: string;
  title: string;
  content?: string;
  description?: string;
  published_at?: string;
  source_name?: string;
  fetched_at?: string;
  full_content?: string;
  extraction_failed?: number;
  image_url?: string; // Extracted from article HTML
}

export interface Analysis {
  id?: number;
  article_id: number;
  ollama_response: string;
  created_at?: string;
}

export interface Favorite {
  id?: number;
  article_id: number;
  user_note?: string;
  created_at?: string;
}

// Article operations
export function saveArticle(article: Article): number {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO articles (url, category, title, content, description, published_at, source_name, full_content, extraction_failed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    article.url,
    article.category,
    article.title,
    article.content,
    article.description,
    article.published_at,
    article.source_name,
    article.full_content || null,
    article.extraction_failed || 0
  );
  
  if (result.changes === 0) {
    // Article already exists, update full_content if provided
    if (article.full_content !== undefined || article.extraction_failed !== undefined) {
      const updateStmt = db.prepare(`
        UPDATE articles 
        SET full_content = COALESCE(?, full_content),
            extraction_failed = COALESCE(?, extraction_failed)
        WHERE url = ?
      `);
      updateStmt.run(
        article.full_content || null,
        article.extraction_failed !== undefined ? article.extraction_failed : null,
        article.url
      );
    }
    const existing = db.prepare('SELECT id FROM articles WHERE url = ?').get(article.url) as { id: number };
    return existing.id;
  }
  
  return result.lastInsertRowid as number;
}

export function getArticleByUrl(url: string): Article | undefined {
  const stmt = db.prepare('SELECT * FROM articles WHERE url = ?');
  return stmt.get(url) as Article | undefined;
}

// Analysis operations
export function saveAnalysis(analysis: Analysis): number {
  const stmt = db.prepare(`
    INSERT INTO analyses (article_id, ollama_response)
    VALUES (?, ?)
  `);
  const result = stmt.run(analysis.article_id, analysis.ollama_response);
  return result.lastInsertRowid as number;
}

export function getAnalysisByArticleId(articleId: number): Analysis | undefined {
  const stmt = db.prepare('SELECT * FROM analyses WHERE article_id = ? ORDER BY created_at DESC LIMIT 1');
  return stmt.get(articleId) as Analysis | undefined;
}

// Favorite operations
export function saveFavorite(favorite: Favorite): number {
  const stmt = db.prepare(`
    INSERT INTO favorites (article_id, user_note)
    VALUES (?, ?)
  `);
  const result = stmt.run(favorite.article_id, favorite.user_note);
  return result.lastInsertRowid as number;
}

export function getFavorites(): (Article & Favorite)[] {
  const stmt = db.prepare(`
    SELECT a.*, f.user_note, f.created_at as favorite_created_at
    FROM favorites f
    JOIN articles a ON f.article_id = a.id
    ORDER BY f.created_at DESC
  `);
  return stmt.all() as (Article & Favorite)[];
}

export default db;
