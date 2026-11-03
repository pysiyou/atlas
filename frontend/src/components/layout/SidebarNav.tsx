import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { CHROME } from '@/theme/recipes';
import { cn } from '@/utils';
import type { MenuItem, SettingsPopoverLink } from './sidebarMenu';
import { settingsPopoverTrigger } from '@/config/sidebarMenu';
import { SidebarSettingsMenu } from './SidebarSettingsMenu';

export interface SidebarNavProps {
  menuItems: MenuItem[];
  settingsPopoverLinks: SettingsPopoverLink[];
  isCollapsed?: boolean;
  onNavigate?: () => void;
}

function SectionTitle({ children }: { children: string }) {
  return <p className={CHROME.sectionTitle}>{children}</p>;
}

function NavRowBody({
  icon,
  label,
  isActive = false,
  interactive = true,
}: {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  interactive?: boolean;
}) {
  return (
    <>
      <div className={cn(CHROME.navHit, interactive && CHROME.navHitHover)}>
        <div className={CHROME.navIconColumn}>
          <div
            className={cn(
              CHROME.navIcon,
              isActive ? CHROME.navIconActive : CHROME.navIconHover,
            )}
          >
            {icon}
          </div>
        </div>
        <span
          className={cn(
            CHROME.navLabel,
            'text-left',
            isActive ? CHROME.navLabelActive : CHROME.navLabelHover,
          )}
        >
          {label}
        </span>
      </div>
      <span className={CHROME.navTooltip} role="tooltip">
        {label}
      </span>
    </>
  );
}

const navRowReset =
  'appearance-none bg-transparent p-0 m-0 border-0 text-left no-underline';

export function SidebarNav({
  menuItems,
  settingsPopoverLinks,
  isCollapsed = false,
  onNavigate,
}: SidebarNavProps) {
  const handleNavClick = () => onNavigate?.();
  const showSettings = settingsPopoverLinks.length > 0;

  return (
    <div className={CHROME.navScroll}>
      <SectionTitle>Menu</SectionTitle>
      <nav className={CHROME.navList} aria-label="Main navigation">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={cn(CHROME.navItem, navRowReset)}
          >
            {({ isActive }) => (
              <NavRowBody icon={item.icon} label={item.label} isActive={isActive} />
            )}
          </NavLink>
        ))}
      </nav>

      {showSettings && (
        <>
          <div className={CHROME.footerDivider} aria-hidden="true">
            <div className={CHROME.footerDividerRule} />
          </div>
          <SectionTitle>Settings</SectionTitle>
          <div className={CHROME.navList} role="group" aria-label="Settings">
            <SidebarSettingsMenu
              isCollapsed={isCollapsed}
              triggerIcon={settingsPopoverTrigger.icon}
              triggerLabel={settingsPopoverTrigger.label}
              items={settingsPopoverLinks}
              onNavigate={handleNavClick}
            />
          </div>
        </>
      )}
    </div>
  );
}
