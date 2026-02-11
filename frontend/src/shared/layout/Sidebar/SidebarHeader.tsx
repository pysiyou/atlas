/**
 * SidebarHeader Component
 * App name (two-tone when configured) and close/collapse button. No logo.
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
  const { company, branding } = companyConfig.getConfig();
  const displayName = company.displayName;
  const splitAt = branding.appNamePart2Start;
  const part1 = splitAt != null && splitAt > 0 && splitAt < displayName.length
    ? displayName.slice(0, splitAt)
    : null;
  const part2 = part1 != null ? displayName.slice(splitAt!) : null;

  const handleButtonClick = () => {
    if (onMobileClose) onMobileClose();
    else onToggleCollapse();
  };

  return (
    <div className="h-16 border-b border-border-default flex items-center justify-between px-4">
      <div className="min-w-0 overflow-hidden">
        <h1 className="text-2xl font-bold truncate">
          {part1 != null && part2 != null ? (
            <>
              <span className="text-brand">{part1}</span>
              <span className="bg-brand text-on-brand py-0.5 px-1">{part2}</span>
            </>
          ) : (
            <span className="text-brand">{displayName}</span>
          )}
        </h1>
      </div>
      <IconButton
        variant="sidebarClose"
        size="sm"
        icon={<Icon name={isCollapsed ? ICONS.actions.doubleArrowRight : ICONS.actions.doubleArrowLeft} />}
        onClick={handleButtonClick}
        title={onMobileClose ? 'Close Sidebar' : isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        className="w-8 h-8 shrink-0"
      />
    </div>
  );
};
