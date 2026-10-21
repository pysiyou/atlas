/**
 * Monospace / code-styled text — no domain formatting or routing.
 */

import React, { type ElementType, type MouseEventHandler } from 'react';
import { cn } from '@/utils';
import {
  ENTITY_ID,
  ENTITY_ID_BLOCK,
  ENTITY_ID_CLICKABLE,
  ENTITY_ID_INLINE,
  ENTITY_ID_SECONDARY,
  ENTITY_ID_SECONDARY_BLOCK,
  ENTITY_ID_HEADER_SECONDARY,
} from '@/utils/constants';

export type CodeTextEmphasis =
  | 'default'
  | 'muted'
  | 'headerMuted'
  | 'block'
  | 'inline'
  | 'interactive'
  | 'mutedBlock';

const EMPHASIS_CLASSES: Record<CodeTextEmphasis, string> = {
  default: ENTITY_ID,
  muted: ENTITY_ID_SECONDARY,
  mutedBlock: ENTITY_ID_SECONDARY_BLOCK,
  headerMuted: ENTITY_ID_HEADER_SECONDARY,
  block: ENTITY_ID_BLOCK,
  inline: ENTITY_ID_INLINE,
  interactive: ENTITY_ID_CLICKABLE,
};

export interface CodeTextProps {
  children: React.ReactNode;
  emphasis?: CodeTextEmphasis;
  className?: string;
  title?: string;
  onPress?: () => void;
  onClick?: MouseEventHandler<HTMLElement>;
  as?: ElementType;
}

export function CodeText({
  children,
  emphasis = 'default',
  className,
  title,
  onPress,
  onClick,
  as: Component = 'span',
}: CodeTextProps) {
  if (children == null || children === '' || children === '-') {
    return null;
  }

  const interactive = onPress != null || onClick != null;
  const resolvedEmphasis = interactive && emphasis === 'default' ? 'interactive' : emphasis;
  const secondaryInteractive =
    interactive && (resolvedEmphasis === 'muted' || resolvedEmphasis === 'mutedBlock');

  const EffectiveComponent = (interactive && Component === 'span' ? 'button' : Component) as ElementType;
  const handleClick = onClick ?? (onPress ? () => onPress() : undefined);

  return (
    <EffectiveComponent
      className={cn(
        EMPHASIS_CLASSES[resolvedEmphasis],
        secondaryInteractive && 'entity-id--clickable',
        'font-normal',
        className
      )}
      title={title}
      onClick={handleClick}
      {...(EffectiveComponent === 'button' ? { type: 'button' as const } : {})}
    >
      {children}
    </EffectiveComponent>
  );
}
