/**
 * SectionPanel — titled content container (was SectionContainer).
 * Max-depth-1: all variants in this file.
 */

import React from 'react';
import { cn } from '@/utils';

type ContentSpacing = 'compact' | 'normal' | 'relaxed' | 'none';

export interface SectionPanelProps {
  /** Section title displayed in header (string or ReactNode) */
  title?: string | React.ReactNode;
  /** Content to display in the section */
  children: React.ReactNode;
  /** Content to display on the right side of header */
  headerRight?: React.ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Additional CSS classes for the header */
  headerClassName?: string;
  /** Typography/classes for the title (string titles only) */
  titleClassName?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
  /** Hide the header completely */
  hideHeader?: boolean;
  /** Content to display on the left side of header (before title) */
  headerLeft?: React.ReactNode;
  /** Data test ID for testing */
  testId?: string;
  /** Preset spacing between child elements (applies space-y-* class) */
  spacing?: ContentSpacing;
}

const SPACING_CLASSES: Record<ContentSpacing, string> = {
  compact: 'space-y-1',
  normal: 'space-y-2',
  relaxed: 'space-y-3',
  none: '',
};

const HEADER_LAYOUT =
  'w-full px-4 py-3 border-b border-border-default flex items-center justify-between bg-surface-page';
const DEFAULT_TITLE_CLASS =
  'truncate text-xs text-text-secondary uppercase font-normal tracking-wide';

export const SectionPanel: React.FC<SectionPanelProps> = ({
  title,
  children,
  className = '',
  headerClassName = '',
  titleClassName = '',
  contentClassName = '',
  hideHeader = false,
  headerLeft,
  headerRight,
  testId,
  spacing = 'none',
}) => {
  const wrapperStyles = `w-full bg-surface border border-border-default rounded-md overflow-hidden ${className}`;
  const headerStyles = cn(HEADER_LAYOUT, headerClassName);
  const spacingClass = SPACING_CLASSES[spacing];
  const contentStyles = `p-4 ${spacingClass} ${contentClassName}`.trim();

  return (
    <section className={wrapperStyles} data-testid={testId}>
      {!hideHeader && (
        <div className={headerStyles}>
          <div className="flex items-center gap-2 min-w-0">
            {headerLeft && <div>{headerLeft}</div>}
            {title &&
              (typeof title === 'string' ? (
                <p className={cn(DEFAULT_TITLE_CLASS, titleClassName)}>{title}</p>
              ) : (
                <div className="truncate">{title}</div>
              ))}
          </div>
          {headerRight && (
            <div className="flex items-center shrink-0">{headerRight}</div>
          )}
        </div>
      )}
      <div className={contentStyles}>{children}</div>
    </section>
  );
};

