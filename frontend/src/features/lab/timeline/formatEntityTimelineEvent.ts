/**
 * Entity timeline formatting — delegates to the entity event registry.
 */

import { displayId } from '@/utils';
import type { TimelineEvent } from '../api/commandCenter.api';
import { formatEntityEvent } from './registry';
import { testIdFromEvent } from './timelineDetailBuilders';

export type { FormattedTimelineEvent, EventDetail } from './timelineDetailBuilders';

export function formatEntityTimelineEvent(event: TimelineEvent) {
  return formatEntityEvent(event);
}

/** Returns a divider label when the test entity changes between consecutive events. */
export function getRetestAttemptDivider(
  current: TimelineEvent,
  previous: TimelineEvent | undefined,
): string | null {
  if (!previous) return null;
  const currentTestId = testIdFromEvent(current);
  const previousTestId = testIdFromEvent(previous);
  if (
    currentTestId != null &&
    previousTestId != null &&
    currentTestId !== previousTestId
  ) {
    return `Retest attempt · ${displayId.orderTest(currentTestId)}`;
  }
  return null;
}
