import React from 'react';
import { motion } from 'framer-motion';
import type { AuthUser } from '@/types';
import type { MenuItem, SettingsItem } from './sidebarMenu';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { ThemeSwitch } from './ThemeSwitch';
import { SidebarProfile } from './SidebarProfile';

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
    expanded: { width: '16rem', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
    collapsed: { width: '4rem', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
  };
  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      initial={false}
      className="bg-surface border-r border-border-default flex flex-col overflow-hidden"
      style={{ padding: '0' }}
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
      <ThemeSwitch isCollapsed={collapsed} />
      {currentUser && (
        <SidebarProfile currentUser={currentUser} isCollapsed={collapsed} onLogout={onLogout} />
      )}
    </motion.aside>
  );
};
