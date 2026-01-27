import { AnnotationRepository } from '../db/repositories/annotations.js';
import { EventRepository } from '../db/repositories/events.js';
import type {
  Annotation,
  CreateAnnotationInput,
  UpdateAnnotationInput,
  PageSummary,
} from '../types/index.js';

export class AnnotationService {
  private annotationRepo: AnnotationRepository;
  private eventRepo: EventRepository;

  constructor() {
    this.annotationRepo = new AnnotationRepository();
    this.eventRepo = new EventRepository();
  }

  create(input: CreateAnnotationInput): Annotation {
    const annotation = this.annotationRepo.create(input);

    // Log creation event
    this.eventRepo.create({
      annotation_id: annotation.id,
      event_type: 'CREATE',
      actor: input.actor,
      meta: {
        url_full: annotation.url_full,
        title: annotation.title,
      },
    });

    return annotation;
  }

  findById(id: string): Annotation | null {
    return this.annotationRepo.findById(id);
  }

  findByUrl(urlCanonical: string, includeDeleted = false): Annotation[] {
    return this.annotationRepo.findByUrl(urlCanonical, includeDeleted);
  }

  findAll(includeDeleted = false): Annotation[] {
    return this.annotationRepo.findAll(includeDeleted);
  }

  findByIds(ids: string[]): Annotation[] {
    return this.annotationRepo.findByIds(ids);
  }

  update(id: string, input: UpdateAnnotationInput): Annotation | null {
    const existing = this.annotationRepo.findById(id);
    if (!existing || existing.deleted_at) return null;

    // Build diff for event logging
    const diff: Record<string, { old: unknown; new: unknown }> = {};

    if (input.title !== undefined && input.title !== existing.title) {
      diff.title = { old: existing.title, new: input.title };
    }
    if (input.body !== undefined && input.body !== existing.body) {
      diff.body = { old: existing.body, new: input.body };
    }
    if (input.anchor_type !== undefined && input.anchor_type !== existing.anchor_type) {
      diff.anchor_type = { old: existing.anchor_type, new: input.anchor_type };
    }
    if (input.anchor_payload !== undefined) {
      diff.anchor_payload = { old: existing.anchor_payload, new: input.anchor_payload };
    }

    const updated = this.annotationRepo.update(id, input);
    if (!updated) return null;

    // Log update event if there were changes
    if (Object.keys(diff).length > 0) {
      this.eventRepo.create({
        annotation_id: id,
        event_type: 'UPDATE',
        actor: input.actor,
        diff,
      });
    }

    return updated;
  }

  delete(id: string, actor: string): Annotation | null {
    const deleted = this.annotationRepo.softDelete(id, actor);
    if (!deleted) return null;

    // Log delete event
    this.eventRepo.create({
      annotation_id: id,
      event_type: 'DELETE',
      actor,
      meta: {
        title: deleted.title,
        url_canonical: deleted.url_canonical,
      },
    });

    return deleted;
  }

  restore(id: string, actor: string): Annotation | null {
    const restored = this.annotationRepo.restore(id, actor);
    if (!restored) return null;

    // Log restore event
    this.eventRepo.create({
      annotation_id: id,
      event_type: 'RESTORE',
      actor,
    });

    return restored;
  }

  getPages(): PageSummary[] {
    return this.annotationRepo.getPages();
  }
}
