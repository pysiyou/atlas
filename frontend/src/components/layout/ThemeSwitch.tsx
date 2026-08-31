import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/components';
import { getActiveTheme, setTheme } from '@/components/theme';
import type { ThemeName } from '@/components/theme';

const LIGHT_THEME: ThemeName = 'studio-light';
const DARK_THEME: ThemeName = 'noir-studio';

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
  const isLight = effective === LIGHT_THEME;
  const toggle = useCallback(() => {
    const next = isLight ? DARK_THEME : LIGHT_THEME;
    setTheme(next);
    setEffective(next);
  }, [isLight]);
  const themeIcon = (name: 'sun' | 'moon') => (
    <span className="flex items-center justify-center size-3.5 shrink-0">
      <Icon name={name} className="size-3.5" />
    </span>
  );

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center py-3 border-t border-border-default">
        <button
          type="button"
          onClick={toggle}
          className="flex items-center justify-center size-8 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-hover/80 transition-colors"
          title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
          aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          <span className="flex items-center justify-center size-4 shrink-0">
            {isLight ? <Icon name="sun" className="size-4" /> : <Icon name="moon" className="size-4" />}
          </span>
        </button>
      </div>
    );
  }
  return (
    <div className="border-t border-border-default px-4 py-4 flex justify-center">
      <button
        type="button"
        onClick={toggle}
        className="relative w-24 h-8 rounded-full bg-border-default/60 border border-border-default/80 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface shadow-inner"
        aria-pressed={!isLight}
        aria-label={isLight ? 'Dark mode' : 'Light mode'}
      >
        <div className="absolute inset-0 flex">
          <span className="flex-1 flex items-center justify-center text-text-secondary/70" aria-hidden>
            {themeIcon('sun')}
          </span>
          <span className="flex-1 flex items-center justify-center text-text-secondary/70" aria-hidden>
            {themeIcon('moon')}
          </span>
        </div>
        <motion.span
          className="absolute top-0.5 bottom-0.5 w-11 rounded-full bg-text-primary flex items-center justify-center shadow-sm ring-1 ring-black/5 text-surface"
          initial={false}
          animate={{ left: isLight ? '2px' : 'calc(100% - 2px - 2.75rem)' }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          aria-hidden
        >
          {isLight ? themeIcon('sun') : themeIcon('moon')}
        </motion.span>
      </button>
    </div>
  );
}
