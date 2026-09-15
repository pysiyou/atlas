import { Badge, MobileEntityCard, EntityId } from '@/components';
import type { CardComponentProps } from '@/components';
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
    <MobileEntityCard onClick={onClick}>
      <MobileEntityCard.Header
        leading={
          <div className="flex flex-col min-w-0">
            <div className="text-sm text-text-primary break-words">{test.name}</div>
            <EntityId className="leading-none">{test.code}</EntityId>
          </div>
        }
        trailing={
          <div className="text-text-primary text-lg leading-none">{formatCurrency(test.price)}</div>
        }
      />

      {/* Synonyms and volume */}
      <div className="grow">
        <div className="space-y-1">
          {test.synonyms && test.synonyms.length > 0 && (
            <div className="text-xs text-text-secondary truncate">
              {test.synonyms.slice(0, 2).join(', ')}
              {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
            </div>
          )}
          {test.sampleVolume && (
            <div className="text-xs text-text-secondary">Volume: {test.sampleVolume}</div>
          )}
        </div>
      </div>

      {/* Bottom section: Turnaround time (left) + Category + Sample Type badges (right) */}
      <div className="flex justify-between items-center mt-auto pt-3">
        <div className="text-xs text-text-tertiary">
          TAT: {formatTurnaroundTime(test.turnaroundTime)}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={test.category} size="xs" className="border-none" />
          <Badge variant={test.sampleType} size="xs" />
        </div>
      </div>
    </MobileEntityCard>
  );
}
