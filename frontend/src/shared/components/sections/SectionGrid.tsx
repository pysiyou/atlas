/**
 * SectionGrid - Responsive grid layout for sections
 *
 * Provides a consistent grid layout for organizing section cards.
 * Automatically responsive based on screen size.
 */

import React from 'react';
import { sectionGrid } from '@/shared/design-system/tokens/components/shared';

export interface SectionGridProps {
  /** Number of columns (1-4) */
  columns?: 1 | 2 | 3 | 4;
  /** Gap size between grid items */
  gap?: 'sm' | 'md' | 'lg';
  /** Grid items */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

const GAP_CLASSES = sectionGrid.gap;
const COLUMN_CLASSES = sectionGrid.columns;

/**
 * SectionGrid component
 *
 * @example
 * ```tsx
 * <SectionGrid columns={2} gap="md">
 *   <SectionCard title="Section 1">...</SectionCard>
 *   <SectionCard title="Section 2">...</SectionCard>
 * </SectionGrid>
 * ```
 */
export const SectionGrid: React.FC<SectionGridProps> = ({
  columns = 2,
  gap = 'md',
  children,
  className = '',
}) => {
  return (
    <div className={`grid ${COLUMN_CLASSES[columns]} ${GAP_CLASSES[gap]} ${className}`}>
      {children}
    </div>
  );
};
