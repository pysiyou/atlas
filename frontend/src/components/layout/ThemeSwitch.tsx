import { Icon } from '@/components';
import { useActiveTheme, setTheme } from '@/components/theme';
import type { ThemeName } from '@/components/theme';
import type { IconName } from '@/components/primitives/Icon';
import { CHROME, RADIUS } from '@/components/theme/recipes';
import { cn } from '@/utils';

const THEMES: ThemeName[] = ['studio-light', 'noir-studio', 'github'];

const THEME_CONFIG: Record<ThemeName, { icon: IconName; label: string }> = {
  'studio-light': { icon: 'sun', label: 'Light' },
  'noir-studio': { icon: 'moon', label: 'Dark' },
  github: { icon: 'settings', label: 'GitHub' },
};

export function ThemeSwitch() {
  const effective = useActiveTheme();

  return (
    <div className="flex flex-col">
      <p className={CHROME.sectionTitle}>Theme</p>
      <div
        className={cn(
          'chrome-theme-well mx-2 flex items-center gap-1 bg-surface-hover p-1',
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
              onClick={() => setTheme(theme)}
              title={config.label}
              aria-pressed={isActive}
              aria-label={`${config.label} theme`}
              className={cn(
                'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 px-1.5 py-1.5 leading-none text-xs font-normal transition-all duration-200 cursor-pointer',
                RADIUS.control,
                isActive
                  ? 'bg-surface text-brand shadow-sm ring-1 ring-black/5'
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
