/**
 * Read-only access to feedback catalog copy (safe to import from utils/errors).
 */
import { FEEDBACK_CATALOG, type FeedbackId, type FeedbackEntry } from '@/config/feedbackCatalog';

export function getFeedback(id: FeedbackId): FeedbackEntry {
  return FEEDBACK_CATALOG[id];
}

export function feedbackTitle(id: FeedbackId): string {
  return FEEDBACK_CATALOG[id].title;
}

export function feedbackSubtitle(id: FeedbackId): string | undefined {
  return FEEDBACK_CATALOG[id].subtitle;
}
