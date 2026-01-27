import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../index.js';
import type { AnnotationEvent, EventType } from '../../types/index.js';

// Helper to parse event from database row
function parseEvent(row: Record<string, unknown>): AnnotationEvent {
  return {
    id: row.id as string,
    annotation_id: row.annotation_id as string | null,
    event_type: row.event_type as EventType,
    actor: row.actor as string,
    timestamp: row.timestamp as string,
    diff: row.diff ? JSON.parse(row.diff as string) : null,
    meta: row.meta ? JSON.parse(row.meta as string) : null,
  };
}

export class EventRepository {
  create(input: {
    annotation_id?: string | null;
    event_type: EventType;
    actor: string;
    diff?: Record<string, { old: unknown; new: unknown }> | null;
    meta?: Record<string, unknown> | null;
  }): AnnotationEvent {
    const db = getDatabase();
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO annotation_events (id, annotation_id, event_type, actor, timestamp, diff, meta)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      input.annotation_id ?? null,
      input.event_type,
      input.actor,
      timestamp,
      input.diff ? JSON.stringify(input.diff) : null,
      input.meta ? JSON.stringify(input.meta) : null
    );

    return this.findById(id)!;
  }

  findById(id: string): AnnotationEvent | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM annotation_events WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    return row ? parseEvent(row) : null;
  }

  findByAnnotationId(annotationId: string): AnnotationEvent[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM annotation_events WHERE annotation_id = ? ORDER BY timestamp DESC'
    ).all(annotationId) as Record<string, unknown>[];
    return rows.map(parseEvent);
  }

  findAll(limit = 100, offset = 0): AnnotationEvent[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM annotation_events ORDER BY timestamp DESC LIMIT ? OFFSET ?'
    ).all(limit, offset) as Record<string, unknown>[];
    return rows.map(parseEvent);
  }

  findByEventType(eventType: EventType, limit = 100): AnnotationEvent[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM annotation_events WHERE event_type = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(eventType, limit) as Record<string, unknown>[];
    return rows.map(parseEvent);
  }

  countAll(): number {
    const db = getDatabase();
    const result = db.prepare('SELECT COUNT(*) as count FROM annotation_events').get() as { count: number };
    return result.count;
  }

  findByDateRange(startDate: string, endDate: string): AnnotationEvent[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM annotation_events WHERE timestamp >= ? AND timestamp <= ? ORDER BY timestamp DESC'
    ).all(startDate, endDate) as Record<string, unknown>[];
    return rows.map(parseEvent);
  }

  findByUrlCanonical(urlCanonical: string, limit = 100): AnnotationEvent[] {
    const db = getDatabase();
    const rows = db.prepare(`
      SELECT e.* FROM annotation_events e
      INNER JOIN annotations a ON e.annotation_id = a.id
      WHERE a.url_canonical = ?
      ORDER BY e.timestamp DESC
      LIMIT ?
    `).all(urlCanonical, limit) as Record<string, unknown>[];
    return rows.map(parseEvent);
  }
}
