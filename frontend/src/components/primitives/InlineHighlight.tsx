/**
 * Inline highlight for body copy (event log, notes, help text).
 *
 * Unlike {@link Badge}, this is not a single-line chip: the label may wrap onto multiple
 * lines when space is tight. Use inside paragraphs; `box-decoration-clone` keeps background
 * and padding on each wrapped line.
 *
 * Geometry: recipes `INLINE_HIGHLIGHT`. Colors: `inlineHighlightStyles`.
 */
import React from 'react';
import { cn } from '@/utils';
import { useBadgeAppearance } from '@/components/theme/theme';
import { INLINE_HIGHLIGHT } from '@/components/theme/recipes';
import { Icon, type IconName } from './Icon';
import {
  getInlineHighlightStyles,
  type InlineHighlightVariant,
} from './inlineHighlightStyles';

export type { InlineHighlightVariant } from './inlineHighlightStyles';
export {
  getInlineHighlightStyles,
  resolveInlineHighlightVariant,
} from './inlineHighlightStyles';

export type InlineHighlightSize = keyof typeof INLINE_HIGHLIGHT.size;

const SUGGESTED_ICONS: Partial<Record<string, IconName>> = {
  warning: 'question',
  primary: 'lab-tube',
  info: 'info-circle',
  danger: 'alert-circle',
};

export interface InlineHighlightProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: InlineHighlightVariant;
  size?: InlineHighlightSize;
  /** Icon name, custom node, or `false` to hide the leading icon. */
  icon?: IconName | React.ReactNode | false;
  /** When set, used instead of `children` for the label text. */
  label?: React.ReactNode;
  children?: React.ReactNode;
}

export const InlineHighlight: React.FC<InlineHighlightProps> = ({
  variant = 'warning',
  size = 'sm',
  icon,
  label,
  className,
  children,
  ...props
}) => {
  const appearance = useBadgeAppearance();
  const { colorClass, surfaceClass } = getInlineHighlightStyles(variant, appearance);
  const content = label ?? children;

  const resolvedIcon =
    icon === false
      ? null
      : icon === undefined
        ? SUGGESTED_ICONS[String(variant).toLowerCase()]
        : icon;

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

  return (
    <span
      className={cn(
        INLINE_HIGHLIGHT.rootBase,
        INLINE_HIGHLIGHT.size[size],
        surfaceClass,
        colorClass,
        className,
      )}
      {...props}
    >
      {iconElement}
      {content}
    </span>
  );
};
