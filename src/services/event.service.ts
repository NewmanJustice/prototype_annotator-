import { EventRepository } from '../db/repositories/events.js';
import type { AnnotationEvent, EventType } from '../types/index.js';

export class EventService {
  private eventRepo: EventRepository;

  constructor() {
    this.eventRepo = new EventRepository();
  }

  findById(id: string): AnnotationEvent | null {
    return this.eventRepo.findById(id);
  }

  findByAnnotationId(annotationId: string): AnnotationEvent[] {
    return this.eventRepo.findByAnnotationId(annotationId);
  }

  findAll(limit = 100, offset = 0): AnnotationEvent[] {
    return this.eventRepo.findAll(limit, offset);
  }

  findByEventType(eventType: EventType, limit = 100): AnnotationEvent[] {
    return this.eventRepo.findByEventType(eventType, limit);
  }

  findByDateRange(startDate: string, endDate: string): AnnotationEvent[] {
    return this.eventRepo.findByDateRange(startDate, endDate);
  }

  countAll(): number {
    return this.eventRepo.countAll();
  }

  getRecentActivity(limit = 20): AnnotationEvent[] {
    return this.eventRepo.findAll(limit, 0);
  }

  findByUrlCanonical(urlCanonical: string, limit = 100): AnnotationEvent[] {
    return this.eventRepo.findByUrlCanonical(urlCanonical, limit);
  }
}
