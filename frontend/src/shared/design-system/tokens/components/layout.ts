/**
 * Layout Component Tokens
 * 
 * Unified layout styling tokens for AppLayout and Sidebar components.
 */

import { neutralColors } from '../colors';
import { border } from '../borders';
import { shadow } from '../shadows';
import { radius } from '../borders';
import { brandColors } from '../colors';

/**
 * AppLayout Base Styles
 */
/**
 * AppLayout Base Styles
 */
export const appLayout = {
  container: 'h-screen flex bg-app-bg relative', // using bg-app-bg (mapped to neutral-50)
  main: 'flex-1 flex flex-col overflow-hidden',
  mobileMenuButton: `fixed top-4 left-4 z-30 lg:hidden ${neutralColors.white} hover:bg-surface-hover ${radius.lg} p-2 ${shadow.md} ${border.default} transition-colors`,
  mobileMenuIcon: 'w-6 h-6 text-text-secondary',
} as const;

/**
 * Sidebar Base Styles
 */
export const sidebar = {
  container: (collapsed: boolean) => `${collapsed ? 'w-16' : 'w-64'} ${neutralColors.white} ${border.default} flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden`,
  backdrop: 'fixed inset-0 bg-overlay backdrop-blur-sm z-40 lg:hidden',
  mobileContainer: 'fixed left-0 top-0 h-full z-50 lg:hidden',
} as const;

/**
 * Sidebar Header Styles
 */
export const sidebarHeader = {
  container: `border-b ${border.default} shrink-0 h-[73px] flex items-center`,
  logoContainer: 'w-16 flex items-center justify-center shrink-0 h-full cursor-pointer',
  logoIcon: `w-8 h-8 flex items-center justify-center ${brandColors.primary.icon}`,
  titleContainer: (collapsed: boolean) => `flex-1 flex items-center justify-between min-w-0 pr-4 transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`,
  title: 'text-xs font-bold text-text-primary truncate',
  subtitle: 'text-xs text-text-muted',
} as const;

/**
 * Sidebar Navigation Styles
 */
export const sidebarNav = {
  container: 'flex-1 overflow-y-auto overflow-x-hidden py-4',
  section: 'mb-6',
  sectionHeader: (collapsed: boolean) => `overflow-hidden transition-all duration-300 ${collapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`,
  sectionTitle: 'text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-6 whitespace-nowrap',
  nav: 'space-y-1',
  navLink: (isActive: boolean) => `flex items-center min-w-0 py-2.5 transition-colors relative cursor-pointer ${isActive ? 'bg-brand-light/50 text-brand font-medium' : 'text-text-secondary hover:bg-surface-hover'}`,
  navIcon: 'w-16 flex items-center justify-center shrink-0',
  navText: (collapsed: boolean) => `text-sm whitespace-nowrap overflow-hidden transition-opacity duration-300 ${collapsed ? 'opacity-0' : 'opacity-100'}`,
  settingsButton: 'flex items-center min-w-0 py-2.5 w-full text-left text-text-muted cursor-not-allowed opacity-60',
} as const;

/**
 * Sidebar Profile Styles
 */
export const sidebarProfile = {
  container: `border-t ${border.default} bg-surface-muted relative shrink-0`,
  popover: `absolute bottom-full left-0 mb-2 w-48 ${neutralColors.white} ${radius.md} ${shadow.md} ${border.default} py-1 z-50 ml-2`,
  popoverHeader: 'px-4 py-2 border-b border-border-subtle',
  popoverName: 'text-sm font-medium text-text-primary truncate',
  popoverRole: 'text-xs text-text-muted truncate',
  profileContainer: 'flex items-center cursor-pointer min-w-0 w-full py-4',
  avatarContainer: 'w-16 flex items-center justify-center shrink-0',
  userInfo: (collapsed: boolean) => `flex-1 min-w-0 flex items-center pr-4 transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`,
  userName: 'text-sm font-medium text-text-primary truncate',
  userRole: 'text-xs text-text-muted truncate',
  backdrop: 'fixed inset-0 z-40',
} as const;
