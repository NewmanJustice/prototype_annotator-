import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

// Wrapper to provide better-sqlite3-like API
class DatabaseWrapper {
  private db: SqlJsDatabase;
  private dbPath: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(db: SqlJsDatabase, dbPath: string) {
    this.db = db;
    this.dbPath = dbPath;
  }

  prepare(sql: string): StatementWrapper {
    return new StatementWrapper(this.db, sql, () => this.scheduleSave());
  }

  exec(sql: string): void {
    this.db.run(sql);
    this.scheduleSave();
  }

  pragma(_pragma: string): void {
    // sql.js doesn't support WAL mode or most pragmas - silently ignore
  }

  close(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveNow();
    this.db.close();
  }

  private scheduleSave(): void {
    // Debounce saves to avoid excessive disk writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveNow();
      this.saveTimeout = null;
    }, 100);
  }

  private saveNow(): void {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      console.error('[prototype-annotator] Failed to save database:', error);
    }
  }
}

class StatementWrapper {
  private db: SqlJsDatabase;
  private sql: string;
  private onWrite: () => void;

  constructor(db: SqlJsDatabase, sql: string, onWrite: () => void) {
    this.db = db;
    this.sql = sql;
    this.onWrite = onWrite;
  }

  run(...params: unknown[]): void {
    this.db.run(this.sql, params as (string | number | null | Uint8Array)[]);
    this.onWrite();
  }

  get(...params: unknown[]): Record<string, unknown> | undefined {
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params as (string | number | null | Uint8Array)[]);

    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row as Record<string, unknown>;
    }

    stmt.free();
    return undefined;
  }

  all(...params: unknown[]): Record<string, unknown>[] {
    const results: Record<string, unknown>[] = [];
    const stmt = this.db.prepare(this.sql);
    stmt.bind(params as (string | number | null | Uint8Array)[]);

    while (stmt.step()) {
      results.push(stmt.getAsObject() as Record<string, unknown>);
    }

    stmt.free();
    return results;
  }
}

let db: DatabaseWrapper | null = null;
let SQL: Awaited<ReturnType<typeof initSqlJs>> | null = null;

// Pre-initialize sql.js when module loads
const sqlJsPromise: Promise<Awaited<ReturnType<typeof initSqlJs>>> = initSqlJs();
sqlJsPromise.then((instance) => {
  SQL = instance;
});

export function getDatabase(): DatabaseWrapper {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabaseAsync(dbPath: string): Promise<DatabaseWrapper> {
  // Wait for sql.js to be ready
  if (!SQL) {
    SQL = await sqlJsPromise;
  }

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing database or create new one
  let sqlJsDb: SqlJsDatabase;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlJsDb = new SQL.Database(fileBuffer);
  } else {
    sqlJsDb = new SQL.Database();
  }

  db = new DatabaseWrapper(sqlJsDb, dbPath);

  // Run migrations
  runMigrations(db);

  return db;
}

// Synchronous init - requires SQL to be pre-loaded
export function initDatabase(dbPath: string): DatabaseWrapper {
  if (!SQL) {
    throw new Error(
      'sql.js not yet initialized. Use initDatabaseAsync() or wait for module to load.'
    );
  }

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing database or create new one
  let sqlJsDb: SqlJsDatabase;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlJsDb = new SQL.Database(fileBuffer);
  } else {
    sqlJsDb = new SQL.Database();
  }

  db = new DatabaseWrapper(sqlJsDb, dbPath);

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

// Export promise for consumers who need to wait
export function waitForSqlJs(): Promise<void> {
  return sqlJsPromise.then(() => {});
}

function runMigrations(database: DatabaseWrapper): void {
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
  for (const migration of migrations) {
    if (!appliedMigrations.has(migration.name)) {
      database.exec(migration.sql);
      database.prepare(
        'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)'
      ).run(migration.name, new Date().toISOString());
      console.log(`Applied migration: ${migration.name}`);
    }
  }
}
