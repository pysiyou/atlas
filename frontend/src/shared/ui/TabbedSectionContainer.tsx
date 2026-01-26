/**
 * TabbedSectionContainer
 *
 * CargoPlan-style pattern: tabs rendered INSIDE a `SectionContainer` header.
 * This keeps the “dashboard module” layout consistent and avoids standalone tab bars.
 *
 * Notes:
 * - Uses existing `SectionContainer` + `TabsList` components.
 * - Designed for “section” usage: compact header, tabs on the right, content below.
 */

import React, { useRef, useState } from 'react';
import { SectionContainer } from './SectionContainer';
import { TabsList, TAB_INDICATOR_TRANSITION } from './Tabs';

export interface TabbedSectionTab {
  id: string;
  label: string;
  /** When false, tab is hidden (mirrors CargoPlan enabled flag) */
  enabled?: boolean;
  /** Optional counter badge */
  count?: number;
}

export interface TabbedSectionContainerProps {
  /** Optional title shown on the right side of the header */
  title?: string;
  /** Optional content shown on the right side of the header (overrides title if both provided) */
  headerRight?: React.ReactNode;
  /** Tabs list (disabled tabs are filtered out) */
  tabs: TabbedSectionTab[];
  /** Currently selected tab id */
  activeTab: string;
  /** Tab selection callback */
  onTabChange: (tabId: string) => void;
  /** Content of the active tab */
  children: React.ReactNode;
  /** Optional header-left content (e.g., icon) */
  headerLeft?: React.ReactNode;
  /** Wrapper class */
  className?: string;
  /** Header class override */
  headerClassName?: string;
  /** Content class override */
  contentClassName?: string;
  /** Test id */
  testId?: string;
}

export const TabbedSectionContainer: React.FC<TabbedSectionContainerProps> = ({
  title,
  headerRight,
  tabs,
  activeTab,
  onTabChange,
  children,
  headerLeft,
  className = '',
  headerClassName = '',
  contentClassName = '',
  testId,
}) => {
  // Filter disabled tabs to match CargoPlan behavior
  const enabledTabs = tabs.filter(t => t.enabled !== false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  return (
    <SectionContainer
      testId={testId}
      headerLeft={
        <div
          ref={headerRef}
          className="self-stretch flex items-center relative -mx-4 -my-3 px-4 py-3"
        >
          {headerLeft && <div className="mr-4">{headerLeft}</div>}
          <TabsList
            tabs={enabledTabs.map(t => ({
              id: t.id,
              label: t.label,
              count: t.count,
              // content is not used by TabsList; provide placeholder for type compatibility
              content: null,
            }))}
            activeTabId={activeTab}
            onTabChange={onTabChange}
            variant="underline"
            className="border-b-0"
            headerRef={headerRef}
            onIndicatorChange={setIndicator}
          />
          {/* Tab indicator positioned relative to header container (cargoplan pattern) */}
          {/* Positioned at bottom: -1px to overlap the border and eliminate gap */}
          <div
            className="absolute left-0 h-[2px] bg-brand rounded-full pointer-events-none z-10"
            style={{
              bottom: '-1px', // Overlap the 1px border to eliminate gap
              left: `${indicator.left}px`,
              width: `${indicator.width}px`,
              transition:
                indicator.left > 0 || indicator.width > 0 ? TAB_INDICATOR_TRANSITION : 'none',
              transform: 'translateZ(0)',
              willChange: 'left, width',
            }}
            aria-hidden="true"
          />
        </div>
      }
      headerRight={headerRight ?? (title ? <p className="truncate">{title}</p> : undefined)}
      className={className}
      // Make header look like a “module header”: remove forced uppercase + tighten spacing
      headerClassName={`normal-case tracking-normal ${headerClassName}`}
      contentClassName={contentClassName}
    >
      {children}
    </SectionContainer>
  );
};
