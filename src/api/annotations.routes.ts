import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AnnotationService } from '../services/annotation.service.js';
import type { ResolvedConfig } from '../types/index.js';

const CreateAnnotationSchema = z.object({
  url_full: z.string().url(),
  title: z.string().min(1).max(500),
  body: z.string(),
  anchor_type: z.enum(['element', 'rect']),
  anchor_payload: z.record(z.unknown()),
  actor: z.string().optional(),
});

const UpdateAnnotationSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  body: z.string().optional(),
  anchor_type: z.enum(['element', 'rect']).optional(),
  anchor_payload: z.record(z.unknown()).optional(),
  actor: z.string().optional(),
});

export function createAnnotationsRouter(config: ResolvedConfig): Router {
  const router = Router();
  const service = new AnnotationService();

  // List all annotations
  router.get('/', (_req: Request, res: Response) => {
    try {
      const includeDeleted = _req.query.includeDeleted === 'true';
      const annotations = service.findAll(includeDeleted);
      res.json({ success: true, data: annotations });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Get annotations by URL
  router.get('/by-url', (req: Request, res: Response) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        res.status(400).json({ success: false, error: 'url query parameter required' });
        return;
      }
      const includeDeleted = req.query.includeDeleted === 'true';
      const annotations = service.findByUrl(url, includeDeleted);
      res.json({ success: true, data: annotations });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Get single annotation
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const annotation = service.findById(req.params.id);
      if (!annotation) {
        res.status(404).json({ success: false, error: 'Annotation not found' });
        return;
      }
      res.json({ success: true, data: annotation });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Create annotation
  router.post('/', (req: Request, res: Response) => {
    try {
      const result = CreateAnnotationSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.message });
        return;
      }

      const annotation = service.create({
        ...result.data,
        anchor_payload: result.data.anchor_payload as never,
        actor: result.data.actor || config.defaultActor,
      });

      res.status(201).json({ success: true, data: annotation });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Update annotation
  router.patch('/:id', (req: Request, res: Response) => {
    try {
      const result = UpdateAnnotationSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.message });
        return;
      }

      const updated = service.update(req.params.id, {
        ...result.data,
        anchor_payload: result.data.anchor_payload as never,
        actor: result.data.actor || config.defaultActor,
      });

      if (!updated) {
        res.status(404).json({ success: false, error: 'Annotation not found' });
        return;
      }

      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Delete annotation (soft delete)
  router.delete('/:id', (req: Request, res: Response) => {
    try {
      const actor = (req.query.actor as string) || config.defaultActor;
      const deleted = service.delete(req.params.id, actor);

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Annotation not found' });
        return;
      }

      res.json({ success: true, data: deleted });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Restore annotation
  router.post('/:id/restore', (req: Request, res: Response) => {
    try {
      const actor = (req.body.actor as string) || config.defaultActor;
      const restored = service.restore(req.params.id, actor);

      if (!restored) {
        res.status(404).json({ success: false, error: 'Annotation not found or not deleted' });
        return;
      }

      res.json({ success: true, data: restored });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  return router;
}
