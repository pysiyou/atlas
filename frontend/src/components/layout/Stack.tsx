import { type ElementType, type HTMLAttributes } from 'react';
import { SPACING } from '@/theme/recipes';
import { cn } from '@/utils/cn';

const GAP_CLASS: Record<string, string> = {
  hairline: SPACING.gapHairline,
  tight: SPACING.gapTight,
  compact: SPACING.gapCompact,
  inline: SPACING.gapInline,
  relaxed: SPACING.gapRelaxed,
  section: SPACING.gapSection,
  stack: SPACING.gapStack,
};

export type StackGap = keyof typeof GAP_CLASS;

export interface StackProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  direction?: 'column' | 'row';
  gap?: StackGap;
  wrap?: boolean;
}

export function Stack({
  as: Component = 'div',
  direction = 'column',
  gap = 'inline',
  wrap = false,
  className,
  ...props
}: StackProps) {
  return (
    <Component
      className={cn(
        'flex min-w-0',
        direction === 'column' ? 'flex-col' : 'flex-row items-center',
        GAP_CLASS[gap],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    />
  );
}
