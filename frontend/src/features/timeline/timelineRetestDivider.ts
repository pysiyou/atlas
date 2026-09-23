import type { TimelineEvent } from '@/features/lab';
import { testIdFromEvent } from './timelineDetails';

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
