import { companyConfig } from '@/config';
import { actionButtonPreset, Icon, IconButton } from '@/components';
import { ICONS } from '@/config/icons';
import { CHROME, RADIUS, TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';

export interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMobileClose?: () => void;
}

function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn(CHROME.navIndicator, 'bg-brand-muted text-brand', className)}>
      <Icon name={ICONS.ui.appLogo} className="size-[1.125rem]" />
    </div>
  );
}

export function SidebarHeader({
  isCollapsed,
  onToggleCollapse,
  onMobileClose,
}: SidebarHeaderProps) {
  const { company, branding } = companyConfig.getConfig();
  const displayName = company.displayName;
  const splitAt = branding.appNamePart2Start;
  const part1 =
    splitAt != null && splitAt > 0 && splitAt < displayName.length
      ? displayName.slice(0, splitAt)
      : null;
  const part2 = part1 != null ? displayName.slice(splitAt!) : null;

  const handleToggle = () => {
    if (onMobileClose) onMobileClose();
    else onToggleCollapse();
  };

  return (
    <div className={CHROME.headerBand}>
      <div className={CHROME.navIconColumn}>
        <button
          type="button"
          onClick={isCollapsed && !onMobileClose ? onToggleCollapse : undefined}
          className={`${RADIUS.field} transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]`}
          title={isCollapsed && !onMobileClose ? 'Expand sidebar' : displayName}
          aria-label={isCollapsed && !onMobileClose ? 'Expand sidebar' : displayName}
        >
          <BrandMark />
        </button>
      </div>
      <p className={cn(CHROME.clipPane, TYPE.detailTitle, 'leading-none')}>
        {part1 != null && part2 != null ? (
          <>
            <span className="text-brand">{part1}</span>
            <span className="text-text-primary">{part2}</span>
          </>
        ) : (
          <span className="text-brand">{displayName}</span>
        )}
      </p>
      <div className={cn(CHROME.clipPane, 'flex items-center justify-end pr-chrome-page-header-trailing')}>
        <IconButton
          {...actionButtonPreset('sidebarClose')}
          size="sm"
          shape="square"
          icon={
            <Icon
              name={onMobileClose ? ICONS.actions.close : ICONS.actions.doubleArrowLeft}
              className="size-4"
            />
          }
          onClick={handleToggle}
          title={onMobileClose ? 'Close sidebar' : 'Collapse sidebar'}
          className="text-text-tertiary hover:text-text-primary"
        />
      </div>
    </div>
  );
}
