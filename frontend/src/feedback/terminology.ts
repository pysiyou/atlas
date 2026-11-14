/**
 * Apply client terminology to feedback catalog strings (no `@/feedback` barrel — safe for `@/utils/errors`).
 */
import {
  FEEDBACK_CATALOG,
  type FeedbackEntry,
  type FeedbackId,
} from '@/types/generated/feedbackCatalog';
import { getFeedbackTerminologyContext, interpolate } from '@/config/clientConfig';

export function applyFeedbackTerminology(entry: FeedbackEntry): FeedbackEntry {
  const terminologyContext = getFeedbackTerminologyContext();
  return {
    ...entry,
    title: interpolate(entry.title, terminologyContext),
    subtitle: entry.subtitle ? interpolate(entry.subtitle, terminologyContext) : undefined,
    brief: entry.brief ? interpolate(entry.brief, terminologyContext) : undefined,
  };
}

export function resolveFeedbackTitle(id: FeedbackId): string {
  return applyFeedbackTerminology(FEEDBACK_CATALOG[id]).title;
}