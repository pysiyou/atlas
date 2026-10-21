/**
 * Domain adapter: formatted record identifiers with optional filtered navigation.
 */

import { type ElementType, type MouseEventHandler, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CodeText, type CodeTextEmphasis } from '@/components/display/CodeText';
import { displayId, type EntityType } from '@/utils';
import { createEntityFilterNavigateHandler, type EntityNavigateTarget } from '@/utils/filters';

export type RecordIdEmphasis = CodeTextEmphasis;

export interface RecordIdProps {
  type?: EntityType;
  value?: number | string | null | undefined;
  children?: ReactNode;
  emphasis?: RecordIdEmphasis;
  className?: string;
  title?: string;
  navigateToFiltered?: EntityNavigateTarget;
  onPress?: () => void;
  onClick?: MouseEventHandler<HTMLElement>;
  as?: ElementType;
}

export function RecordId({
  type,
  value,
  children,
  emphasis = 'default',
  className,
  title,
  navigateToFiltered,
  onPress,
  onClick,
  as,
}: RecordIdProps) {
  const navigate = useNavigate();

  const content =
    children ??
    (type != null ? displayId[type](typeof value === 'string' ? Number(value) : value) : null);

  const handleFilteredNavigation =
    navigateToFiltered && value != null
      ? createEntityFilterNavigateHandler(navigate, value, navigateToFiltered)
      : undefined;

  return (
    <CodeText
      emphasis={emphasis}
      className={className}
      title={title}
      onPress={onPress ?? handleFilteredNavigation}
      onClick={onClick}
      as={as}
    >
      {content}
    </CodeText>
  );
}
