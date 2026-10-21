/* eslint-disable react-refresh/only-export-components -- util render helpers, not a component module */
/**
 * Shared stacked identity and table entity sub-line renders.
 */

import type { ReactNode } from 'react';
import { EntityId, type EntityIdProps } from '@/components/display/EntityId';
import { Text } from '@/components/layout/Text';
import { PRESENTATION_STACK_CLASS } from '@/theme/recipes';
import { cn } from '@/utils/cn';

export { PRESENTATION_STACK_CLASS };

export interface RenderStackedIdentityOptions {
  primaryClassName?: string;
  capitalizePrimary?: boolean;
  density?: 'default' | 'table';
}

/** Name (or title) over an optional secondary node — tables, cards, lists. */
export function renderStackedIdentity(
  primary: ReactNode,
  secondary?: ReactNode,
  options?: RenderStackedIdentityOptions,
): ReactNode {
  return (
    <div className={PRESENTATION_STACK_CLASS}>
      <Text
        as="div"
        role="body"
        density={options?.density === 'table' ? 'table' : 'default'}
        truncate
        className={cn(
          'font-normal',
          options?.capitalizePrimary !== false && 'capitalize',
          options?.primaryClassName,
        )}
      >
        {primary}
      </Text>
      {secondary}
    </div>
  );
}

/** PAT/ORD/SAM/TST sub-line under a primary label (left-aligned, secondary entity color). */
export function renderTableSecondaryEntityId(
  props: Omit<EntityIdProps, 'variant'>,
): ReactNode {
  return <EntityId {...props} variant="secondaryBlock" />;
}
