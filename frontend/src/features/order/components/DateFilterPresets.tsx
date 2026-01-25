/**
 * DateFilterPresets Component
 * Quick preset buttons for common date ranges
 */

import React from 'react';
import { subDays } from 'date-fns';
import { brandColors } from '@/shared/design-system/tokens/colors';

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
        className={`hover:${brandColors.primary.icon} font-medium px-1 py-0.5 rounded hover:${brandColors.primary.backgroundLight} transition-colors cursor-pointer`}
      >
        Today
      </button>
      <button
        onClick={() => {
          const yesterday = subDays(new Date(), 1);
          onSelect(yesterday, yesterday);
        }}
        className={`hover:${brandColors.primary.icon} font-medium px-1 py-0.5 rounded hover:${brandColors.primary.backgroundLight} transition-colors cursor-pointer`}
      >
        Yesterday
      </button>
      <button
        onClick={() => {
          const today = new Date();
          const lastWeek = subDays(today, 6);
          onSelect(lastWeek, today);
        }}
        className={`hover:${brandColors.primary.icon} font-medium px-1 py-0.5 rounded hover:${brandColors.primary.backgroundLight} transition-colors cursor-pointer`}
      >
        Last Week
      </button>
    </div>
  );
};
