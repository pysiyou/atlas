import type { ReactNode } from 'react';
import { Text } from '@/components/layout/Text';
import { PRESENTATION_STACK_CLASS } from '@/theme/recipes';
import { cn } from '@/utils/cn';

export type IdentityStackSecondarySlot = 'meta' | 'node';

export interface IdentityStackProps {
  primary: ReactNode;
  secondary?: ReactNode;
  className?: string;
  primaryClassName?: string;
  /** When `meta`, secondary is wrapped in muted table body text. */
  secondarySlot?: IdentityStackSecondarySlot;
  capitalizePrimary?: boolean;
  tableDensity?: boolean;
}

export function IdentityStack({
  primary,
  secondary,
  className,
  primaryClassName,
  secondarySlot = 'node',
  capitalizePrimary = true,
  tableDensity = false,
}: IdentityStackProps) {
  if (secondary == null) {
    return (
      <div className={cn(PRESENTATION_STACK_CLASS, className)}>
        <Text
          as="div"
          role="body"
          density={tableDensity ? 'table' : 'default'}
          truncate
          className={cn('font-normal', capitalizePrimary && 'capitalize', primaryClassName)}
        >
          {primary}
        </Text>
      </div>
    );
  }

  const secondaryNode =
    secondarySlot === 'meta' && typeof secondary === 'string' ? (
      <Text
        as="div"
        role="body"
        intent="muted"
        density={tableDensity ? 'table' : 'default'}
        truncate
        className="font-normal w-full"
      >
        {secondary}
      </Text>
    ) : (
      secondary
    );

  return (
    <div className={cn(PRESENTATION_STACK_CLASS, className)}>
      <Text
        as="div"
        role="body"
        density={tableDensity ? 'table' : 'default'}
        truncate
        className={cn('font-normal', capitalizePrimary && 'capitalize', primaryClassName)}
      >
        {primary}
      </Text>
      {secondaryNode}
    </div>
  );
}
