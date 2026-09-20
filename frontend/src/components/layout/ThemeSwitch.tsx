import { Icon } from '@/components';
import { useActiveTheme, setTheme } from '@/components/theme';
import type { ThemeName } from '@/components/theme';
import type { IconName } from '@/components/primitives/Icon';
import { CHROME, CONTROL, RADIUS } from '@/components/theme/recipes';
import { cn } from '@/utils';

const THEMES: ThemeName[] = ['studio-light', 'playful-light', 'noir-studio', 'github'];

const THEME_CONFIG: Record<ThemeName, { icon: IconName; label: string }> = {
  'studio-light': { icon: 'sun', label: 'Studio' },
  'playful-light': { icon: 'category', label: 'Playful' },
  'noir-studio': { icon: 'moon', label: 'Dark' },
  github: { icon: 'settings', label: 'GitHub' },
};

function nextTheme(current: ThemeName): ThemeName {
  const index = THEMES.indexOf(current);
  return THEMES[(index + 1) % THEMES.length] ?? THEMES[0];
}

export interface ThemeSwitchProps {
  isCollapsed?: boolean;
}

export function ThemeSwitch({ isCollapsed = false }: ThemeSwitchProps) {
  const effective = useActiveTheme();

  const handleThemeClick = (theme: ThemeName) => {
    if (isCollapsed) {
      setTheme(nextTheme(effective));
      return;
    }
    setTheme(theme);
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
        {THEMES.map(theme => {
          const config = THEME_CONFIG[theme];
          const isActive = effective === theme;
          return (
            <button
              key={theme}
              type="button"
              onClick={() => handleThemeClick(theme)}
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
