import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components';
import { getActiveTheme, setTheme } from '@/components/theme';
import type { ThemeName } from '@/components/theme';
import type { IconName } from '@/components/primitives/Icon';

const THEMES: ThemeName[] = ['studio-light', 'noir-studio', 'github'];

const THEME_CONFIG: Record<ThemeName, { icon: IconName; label: string }> = {
  'studio-light': { icon: 'sun', label: 'Light' },
  'noir-studio': { icon: 'moon', label: 'Dark' },
  'github': { icon: 'settings', label: 'GitHub' },
};

export interface ThemeSwitchProps {
  isCollapsed: boolean;
}

export function ThemeSwitch({ isCollapsed }: ThemeSwitchProps) {
  const [effective, setEffective] = useState<ThemeName>(() => getActiveTheme());
  useEffect(() => {
    const sync = () => setEffective(getActiveTheme());
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  
  const cycleTheme = useCallback(() => {
    const currentIndex = THEMES.indexOf(effective);
    const next = THEMES[(currentIndex + 1) % THEMES.length];
    setTheme(next);
    setEffective(next);
  }, [effective]);
  const currentConfig = THEME_CONFIG[effective];

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center py-3 border-t border-border-default">
        <button
          type="button"
          onClick={cycleTheme}
          className="flex items-center justify-center size-8 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-hover/80 transition-colors"
          title={`Theme: ${currentConfig.label} (click to cycle)`}
          aria-label={`Current theme: ${currentConfig.label}. Click to cycle themes.`}
        >
          <span className="flex items-center justify-center size-4 shrink-0">
            <Icon name={currentConfig.icon} className="size-4" />
          </span>
        </button>
      </div>
    );
  }
  
  return (
    <div className="border-t border-border-default px-4 py-4 flex flex-col gap-2">
      <div className="text-xxs text-text-tertiary text-center font-medium">Theme</div>
      <div className="flex gap-1">
        {THEMES.map((theme) => {
          const config = THEME_CONFIG[theme];
          const isActive = effective === theme;
          return (
            <button
              key={theme}
              type="button"
              onClick={() => {
                setTheme(theme);
                setEffective(theme);
              }}
              className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand text-on-brand'
                  : 'bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-selected'
              }`}
              aria-pressed={isActive}
              aria-label={`${config.label} theme`}
            >
              <Icon name={config.icon} className="size-4" />
              <span className="text-xxs font-medium">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
