// Main entry point for prototype-annotator

export { createPrototypeAnnotator } from './middleware/factory.js';

// Re-export types
export type {
  // Core types
  Annotation,
  AnchorType,
  AnchorPayload,
  ElementAnchor,
  RectAnchor,
  CreateAnnotationInput,
  UpdateAnnotationInput,

  // Event types
  AnnotationEvent,
  EventType,

  // Prompt types
  PromptExport,
  GeneratePromptInput,
  GeneratedPrompt,

  // Page types
  PageSummary,

  // Config types
  PrototypeAnnotatorConfig,
  ResolvedConfig,
  ClientConfig,

  // API types
  ApiResponse,
  PaginatedResponse,
  PrototypeAnnotatorMiddleware,
} from './types/index.js';

// Export database utilities for advanced usage
export { initDatabase, closeDatabase, getDatabase } from './db/index.js';

// Export config utilities
export { resolveConfig, getClientConfig } from './config/index.js';
