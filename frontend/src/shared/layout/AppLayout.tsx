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

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const breakpoint = useBreakpoint();
  const isMobile = !isBreakpointAtLeast(breakpoint, 'lg');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  /**
   * Close mobile sidebar when switching to desktop
   */
  useEffect(() => {
    if (!isMobile && isMobileSidebarOpen) {
      setIsMobileSidebarOpen(false);
    }
  }, [isMobile, isMobileSidebarOpen]);

  /**
   * Toggle mobile sidebar
   */
  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  /**
   * Close mobile sidebar
   */
  const handleCloseMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen flex bg-gray-50 relative">
      {/* Mobile Menu Button - Only visible on mobile */}
      {isMobile && (
        <button
          onClick={handleToggleMobileSidebar}
          title="Open Menu"
          className="fixed top-4 left-4 z-30 lg:hidden bg-white hover:bg-gray-50 rounded-lg p-2 shadow-md border border-gray-200 transition-colors"
          aria-label="Open navigation menu"
        >
          {/* Hamburger Menu Icon */}
          <svg
            className="w-6 h-6 text-gray-700"
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
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};
