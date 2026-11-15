import { Icon } from '@/components/primitives';
import type { IconKey } from '@/config/icons';
import { ICON_SIZE } from '@/theme/recipes';

export function SidebarNavIcon({ iconKey }: { iconKey: IconKey }) {
  return <Icon iconKey={iconKey} className={ICON_SIZE.sidebarNav.icon} />;
}