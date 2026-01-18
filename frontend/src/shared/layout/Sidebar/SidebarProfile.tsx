/**
 * SidebarProfile Component
 * User profile section at the bottom of the sidebar
 */

import React, { useState } from 'react';
import { Avatar } from '@/shared/ui/Avatar';
import { formatStatus } from '@/utils/statusHelpers';
import { LogOut } from 'lucide-react';
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

  return (
    <div className="border-t border-gray-200 bg-gray-50 relative shrink-0">
      {/* Profile Popover for Collapsed Mode */}
      {isCollapsed && showProfileMenu && (
        <div
          className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded shadow-md border border-gray-100 py-1 z-50 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {formatStatus(currentUser.role)}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      )}

      <div
        className="flex items-center cursor-pointer min-w-0 w-full py-4"
        onClick={() => isCollapsed && setShowProfileMenu(!showProfileMenu)}
        title={isCollapsed ? 'Click for options' : undefined}
      >
        {/* User Avatar - Fixed Width w-16 */}
        <div className="w-16 flex items-center justify-center shrink-0">
          <Avatar name={currentUser.name} src={defaultAvatar} size="md" />
        </div>

        {/* User Info - Collapsible */}
        <div
          className={`flex-1 min-w-0 flex items-center pr-4 transition-opacity duration-300 ${
            isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-sm font-medium text-gray-900 truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {formatStatus(currentUser.role)}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onLogout();
            }}
            className="shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Invisible backdrop to close popover */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          style={{ pointerEvents: 'auto', background: 'transparent' }}
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </div>
  );
};
