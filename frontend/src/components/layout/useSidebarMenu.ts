import type { IconKey } from '@/icons';
import type { UserRole } from '@/types';
import {
  getFilteredNavMenuDefinitions,
  getFilteredSettingsPopoverLinkDefinitions,
  SETTINGS_POPOVER_TRIGGER,
} from '@/app/navigation';
import { useNavCopy } from '@/strings';

export interface SidebarNavItem {
  path: string;
  label: string;
  iconKey: IconKey;
}

export interface SidebarSettingsLink {
  label: string;
  iconKey?: IconKey;
  path?: string;
  disabled?: boolean;
}

export interface SidebarSettingsTrigger {
  label: string;
  iconKey: IconKey;
}

export interface SidebarNavChrome {
  menu: string;
  settings: string;
  mainAriaLabel: string;
}

/** Resolves sidebar labels from ui-strings; re-renders when config context updates. */
export function useSidebarMenu(hasRole: (roles: UserRole | UserRole[]) => boolean) {
  const nav = useNavCopy();

  const menuItems: SidebarNavItem[] = getFilteredNavMenuDefinitions().map(item => ({
    path: item.path,
    label: nav.main[item.stringKey],
    iconKey: item.iconKey,
  }));

  const settingsPopoverLinks: SidebarSettingsLink[] = getFilteredSettingsPopoverLinkDefinitions(
    hasRole,
  ).map(item => ({
    label: nav.settingsLinks[item.stringKey],
    iconKey: item.iconKey,
    path: item.path,
    disabled: item.disabled,
  }));

  const settingsTrigger: SidebarSettingsTrigger = {
    label: nav.settings,
    iconKey: SETTINGS_POPOVER_TRIGGER.iconKey,
  };

  const chrome: SidebarNavChrome = {
    menu: nav.menu,
    settings: nav.settings,
    mainAriaLabel: nav.mainAriaLabel,
  };

  return { menuItems, settingsPopoverLinks, settingsTrigger, chrome };
}
