import { companyConfig } from '@/config';
import { Icon, IconButton } from '@/components';
import { ICONS } from '@/config/icons';
import { CHROME } from '@/components/theme/recipes';
import { cn } from '@/utils';

export interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMobileClose?: () => void;
}

export function SidebarHeader({ isCollapsed, onToggleCollapse, onMobileClose }: SidebarHeaderProps) {
  const { company, branding } = companyConfig.getConfig();
  const displayName = company.displayName;
  const splitAt = branding.appNamePart2Start;
  const part1 =
    splitAt != null && splitAt > 0 && splitAt < displayName.length
      ? displayName.slice(0, splitAt)
      : null;
  const part2 = part1 != null ? displayName.slice(splitAt!) : null;
  const handleButtonClick = () => {
    if (onMobileClose) onMobileClose();
    else onToggleCollapse();
  };
  return (
    <div
      className={cn(
        CHROME.railHeight,
        'flex items-center shrink-0',
        isCollapsed ? 'justify-center px-0' : 'justify-between px-4'
      )}
    >
      {!isCollapsed && (
        <div className="min-w-0 flex-1 overflow-hidden">
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
      )}
      <IconButton
        variant="sidebarClose"
        size="sm"
        shape="square"
        icon={
          <Icon
            name={isCollapsed ? ICONS.actions.doubleArrowRight : ICONS.actions.doubleArrowLeft}
          />
        }
        onClick={handleButtonClick}
        title={onMobileClose ? 'Close Sidebar' : isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        className="shrink-0"
      />
    </div>
  );
}
