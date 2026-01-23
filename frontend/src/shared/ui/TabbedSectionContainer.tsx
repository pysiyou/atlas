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

import React from 'react';
import { SectionContainer } from './SectionContainer';
import { TabsList } from './Tabs';

export interface TabbedSectionTab {
  id: string;
  label: string;
  /** When false, tab is hidden (mirrors CargoPlan enabled flag) */
  enabled?: boolean;
  /** Optional counter badge */
  count?: number;
}

export interface TabbedSectionContainerProps {
  /** Optional title shown on the left side of the header */
  title?: string;
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
  const enabledTabs = tabs.filter((t) => t.enabled !== false);

  return (
    <SectionContainer
      testId={testId}
      title={title}
      headerLeft={headerLeft}
      headerRight={
        <TabsList
          tabs={enabledTabs.map((t) => ({
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
        />
      }
      className={className}
      // Make header look like a “module header”: remove forced uppercase + tighten spacing
      headerClassName={`normal-case tracking-normal ${headerClassName}`}
      contentClassName={contentClassName}
    >
      {children}
    </SectionContainer>
  );
};

