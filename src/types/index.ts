import type { Router } from 'express';

// Anchor types for annotations
export type AnchorType = 'element' | 'rect';

export interface ElementAnchor {
  selector: string;
  xpath?: string;
  textContent?: string;
}

export interface RectAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
  viewportWidth: number;
  viewportHeight: number;
}

export type AnchorPayload = ElementAnchor | RectAnchor;

// Core annotation type
export interface Annotation {
  id: string;
  url_full: string;
  url_canonical: string;
  title: string;
  body: string;
  anchor_type: AnchorType;
  anchor_payload: AnchorPayload;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: string;
  updated_by: string;
}

// Input types for creating/updating annotations
export interface CreateAnnotationInput {
  url_full: string;
  title: string;
  body: string;
  anchor_type: AnchorType;
  anchor_payload: AnchorPayload;
  actor: string;
}

export interface UpdateAnnotationInput {
  title?: string;
  body?: string;
  anchor_type?: AnchorType;
  anchor_payload?: AnchorPayload;
  actor: string;
}

// Event types
export type EventType = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'EXPORT_PROMPT';

export interface AnnotationEvent {
  id: string;
  annotation_id: string | null;
  event_type: EventType;
  actor: string;
  timestamp: string;
  diff: Record<string, { old: unknown; new: unknown }> | null;
  meta: Record<string, unknown> | null;
}

// Prompt export types
export interface PromptExport {
  id: string;
  created_at: string;
  actor: string;
  url_scope: string[];
  annotation_ids: string[];
  template_id: string;
  prompt_markdown: string;
  saved_path_md: string;
  saved_path_json: string;
}

export interface GeneratePromptInput {
  urls: string[];
  annotation_ids?: string[];
  template_id?: string;
  enhance_with_ai?: boolean;
  actor: string;
}

export interface GeneratedPrompt {
  markdown: string;
  annotations: Annotation[];
  enhanced: boolean;
}

// Page summary for dashboard
export interface PageSummary {
  url_canonical: string;
  annotation_count: number;
  latest_annotation_at: string;
}

// Configuration types
export type UrlMode = 'full' | 'canonical';
export type ActorMode = 'prompt' | 'anonymous' | 'fixed';

export interface PrototypeAnnotatorConfig {
  basePath?: string;
  dbPath?: string;
  exportDir?: string;
  defaultActor?: string;
  enableOverlay?: boolean;
  enableDashboard?: boolean;
  urlMode?: UrlMode;
  actorMode?: ActorMode;
}

export interface ResolvedConfig {
  basePath: string;
  dbPath: string;
  exportDir: string;
  defaultActor: string;
  enableOverlay: boolean;
  enableDashboard: boolean;
  urlMode: UrlMode;
  actorMode: ActorMode;
}

// Client configuration (passed to browser)
export interface ClientConfig {
  basePath: string;
  apiUrl: string;
  defaultActor: string;
  actorMode: ActorMode;
}

// Middleware result
export interface PrototypeAnnotatorMiddleware {
  middleware: () => Router;
  router: Router;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  injector: (req: any, res: any, next: () => void) => void;
  config: ResolvedConfig;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
