/**
 * SidebarProfile Component
 * User profile section at the bottom of the sidebar
 * Fixed 4rem icon column; content column clipped on collapse (no inner animation)
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '@/shared/ui';
import { Button, IconButton } from '@/shared/ui';
import { formatStatus } from '@/utils/statusHelpers';
import type { AuthUser } from '@/types';
import defaultAvatar from '@/assets/images/default-avatar.jpg';

interface SidebarProfileProps {
  currentUser: AuthUser;
  isCollapsed: boolean;
  onLogout: () => void;
}

const popoverVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' as const } },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};

export const SidebarProfile: React.FC<SidebarProfileProps> = ({
  currentUser,
  isCollapsed,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <div className="mt-auto border-t border-border py-4">
      <AnimatePresence>
        {isCollapsed && showProfileMenu && (
          <motion.div
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-20 left-20 bg-surface border border-border rounded shadow-lg w-48 overflow-hidden z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-text truncate">{currentUser.name}</p>
              <p className="text-xs text-text-3 truncate">{formatStatus(currentUser.role)}</p>
            </div>
            <Button
              variant="logout"
              size="sm"
              fullWidth
              onClick={onLogout}
              className="justify-start rounded-none"
            >
              Logout
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="flex items-center cursor-pointer"
        onClick={() => isCollapsed && setShowProfileMenu(!showProfileMenu)}
        title={isCollapsed ? 'Click for options' : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && isCollapsed && setShowProfileMenu(prev => !prev)}
      >
        <div className="w-16 shrink-0 flex items-center justify-center">
          <Avatar primaryText={currentUser.name} src={defaultAvatar} size="md" />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden flex items-center justify-between px-3">
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium text-text truncate">{currentUser.name}</p>
            <p className="text-xs text-text-3 truncate">{formatStatus(currentUser.role)}</p>
          </div>
          <IconButton
            variant="logout"
            size="sm"
            onClick={e => {
              e.stopPropagation();
              onLogout();
            }}
            title="Logout"
            className="ml-2"
          />
        </div>
      </div>

      <AnimatePresence>
        {showProfileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            style={{ pointerEvents: 'auto', background: 'transparent' }}
            onClick={() => setShowProfileMenu(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
