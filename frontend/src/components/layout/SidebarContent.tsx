import React from 'react';
import { motion } from 'framer-motion';
import { CHROME } from '@/components/theme/recipes';
import { cn } from '@/utils';
import type { AuthUser } from '@/types';
import type { MenuItem, SettingsItem } from './sidebarMenu';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { ThemeSwitch } from './ThemeSwitch';
import { SidebarProfile } from './SidebarProfile';
import { SIDEBAR_MOTION } from './sidebarMotion';

export interface SidebarContentProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onMobileClose?: () => void;
  menuItems: MenuItem[];
  settingsItems: SettingsItem[];
  currentUser: AuthUser | null | undefined;
  onLogout: () => void;
  onToggleCollapse: () => void;
}

export const SidebarContent: React.FC<SidebarContentProps> = ({
  isCollapsed,
  isMobile,
  onMobileClose,
  menuItems,
  settingsItems: settingsItemsProp,
  currentUser,
  onLogout,
  onToggleCollapse,
}) => {
  const collapsed = isCollapsed && !isMobile;
  const sidebarVariants = {
    expanded: {
      width: CHROME.sidebarExpandedVar,
      transition: SIDEBAR_MOTION.width,
    },
    collapsed: {
      width: CHROME.railVar,
      transition: SIDEBAR_MOTION.width,
    },
  };

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      initial={false}
      className={cn(CHROME.aside, collapsed && 'chrome-collapsed')}
      data-collapsed={collapsed ? 'true' : 'false'}
      onClick={e => e.stopPropagation()}
    >
      <SidebarHeader
        isCollapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onMobileClose={isMobile ? onMobileClose : undefined}
      />
      <SidebarNav
        menuItems={menuItems}
        settingsItems={settingsItemsProp}
        onNavigate={isMobile ? onMobileClose : undefined}
      />
      <div className={CHROME.footerDivider} aria-hidden="true">
        <div className={CHROME.footerDividerRule} />
      </div>
      <div className={CHROME.footerBlock}>
        <ThemeSwitch isCollapsed={collapsed} />
        {currentUser && (
          <SidebarProfile currentUser={currentUser} isCollapsed={collapsed} onLogout={onLogout} />
        )}
      </div>
    </motion.aside>
  );
};
