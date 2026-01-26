import { Badge } from '@/shared/ui';
import type { CardComponentProps } from '@/shared/ui/Table';
import { formatCurrency, formatTurnaroundTime } from '@/utils';
import type { Test } from '@/types';
import { mobileCard } from '@/shared/design-system/tokens/components/card';
import { brandColors } from '@/shared/design-system/tokens/colors';

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
      className={mobileCard.base}
    >
      {/* Header: Test code (left) + Price (right) */}
      <div className={`${mobileCard.header.container} flex justify-between items-center`}>
        <span className={`text-xs ${brandColors.primary.icon} font-medium font-mono leading-none`}>{test.code}</span>
        <div className={`font-medium ${brandColors.primary.icon} text-lg leading-none`}>
          {formatCurrency(test.price)}
        </div>
      </div>

      {/* Test name and synonyms */}
      <div className={mobileCard.content.container}>
        <div className={`${mobileCard.header.title} break-words`}>{test.name}</div>
        {test.synonyms && test.synonyms.length > 0 && (
          <div className={`${mobileCard.content.textSecondary} truncate mt-1`}>
            {test.synonyms.slice(0, 2).join(', ')}
            {test.synonyms.length > 2 && ` +${test.synonyms.length - 2} more`}
          </div>
        )}
        {/* Sample volume - shown if available */}
        {test.sampleVolume && (
          <div className={`${mobileCard.content.textSecondary} mt-1`}>Volume: {test.sampleVolume}</div>
        )}
      </div>

      {/* Bottom section: Turnaround time (left) + Category + Sample Type badges (right) */}
      <div className={mobileCard.footer.container}>
        {/* Turnaround time on bottom left */}
        <div className={mobileCard.content.textSecondary}>
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
