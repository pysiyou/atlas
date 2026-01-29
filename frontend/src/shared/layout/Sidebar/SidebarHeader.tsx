/**
 * SidebarHeader Component
 * Logo and app title section of the sidebar
 * Fixed 4rem icon column; content column clips on collapse (no inner animation)
 */

import React from 'react';
import { Icon, IconButton } from '@/shared/ui';
import { ICONS } from '@/utils';
import { companyConfig } from '@/config';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMobileClose?: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  onToggleCollapse,
  onMobileClose,
}) => {
  const company = companyConfig.getConfig();

  return (
    <div className="h-16 border-b border-border flex items-center">
      {/* Fixed 4rem icon column — no transition, icon stays motionless */}
      <div
        className="w-16 shrink-0 flex items-center justify-center cursor-pointer"
        onClick={() => isCollapsed && onToggleCollapse()}
        title={isCollapsed ? 'Expand Sidebar' : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && isCollapsed && onToggleCollapse()}
      >
        <div className="w-8 h-8 text-brand flex items-center justify-center">
          <Icon name={ICONS.ui.appLogo} className="w-full h-full" />
        </div>
      </div>
      {/* Content column — clipped by aside overflow when collapsed */}
      <div className="flex-1 min-w-0 overflow-hidden flex items-center justify-between px-3">
        <div className="min-w-0 overflow-hidden whitespace-nowrap">
          <h1 className="text-base font-bold text-text-primary truncate">{company.company.displayName}</h1>
          <p className="text-xs text-text-tertiary">Version {company.company.version}</p>
        </div>
        {onMobileClose ? (
          <IconButton variant="close" size="sm" onClick={onMobileClose} title="Close Sidebar" />
        ) : (
          <IconButton
            variant="collapse"
            size="sm"
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
          />
        )}
      </div>
    </div>
  );
};
