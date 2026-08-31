/**
 * Config-driven detail page and workflow loading skeletons.
 */

import React, { type ReactNode } from 'react';
import { useResponsiveLayout } from '@/hooks';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { SectionPanel } from '@/components';
import { Skeleton, SkeletonCard, SkeletonInfoSection, SkeletonTableRow } from './Skeleton';

export interface DetailSkeletonSection {
  title: string;
  rows?: number;
  layout?: 'grid' | 'column';
  tableColumns?: number;
  tableRows?: number;
  colSpan?: number;
  headerClassName?: string;
  contentClassName?: string;
  panelClassName?: string;
  customContent?: ReactNode;
}

export type DetailPageSkeletonVariant = 'responsive-detail' | 'balanced-grid' | 'workflow-grid';

export interface DetailPageSkeletonProps {
  variant?: DetailPageSkeletonVariant;
  sections?: DetailSkeletonSection[];
  workflowCardCount?: number;
  renderLargeLayout?: () => ReactNode;
  'aria-label'?: string;
}

function renderTableSkeleton(columns: number, rows: number) {
  return (
    <div className="border-t border-border-default">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

function renderSectionContent(section: DetailSkeletonSection) {
  if (section.customContent) return section.customContent;
  if (section.tableColumns && section.tableRows) {
    return renderTableSkeleton(section.tableColumns, section.tableRows);
  }
  return <SkeletonInfoSection rows={section.rows ?? 4} layout={section.layout ?? 'column'} />;
}

function ResponsiveDetailSkeleton({
  sections,
  renderLargeLayout,
}: {
  sections: DetailSkeletonSection[];
  renderLargeLayout?: () => ReactNode;
}) {
  const { isSmall, isMedium } = useResponsiveLayout();

  if (isSmall) {
    return (
      <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6 bg-surface-page">
        {sections.map(section => (
          <SectionPanel
            key={section.title}
            title={section.title}
            className={section.panelClassName ?? 'shrink-0 bg-surface'}
            contentClassName={section.contentClassName ?? 'overflow-visible'}
            headerClassName={section.headerClassName}
          >
            {renderSectionContent(section)}
          </SectionPanel>
        ))}
      </div>
    );
  }

  if (isMedium) {
    return (
      <div className="grid grid-cols-2 gap-4 w-full pb-6">
        {sections.map(section => (
          <SectionPanel
            key={section.title}
            title={section.title}
            className={`bg-surface ${section.colSpan === 2 ? 'col-span-2' : ''} ${section.panelClassName ?? ''}`}
            contentClassName={section.contentClassName ?? 'overflow-visible'}
            headerClassName={section.headerClassName}
          >
            {renderSectionContent({ ...section, layout: section.layout ?? 'column' })}
          </SectionPanel>
        ))}
      </div>
    );
  }

  if (renderLargeLayout) {
    return renderLargeLayout();
  }

  return (
    <div
      className="flex-1 grid grid-cols-3 grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
      style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
    >
      {sections.map(section => (
        <SectionPanel
          key={section.title}
          title={section.title}
          className={`h-full flex flex-col min-h-0 ${section.colSpan === 3 ? 'col-span-3' : ''} ${section.panelClassName ?? ''}`}
          contentClassName={section.contentClassName ?? 'flex-1 min-h-0 overflow-y-auto'}
          headerClassName={section.headerClassName}
        >
          {renderSectionContent({ ...section, layout: section.layout ?? 'column' })}
        </SectionPanel>
      ))}
    </div>
  );
}

function BalancedGridSkeleton({ sections }: { sections: DetailSkeletonSection[] }) {
  const breakpoint = useBreakpoint();
  const columns =
    breakpoint === 'xs' || breakpoint === 'sm' ? 1 : breakpoint === 'md' ? 2 : 3;

  return (
    <div
      className="grid gap-4 pb-6"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-busy="true"
    >
      {sections.map(section => (
        <div
          key={section.title}
          className="bg-surface border border-border-default rounded-md overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border-default bg-surface-page">
            <div className="h-3 w-24 animate-pulse bg-neutral-200 rounded-md" />
          </div>
          <div className="p-4">
            {renderSectionContent({ ...section, layout: 'column' })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowGridSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <div className="h-full flex flex-col min-h-0" aria-busy="true">
      <div className="shrink-0 px-4 py-3 border-b border-border-default bg-surface-page flex flex-wrap items-center gap-3">
        <Skeleton height={40} width={280} className="rounded-md" />
        <Skeleton height={36} width={120} className="rounded-md" />
        <Skeleton height={32} width={100} className="rounded-full" />
        <Skeleton height={32} width={100} className="rounded-full" />
        <Skeleton height={32} width={90} className="rounded-full" />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-6 grid gap-4 content-start">
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export const DetailPageSkeleton: React.FC<DetailPageSkeletonProps> = ({
  variant = 'responsive-detail',
  sections = [],
  workflowCardCount = 8,
  renderLargeLayout,
  'aria-label': ariaLabel = 'Loading',
}) => {
  if (variant === 'workflow-grid') {
    return <WorkflowGridSkeleton cardCount={workflowCardCount} />;
  }
  if (variant === 'balanced-grid') {
    return <BalancedGridSkeleton sections={sections} />;
  }
  return (
    <div aria-busy="true" aria-label={ariaLabel}>
      <ResponsiveDetailSkeleton sections={sections} renderLargeLayout={renderLargeLayout} />
    </div>
  );
};
