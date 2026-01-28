/**
 * SidebarHeader Component
 * Logo and app title section of the sidebar
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon, IconButton } from '@/shared/ui';
import { ICONS } from '@/utils';
import { companyConfig } from '@/config';

interface SidebarHeaderProps {
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Callback to toggle collapse state */
  onToggleCollapse: () => void;
  /** Callback to close sidebar on mobile (optional) */
  onMobileClose?: () => void;
}

/**
 * SidebarHeader Component
 * Displays the app logo, title, and collapse toggle
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isCollapsed,
  onToggleCollapse,
  onMobileClose,
}) => {
  const company = companyConfig.getConfig();
  const titleVariants = {
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

  return (
    <div className={`h-16 border-b border-border flex items-center transition-all duration-300 ${isCollapsed ? 'px-0 justify-center' : 'px-4'}`}>
      <div className={`flex items-center ${isCollapsed ? 'w-full justify-center' : 'w-full h-full'}`}>
        {/* Logo - Centered when collapsed */}
        <motion.div
          className={`flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-300 ${isCollapsed ? 'w-full' : 'w-12 h-12'}`}
          onClick={() => isCollapsed && onToggleCollapse()}
          title={isCollapsed ? 'Expand Sidebar' : undefined}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-8 h-8 text-brand flex items-center justify-center">
            <Icon name={ICONS.ui.appLogo} className="w-full h-full" />
          </div>
        </motion.div>

        {/* Title and collapse/close button */}
        <AnimatePresence mode="wait">
          {!isCollapsed && (
            <motion.div
              key="header-content"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex items-center justify-between flex-1 ml-3 overflow-hidden"
            >
              <div className="min-w-0 overflow-hidden whitespace-nowrap">
                <h1 className="text-base font-bold text-text-primary truncate">{company.company.displayName}</h1>
                <p className="text-xs text-text-tertiary">Version {company.company.version}</p>
              </div>
              {onMobileClose ? (
                <IconButton variant="close" size="sm" onClick={onMobileClose} title="Close Sidebar" />
              ) : (
                <IconButton
                  variant="collapse"
                  size="sm"
                  onClick={onToggleCollapse}
                  title="Collapse Sidebar"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
