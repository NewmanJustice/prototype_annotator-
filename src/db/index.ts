import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(dbPath: string): Database.Database {
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create database connection
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations(db);

  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function runMigrations(database: Database.Database): void {
  // Create migrations tracking table
  database.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    )
  `);

  // Migrations are inlined since they're embedded in the bundle
  const migrations = [
    {
      name: '001_initial.sql',
      sql: `
        CREATE TABLE IF NOT EXISTS annotations (
          id TEXT PRIMARY KEY,
          url_full TEXT NOT NULL,
          url_canonical TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          anchor_type TEXT CHECK(anchor_type IN ('element', 'rect')) NOT NULL,
          anchor_payload TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          created_by TEXT NOT NULL,
          updated_by TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_annotations_url_canonical ON annotations(url_canonical);
        CREATE INDEX IF NOT EXISTS idx_annotations_deleted_at ON annotations(deleted_at);

        CREATE TABLE IF NOT EXISTS annotation_events (
          id TEXT PRIMARY KEY,
          annotation_id TEXT,
          event_type TEXT CHECK(event_type IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'EXPORT_PROMPT')) NOT NULL,
          actor TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          diff TEXT,
          meta TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_events_annotation_id ON annotation_events(annotation_id);
        CREATE INDEX IF NOT EXISTS idx_events_timestamp ON annotation_events(timestamp);

        CREATE TABLE IF NOT EXISTS prompt_exports (
          id TEXT PRIMARY KEY,
          created_at TEXT NOT NULL,
          actor TEXT NOT NULL,
          url_scope TEXT NOT NULL,
          annotation_ids TEXT NOT NULL,
          template_id TEXT NOT NULL,
          prompt_markdown TEXT NOT NULL,
          saved_path_md TEXT NOT NULL,
          saved_path_json TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_prompt_exports_created_at ON prompt_exports(created_at);
      `,
    },
  ];

  // Check which migrations have been applied
  const appliedMigrations = new Set<string>();
  const rows = database.prepare('SELECT name FROM _migrations').all() as { name: string }[];
  for (const row of rows) {
    appliedMigrations.add(row.name);
  }

  // Apply pending migrations
  const insertMigration = database.prepare(
    'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)'
  );

  for (const migration of migrations) {
    if (!appliedMigrations.has(migration.name)) {
      database.exec(migration.sql);
      insertMigration.run(migration.name, new Date().toISOString());
      console.log(`Applied migration: ${migration.name}`);
    }
  }
}
