/**
 * TabbedPanel — Section panel with tabs rendered inside the header (was TabbedSectionContainer).
 * CargoPlan-style pattern: tabs in the header of a SectionPanel.
 */

import React, { useRef, useState } from 'react';
import { SectionPanel } from './SectionPanel';
import { TabsList, TAB_INDICATOR_TRANSITION } from './Tabs';

export interface TabbedPanelTab {
  id: string;
  label: string;
  /** When false, tab is hidden */
  enabled?: boolean;
  /** Optional counter badge */
  count?: number;
}

export interface TabbedPanelProps {
  /** Optional title shown on the right side of the header */
  title?: string;
  /** Optional content shown on the right side of the header (overrides title if both provided) */
  headerRight?: React.ReactNode;
  /** Tabs list (disabled tabs are filtered out) */
  tabs: TabbedPanelTab[];
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

export const TabbedPanel: React.FC<TabbedPanelProps> = ({
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
  const enabledTabs = tabs.filter(t => t.enabled !== false);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  return (
    <SectionPanel
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
              content: null,
            }))}
            activeTabId={activeTab}
            onTabChange={onTabChange}
            variant="underline"
            className="border-b-0"
            headerRef={headerRef}
            onIndicatorChange={setIndicator}
          />
          <div
            className="absolute left-0 h-[2px] bg-brand rounded-full pointer-events-none z-10"
            style={{
              bottom: '-1px',
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
      headerClassName={`normal-case tracking-normal ${headerClassName}`}
      contentClassName={contentClassName}
    >
      {children}
    </SectionPanel>
  );
};

/** @deprecated Use TabbedPanel */
export const TabbedSectionContainer = TabbedPanel;
/** @deprecated Use TabbedPanelProps */
export type TabbedSectionContainerProps = TabbedPanelProps;
/** @deprecated Use TabbedPanelTab */
export type TabbedSectionTab = TabbedPanelTab;
