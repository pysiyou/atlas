/**
 * Domain adapter: formatted record identifiers with optional filtered navigation.
 */

import { type ElementType, type MouseEventHandler, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CodeText, type CodeTextEmphasis } from '@/components/display/CodeText';
import { formatClinicalId, type EntityType } from '@/utils';
import { createEntityFilterNavigateHandler, type EntityNavigateTarget } from '@/utils/filters';

export type RecordIdEmphasis = CodeTextEmphasis;

export interface RecordIdProps {
  /** Entity kind for navigation; not used to prefix the displayed value. */
  type?: EntityType;
  /** Stored clinical identifier (MRN, filler, accession, mnemonic, etc.). */
  value?: string | null | undefined;
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

  const content = children ?? formatClinicalId(value);

  const handleFilteredNavigation =
    navigateToFiltered && value != null
      ? createEntityFilterNavigateHandler(navigate, value, navigateToFiltered)
      : undefined;

  return (
    <CodeText
      emphasis={emphasis}
      className={className}
      title={title ?? (type ? `${type} ${content}` : undefined)}
      onPress={onPress ?? handleFilteredNavigation}
      onClick={onClick}
      as={as}
    >
      {content}
    </CodeText>
  );
}
