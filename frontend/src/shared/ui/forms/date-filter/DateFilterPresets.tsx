/**
 * DateFilterPresets - Quick preset buttons for common date ranges
 */

import React from 'react';
import { subDays } from 'date-fns';

export interface DateFilterPresetsProps {
  onSelect: (start: Date, end: Date) => void;
}

export const DateFilterPresets: React.FC<DateFilterPresetsProps> = ({ onSelect }) => (
  <div className="mt-3 pt-2 border-t border-stroke-subtle flex items-center justify-between text-xs text-fg-subtle">
    <button
      onClick={() => {
        const today = new Date();
        onSelect(today, today);
      }}
      className="hover:text-brand font-normal px-1 py-0.5 rounded hover:bg-brand-muted transition-colors cursor-pointer"
    >
      Today
    </button>
    <button
      onClick={() => {
        const yesterday = subDays(new Date(), 1);
        onSelect(yesterday, yesterday);
      }}
      className="hover:text-brand font-normal px-1 py-0.5 rounded hover:bg-brand-muted transition-colors cursor-pointer"
    >
      Yesterday
    </button>
    <button
      onClick={() => {
        const today = new Date();
        onSelect(subDays(today, 6), today);
      }}
      className="hover:text-brand font-normal px-1 py-0.5 rounded hover:bg-brand-muted transition-colors cursor-pointer"
    >
      Last Week
    </button>
  </div>
);
