/**
 * Entity timeline formatting — delegates to the entity event registry.
 */

import type { TimelineEvent } from '../api/labCommandCenter';
import { formatEntityEvent } from './labEntityTimelineEvents';
import { testIdFromEvent } from './labTimelineShared';

export type { FormattedTimelineEvent, EventDetail } from './labTimelineShared';

export function formatEntityTimelineEvent(event: TimelineEvent) {
  return formatEntityEvent(event);
}

/** Returns divider content when the test entity changes between consecutive events. */
export function getRetestAttemptDivider(
  current: TimelineEvent,
  previous: TimelineEvent | undefined,
): { testId: number } | null {
  if (!previous) return null;
  const currentTestId = testIdFromEvent(current);
  const previousTestId = testIdFromEvent(previous);
  if (
    currentTestId != null &&
    previousTestId != null &&
    currentTestId !== previousTestId
  ) {
    return { testId: currentTestId };
  }
  return null;
}
