-- Initial schema for prototype-annotator

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
