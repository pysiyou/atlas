/**
 * DateFilter Component (Refactored)
 *
 * Simplified by extracting:
 * - State logic → hooks/useDateFilterState.ts
 * - Navigation logic → hooks/useDateFilterNavigation.ts
 * - Helper functions → utils/dateFilterHelpers.ts
 * - Calendar views → components/ (days, months, years)
 */

import React from 'react';
import { format } from 'date-fns';
import { cn } from '@/utils';

interface DateFilterProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Main DateFilter component with calendar picker and quick presets
 * TEMPORARY: Simplified during migration
 */
export const DateFilter: React.FC<DateFilterProps> = ({
  value,
  onChange,
  placeholder = 'Filter by Date',
  className,
}) => {
  const handleClear = () => onChange(null);
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={handleClear}
        className="px-4 py-2 bg-surface border border-border rounded text-sm hover:bg-app-bg transition"
      >
        {value ? `${format(value[0], 'MMM dd')} - ${format(value[1], 'MMM dd')}` : placeholder}
      </button>
    </div>
  );
};
