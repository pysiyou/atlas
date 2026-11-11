/**
 * Description-list field descriptors (no React components).
 * Distinct from `@/theme/recipes/presentation` (CSS) and generated presentation enums.
 */

import type { ReactNode } from 'react';
import type { DescriptionListItemConfig } from '@/components/display/DescriptionList';

export type FieldKind = 'text' | 'timestamp' | 'badge';

export interface PresentationContext {
  resolveUserDisplay?: (userId: string) => string | undefined;
}

export interface FieldDescriptor {
  id: string;
  label: string;
  kind?: FieldKind;
  value?: string | null;
  timestamp?: string;
  user?: string;
  hidden?: boolean | ((ctx: PresentationContext) => boolean);
  gridSpan?: 'full';
  renderValue?: (ctx: PresentationContext) => ReactNode;
}

function isHidden(descriptor: FieldDescriptor, ctx: PresentationContext): boolean {
  if (typeof descriptor.hidden === 'function') {
    return descriptor.hidden(ctx);
  }
  return descriptor.hidden === true;
}

export function buildDescriptionItems(
  descriptors: FieldDescriptor[],
  ctx: PresentationContext = {}
): DescriptionListItemConfig[] {
  const items: DescriptionListItemConfig[] = [];

  for (const descriptor of descriptors) {
    if (isHidden(descriptor, ctx)) {
      continue;
    }

    if (descriptor.renderValue) {
      items.push({
        label: descriptor.label,
        value: descriptor.renderValue(ctx),
      });
      continue;
    }

    items.push({
      label: descriptor.label,
      value: descriptor.value ?? undefined,
      timestamp: descriptor.timestamp,
      user: descriptor.user,
    });
  }

  return items;
}
