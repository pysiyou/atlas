import React, { type ElementType, type ReactNode } from 'react';
import { cn, displayId, type EntityType } from '@/utils';
import {
  ENTITY_ID,
  ENTITY_ID_BLOCK,
  ENTITY_ID_CLICKABLE,
  ENTITY_ID_INLINE,
  ENTITY_ID_SECONDARY,
} from '@/utils/constants';

export type EntityIdVariant = 'default' | 'secondary' | 'block' | 'inline' | 'clickable';

const VARIANT_CLASSES: Record<EntityIdVariant, string> = {
  default: ENTITY_ID,
  secondary: ENTITY_ID_SECONDARY,
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
}

/**
 * Consistent typography for entity IDs (PAT/ORD/SAM/TST) and catalog/test codes.
 * Uses theme tokens via the `.entity-id` class.
 */
export const EntityId: React.FC<EntityIdProps> = ({
  type,
  value,
  children,
  variant = 'default',
  className,
  title,
  as: Component = 'span',
  onClick,
}) => {
  const content =
    children ??
    (type != null
      ? displayId[type](typeof value === 'string' ? Number(value) : value)
      : null);

  if (content == null || content === '' || content === '-') {
    return null;
  }

  return (
    <Component
      className={cn(VARIANT_CLASSES[variant], 'font-normal', className)}
      title={title}
      onClick={onClick}
    >
      {content}
    </Component>
  );
};
