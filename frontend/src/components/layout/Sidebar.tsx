/**
 * Sidebar — single-file layout (max-depth-1).
 * Inlines: SidebarHeader, SidebarNav, ThemeSwitch, SidebarProfile, menuConfig, types.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/app/store';
import { companyConfig } from '@/config';
import { Icon, IconButton, Avatar, Button, Popover } from '@/components';
import { ICONS } from '@/utils';
import type { PopoverPlacement } from '@/components';
import { getActiveTheme, setTheme } from '@/components/theme';
import type { ThemeName } from '@/components/theme';
import { formatStatus } from '@/utils/string';
import type { AuthUser } from '@/types';
import defaultAvatar from '@/assets/images/default-avatar.jpg';
import { getFilteredMenuItems, settingsItems, type MenuItem, type SettingsItem } from './sidebarMenu';

const LIGHT_THEME: ThemeName = 'studio-light';
const DARK_THEME: ThemeName = 'noir-studio';

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMobileClose?: () => void;
}

function SidebarHeader({ isCollapsed, onToggleCollapse, onMobileClose }: SidebarHeaderProps) {
  const { company, branding } = companyConfig.getConfig();
  const displayName = company.displayName;
  const splitAt = branding.appNamePart2Start;
  const part1 = splitAt != null && splitAt > 0 && splitAt < displayName.length ? displayName.slice(0, splitAt) : null;
  const part2 = part1 != null ? displayName.slice(splitAt!) : null;
  const handleButtonClick = () => {
    if (onMobileClose) onMobileClose();
    else onToggleCollapse();
  };
  return (
    <div className="h-16 border-b border-border-default flex items-center justify-between px-4">
      <div className="min-w-0 overflow-hidden">
        <h1 className="text-2xl font-bold truncate">
          {part1 != null && part2 != null ? (
            <>
              <span className="text-brand">{part1}</span>
              <span className="bg-brand text-on-brand py-0.5 px-1">{part2}</span>
            </>
          ) : (
            <span className="text-brand">{displayName}</span>
          )}
        </h1>
      </div>
      <IconButton
        variant="sidebarClose"
        size="sm"
        icon={<Icon name={isCollapsed ? ICONS.actions.doubleArrowRight : ICONS.actions.doubleArrowLeft} />}
        onClick={handleButtonClick}
        title={onMobileClose ? 'Close Sidebar' : isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        className="w-8 h-8 shrink-0"
      />
    </div>
  );
}

interface SidebarNavProps {
  menuItems: MenuItem[];
  settingsItems: SettingsItem[];
  onNavigate?: () => void;
}

function SidebarNav({ menuItems, settingsItems, onNavigate }: SidebarNavProps) {
  const handleNavClick = () => onNavigate?.();
  const getNavLinkClasses = (isActive: boolean) => {
    const base = 'flex items-center py-3 text-sm font-normal rounded-none border-l-2 border-transparent';
    return isActive ? `${base} border-l-brand text-brand` : `${base} text-text-secondary hover:bg-surface-hover hover:text-text-primary`;
  };
  return (
    <div className="flex-1 overflow-y-auto py-4 flex flex-col">
      <nav className="flex-1 min-h-0 space-y-1 px-0" aria-label="Main navigation">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={({ isActive }) => getNavLinkClasses(isActive)}
          >
            <div className="w-16 shrink-0 flex items-center justify-center">
              <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
            </div>
            <span className="flex-1 min-w-0 overflow-hidden truncate" title={item.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 pt-4 border-t border-border-default">
        <div className="space-y-1" role="group" aria-label="Settings">
          {settingsItems.map((item, index) => (
            <button
              key={index}
              disabled
              className="w-full flex items-center py-3 text-sm font-normal text-text-disabled rounded cursor-not-allowed"
              title={item.label}
            >
              <div className="w-16 shrink-0 flex items-center justify-center">
                <div className="w-5 h-5 flex items-center justify-center">{item.icon}</div>
              </div>
              <span className="flex-1 min-w-0 overflow-hidden truncate text-left">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ThemeSwitchProps {
  isCollapsed: boolean;
}

function ThemeSwitch({ isCollapsed }: ThemeSwitchProps) {
  const [effective, setEffective] = useState<ThemeName>(() => getActiveTheme());
  useEffect(() => {
    const sync = () => setEffective(getActiveTheme());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const isLight = effective === LIGHT_THEME;
  const toggle = useCallback(() => {
    const next = isLight ? DARK_THEME : LIGHT_THEME;
    setTheme(next);
    setEffective(next);
  }, [isLight]);
  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center py-3 border-t border-border-default">
        <button
          type="button"
          onClick={toggle}
          className="p-2 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-hover/80 transition-colors"
          title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
          aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {isLight ? <Icon name="sun" className="w-4 h-4" /> : <Icon name="moon" className="w-4 h-4" />}
        </button>
      </div>
    );
  }
  return (
    <div className="border-t border-border-default px-4 py-4 flex justify-center">
      <button
        type="button"
        onClick={toggle}
        className="relative w-24 h-8 rounded-full bg-border-default/60 border border-border-default/80 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface shadow-inner"
        aria-pressed={!isLight}
        aria-label={isLight ? 'Dark mode' : 'Light mode'}
      >
        <div className="absolute inset-0 flex">
          <span className="flex-1 flex items-center justify-center text-text-secondary/70 [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
            <Icon name="sun" className="w-4 h-4" />
          </span>
          <span className="flex-1 flex items-center justify-center text-text-secondary/70 [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
            <Icon name="moon" className="w-4 h-4" />
          </span>
        </div>
        <motion.span
          className="absolute top-0.5 bottom-0.5 w-11 rounded-full bg-text-primary flex items-center justify-center shadow-sm ring-1 ring-black/5 text-surface [&>svg]:w-3 [&>svg]:h-3"
          initial={false}
          animate={{ left: isLight ? '4px' : 'calc(100% - 4px - 2.75rem)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          aria-hidden
        >
          {isLight ? <Icon name="sun" className="w-4 h-4" /> : <Icon name="moon" className="w-4 h-4" />}
        </motion.span>
      </button>
    </div>
  );
}

interface SidebarProfileProps {
  currentUser: AuthUser;
  isCollapsed: boolean;
  onLogout: () => void;
}

function SidebarProfile({ currentUser, isCollapsed, onLogout }: SidebarProfileProps) {
  const placement: PopoverPlacement = isCollapsed ? 'right-start' : 'top';
  return (
    <div className="mt-auto border-t border-border-default py-4">
      <Popover
        placement={placement}
        offsetValue={8}
        viewportPadding={8}
        showBackdrop={false}
        className="w-48 min-w-0"
        trigger={
          <div className="flex items-center py-0 cursor-pointer" title="Click for options" role="button" tabIndex={0}>
            <div className="w-16 shrink-0 flex items-center justify-center">
              <Avatar
                primaryText={currentUser.name}
                secondaryText={formatStatus(currentUser.role)}
                src={defaultAvatar}
                size="sm"
                avatarOnly
              />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-normal text-text-primary truncate">{currentUser.name}</p>
              <p className="text-xs text-text-tertiary truncate">{formatStatus(currentUser.role)}</p>
            </div>
          </div>
        }
      >
        {({ close }) => (
          <>
            <div className="px-4 py-3 border-b border-border-default">
              <p className="text-sm font-normal text-text-primary truncate">{currentUser.name}</p>
              <p className="text-xs text-text-tertiary truncate">{formatStatus(currentUser.role)}</p>
            </div>
            <Button
              variant="logout"
              size="sm"
              fullWidth
              onClick={() => { close(); onLogout(); }}
              className="justify-start rounded-none"
            >
              Logout
            </Button>
          </>
        )}
      </Popover>
    </div>
  );
}

interface SidebarContentProps {
  isCollapsed: boolean;
  isMobile: boolean;
  onMobileClose?: () => void;
  menuItems: MenuItem[];
  settingsItems: SettingsItem[];
  currentUser: AuthUser | null | undefined;
  onLogout: () => void;
  onToggleCollapse: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  isCollapsed,
  isMobile,
  onMobileClose,
  menuItems,
  settingsItems: settingsItemsProp,
  currentUser,
  onLogout,
  onToggleCollapse,
}) => {
  const collapsed = isCollapsed && !isMobile;
  const sidebarVariants = {
    expanded: { width: '16rem', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
    collapsed: { width: '4rem', transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const } },
  };
  return (
    <motion.aside
      variants={sidebarVariants}
      animate={collapsed ? 'collapsed' : 'expanded'}
      initial={false}
      className="bg-surface border-r border-border-default flex flex-col overflow-hidden"
      style={{ padding: '0' }}
      onClick={e => e.stopPropagation()}
    >
      <SidebarHeader
        isCollapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onMobileClose={isMobile ? onMobileClose : undefined}
      />
      <SidebarNav
        menuItems={menuItems}
        settingsItems={settingsItemsProp}
        onNavigate={isMobile ? onMobileClose : undefined}
      />
      <ThemeSwitch isCollapsed={collapsed} />
      {currentUser && (
        <SidebarProfile currentUser={currentUser} isCollapsed={collapsed} onLogout={onLogout} />
      )}
    </motion.aside>
  );
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isMobile?: boolean;
}

const SidebarComponent: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onMobileClose,
  isMobile = false,
}) => {
  const { user: currentUser, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const filteredMenuItems = getFilteredMenuItems();

  useEffect(() => {
    if (isMobile && isMobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, isMobileOpen]);

  useEffect(() => {
    if (!isMobile || !isMobileOpen || !onMobileClose) return;
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onMobileClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isMobileOpen, onMobileClose]);

  const content = (
    <SidebarContent
      isCollapsed={isCollapsed}
      isMobile={isMobile}
      onMobileClose={onMobileClose}
      menuItems={filteredMenuItems}
      settingsItems={settingsItems}
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
            className="fixed inset-0 bg-overlay z-40"
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
};

export const Sidebar = SidebarComponent;
