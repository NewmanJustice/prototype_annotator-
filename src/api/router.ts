import { Router } from 'express';
import { createAnnotationsRouter } from './annotations.routes.js';
import { createEventsRouter } from './events.routes.js';
import { createPromptsRouter } from './prompts.routes.js';
import { AnnotationService } from '../services/annotation.service.js';
import { OllamaManager } from '../ollama/manager.js';
import type { ResolvedConfig } from '../types/index.js';

export function createApiRouter(config: ResolvedConfig): Router {
  const router = Router();
  const annotationService = new AnnotationService();
  const ollamaManager = new OllamaManager(config.ollamaUrl, config.ollamaModel);

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

  // Ollama status endpoint
  router.get('/ollama/status', async (_req, res) => {
    try {
      const status = await ollamaManager.getStatus(true);
      res.json({
        success: true,
        data: {
          ...status,
          setupInstructions: !status.running ? ollamaManager.getSetupInstructions() : undefined,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Ollama setup instructions endpoint
  router.get('/ollama/setup', (_req, res) => {
    res.json({
      success: true,
      data: {
        instructions: ollamaManager.getSetupInstructions(),
        model: config.ollamaModel,
        ollamaUrl: config.ollamaUrl,
      },
    });
  });

  return router;
}
