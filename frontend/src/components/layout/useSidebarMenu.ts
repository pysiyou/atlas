import type { IconKey } from '@/config/icons';
import {
  getFilteredNavMenuDefinitions,
  getFilteredSettingsPopoverLinkDefinitions,
  SETTINGS_POPOVER_TRIGGER,
  t,
} from '@/config';
import { useClientConfig } from '@/app/clientConfigContext';
import type { UserRole } from '@/types';

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

/** Resolves sidebar labels from loaded client terminology; re-renders when config context updates. */
export function useSidebarMenu(hasRole: (roles: UserRole | UserRole[]) => boolean) {
  useClientConfig();

  const menuItems: SidebarNavItem[] = getFilteredNavMenuDefinitions().map(item => ({
    path: item.path,
    label: t(item.terminologyKey, item.labelFallback),
    iconKey: item.iconKey,
  }));

  const settingsPopoverLinks: SidebarSettingsLink[] = getFilteredSettingsPopoverLinkDefinitions(
    hasRole,
  ).map(item => ({
    label: item.terminologyKey ? t(item.terminologyKey, item.label) : item.label,
    iconKey: item.iconKey,
    path: item.path,
    disabled: item.disabled,
  }));

  const settingsTrigger: SidebarSettingsTrigger = {
    label: SETTINGS_POPOVER_TRIGGER.label,
    iconKey: SETTINGS_POPOVER_TRIGGER.iconKey,
  };

  return { menuItems, settingsPopoverLinks, settingsTrigger };
}