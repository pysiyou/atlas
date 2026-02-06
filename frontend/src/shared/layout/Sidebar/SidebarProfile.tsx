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
    <div className="mt-auto border-t border-stroke py-4">
      <AnimatePresence>
        {isCollapsed && showProfileMenu && (
          <motion.div
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-20 left-20 bg-panel border border-stroke rounded shadow-lg w-48 overflow-hidden z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-stroke">
              <p className="text-sm font-medium text-fg truncate">{currentUser.name}</p>
              <p className="text-xs text-fg-subtle truncate">{formatStatus(currentUser.role)}</p>
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
        className="flex items-center gap-2 px-3 cursor-pointer"
        onClick={() => isCollapsed && setShowProfileMenu(!showProfileMenu)}
        title={isCollapsed ? 'Click for options' : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && isCollapsed && setShowProfileMenu(prev => !prev)}
      >
        <Avatar
          primaryText={currentUser.name}
          secondaryText={formatStatus(currentUser.role)}
          src={defaultAvatar}
          size="md"
          avatarOnly={isCollapsed}
          className={isCollapsed ? 'shrink-0' : 'flex-1 min-w-0'}
        />
        <IconButton
          variant="logout"
          size="sm"
          onClick={e => {
            e.stopPropagation();
            onLogout();
          }}
          title="Logout"
          className="shrink-0"
        />
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
