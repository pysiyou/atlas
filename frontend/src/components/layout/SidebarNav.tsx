import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { CHROME } from '@/components/theme/recipes';
import { cn } from '@/utils';
import type { MenuItem, SettingsItem } from './sidebarMenu';

export interface SidebarNavProps {
  menuItems: MenuItem[];
  settingsItems: SettingsItem[];
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
      <div
        className={cn(
          CHROME.navHit,
          isActive && CHROME.navHitFill,
          interactive && CHROME.navHitHover,
        )}
      >
        <div className={CHROME.navIcon}>{icon}</div>
        <span className={cn(CHROME.navLabel, 'text-left')}>{label}</span>
      </div>
      <span className={CHROME.navTooltip} role="tooltip">
        {label}
      </span>
    </>
  );
}

const navRowReset =
  'appearance-none bg-transparent p-0 m-0 border-0 text-left no-underline';

export function SidebarNav({ menuItems, settingsItems, onNavigate }: SidebarNavProps) {
  const handleNavClick = () => onNavigate?.();

  return (
    <div className={CHROME.navScroll}>
      <SectionTitle>Menu</SectionTitle>
      <nav className={CHROME.navList} aria-label="Main navigation">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={handleNavClick}
            className={cn(CHROME.navItem, CHROME.navRow, navRowReset)}
          >
            {({ isActive }) => (
              <NavRowBody icon={item.icon} label={item.label} isActive={isActive} />
            )}
          </NavLink>
        ))}
      </nav>

      {settingsItems.length > 0 && (
        <>
          <div className={CHROME.footerDivider} aria-hidden="true">
            <div className={CHROME.footerDividerRule} />
          </div>
          <SectionTitle>Settings</SectionTitle>
          <div className={CHROME.navList} role="group" aria-label="Settings">
            {settingsItems.map((item, index) => (
              <button
                key={index}
                type="button"
                disabled
                className={cn(CHROME.navItem, CHROME.navRow, navRowReset, 'cursor-not-allowed')}
              >
                <NavRowBody icon={item.icon} label={item.label} interactive={false} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
