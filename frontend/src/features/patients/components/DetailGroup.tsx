/**
 * DetailGroup
 * Clusters related detail fields under a small section label inside a panel.
 */

import React from 'react';
import { TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';

export interface DetailGroupProps {
  /** Short label for the cluster, e.g. "Identity" or "Coverage". */
  title: string;
  /** @deprecated Fields always use a wrapping grid; kept for call-site compatibility. */
  layout?: 'grid' | 'column';
  /** Override default group heading styles (e.g. {@link DETAIL_GROUP_TITLE_COMPACT}). */
  titleClassName?: string;
  className?: string;
  children: React.ReactNode;
}

/** Smaller, lighter group headings for dense patient detail panels. */
export const DETAIL_GROUP_TITLE_COMPACT =
  'text-3xs font-normal uppercase tracking-wide text-text-tertiary leading-none';

/** Responsive field grid: equal-width columns that wrap and stay left-aligned. */
export const DETAIL_FIELDS_WRAP_GRID =
  'grid w-full grid-cols-[repeat(auto-fill,minmax(9.75rem,1fr))] items-start gap-x-layout-stack gap-y-layout-section content-start';

/**
 * Renders a labeled group of detail fields.
 * On constrained panels (sm+), the field area scrolls when content overflows.
 */
export const DetailGroup: React.FC<DetailGroupProps> = ({
  title,
  titleClassName,
  className,
  children,
}) => {
  const items = React.Children.toArray(children).filter(Boolean);

  return (
    <section className={cn('flex flex-col', className)}>
      <h4 className={cn(TYPE.sectionTitle, 'shrink-0', titleClassName)}>{title}</h4>
      <div className="mt-space-2 min-h-0">
        <div className={DETAIL_FIELDS_WRAP_GRID}>
          {items.map((child, index) => {
            const spanFull =
              React.isValidElement(child) &&
              (child.props as { span?: string }).span === 'full';
            return (
              <div
                key={index}
                className={cn('min-w-0 w-full', spanFull && 'col-span-full')}
              >
                {child}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/**
 * Two equal-height rows for grouped sections (e.g. care snapshot 2×2, general info 2+1).
 * Each group scrolls independently when its cell is height-constrained.
 */
export const DETAIL_SECTION_TWO_ROW_GRID =
  'grid h-full min-h-0 w-full grid-cols-1 auto-rows-auto gap-layout-section sm:grid-cols-2 sm:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]';

/** General info: two columns, content-sized rows (no clipped equal-height cells). */
export const DETAIL_SECTION_GENERAL_INFO_GRID =
  'grid w-full min-h-0 grid-cols-1 auto-rows-auto gap-layout-section sm:grid-cols-2';
