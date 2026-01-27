import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../index.js';
import type {
  Annotation,
  AnchorPayload,
  AnchorType,
  CreateAnnotationInput,
  UpdateAnnotationInput,
  PageSummary,
} from '../../types/index.js';

// Helper to extract canonical URL (strip query params and hash)
function getCanonicalUrl(urlFull: string): string {
  try {
    const url = new URL(urlFull);
    return `${url.origin}${url.pathname}`;
  } catch {
    return urlFull;
  }
}

// Helper to parse annotation from database row
function parseAnnotation(row: Record<string, unknown>): Annotation {
  return {
    id: row.id as string,
    url_full: row.url_full as string,
    url_canonical: row.url_canonical as string,
    title: row.title as string,
    body: row.body as string,
    anchor_type: row.anchor_type as AnchorType,
    anchor_payload: JSON.parse(row.anchor_payload as string) as AnchorPayload,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: row.deleted_at as string | null,
    created_by: row.created_by as string,
    updated_by: row.updated_by as string,
  };
}

export class AnnotationRepository {
  create(input: CreateAnnotationInput): Annotation {
    const db = getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    const urlCanonical = getCanonicalUrl(input.url_full);

    const stmt = db.prepare(`
      INSERT INTO annotations (
        id, url_full, url_canonical, title, body, anchor_type, anchor_payload,
        created_at, updated_at, deleted_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `);

    stmt.run(
      id,
      input.url_full,
      urlCanonical,
      input.title,
      input.body,
      input.anchor_type,
      JSON.stringify(input.anchor_payload),
      now,
      now,
      input.actor,
      input.actor
    );

    return this.findById(id)!;
  }

  findById(id: string): Annotation | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM annotations WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? parseAnnotation(row) : null;
  }

  findByUrl(urlCanonical: string, includeDeleted = false): Annotation[] {
    const db = getDatabase();
    const query = includeDeleted
      ? 'SELECT * FROM annotations WHERE url_canonical = ? ORDER BY created_at DESC'
      : 'SELECT * FROM annotations WHERE url_canonical = ? AND deleted_at IS NULL ORDER BY created_at DESC';

    const rows = db.prepare(query).all(urlCanonical) as Record<string, unknown>[];
    return rows.map(parseAnnotation);
  }

  findAll(includeDeleted = false): Annotation[] {
    const db = getDatabase();
    const query = includeDeleted
      ? 'SELECT * FROM annotations ORDER BY created_at DESC'
      : 'SELECT * FROM annotations WHERE deleted_at IS NULL ORDER BY created_at DESC';

    const rows = db.prepare(query).all() as Record<string, unknown>[];
    return rows.map(parseAnnotation);
  }

  findByIds(ids: string[]): Annotation[] {
    if (ids.length === 0) return [];

    const db = getDatabase();
    const placeholders = ids.map(() => '?').join(',');
    const rows = db.prepare(
      `SELECT * FROM annotations WHERE id IN (${placeholders}) AND deleted_at IS NULL`
    ).all(...ids) as Record<string, unknown>[];

    return rows.map(parseAnnotation);
  }

  update(id: string, input: UpdateAnnotationInput): Annotation | null {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing || existing.deleted_at) return null;

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?', 'updated_by = ?'];
    const values: unknown[] = [now, input.actor];

    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
    }
    if (input.body !== undefined) {
      updates.push('body = ?');
      values.push(input.body);
    }
    if (input.anchor_type !== undefined) {
      updates.push('anchor_type = ?');
      values.push(input.anchor_type);
    }
    if (input.anchor_payload !== undefined) {
      updates.push('anchor_payload = ?');
      values.push(JSON.stringify(input.anchor_payload));
    }

    values.push(id);

    db.prepare(`UPDATE annotations SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return this.findById(id);
  }

  softDelete(id: string, actor: string): Annotation | null {
    const db = getDatabase();
    const existing = this.findById(id);
    if (!existing || existing.deleted_at) return null;

    const now = new Date().toISOString();
    db.prepare('UPDATE annotations SET deleted_at = ?, updated_at = ?, updated_by = ? WHERE id = ?')
      .run(now, now, actor, id);

    return this.findById(id);
  }

  restore(id: string, actor: string): Annotation | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM annotations WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!row || !row.deleted_at) return null;

    const now = new Date().toISOString();
    db.prepare('UPDATE annotations SET deleted_at = NULL, updated_at = ?, updated_by = ? WHERE id = ?')
      .run(now, actor, id);

    return this.findById(id);
  }

  getPages(): PageSummary[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT
        url_canonical,
        COUNT(*) as annotation_count,
        MAX(updated_at) as latest_annotation_at
      FROM annotations
      WHERE deleted_at IS NULL
      GROUP BY url_canonical
      ORDER BY latest_annotation_at DESC
    `).all() as { url_canonical: string; annotation_count: number; latest_annotation_at: string }[];

    return rows;
  }
}
