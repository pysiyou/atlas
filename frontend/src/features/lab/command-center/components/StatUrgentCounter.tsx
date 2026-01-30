/**
 * StatUrgentCounter - STAT/urgent orders pending widget.
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';

export interface StatUrgentCounterProps {
  count: number;
}

export const StatUrgentCounter: React.FC<StatUrgentCounterProps> = ({ count }) => {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-feedback-warning-border-strong bg-feedback-warning-bg px-4 py-3">
      <div className="flex-shrink-0 p-2 bg-feedback-warning-bg0 rounded-full">
        <Icon name={ICONS.priority} className="w-5 h-5 text-action-warning-on" />
      </div>
      <div>
        <p className="text-xs font-medium text-feedback-warning-text-strong uppercase tracking-wide">STAT / Urgent</p>
        <p className="text-2xl font-bold text-feedback-warning-text-strong">{count}</p>
        <p className="text-xxs text-feedback-warning-text">orders pending</p>
      </div>
    </div>
  );
}
