import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../index.js';
import type { PromptExport } from '../../types/index.js';

// Helper to parse prompt export from database row
function parsePromptExport(row: Record<string, unknown>): PromptExport {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    actor: row.actor as string,
    url_scope: JSON.parse(row.url_scope as string),
    annotation_ids: JSON.parse(row.annotation_ids as string),
    template_id: row.template_id as string,
    prompt_markdown: row.prompt_markdown as string,
    saved_path_md: row.saved_path_md as string,
    saved_path_json: row.saved_path_json as string,
  };
}

export class PromptExportRepository {
  create(input: {
    actor: string;
    url_scope: string[];
    annotation_ids: string[];
    template_id: string;
    prompt_markdown: string;
    saved_path_md: string;
    saved_path_json: string;
  }): PromptExport {
    const db = getDatabase();
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO prompt_exports (
        id, created_at, actor, url_scope, annotation_ids, template_id,
        prompt_markdown, saved_path_md, saved_path_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      createdAt,
      input.actor,
      JSON.stringify(input.url_scope),
      JSON.stringify(input.annotation_ids),
      input.template_id,
      input.prompt_markdown,
      input.saved_path_md,
      input.saved_path_json
    );

    return this.findById(id)!;
  }

  findById(id: string): PromptExport | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM prompt_exports WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? parsePromptExport(row) : null;
  }

  findAll(limit = 50, offset = 0): PromptExport[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM prompt_exports ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).all(limit, offset) as Record<string, unknown>[];
    return rows.map(parsePromptExport);
  }

  findByActor(actor: string): PromptExport[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM prompt_exports WHERE actor = ? ORDER BY created_at DESC'
    ).all(actor) as Record<string, unknown>[];
    return rows.map(parsePromptExport);
  }

  countAll(): number {
    const db = getDatabase();
    const result = db.prepare('SELECT COUNT(*) as count FROM prompt_exports').get() as { count: number };
    return result.count;
  }
}
