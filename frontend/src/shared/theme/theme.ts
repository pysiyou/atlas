export type ThemeName = "studio-light";

const THEME_ATTRIBUTE = "data-theme";
const DEFAULT_THEME: ThemeName = "studio-light";
const STORAGE_KEY = "atlas-theme";

export function getActiveTheme(): ThemeName {
  return DEFAULT_THEME;
}

export function initializeTheme(): void {
  // Enforce the single theme
  document.documentElement.setAttribute(THEME_ATTRIBUTE, DEFAULT_THEME);
  localStorage.setItem(STORAGE_KEY, DEFAULT_THEME);
}

export function getRSuiteTheme(): "light" | "dark" {
  return "light";
}
