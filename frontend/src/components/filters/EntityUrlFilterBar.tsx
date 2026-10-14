/**
 * EntityUrlFilterBar — URL entity-filter badges with typed single-key clear.
 */

import type { UrlFilterKey, UrlFilters } from '@/utils/filters';
import { UrlFilterBadges } from './UrlFilterBadges';

export interface EntityUrlFilterBarProps<K extends UrlFilterKey = UrlFilterKey> {
  urlFilters: UrlFilters;
  urlFilterKeys: readonly K[];
  onClear: () => void;
  onClearSingle: (key: K) => void;
}

/**
 * Renders nothing when no allowed entity keys are active.
 */
export function EntityUrlFilterBar<K extends UrlFilterKey>({
  urlFilters,
  urlFilterKeys,
  onClear,
  onClearSingle,
}: EntityUrlFilterBarProps<K>) {
  const allowed = new Set<string>(urlFilterKeys);
  const visible: UrlFilters = {};
  for (const key of urlFilterKeys) {
    const value = urlFilters[key];
    if (value !== undefined) {
      visible[key] = value;
    }
  }

  if (Object.keys(visible).length === 0) return null;

  return (
    <UrlFilterBadges
      urlFilters={visible}
      onClear={onClear}
      onClearSingle={key => {
        if (allowed.has(key)) {
          onClearSingle(key as K);
        }
      }}
    />
  );
}
