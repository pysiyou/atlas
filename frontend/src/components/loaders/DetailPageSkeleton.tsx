/**
 * Config-driven detail page and workflow loading skeletons.
 */

import React, { type ReactNode } from 'react';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Panel, type PanelPadding, type PanelScroll } from '@/components';
import { Skeleton, SkeletonCard, SkeletonInfoSection, SkeletonTableRow } from './Skeleton';
import { LAYOUT, RADIUS, SPACING } from '@/components/theme/recipes';
import { cn } from '@/utils';

export interface DetailSkeletonSection {
  title: string;
  rows?: number;
  layout?: 'grid' | 'column';
  tableColumns?: number;
  tableRows?: number;
  colSpan?: number;
  padding?: PanelPadding;
  scroll?: PanelScroll;
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

function SkeletonPanel({
  section,
  className,
  scroll,
}: {
  section: DetailSkeletonSection;
  className?: string;
  scroll?: PanelScroll;
}) {
  return (
    <Panel
      title={section.title}
      className={className}
      padding={section.padding}
      scroll={section.scroll ?? scroll}
    >
      {renderSectionContent(section)}
    </Panel>
  );
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
      <div className={LAYOUT.detailScroll}>
        {sections.map(section => (
          <SkeletonPanel
            key={section.title}
            section={section}
            className={section.panelClassName ?? 'shrink-0'}
            scroll={section.scroll ?? 'visible'}
          />
        ))}
      </div>
    );
  }

  if (isMedium) {
    return (
      <div className={cn(LAYOUT.detailGrid2, 'w-full pb-layout-scroll-end')}>
        {sections.map(section => (
          <SkeletonPanel
            key={section.title}
            section={{ ...section, layout: section.layout ?? 'column' }}
            className={`${section.colSpan === 2 ? 'col-span-2' : ''} ${section.panelClassName ?? ''}`}
            scroll={section.scroll ?? 'visible'}
          />
        ))}
      </div>
    );
  }

  if (renderLargeLayout) {
    return renderLargeLayout();
  }

  return (
    <div
      className={LAYOUT.detailGrid3Rows2}
      style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
    >
      {sections.map(section => (
        <SkeletonPanel
          key={section.title}
          section={{ ...section, layout: section.layout ?? 'column' }}
          className={`min-h-0 ${section.colSpan === 3 ? 'col-span-3' : ''} ${section.panelClassName ?? ''}`}
          scroll={section.scroll ?? 'auto'}
        />
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
      className={cn(LAYOUT.balancedColumns, SPACING.pbScrollEnd)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-busy="true"
    >
      {sections.map(section => (
        <Panel key={section.title} title={section.title} padding={section.padding}>
          {renderSectionContent({ ...section, layout: 'column' })}
        </Panel>
      ))}
    </div>
  );
}

function WorkflowGridSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <div className="h-full flex flex-col min-h-0" aria-busy="true">
      <div
        className={`shrink-0 ${SPACING.pxSpace4} py-space-3 border-b border-border-default bg-surface-page flex flex-wrap items-center ${SPACING.gapRelaxed}`}
      >
        <Skeleton height={40} width={280} className={`${RADIUS.card}`} />
        <Skeleton height={36} width={120} className={`${RADIUS.card}`} />
        <Skeleton height={32} width={100} className={`${RADIUS.pill}`} />
        <Skeleton height={32} width={100} className={`${RADIUS.pill}`} />
        <Skeleton height={32} width={90} className={`${RADIUS.pill}`} />
      </div>
      <div
        className={`flex-1 min-h-0 overflow-y-auto p-space-6 grid ${SPACING.gapSection} content-start`}
      >
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
