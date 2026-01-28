/**
 * SidebarNav Component
 * Navigation menu section of the sidebar
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { MenuItem, SettingsItem } from './types';

interface SidebarNavProps {
  /** Menu items to display */
  menuItems: MenuItem[];
  /** Settings items to display */
  settingsItems: SettingsItem[];
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback when navigation occurs (for mobile close) */
  onNavigate?: () => void;
}

/**
 * SidebarNav Component
 * Displays the main navigation menu and settings section
 */
export const SidebarNav: React.FC<SidebarNavProps> = ({
  menuItems,
  settingsItems,
  isCollapsed,
  onNavigate,
}) => {
  /**
   * Handle navigation click (close mobile sidebar if needed)
   */
  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  const getNavLinkClasses = (isActive: boolean) => {
    const base = isCollapsed
      ? 'flex items-center justify-center py-3 text-sm font-medium transition-all duration-300 rounded-lg mx-2'
      : 'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg mx-2';
    return isActive
      ? `${base} bg-brand/10 text-brand`
      : `${base} text-text-secondary hover:bg-surface-hover hover:text-text-primary`;
  };

  const textContentVariants = {
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

  const sectionTitleVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.15,
      },
    },
  };

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {/* Main Menu Section */}
      <div className="mb-6">
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="main-menu-title"
              variants={sectionTitleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="px-4 mb-2"
            >
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Main Menu
              </h3>
            </motion.div>
          )}
        </AnimatePresence>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              onClick={handleNavClick}
              className={({ isActive }) => getNavLinkClasses(isActive)}
            >
              {/* Icon Container - Fixed, no animation */}
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                {item.icon}
              </div>

              {/* Text Content - Animated */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    key={`text-${item.path}`}
                    variants={textContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Settings Section */}
      <div>
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="settings-title"
              variants={sectionTitleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="px-4 mb-2"
            >
              <h3 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
                Settings
              </h3>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="space-y-1">
          {settingsItems.map((item, index) => (
            <button
              key={index}
              disabled
              className={isCollapsed
                ? 'w-full flex items-center justify-center py-3 text-sm font-medium text-text-disabled rounded-lg mx-2 cursor-not-allowed transition-all duration-300'
                : 'w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-disabled rounded-lg mx-2 cursor-not-allowed transition-all duration-300'}
              title={isCollapsed ? item.label : 'Coming soon'}
            >
              {/* Icon Container - Fixed, no animation */}
              <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                {item.icon}
              </div>
              {/* Text Content - Animated */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    key={`settings-text-${index}`}
                    variants={textContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
