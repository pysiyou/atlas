/**
 * UrlFilterBadges - Display and clear active URL-synced entity filters
 * Shows badges for patientId, orderId, sampleId, testId with clear buttons
 */

import { Icon, Badge } from '@/components/primitives';
import { ICONS } from '@/config/icons';
import { displayId } from '@/utils';
import type { UrlFilters } from '@/utils/filters';
import { TYPE } from '@/theme/recipes';

export interface UrlFilterBadgesProps {
  urlFilters: UrlFilters;
  onClear: () => void;
  onClearSingle?: (key: string) => void;
}

const FILTER_LABELS: Record<string, { label: string; formatValue: (value: string | number) => string }> = {
  patientId: { label: 'Patient', formatValue: (value) => displayId.patient(Number(value)) },
  orderId: { label: 'Order', formatValue: (value) => displayId.order(Number(value)) },
  sampleId: { label: 'Sample', formatValue: (value) => displayId.sample(Number(value)) },
  testId: { label: 'Test', formatValue: (value) => displayId.orderTest(Number(value)) },
};

export function UrlFilterBadges({ urlFilters, onClear, onClearSingle }: UrlFilterBadgesProps) {
  const activeFilters = Object.entries(urlFilters).filter(([_, value]) => value != null);

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex items-center gap-space-2 px-space-4 py-space-2 bg-surface-secondary border-b border-border-default">
      <span className={`${TYPE.label} text-text-secondary`}>Filtered by:</span>
      
      <div className="flex items-center gap-space-2 flex-wrap">
        {activeFilters.map(([key, value]) => {
          const config = FILTER_LABELS[key];
          if (!config) return null;

          const displayValue = config.formatValue(value);

          return (
            <Badge
              key={key}
              variant="info"
              size="sm"
              className="flex items-center gap-space-1.5"
            >
              <span>
                {config.label}: {displayValue}
              </span>
              {onClearSingle && (
                <button
                  onClick={() => onClearSingle(key)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Clear ${config.label} filter`}
                  type="button"
                >
                  <Icon name={ICONS.actions.close} className="w-3 h-3" />
                </button>
              )}
            </Badge>
          );
        })}
      </div>

      <button
        onClick={onClear}
        className={`ml-auto ${TYPE.label} text-text-secondary hover:text-text-primary transition-colors`}
        type="button"
      >
        Clear all filters
      </button>
    </div>
  );
}
