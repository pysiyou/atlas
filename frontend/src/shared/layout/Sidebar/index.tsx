/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 * Organized into Header, Navigation, and Profile sections
 * Supports responsive behavior: overlay on mobile, fixed on desktop
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/shared/stores/auth.store';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarProfile } from './SidebarProfile';
import { getFilteredMenuItems, settingsItems } from './menuConfig';
import type { MenuItem, SettingsItem } from './types';
import type { AuthUser } from '@/types';

interface SidebarProps {
  /** Whether the sidebar is open on mobile */
  isMobileOpen?: boolean;
  /** Callback to close sidebar on mobile */
  onMobileClose?: () => void;
  /** Whether the sidebar is in mobile mode */
  isMobile?: boolean;
}

/** Props for the static SidebarContent component */
interface SidebarContentProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onMobileClose?: () => void;
  menuItems: MenuItem[];
  settingsItems: SettingsItem[];
  currentUser: AuthUser | null | undefined;
  onLogout: () => void;
  onToggleCollapse: () => void;
}

/**
 * Sidebar content (aside). Declared at module level so it is not recreated each render.
 */
const SidebarContent: React.FC<SidebarContentProps> = ({
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
  const containerClasses = collapsed
    ? 'w-16 bg-surface border-r border-border flex flex-col transition-all duration-300'
    : 'w-64 bg-surface border-r border-border flex flex-col transition-all duration-300';
  
  return (
    <aside
      className={containerClasses}
      style={{ padding: '0' }}
      onClick={e => {
        e.stopPropagation();
      }}
    >
      <SidebarHeader
        isCollapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onMobileClose={isMobile ? onMobileClose : undefined}
      />
      <SidebarNav
        menuItems={menuItems}
        settingsItems={settingsItemsProp}
        isCollapsed={collapsed}
        onNavigate={isMobile ? onMobileClose : undefined}
      />
      {currentUser && (
        <SidebarProfile currentUser={currentUser} isCollapsed={collapsed} onLogout={onLogout} />
      )}
    </aside>
  );
};

/**
 * Sidebar Component
 * Main sidebar container that composes Header, Nav, and Profile components
 *
 * Responsive behavior:
 * - Desktop (>= lg): Fixed sidebar with collapse/expand functionality
 * - Mobile (< lg): Overlay sidebar that slides in from the left
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onMobileClose,
  isMobile = false,
}) => {
  const { user: currentUser, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredMenuItems = getFilteredMenuItems(currentUser?.role);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  useEffect(() => {
    if (isMobile && isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileOpen]);

  useEffect(() => {
    if (!isMobile || !isMobileOpen || !onMobileClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onMobileClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobile, isMobileOpen, onMobileClose]);

  const content = (
    <SidebarContent
      isCollapsed={isCollapsed}
      isMobile={isMobile}
      onMobileClose={onMobileClose}
      menuItems={filteredMenuItems}
      settingsItems={settingsItems}
      currentUser={currentUser}
      onLogout={logout}
      onToggleCollapse={handleToggleCollapse}
    />
  );

  if (!isMobile) {
    return content;
  }

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed top-0 left-0 bottom-0 z-50"
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Re-export sub-components for flexibility
export { SidebarHeader } from './SidebarHeader';
export { SidebarNav } from './SidebarNav';
export { SidebarProfile } from './SidebarProfile';
// eslint-disable-next-line react-refresh/only-export-components
export { menuItems, settingsItems, getFilteredMenuItems } from './menuConfig';
export type { MenuItem, SettingsItem } from './types';
