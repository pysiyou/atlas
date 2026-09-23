/**
 * DetailGroup — labeled cluster of detail fields inside a panel.
 */

import React from 'react';
import { TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';

export interface DetailGroupProps {
  title: string;
  titleClassName?: string;
  className?: string;
  children: React.ReactNode;
}

export const DETAIL_GROUP_TITLE_COMPACT =
  'text-3xs font-normal uppercase tracking-wide text-text-tertiary leading-none';

export const DETAIL_FIELDS_WRAP_GRID =
  'grid w-full grid-cols-[repeat(auto-fill,minmax(9.75rem,1fr))] items-start gap-x-layout-stack gap-y-layout-section content-start';

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

export const DETAIL_SECTION_TWO_ROW_GRID =
  'grid h-full min-h-0 w-full grid-cols-1 auto-rows-auto gap-layout-section sm:grid-cols-2 sm:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]';

export const DETAIL_SECTION_GENERAL_INFO_GRID =
  'grid w-full min-h-0 grid-cols-1 auto-rows-auto gap-layout-section sm:grid-cols-2';
