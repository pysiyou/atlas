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

function navIconIndicatorClasses(isActive: boolean): string {
  return cn(CHROME.navIndicator, isActive ? CHROME.navIndicatorActive : CHROME.navIndicatorIdle);
}

function SectionTitle({ children }: { children: string }) {
  return <p className={CHROME.sectionTitle}>{children}</p>;
}

function NavRowBody({
  icon,
  label,
  isActive = false,
}: {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
}) {
  return (
    <>
      <div className={CHROME.navIconColumn}>
        <div className={navIconIndicatorClasses(isActive)}>{icon}</div>
      </div>
      <span
        className={cn(
          CHROME.navLabel,
          'text-left',
          isActive ? 'text-text-primary' : 'text-text-secondary group-hover/nav:text-text-primary',
        )}
      >
        {label}
      </span>
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
            className={cn(CHROME.navItem, navRowReset)}
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
                className={cn(CHROME.navItem, navRowReset, 'cursor-not-allowed')}
              >
                <NavRowBody icon={item.icon} label={item.label} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
