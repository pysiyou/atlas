/**
 * ThemeSwitch Component
 * Pill-shaped toggle between studio-light and noir-studio with sliding thumb and icons.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@/shared/ui';
import { getActiveTheme, setTheme } from '@/shared/theme';
import type { ThemeName } from '@/shared/theme';

const LIGHT_THEME: ThemeName = 'studio-light';
const DARK_THEME: ThemeName = 'noir-studio';

/** Maps any theme to the two we support for the switch (light vs dark). */
function toSwitchTheme(theme: ThemeName): ThemeName {
  return theme === LIGHT_THEME ? LIGHT_THEME : DARK_THEME;
}

interface ThemeSwitchProps {
  isCollapsed: boolean;
}

export const ThemeSwitch: React.FC<ThemeSwitchProps> = ({ isCollapsed }) => {
  const [effective, setEffective] = useState<ThemeName>(() => toSwitchTheme(getActiveTheme()));

  useEffect(() => {
    const sync = () => setEffective(toSwitchTheme(getActiveTheme()));
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const isLight = effective === LIGHT_THEME;

  const toggle = useCallback(() => {
    const next = isLight ? DARK_THEME : LIGHT_THEME;
    setTheme(next);
    setEffective(next);
  }, [isLight]);

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center py-3 border-t border-border-default">
        <button
          type="button"
          onClick={toggle}
          className="p-2 rounded-lg bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-hover/80 transition-colors"
          title={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
          aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
        >
          {isLight ? <Icon name="sun" className="w-4 h-4" /> : <Icon name="moon" className="w-4 h-4" />}
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
          <span className="flex-1 flex items-center justify-center text-text-secondary/70 [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
            <Icon name="sun" className="w-4 h-4" />
          </span>
          <span className="flex-1 flex items-center justify-center text-text-secondary/70 [&>svg]:w-3.5 [&>svg]:h-3.5" aria-hidden>
            <Icon name="moon" className="w-4 h-4" />
          </span>
        </div>
        <motion.span
          className="absolute top-0.5 bottom-0.5 w-11 rounded-full bg-text-primary flex items-center justify-center shadow-sm ring-1 ring-black/5 text-surface [&>svg]:w-3 [&>svg]:h-3"
          initial={false}
          animate={{ left: isLight ? '4px' : 'calc(100% - 4px - 2.75rem)' }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 28,
          }}
          aria-hidden
        >
          {isLight ? <Icon name="sun" className="w-4 h-4" /> : <Icon name="moon" className="w-4 h-4" />}
        </motion.span>
      </button>
    </div>
  );
};
