import type { SidebarNavItem, SidebarSettingsLink, SidebarSettingsTrigger } from './useSidebarMenu';
import type { AuthUser } from '@/types';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarProfile } from './SidebarProfile';
import { SIDEBAR_MOTION } from '@/app/navigation';
import { ThemeSwitch } from '@/components/inputs';
import { CHROME } from '@/theme/recipes';
import { cn } from '@/utils';
import { motion } from 'framer-motion';

export interface SidebarContentProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onMobileClose?: () => void;
  menuItems: SidebarNavItem[];
  settingsPopoverLinks: SidebarSettingsLink[];
  settingsTrigger: SidebarSettingsTrigger;
  currentUser: AuthUser | null | undefined;
  onLogout: () => void;
  onToggleCollapse: () => void;
}

export function SidebarContent({
  isCollapsed,
  isMobile,
  onMobileClose,
  menuItems,
  settingsPopoverLinks: settingsPopoverLinksProp,
  settingsTrigger,
  currentUser,
  onLogout,
  onToggleCollapse,
}: SidebarContentProps) {
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
      className={cn(CHROME.aside, collapsed && CHROME.collapsed)}
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
        settingsPopoverLinks={settingsPopoverLinksProp}
        settingsTrigger={settingsTrigger}
        isCollapsed={collapsed}
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
}
