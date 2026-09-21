import { useSyncExternalStore } from 'react';

export type ThemeName = 'studio-light' | 'playful-light' | 'aurora-light' | 'github' | 'noir-studio';
export type ThemeMode = 'light' | 'dark';

/** Badge background behaviour: unified = same bg for all; tinted = per-variant bg/text from semantic tokens */
export type BadgeAppearance = 'unified' | 'tinted';

const THEME_ATTRIBUTE = 'data-theme';
const STORAGE_KEY = 'atlas-theme';
export const THEME_CHANGE_EVENT = 'atlas-theme-change';

const LIGHT_THEMES = new Set<ThemeName>(['studio-light', 'playful-light', 'aurora-light']);
const DARK_THEMES = new Set<ThemeName>(['github', 'noir-studio']);
const VALID_THEMES = new Set<ThemeName>([...LIGHT_THEMES, ...DARK_THEMES]);

const DEFAULT_LIGHT_THEME: ThemeName = 'studio-light';
const DEFAULT_DARK_THEME: ThemeName = 'noir-studio';
const DEFAULT_MODE: ThemeMode = 'dark';

const THEME_BADGE_APPEARANCE: Record<ThemeName, BadgeAppearance> = {
  'studio-light': 'tinted',
  'playful-light': 'tinted',
  'aurora-light': 'tinted',
  github: 'unified',
  'noir-studio': 'unified',
};

const isValidTheme = (value: string): value is ThemeName => VALID_THEMES.has(value as ThemeName);

function isLightTheme(theme: ThemeName): boolean {
  return LIGHT_THEMES.has(theme);
}

function pickTheme(value: string | undefined, fallback: ThemeName, allowed: Set<ThemeName>): ThemeName {
  if (value && isValidTheme(value) && allowed.has(value)) return value;
  return fallback;
}

/** Instance light/dark palettes from env (`VITE_THEME_LIGHT` / `VITE_THEME_DARK`). */
export function getThemePair(): { light: ThemeName; dark: ThemeName } {
  return {
    light: pickTheme(import.meta.env.VITE_THEME_LIGHT, DEFAULT_LIGHT_THEME, LIGHT_THEMES),
    dark: pickTheme(import.meta.env.VITE_THEME_DARK, DEFAULT_DARK_THEME, DARK_THEMES),
  };
}

export function themeNameToMode(theme: ThemeName): ThemeMode {
  return isLightTheme(theme) ? 'light' : 'dark';
}

function storedToMode(stored: string | null): ThemeMode {
  if (stored === 'light' || stored === 'dark') return stored;
  if (stored && isValidTheme(stored)) return themeNameToMode(stored);
  return DEFAULT_MODE;
}

function resolveTheme(mode: ThemeMode): ThemeName {
  return getThemePair()[mode];
}

export function getActiveMode(): ThemeMode {
  if (typeof document === 'undefined') return DEFAULT_MODE;
  const currentTheme = document.documentElement.getAttribute(THEME_ATTRIBUTE);
  if (currentTheme && isValidTheme(currentTheme)) return themeNameToMode(currentTheme);
  if (typeof localStorage === 'undefined') return DEFAULT_MODE;
  return storedToMode(localStorage.getItem(STORAGE_KEY));
}

export function getActiveTheme(): ThemeName {
  if (typeof document === 'undefined') return resolveTheme(DEFAULT_MODE);
  const currentTheme = document.documentElement.getAttribute(THEME_ATTRIBUTE);
  if (currentTheme && isValidTheme(currentTheme)) return currentTheme;
  return resolveTheme(getActiveMode());
}

const THEME_TRANSITION_CLASS = 'theme-transitioning';
const THEME_TRANSITION_MS = 420;

function applyTheme(theme: ThemeName, mode: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add(THEME_TRANSITION_CLASS);
  requestAnimationFrame(() => {
    root.setAttribute(THEME_ATTRIBUTE, theme);
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    setTimeout(() => root.classList.remove(THEME_TRANSITION_CLASS), THEME_TRANSITION_MS);
  });
}

/** Apply the instance palette for this mode (Light / Dark). */
export function setThemeMode(mode: ThemeMode): void {
  applyTheme(resolveTheme(mode), mode);
}

/** Coerces a palette name onto the instance pair (light names → configured light). */
export function setTheme(theme: ThemeName): void {
  const mode = isValidTheme(theme) ? themeNameToMode(theme) : DEFAULT_MODE;
  setThemeMode(mode);
}

export function initializeTheme(): void {
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  setThemeMode(storedToMode(stored));
}

export function getBadgeAppearance(): BadgeAppearance {
  const theme = getActiveTheme();
  return THEME_BADGE_APPEARANCE[theme] ?? 'unified';
}

function subscribeTheme(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }
  const handler = () => onStoreChange();
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

function getThemeServerSnapshot(): ThemeName {
  return resolveTheme(DEFAULT_MODE);
}

function getModeServerSnapshot(): ThemeMode {
  return DEFAULT_MODE;
}

/** Re-renders when setTheme() updates data-theme (badge appearance, etc.). */
export function useActiveTheme(): ThemeName {
  return useSyncExternalStore(subscribeTheme, getActiveTheme, getThemeServerSnapshot);
}

export function useActiveThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribeTheme, getActiveMode, getModeServerSnapshot);
}

export function useBadgeAppearance(): BadgeAppearance {
  const theme = useActiveTheme();
  return THEME_BADGE_APPEARANCE[theme] ?? 'unified';
}
