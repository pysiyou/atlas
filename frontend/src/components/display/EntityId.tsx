import React, { type ElementType, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn, displayId, type EntityType } from '@/utils';
import {
  ENTITY_ID,
  ENTITY_ID_BLOCK,
  ENTITY_ID_CLICKABLE,
  ENTITY_ID_INLINE,
  ENTITY_ID_SECONDARY,
  ENTITY_ID_HEADER_SECONDARY,
} from '@/utils/constants';
import { createEntityFilterNavigateHandler, type EntityNavigateTarget } from '@/utils/filters';

export type EntityIdVariant =
  | 'default'
  | 'secondary'
  | 'headerSecondary'
  | 'block'
  | 'inline'
  | 'clickable';

const VARIANT_CLASSES: Record<EntityIdVariant, string> = {
  default: ENTITY_ID,
  secondary: ENTITY_ID_SECONDARY,
  headerSecondary: ENTITY_ID_HEADER_SECONDARY,
  block: ENTITY_ID_BLOCK,
  inline: ENTITY_ID_INLINE,
  clickable: ENTITY_ID_CLICKABLE,
};

export interface EntityIdProps {
  /** Entity type for formatted IDs (PAT/ORD/SAM/TST). Omit when passing `children`. */
  type?: EntityType;
  /** Numeric entity id. Omit when passing `children`. */
  value?: number | string | null | undefined;
  /** Pre-formatted label (test codes, custom ids). */
  children?: ReactNode;
  variant?: EntityIdVariant;
  className?: string;
  title?: string;
  as?: ElementType;
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** When set, clicking navigates to targetPage with the entity filter applied. */
  navigateToFiltered?: EntityNavigateTarget;
  [key: string]: unknown;
}

/**
 * Consistent typography for entity IDs (PAT/ORD/SAM/TST) and catalog/test codes.
 * Uses theme tokens via the `.entity-id` class.
 * 
 * Supports filtered navigation via `navigateToFiltered` prop for cross-page navigation.
 */
export function EntityId({
  type,
  value,
  children,
  variant = 'default',
  className,
  title,
  as: Component = 'span',
  onClick,
  navigateToFiltered,
  ...rest
}: EntityIdProps) {
  const navigate = useNavigate();

  const content =
    children ??
    (type != null
      ? displayId[type](typeof value === 'string' ? Number(value) : value)
      : null);

  if (content == null || content === '' || content === '-') {
    return null;
  }

  // Build filtered navigation handler if specified
  const handleFilteredNavigation = navigateToFiltered && value != null
    ? createEntityFilterNavigateHandler(navigate, value, navigateToFiltered)
    : undefined;

  const effectiveOnClick = onClick ?? handleFilteredNavigation;

  const resolvedVariant =
    effectiveOnClick != null && variant === 'default' ? 'clickable' : variant;

  const EffectiveComponent = (effectiveOnClick != null && Component === 'span' ? 'button' : Component) as ElementType;

  return (
    <EffectiveComponent
      className={cn(VARIANT_CLASSES[resolvedVariant], 'font-normal', className)}
      title={title}
      onClick={effectiveOnClick}
      {...rest}
      {...(EffectiveComponent === 'button' ? { type: 'button' } : {})}
    >
      {content}
    </EffectiveComponent>
  );
}
