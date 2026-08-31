import { NavLink } from 'react-router-dom';
import type { MenuItem, SettingsItem } from './sidebarMenu';

export interface SidebarNavProps {
  menuItems: MenuItem[];
  settingsItems: SettingsItem[];
  onNavigate?: () => void;
}

export function SidebarNav({ menuItems, settingsItems, onNavigate }: SidebarNavProps) {
  const handleNavClick = () => onNavigate?.();
  const getNavLinkClasses = (isActive: boolean) => {
    const base =
      'flex items-center py-3 text-sm font-normal rounded-none border-l-2 border-transparent';
    return isActive
      ? `${base} border-l-brand text-brand`
      : `${base} text-text-secondary hover:bg-surface-hover hover:text-text-primary`;
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
            <span className="flex-1 min-w-0 overflow-hidden truncate" title={item.label}>
              {item.label}
            </span>
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
