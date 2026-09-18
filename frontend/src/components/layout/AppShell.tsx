/**
 * AppShell — Main application shell with responsive sidebar.
 *
 * Features:
 * - Desktop: Fixed sidebar with collapse/expand; unified white chrome + inset content well
 * - Mobile: Overlay sidebar with hamburger in top chrome row
 * - PageHeader portals into the top chrome row (shared with sidebar logo band)
 */

import React, { type ReactNode, useState, useEffect, useCallback } from 'react';
import { useBreakpoint, isBreakpointAtLeast } from '@/hooks/useBreakpoint';
import { AppChromeMountContext } from './appChromeMount';
import { Sidebar } from './Sidebar';
import { Icon } from '@/components/primitives/Icon';
import { RADIUS, SURFACE } from '@/components/theme/recipes';

export interface AppShellProps {
  children: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const breakpoint = useBreakpoint();
  const isMobile = !isBreakpointAtLeast(breakpoint, 'lg');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [chromeMountNode, setChromeMountNode] = useState<HTMLDivElement | null>(null);
  const chromeMountRef = useCallback((node: HTMLDivElement | null) => {
    setChromeMountNode(node);
  }, []);

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
    <AppChromeMountContext.Provider value={chromeMountNode}>
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar
          isMobile={isMobile}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleCloseMobileSidebar}
        />

        <div className="flex flex-1 flex-col min-w-0 min-h-0">
          <div className="shrink-0 flex items-stretch min-h-16 bg-surface-sidebar px-2 lg:px-4 gap-2">
            {isMobile && (
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={handleToggleMobileSidebar}
                  title="Open Menu"
                  className={`w-10 h-10 flex items-center justify-center ${SURFACE.raised} ${RADIUS.overlay} shadow-sm hover:bg-surface-hover transition-colors lg:hidden`}
                  aria-label="Open navigation menu"
                >
                  <Icon name="menu" className="w-6 h-6 text-text-primary" />
                </button>
              </div>
            )}
            <div ref={chromeMountRef} className="flex-1 min-w-0 flex items-center min-h-16" />
          </div>

          <div className="flex flex-1 min-h-0 p-2 pt-0">
            <main
              className={`flex flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden bg-surface-page ${RADIUS.workspace}`}
            >
              <div className="flex flex-1 min-h-0 flex-col overflow-hidden">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </AppChromeMountContext.Provider>
  );
};
