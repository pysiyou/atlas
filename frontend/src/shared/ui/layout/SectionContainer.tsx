/**
 * SectionContainer Component
 * Simple section container with header and content area
 * Inspired by CarGoPlan's design system
 */

import React from 'react';

/**
 * Content spacing presets for the section container
 * - compact: Minimal spacing (space-y-1)
 * - normal: Standard spacing (space-y-2) - default
 * - relaxed: More breathing room (space-y-3)
 * - none: No automatic spacing applied
 */
type ContentSpacing = 'compact' | 'normal' | 'relaxed' | 'none';

export interface SectionContainerProps {
  /** Section title displayed in header (string or ReactNode) */
  title?: string | React.ReactNode;
  /** Content to display in the section */
  children: React.ReactNode;
  /** Additional content to display in the header (right side) */
  headerContent?: React.ReactNode;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Additional CSS classes for the header */
  headerClassName?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
  /** Hide the header completely */
  hideHeader?: boolean;
  /** Content to display on the left side of header (before title) */
  headerLeft?: React.ReactNode;
  /** Content to display on the right side of header (alternative to headerContent) */
  headerRight?: React.ReactNode;
  /** Data test ID for testing */
  testId?: string;
  /** Preset spacing between child elements (applies space-y-* class) */
  spacing?: ContentSpacing;
}

/**
 * SectionContainer Component
 *
 * A simple, flexible container component with a header and content area.
 * Features:
 * - Clean, minimal design with border and rounded corners
 * - Separate header and content areas with distinct backgrounds
 * - Flexible header with support for title and custom content
 * - Fully customizable with className props
 *
 * @example
 * ```tsx
 * <SectionContainer title="Patient Information">
 *   <div>Content goes here</div>
 * </SectionContainer>
 * ```
 */
/**
 * Spacing class map for content area
 */
const SPACING_CLASSES: Record<ContentSpacing, string> = {
  compact: 'space-y-1',
  normal: 'space-y-2',
  relaxed: 'space-y-3',
  none: '',
};

export const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  children,
  headerContent,
  className = '',
  headerClassName = '',
  contentClassName = '',
  hideHeader = false,
  headerLeft,
  headerRight,
  testId,
  spacing = 'none',
}) => {
  // Base styles for wrapper: border, background, rounded corners, overflow hidden to clip content
  const wrapperStyles = `w-full bg-surface-default border border-border-default rounded-md overflow-hidden ${className}`;

  // Base styles for header: padding, border-bottom, uppercase text
  const headerStyles = `w-full px-4 py-3 border-b border-border-default text-xs text-text-secondary uppercase font-semibold tracking-wide flex items-center justify-between bg-surface-canvas ${headerClassName}`;

  // Base styles for content: padding, white background (inherits from wrapper)
  // Includes spacing class if specified
  const spacingClass = SPACING_CLASSES[spacing];
  const contentStyles = `p-4 ${spacingClass} ${contentClassName}`.trim();

  return (
    <section className={wrapperStyles} data-testid={testId}>
      {!hideHeader && (
        <div className={headerStyles}>
          <div className="flex items-center gap-2 min-w-0">
            {headerLeft && <div>{headerLeft}</div>}
            {title && (
              typeof title === 'string' ? (
                <p className="truncate">{title}</p>
              ) : (
                <div className="truncate">{title}</div>
              )
            )}
          </div>
          {(headerRight || headerContent) && (
            <div className="flex items-center shrink-0">{headerRight ?? headerContent}</div>
          )}
        </div>
      )}
      <div className={contentStyles}>{children}</div>
    </section>
  );
};
