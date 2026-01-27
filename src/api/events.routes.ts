import { Router, Request, Response } from 'express';
import { EventService } from '../services/event.service.js';

export function createEventsRouter(): Router {
  const router = Router();
  const service = new EventService();

  // List events with optional filters
  router.get('/', (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      const offset = parseInt(req.query.offset as string) || 0;
      const annotationId = req.query.annotationId as string | undefined;
      const urlCanonical = req.query.url_canonical as string | undefined;

      let events;
      let total;

      if (annotationId) {
        // Filter by annotation ID
        events = service.findByAnnotationId(annotationId);
        total = events.length;
      } else if (urlCanonical) {
        // Filter by URL canonical
        events = service.findByUrlCanonical(urlCanonical, limit);
        total = events.length;
      } else {
        // Get all events with pagination
        events = service.findAll(limit, offset);
        total = service.countAll();
      }

      res.json({
        success: true,
        data: {
          items: events,
          total,
          limit,
          offset,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Get events by annotation ID (explicit route)
  router.get('/by-annotation/:annotationId', (req: Request, res: Response) => {
    try {
      const events = service.findByAnnotationId(req.params.annotationId);
      res.json({ success: true, data: events });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Get events by type
  router.get('/by-type/:eventType', (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
      const eventType = req.params.eventType.toUpperCase() as 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE' | 'EXPORT_PROMPT';

      const validTypes = ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'EXPORT_PROMPT'];
      if (!validTypes.includes(eventType)) {
        res.status(400).json({ success: false, error: 'Invalid event type' });
        return;
      }

      const events = service.findByEventType(eventType, limit);
      res.json({ success: true, data: events });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Get single event
  router.get('/:id', (req: Request, res: Response) => {
    try {
      const event = service.findById(req.params.id);
      if (!event) {
        res.status(404).json({ success: false, error: 'Event not found' });
        return;
      }
      res.json({ success: true, data: event });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  // Get recent activity
  router.get('/recent/activity', (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const events = service.getRecentActivity(limit);
      res.json({ success: true, data: events });
    } catch (error) {
      res.status(500).json({ success: false, error: String(error) });
    }
  });

  return router;
}
