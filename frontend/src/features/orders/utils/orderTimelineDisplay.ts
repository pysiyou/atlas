import type { StepProgress } from './orderTimelineUtils';

/**
 * Format timestamp for display.
 * Shows relative time for recent events, full date for older ones.
 */
export function formatTimelineTimestamp(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    const diffInMinutes = Math.floor(diffInHours * 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    return `${Math.floor(diffInHours)}h ago`;
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get the status message for a step that is in progress or blocked.
 */
export function getTimelineStatusMessage(
  stepStatus: string,
  progress: StepProgress,
  blocked: boolean
): string | null {
  if (stepStatus === 'paid') {
    if (!progress.isFullyComplete) {
      return 'Awaiting payment';
    }
    return null;
  }

  if (blocked && !progress.isFullyComplete) {
    return 'Awaiting payment';
  }

  if (progress.isStarted && !progress.isFullyComplete) {
    if (progress.isPartial) {
      return `${progress.completed}/${progress.total} tests complete`;
    }
    return 'In progress...';
  }

  return null;
}

export function getTimelineLineColor(
  progress: StepProgress,
  nextProgress: StepProgress | null,
  blocked: boolean
): string {
  if (progress.isFullyComplete && nextProgress?.isStarted) {
    return 'bg-success';
  }
  if (progress.isFullyComplete) {
    return 'bg-stroke';
  }
  if (blocked) {
    return 'bg-warning-stroke';
  }
  return 'bg-stroke';
}

export function getTimelineLabelColor(
  progress: StepProgress,
  stepStatus: string,
  blocked: boolean
): string {
  if (progress.isFullyComplete) return 'text-text-primary';
  if (blocked && stepStatus !== 'paid') return 'text-text-disabled';
  if (progress.isStarted) return 'text-text-primary';
  return 'text-text-disabled';
}

export function getTimelineStatusColor(
  stepStatus: string,
  progress: StepProgress,
  blocked: boolean
): string {
  if (stepStatus === 'paid' && !progress.isFullyComplete) return 'text-warning-fg';
  if (blocked) return 'text-warning-fg';
  return 'text-brand';
}
