/**
 * AppShell — Main application shell with responsive sidebar.
 * (was AppLayout.tsx / DashboardLayout)
 *
 * Features:
 * - Desktop: Fixed sidebar with collapse/expand
 * - Mobile: Overlay sidebar with hamburger menu button
 */

import React, { type ReactNode, useState, useEffect } from 'react';
import { useBreakpoint, isBreakpointAtLeast } from '@/hooks/useBreakpoint';
import { Sidebar } from './Sidebar';
import { Icon } from '@/components/primitives/Icon';

export interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
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

  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-page">
      {/* Mobile Menu Button - Only visible on mobile */}
      {isMobile && (
        <button
          onClick={handleToggleMobileSidebar}
          title="Open Menu"
          className="fixed top-4 left-4 z-40 w-10 h-10 flex items-center justify-center bg-surface border border-border-default rounded-lg shadow-md hover:bg-surface-hover transition-colors lg:hidden"
          aria-label="Open navigation menu"
        >
          <Icon name="menu" className="w-6 h-6 text-text-primary" />        </button>
      )}

      {/* Sidebar - Responsive behavior */}
      <Sidebar
        isMobile={isMobile}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={handleCloseMobileSidebar}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-auto">{children}</main>
    </div>
  );
};

/** @deprecated Use AppShell */
export const DashboardLayout = AppShell;
/** @deprecated Use AppShellProps */
export type DashboardLayoutProps = AppShellProps;
