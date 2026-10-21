/**
 * URL-synced record id chips (patient / order / sample / test).
 */

import type { UrlFilterKey, UrlFilters } from '@/utils/filters';
import { displayId } from '@/utils';
import { ActiveFilterChipBar, type ActiveFilterItem } from './ActiveFilterChipBar';

const LABELS: Record<string, { label: string; format: (v: string | number) => string }> = {
  patientId: { label: 'Patient', format: v => displayId.patient(Number(v)) },
  orderId: { label: 'Order', format: v => displayId.order(Number(v)) },
  sampleId: { label: 'Sample', format: v => displayId.sample(Number(v)) },
  testId: { label: 'Test', format: v => displayId.orderTest(Number(v)) },
};

export interface UrlFilterChipBarProps<K extends UrlFilterKey = UrlFilterKey> {
  urlFilters: UrlFilters;
  urlFilterKeys: readonly K[];
  onClear: () => void;
  onClearSingle: (key: K) => void;
}

export function UrlFilterChipBar<K extends UrlFilterKey>({
  urlFilters,
  urlFilterKeys,
  onClear,
  onClearSingle,
}: UrlFilterChipBarProps<K>) {
  const allowed = new Set<string>(urlFilterKeys);
  const items: ActiveFilterItem[] = [];
  for (const key of urlFilterKeys) {
    const value = urlFilters[key];
    if (value == null) continue;
    const config = LABELS[key];
    if (!config) continue;
    items.push({
      id: key,
      label: `${config.label}: ${config.format(value)}`,
    });
  }

  return (
    <ActiveFilterChipBar
      items={items}
      onClearAll={onClear}
      onRemoveItem={key => {
        if (allowed.has(key)) onClearSingle(key as K);
      }}
    />
  );
}
