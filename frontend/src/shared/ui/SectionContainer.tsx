/**
 * SectionContainer Component
 * Simple section container with header and content area
 * Inspired by CarGoPlan's design system
 */

import React from 'react';

export interface SectionContainerProps {
  /** Section title displayed in header */
  title?: string;
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
}) => {
  // Base styles for wrapper: border, background, rounded corners
  const wrapperStyles = `w-full bg-gray-50 border border-gray-200 rounded-lg ${className}`;
  
  // Base styles for header: padding, border-bottom, uppercase text
  const headerStyles = `w-full px-4 py-3 border-b border-gray-200 text-xs text-gray-700 uppercase font-semibold tracking-wide flex items-center justify-between bg-gray-50 ${headerClassName}`;
  
  // Base styles for content: padding, white background
  const contentStyles = `p-4 bg-white ${contentClassName}`;

  return (
    <section className={wrapperStyles} data-testid={testId}>
      {!hideHeader && (
        <div className={headerStyles}>
          <div className="flex items-center gap-2 min-w-0">
            {headerLeft && <div>{headerLeft}</div>}
            {title && <p className="truncate">{title}</p>}
          </div>
          {(headerRight || headerContent) && (
            <div>{headerRight ?? headerContent}</div>
          )}
        </div>
      )}
      <div className={contentStyles}>{children}</div>
    </section>
  );
};

export default SectionContainer;
