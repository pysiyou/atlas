import { Icon } from '@/components';
import { useActiveThemeMode, setThemeMode } from '@/components/theme';
import type { ThemeMode } from '@/components/theme';
import type { IconName } from '@/components/primitives/Icon';
import { CHROME, CONTROL, RADIUS } from '@/components/theme/recipes';
import { cn } from '@/utils';

const MODES: ThemeMode[] = ['light', 'dark'];

const MODE_CONFIG: Record<ThemeMode, { icon: IconName; label: string }> = {
  light: { icon: 'sun', label: 'Light' },
  dark: { icon: 'moon', label: 'Dark' },
};

function nextMode(current: ThemeMode): ThemeMode {
  return current === 'light' ? 'dark' : 'light';
}

export interface ThemeSwitchProps {
  isCollapsed?: boolean;
}

export function ThemeSwitch({ isCollapsed = false }: ThemeSwitchProps) {
  const effective = useActiveThemeMode();

  const handleModeClick = (mode: ThemeMode) => {
    if (isCollapsed) {
      setThemeMode(nextMode(effective));
      return;
    }
    setThemeMode(mode);
  };

  return (
    <div className="flex flex-col">
      <p className={CHROME.sectionTitle}>Theme</p>
      <div
        className={cn(
          'chrome-theme-well mx-space-2 flex min-h-control items-center gap-space-1 overflow-hidden bg-surface-hover p-space-1',
          RADIUS.control,
        )}
        role="group"
        aria-label="Theme"
      >
        {MODES.map(mode => {
          const config = MODE_CONFIG[mode];
          const isActive = effective === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeClick(mode)}
              title={isCollapsed ? `Theme: ${config.label}. Click to switch.` : config.label}
              aria-pressed={isActive}
              aria-label={`${config.label} theme`}
              className={cn(
                'relative flex min-w-0 flex-1 items-center justify-center gap-space-1-5 px-space-1-5 py-space-1-5 leading-none text-xs font-normal transition-all duration-200 cursor-pointer',
                RADIUS.control,
                isActive
                  ? `bg-surface text-brand ${CONTROL.segmentActive}`
                  : 'text-text-tertiary hover:bg-surface-hover hover:text-text-primary',
              )}
            >
              <Icon
                name={config.icon}
                className={cn(
                  'flex size-3.5 shrink-0 items-center justify-center leading-none',
                  isActive ? 'text-brand' : 'text-text-disabled',
                )}
              />
              <span className="chrome-clip text-xxs font-medium leading-none">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
