import { ListCard } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import { StatusValueBadge } from '@/features/shared';
import type { CardComponentProps } from '@/components/data-table';
import { formatCurrency, formatTurnaroundTime } from '@/utils';
import type { TestSummary } from '@/types';
import { text, BADGE, PRICE_DISPLAY } from '@/theme/recipes';


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
export function CatalogCard({ item: test, onClick }: CardComponentProps<TestSummary>) {
  return (
    <ListCard onPress={onClick}>
      <ListCard.Header
        leading={
          <div className="flex flex-col min-w-0">
            <div className={`${text({ role: 'amount' })} break-words`}>{test.name}</div>
            <RecordId className="leading-none">{test.code}</RecordId>
          </div>
        }
        trailing={
          <div className={`${PRICE_DISPLAY} leading-none`}>{formatCurrency(test.price)}</div>
        }
      />

      <div className="grow">
        <div className="space-y-space-1">
          {test.synonyms && test.synonyms.length > 0 && (
            <div className={`${text({ role: 'label' })} truncate`}>
              {test.synonyms.slice(0, 2).join(', ')}
              {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Turnaround time (left) + Category + Sample Type badges (right) */}
      <div className="flex justify-between items-center mt-auto pt-space-3">
        <div className={text({ role: 'body', intent: 'muted' })}>
          TAT: {formatTurnaroundTime(test.turnaroundTime)}
        </div>
        <div className="flex items-center gap-space-2">
          <StatusValueBadge value={test.category} size="xs" className={BADGE.tableEmbed} />
          <StatusValueBadge value={test.sampleType} size="xs" />
        </div>
      </div>
    </ListCard>
  );
}
