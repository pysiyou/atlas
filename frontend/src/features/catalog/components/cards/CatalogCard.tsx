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
      className="bg-surface rounded-lg p-4 shadow-sm border border-border hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Header: Test code (left) + Price (right) */}
      <div className="mb-3 flex justify-between items-center">
        <span className="text-xs text-brand font-medium font-mono leading-none">{test.code}</span>
        <div className="font-medium text-brand text-lg leading-none">
          {formatCurrency(test.price)}
        </div>
      </div>

      {/* Test name and synonyms */}
      <div className="space-y-2">
        <div className="text-base font-semibold text-text-primary break-words">{test.name}</div>
        {test.synonyms && test.synonyms.length > 0 && (
          <div className="text-sm text-text-secondary truncate mt-1">
            {test.synonyms.slice(0, 2).join(', ')}
            {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
          </div>
        )}
        {/* Sample volume - shown if available */}
        {test.sampleVolume && (
          <div className="text-sm text-text-secondary mt-1">Volume: {test.sampleVolume}</div>
        )}
      </div>

      {/* Bottom section: Turnaround time (left) + Category + Sample Type badges (right) */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
        {/* Turnaround time on bottom left */}
        <div className="text-sm text-text-secondary">
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
