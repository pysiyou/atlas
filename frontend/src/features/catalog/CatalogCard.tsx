import { Badge } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import { formatCurrency, formatTurnaroundTime } from '@/utils';
import type { Test } from '@/types';

/**
 * CatalogCard Component
 *
 * Custom mobile card component for test catalog data.
 * Displays test information in a mobile-friendly card layout.
 *
 * @param item - Test data
 * @param index - Index of the test in the list
 * @param onClick - Optional click handler
 */
export function CatalogCard({ item: test, onClick }: CardComponentProps<Test>) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
    >
      {/* Header: Test code (left) + Price (right) */}
      <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-100">
        <span className="text-xs text-sky-600 font-medium leading-none">{test.code}</span>
        <div className="font-medium text-sky-600 text-lg leading-none">
          {formatCurrency(test.price)}
        </div>
      </div>

      {/* Test name and synonyms */}
      <div className="flex-grow">
        <div className="font-semibold text-gray-900 text-sm break-words">{test.name}</div>
        {test.synonyms && test.synonyms.length > 0 && (
          <div className="text-xs text-gray-500 truncate mt-1">
            {test.synonyms.slice(0, 2).join(', ')}
            {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
          </div>
        )}
        {/* Sample volume - shown if available */}
        {test.sampleVolume && (
          <div className="text-xs text-gray-500 mt-1">Volume: {test.sampleVolume}</div>
        )}
      </div>

      {/* Bottom section: Turnaround time (left) + Category + Sample Type badges (right) */}
      <div className="flex justify-between items-center mt-auto pt-3">
        {/* Turnaround time on bottom left */}
        <div className="text-xs text-gray-500">
          TAT: {formatTurnaroundTime(test.turnaroundTime)}
        </div>
        {/* Category and Sample Type badges on bottom right */}
        <div className="flex items-center gap-2">
          <Badge variant={test.category} size="xs" className="border-none font-medium" />
          {/* Sample Type badge */}
          <Badge variant={test.sampleType} size="xs" />
        </div>
      </div>
    </div>
  );
}
