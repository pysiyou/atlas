/**
 * DateFilterPresets Component
 * Quick preset buttons for common date ranges
 */

import React from 'react';
import { subDays } from 'date-fns';

export interface DateFilterPresetsProps {
  onSelect: (start: Date, end: Date) => void;
}

/**
 * Renders preset buttons for Today, Yesterday, and Last Week
 */
export const DateFilterPresets: React.FC<DateFilterPresetsProps> = ({ onSelect }) => {
  return (
    <div className="mt-3 pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-text-tertiary">
      <button
        onClick={() => {
          const today = new Date();
          onSelect(today, today);
        }}
        className="hover:text-brand font-medium px-1 py-0.5 rounded hover:bg-brand/10 transition-colors cursor-pointer"
      >
        Today
      </button>
      <button
        onClick={() => {
          const yesterday = subDays(new Date(), 1);
          onSelect(yesterday, yesterday);
        }}
        className="hover:text-brand font-medium px-1 py-0.5 rounded hover:bg-brand/10 transition-colors cursor-pointer"
      >
        Yesterday
      </button>
      <button
        onClick={() => {
          const today = new Date();
          const lastWeek = subDays(today, 6);
          onSelect(lastWeek, today);
        }}
        className="hover:text-brand font-medium px-1 py-0.5 rounded hover:bg-brand/10 transition-colors cursor-pointer"
      >
        Last Week
      </button>
    </div>
  );
};
