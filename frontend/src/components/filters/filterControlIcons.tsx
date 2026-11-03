/**
 * Default leading icons for filter controls when config omits `icon`.
 */
import React from 'react';
import { Icon } from '@/components/primitives/Icon';
import { IconKeys, type IconKey } from '@/config/icons';
import type { FilterControl } from './types';

const triggerIconClass =
  'w-4 h-4 text-text-muted group-hover:text-brand shrink-0 transition-colors';

export function filterTriggerIcon(iconKey: IconKey): React.ReactNode {
  return <Icon iconKey={iconKey} className={triggerIconClass} />;
}

/** Resolve leading icon for a filter control (explicit config icon or key/type defaults). */
export function resolveFilterControlIcon(control: FilterControl): IconKey | undefined {
  if (control.icon) return control.icon;

  const key = control.key.toLowerCase();

  if (control.type === 'dateRange' || key.includes('date')) {
    return IconKeys.dataFields.date;
  }

  if (key === 'sex' || key.includes('gender')) {
    return IconKeys.dataFields.gender;
  }

  if (key === 'status' || key.includes('status')) {
    if (key.includes('payment')) return IconKeys.domain.paymentStatus;
    if (key.includes('account')) return IconKeys.domain.orderStatus;
    return IconKeys.domain.orderStatus;
  }

  if (control.type === 'priceRange' || key.includes('price')) {
    return IconKeys.dataFields.cash;
  }

  return undefined;
}

export function filterControlLeftIcon(control: FilterControl): React.ReactNode | undefined {
  const key = resolveFilterControlIcon(control);
  return key ? filterTriggerIcon(key) : undefined;
}
