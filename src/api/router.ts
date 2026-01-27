import { Router } from 'express';
import { createAnnotationsRouter } from './annotations.routes.js';
import { createEventsRouter } from './events.routes.js';
import { createPromptsRouter } from './prompts.routes.js';
import { AnnotationService } from '../services/annotation.service.js';
import type { ResolvedConfig } from '../types/index.js';

export function createApiRouter(config: ResolvedConfig): Router {
  const router = Router();
  const annotationService = new AnnotationService();

  // Mount sub-routers
  router.use('/annotations', createAnnotationsRouter(config));
  router.use('/events', createEventsRouter());
  router.use('/prompts', createPromptsRouter(config));

  // Pages endpoint (list all annotated URLs)
  router.get('/pages', (_req, res) => {
    try {
      const pages = annotationService.getPages();
      res.json({ success: true, data: pages });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Health check
  router.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  });

  return router;
}
