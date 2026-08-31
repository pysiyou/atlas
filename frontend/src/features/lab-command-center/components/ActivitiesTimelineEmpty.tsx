/**
 * Empty state for ActivitiesTimeline.
 */

import React from 'react';

export interface ActivitiesTimelineEmptyProps {
  className?: string;
}

export const ActivitiesTimelineEmpty: React.FC<ActivitiesTimelineEmptyProps> = ({
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center h-full bg-surface ${className}`}>
    <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center mb-3">
      <span className="text-text-disabled text-lg" aria-hidden>◇</span>
    </div>
    <p className="text-sm text-text-secondary font-medium">No recent activity</p>
    <p className="text-xxs text-text-tertiary mt-0.5">Activity will appear here</p>
  </div>
);
