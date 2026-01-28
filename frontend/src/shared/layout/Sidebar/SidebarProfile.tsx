/**
 * SidebarProfile Component
 * User profile section at the bottom of the sidebar
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/shared/ui';
import { Button, IconButton } from '@/shared/ui';
import { formatStatus } from '@/utils/statusHelpers';
import type { AuthUser } from '@/types';
import defaultAvatar from '@/assets/images/default-avatar.jpg';

interface SidebarProfileProps {
  /** Current authenticated user */
  currentUser: AuthUser;
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback to handle logout */
  onLogout: () => void;
}

/**
 * SidebarProfile Component
 * Displays user avatar, name, role, and logout button
 */
export const SidebarProfile: React.FC<SidebarProfileProps> = ({
  currentUser,
  isCollapsed,
  onLogout,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const profileInfoVariants = {
    hidden: { opacity: 0, width: 0 },
    visible: {
      opacity: 1,
      width: 'auto',
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      width: 0,
      transition: {
        duration: 0.15,
      },
    },
  };

  const popoverVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.15,
      },
    },
  };

  return (
    <div className={`mt-auto border-t border-border transition-all duration-300 ${isCollapsed ? 'p-2' : 'p-4'}`}>
      {/* Profile Popover for Collapsed Mode */}
      <AnimatePresence>
        {isCollapsed && showProfileMenu && (
          <motion.div
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-20 left-20 bg-surface border border-border rounded-lg shadow-lg w-48 overflow-hidden z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-text-primary truncate">{currentUser.name}</p>
              <p className="text-xs text-text-tertiary truncate">{formatStatus(currentUser.role)}</p>
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

      <motion.div
        className={`flex items-center cursor-pointer transition-all duration-300 ${isCollapsed ? 'justify-center' : 'gap-3'}`}
        onClick={() => isCollapsed && setShowProfileMenu(!showProfileMenu)}
        title={isCollapsed ? 'Click for options' : undefined}
        whileHover={{ scale: isCollapsed ? 1.05 : 1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* User Avatar - Centered when collapsed */}
        <div className={`flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-10 h-10'}`}>
          <Avatar primaryText={currentUser.name} src={defaultAvatar} size="md" />
        </div>

        {/* User Info - Collapsible */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="profile-info"
              variants={profileInfoVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center justify-between flex-1 min-w-0 overflow-hidden"
            >
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium text-text-primary truncate">{currentUser.name}</p>
                <p className="text-xs text-text-tertiary truncate">{formatStatus(currentUser.role)}</p>
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
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Invisible backdrop to close popover */}
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
