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
    <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
      <div className="flex-shrink-0 p-2 bg-amber-500 rounded-full">
        <Icon name={ICONS.priority} className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-amber-900 uppercase tracking-wide">STAT / Urgent</p>
        <p className="text-2xl font-bold text-amber-800">{count}</p>
        <p className="text-xxs text-amber-700">orders pending</p>
      </div>
    </div>
  );
}
