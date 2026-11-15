/**
 * Sidebar — main layout shell with mobile overlay support.
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/app/authStore';
import { SidebarContent } from './SidebarContent';
import { useSidebarMenu } from './useSidebarMenu';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

function SidebarComponent({
  isMobileOpen = false,
  onMobileClose,
  isMobile = false,
}: SidebarProps) {
  const { user: currentUser, logout, hasRole } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { menuItems, settingsPopoverLinks, settingsTrigger, chrome } = useSidebarMenu(hasRole);

  useEffect(() => {
    if (isMobile && isMobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileOpen]);

  useEffect(() => {
    if (!isMobile || !isMobileOpen || !onMobileClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isMobileOpen, onMobileClose]);

  const content = (
    <SidebarContent
      isCollapsed={isCollapsed}
      isMobile={isMobile}
      onMobileClose={onMobileClose}
      menuItems={menuItems}
      settingsPopoverLinks={settingsPopoverLinks}
      settingsTrigger={settingsTrigger}
      chrome={chrome}
      currentUser={currentUser}
      onLogout={logout}
      onToggleCollapse={() => setIsCollapsed(prev => !prev)}
    />
  );

  if (!isMobile) return content;

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-40 cursor-default bg-overlay"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1], type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 z-50"
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const Sidebar = SidebarComponent;
