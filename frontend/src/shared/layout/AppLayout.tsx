/**
 * DashboardLayout Component
 * Main layout wrapper with responsive sidebar
 *
 * Features:
 * - Desktop: Fixed sidebar with collapse/expand
 * - Mobile: Overlay sidebar with hamburger menu button
 */

import React, { type ReactNode, useState, useEffect } from 'react';
import { useBreakpoint, isBreakpointAtLeast } from '@/hooks/useBreakpoint';
import { Sidebar } from './Sidebar';
import { appLayout } from '@/shared/design-system/tokens/components/layout';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const breakpoint = useBreakpoint();
  const isMobile = !isBreakpointAtLeast(breakpoint, 'lg');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  /**
   * Close mobile sidebar when switching to desktop (breakpoint change).
   * Syncs UI state to viewport; setState in effect is intentional here.
   */
  useEffect(() => {
    if (!isMobile && isMobileSidebarOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync close when viewport crosses to desktop
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile, isMobileSidebarOpen]);

  /**
   * Toggle mobile sidebar
   */
  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  /**
   * Close mobile sidebar
   */
  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className={appLayout.container}>
      {/* Mobile Menu Button - Only visible on mobile */}
      {isMobile && (
        <button
          onClick={handleToggleMobileSidebar}
          title="Open Menu"
          className={appLayout.mobileMenuButton}
          aria-label="Open navigation menu"
        >
          {/* Hamburger Menu Icon */}
          <svg
            className={appLayout.mobileMenuIcon}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Sidebar - Responsive behavior */}
      <Sidebar
        isMobile={isMobile}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleCloseMobileSidebar}
      />

      {/* Main Content */}
      <main className={appLayout.main}>{children}</main>
    </div>
  );
};
