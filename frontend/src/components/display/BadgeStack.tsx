/**
 * Primary badge with optional caption and secondary chip — domain-free.
 */

import React from 'react';
import { Badge, type BadgeProps, type BadgeVariant } from '@/components/primitives';
import { Text } from '@/components/layout/Text';
import { PRESENTATION_STACK_CLASS } from '@/theme/recipes';
import { cn } from '@/utils';

export type BadgeIntent = BadgeVariant;
export type BadgeStackSize = BadgeProps['size'];

export interface BadgeStackProps {
  primary: { label: React.ReactNode; intent?: BadgeIntent; size?: BadgeStackSize };
  caption?: React.ReactNode;
  secondary?: { label: React.ReactNode; intent?: BadgeIntent; size?: BadgeStackSize };
  layout?: 'stack' | 'inline' | 'compact';
  className?: string;
}

function stackClassFor(layout: BadgeStackProps['layout']): string {
  if (layout === 'inline') return 'flex min-w-0 flex-wrap items-center gap-space-1';
  return PRESENTATION_STACK_CLASS;
}

export function BadgeStack({
  primary,
  caption,
  secondary,
  layout = 'stack',
  className,
}: BadgeStackProps) {
  if (layout === 'compact') {
    const label = caption ?? primary.label;
    return (
      <Badge
        size={primary.size ?? 'xs'}
        variant={primary.intent ?? 'neutral'}
        label={label}
        className={cn('max-w-full truncate', className)}
      />
    );
  }

  const primaryBadge = (
    <Badge
      size={primary.size ?? 'xs'}
      variant={primary.intent ?? 'neutral'}
      label={primary.label}
    />
  );

  return (
    <div className={cn(stackClassFor(layout), className)}>
      {primaryBadge}
      {caption ? (
        <Text as="div" role="caption" intent="muted" truncate className="max-w-full" title={String(caption)}>
          {caption}
        </Text>
      ) : null}
      {secondary ? (
        <Badge
          size={secondary.size ?? 'xs'}
          variant={secondary.intent ?? 'warning'}
          label={secondary.label}
          className="shrink-0 font-normal"
        />
      ) : null}
    </div>
  );
}
