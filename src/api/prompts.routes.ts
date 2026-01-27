import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PromptService } from '../services/prompt.service.js';
import type { ResolvedConfig } from '../types/index.js';

const GeneratePromptSchema = z.object({
  urls: z.array(z.string()).optional(),
  annotation_ids: z.array(z.string()).optional(),
  template_id: z.string().optional(),
  enhance_with_ai: z.boolean().optional(),
  actor: z.string().optional(),
});

const ConfirmPromptSchema = z.object({
  urls: z.array(z.string()).optional(),
  annotation_ids: z.array(z.string()).optional(),
  template_id: z.string().optional(),
  markdown: z.string().optional(),
  actor: z.string().optional(),
});

export function createPromptsRouter(config: ResolvedConfig): Router {
  const router = Router();
  const service = new PromptService(config);

  // Generate prompt (preview without saving)
  router.post('/generate', async (req: Request, res: Response) => {
    try {
      const result = GeneratePromptSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.message });
        return;
      }

      const generated = await service.generate({
        ...result.data,
        actor: result.data.actor || config.defaultActor,
      });

      res.json({ success: true, data: generated });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Confirm prompt (save to files) - new endpoint per spec
  router.post('/confirm', async (req: Request, res: Response) => {
    try {
      const result = ConfirmPromptSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.message });
        return;
      }

      const exported = await service.confirm({
        ...result.data,
        actor: result.data.actor || config.defaultActor,
      });

      res.status(201).json({ success: true, data: exported });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Export prompt (alias for confirm, for backwards compatibility)
  router.post('/export', async (req: Request, res: Response) => {
    try {
      const result = ConfirmPromptSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.message });
        return;
      }

      const exported = await service.confirm({
        ...result.data,
        actor: result.data.actor || config.defaultActor,
      });

      res.status(201).json({ success: true, data: exported });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // List all exports
  router.get('/exports', (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const offset = parseInt(req.query.offset as string) || 0;

      const exports = service.findAllExports(limit, offset);
      res.json({ success: true, data: exports });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Get single export
  router.get('/exports/:id', (req: Request, res: Response) => {
    try {
      const exported = service.findExportById(req.params.id);
      if (!exported) {
        res.status(404).json({ success: false, error: 'Export not found' });
        return;
      }
      res.json({ success: true, data: exported });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  return router;
}
