/**
 * LabHistoryTimeline - Displays lab operation events in a vertical timeline
 * matching the reference design with version-style badges and timestamps.
 */

import React from 'react';
import { useLabHistory } from '../hooks/useLabHistory';
import type { LabHistoryEvent, LabHistoryEventType } from '../hooks/useLabHistory';
import { ICONS } from '@/utils';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { formatDistanceToNow } from 'date-fns';

const EVENT_CONFIG: Record<
  LabHistoryEventType,
  { label: string; icon: IconName; color: string }
> = {
  sample_created: {
    label: 'New sampling arrived',
    icon: ICONS.dataFields.flask,
    color: 'bg-blue-500',
  },
  sample_collected: {
    label: 'Sampling performed',
    icon: ICONS.actions.check,
    color: 'bg-green-500',
  },
  sample_rejected: {
    label: 'Sample rejected',
    icon: ICONS.actions.close,
    color: 'bg-red-500',
  },
  result_entered: {
    label: 'Result entered',
    icon: ICONS.dataFields.notebook,
    color: 'bg-orange-500',
  },
  result_validated: {
    label: 'Result validated',
    icon: ICONS.ui.shieldCheck,
    color: 'bg-emerald-500',
  },
  result_rejected: {
    label: 'Result rejected',
    icon: ICONS.actions.close,
    color: 'bg-red-500',
  },
  escalation_requested: {
    label: 'Escalation requested',
    icon: ICONS.actions.alertCircle,
    color: 'bg-yellow-500',
  },
};

interface TimelineEventProps {
  event: LabHistoryEvent;
  isLast: boolean;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ event, isLast }) => {
  const config = EVENT_CONFIG[event.type];
  const timeAgo = formatDistanceToNow(new Date(event.timestamp), { addSuffix: true });

  return (
    <div className="flex gap-3 relative">
      {/* Timeline line and badge */}
      <div className="flex flex-col items-center relative">
        {/* Badge */}
        <div
          className={`${config.color} w-8 h-8 rounded-full flex items-center justify-center border-2 border-bg-primary z-10 flex-shrink-0`}
        >
          <Icon name={config.icon} className="w-4 h-4 text-white" />
        </div>
        {/* Vertical line */}
        {!isLast && (
          <div className="w-0.5 bg-border-default flex-1 absolute top-8 bottom-0" />
        )}
      </div>

      {/* Event content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="text-sm font-medium text-text-primary">{event.description}</div>
        <div className="text-xs text-text-secondary mt-0.5">
          {event.actor} • {timeAgo}
        </div>
      </div>
    </div>
  );
};

interface LabHistoryTimelineProps {
  className?: string;
}

export const LabHistoryTimeline: React.FC<LabHistoryTimelineProps> = ({
  className = '',
}) => {
  const { events, isLoading } = useLabHistory();

  if (isLoading) {
    return (
      <div
        className={`flex items-center justify-center h-full ${className}`}
      >
        <span className="text-text-tertiary text-sm">Loading...</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-full ${className}`}
      >
        <span className="text-text-tertiary text-sm">No lab activity yet</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-default">
        <h3 className="text-sm font-semibold text-text-primary">Lab History</h3>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {events.map((event, index) => (
          <TimelineEvent
            key={event.id}
            event={event}
            isLast={index === events.length - 1}
          />
        ))}
      </div>
    </div>
  );
};
