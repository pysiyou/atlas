/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 * Organized into Header, Navigation, and Profile sections
 * Supports responsive behavior: overlay on mobile, fixed on desktop
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';
import { SidebarProfile } from './SidebarProfile';
import { getFilteredMenuItems, settingsItems } from './menuConfig';

interface SidebarProps {
  /** Whether the sidebar is open on mobile */
  isMobileOpen?: boolean;
  /** Callback to close sidebar on mobile */
  onMobileClose?: () => void;
  /** Whether the sidebar is in mobile mode */
  isMobile?: boolean;
}

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
  const { currentUser, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Filter menu items based on user role
  const filteredMenuItems = getFilteredMenuItems(currentUser?.role);

  /**
   * Handle toggle collapse (desktop only)
   */
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  /**
   * Close sidebar on mobile when clicking outside or on navigation
   */
  useEffect(() => {
    if (isMobile && isMobileOpen) {
      // Prevent body scroll when mobile sidebar is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileOpen]);

  /**
   * Handle keyboard events (Escape to close on mobile)
   */
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

  /**
   * Sidebar content component
   */
  const SidebarContent = () => (
    <aside
      className={`${
        isCollapsed && !isMobile ? 'w-16' : 'w-64'
      } bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden`}
      style={{ padding: '0' }}
      onClick={(e) => {
        // Prevent clicks inside sidebar from closing it
        e.stopPropagation();
      }}
    >
      {/* App Header - Logo Section */}
      <SidebarHeader
        isCollapsed={isCollapsed && !isMobile}
        onToggleCollapse={handleToggleCollapse}
        onMobileClose={isMobile ? onMobileClose : undefined}
      />

      {/* Scrollable menu content */}
      <SidebarNav
        menuItems={filteredMenuItems}
        settingsItems={settingsItems}
        isCollapsed={isCollapsed && !isMobile}
        onNavigate={isMobile ? onMobileClose : undefined}
      />

      {/* User Profile Section - Fixed at bottom */}
      {currentUser && (
        <SidebarProfile
          currentUser={currentUser}
          isCollapsed={isCollapsed && !isMobile}
          onLogout={logout}
        />
      )}
    </aside>
  );

  // Desktop: Always visible, fixed position
  if (!isMobile) {
    return <SidebarContent />;
  }

  // Mobile: Overlay with slide-in animation
  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-0 top-0 h-full z-50 lg:hidden"
          >
            <SidebarContent />
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
