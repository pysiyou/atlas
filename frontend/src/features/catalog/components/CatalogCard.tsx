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
      className="bg-surface border border-border rounded-md p-3 duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Header: Test name + code (left) + Price (right) */}
      <div className="flex justify-between items-center mb-3 pb-3 border-b border-border">
        <div className="flex flex-col min-w-0">
          <div className="text-sm font-semibold text-text break-words">{test.name}</div>
          <span className="text-xs text-primary font-medium font-mono leading-none">{test.code}</span>
        </div>
        <div className="font-medium text-text text-lg leading-none">
          {formatCurrency(test.price)}
        </div>
      </div>

      {/* Synonyms and volume */}
      <div className="grow">
        <div className="space-y-1">
          {test.synonyms && test.synonyms.length > 0 && (
            <div className="text-xs text-text-2 truncate">
              {test.synonyms.slice(0, 2).join(', ')}
              {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
            </div>
          )}
          {/* Sample volume - shown if available */}
          {test.sampleVolume && (
            <div className="text-xs text-text-2">Volume: {test.sampleVolume}</div>
          )}
        </div>
      </div>

      {/* Bottom section: Turnaround time (left) + Category + Sample Type badges (right) */}
      <div className="flex justify-between items-center mt-auto pt-3">
        {/* Turnaround time on bottom left */}
        <div className="text-xs text-text-3">
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
