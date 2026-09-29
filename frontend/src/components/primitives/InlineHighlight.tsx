/**
 * Inline highlight for body copy (event log, notes). Multi-line via `box-decoration-clone`.
 * Styles: `INLINE_HIGHLIGHT` in `@/components/theme/recipes`.
 */
import React from 'react';
import { cn } from '@/utils';
import { INLINE_HIGHLIGHT } from '@/components/theme/recipes';
import { resolveColor } from './badgeStyles';
import type { BadgeColor, BadgeVariant } from './badgeTypes';
import { Icon, type IconName } from './Icon';

export type InlineHighlightVariant = BadgeVariant;

export type InlineHighlightSize = keyof typeof INLINE_HIGHLIGHT.icon;

export type InlineHighlightDecoration = keyof typeof INLINE_HIGHLIGHT.decoration;

function markerClasses(variant: InlineHighlightVariant): string {
  const color = resolveColor(String(variant)) as BadgeColor;
  const wash =
    INLINE_HIGHLIGHT.wash[color as keyof typeof INLINE_HIGHLIGHT.wash] ??
    INLINE_HIGHLIGHT.wash.neutral;
  return cn(INLINE_HIGHLIGHT.root, wash);
}

function defaultIconForVariant(variant: InlineHighlightVariant): IconName | undefined {
  const color = resolveColor(String(variant)) as BadgeColor;
  return INLINE_HIGHLIGHT.defaultIcon[color as keyof typeof INLINE_HIGHLIGHT.defaultIcon];
}

export interface InlineHighlightProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: InlineHighlightVariant;
  size?: InlineHighlightSize;
  decoration?: InlineHighlightDecoration;
  icon?: IconName | React.ReactNode | false;
  label?: React.ReactNode;
  children?: React.ReactNode;
}

export const InlineHighlight: React.FC<InlineHighlightProps> = ({
  variant = 'warning',
  size = 'sm',
  decoration,
  icon,
  label,
  className,
  children,
  ...props
}) => {
  const content = label ?? children;

  const resolvedIcon =
    icon === false ? null : icon === undefined ? defaultIconForVariant(variant) : icon;

  const iconElement =
    resolvedIcon == null
      ? null
      : React.isValidElement(resolvedIcon)
        ? resolvedIcon
        : (
            <Icon
              name={resolvedIcon as IconName}
              className={INLINE_HIGHLIGHT.icon[size]}
              aria-hidden
            />
          );

  const decorationClass =
    decoration != null ? INLINE_HIGHLIGHT.decoration[decoration] : undefined;

  return (
    <span className={cn(markerClasses(variant), decorationClass, className)} {...props}>
      {iconElement}
      {content}
    </span>
  );
};
