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
    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
      <button
        onClick={() => {
          const today = new Date();
          onSelect(today, today);
        }}
        className="hover:text-sky-600 font-medium px-1 py-0.5 rounded hover:bg-sky-50 transition-colors cursor-pointer"
      >
        Today
      </button>
      <button
        onClick={() => {
          const yesterday = subDays(new Date(), 1);
          onSelect(yesterday, yesterday);
        }}
        className="hover:text-sky-600 font-medium px-1 py-0.5 rounded hover:bg-sky-50 transition-colors cursor-pointer"
      >
        Yesterday
      </button>
      <button
        onClick={() => {
          const today = new Date();
          const lastWeek = subDays(today, 6);
          onSelect(lastWeek, today);
        }}
        className="hover:text-sky-600 font-medium px-1 py-0.5 rounded hover:bg-sky-50 transition-colors cursor-pointer"
      >
        Last Week
      </button>
    </div>
  );
};
