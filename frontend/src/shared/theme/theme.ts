export type ThemeName = "studio-light" | "github" | "noir-studio";

/** Badge background behaviour: unified = same bg for all; tinted = per-variant bg/text from semantic tokens */
export type BadgeAppearance = "unified" | "tinted";

const THEME_ATTRIBUTE = "data-theme";
const DEFAULT_THEME: ThemeName = "noir-studio";
const STORAGE_KEY = "atlas-theme";
const VALID_THEMES = new Set<ThemeName>(["studio-light", "github", "noir-studio"]);

const THEME_BADGE_APPEARANCE: Record<ThemeName, BadgeAppearance> = {
  "studio-light": "tinted",
  github: "unified",
  "noir-studio": "unified",
};

const isValidTheme = (value: string): value is ThemeName =>
  VALID_THEMES.has(value as ThemeName);

export function getActiveTheme(): ThemeName {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const currentTheme = document.documentElement.getAttribute(THEME_ATTRIBUTE);
  if (currentTheme && isValidTheme(currentTheme)) return currentTheme;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isValidTheme(stored) ? stored : DEFAULT_THEME;
}

export function setTheme(theme: ThemeName): void {
  if (!isValidTheme(theme)) {
    console.warn(
      `Only ${Array.from(VALID_THEMES).join(", ")} themes are supported. Using default.`
    );
    theme = DEFAULT_THEME;
  }
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initializeTheme(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isValidTheme(stored)) {
    setTheme(stored);
    return;
  }
  setTheme(DEFAULT_THEME);
}

export function getRSuiteTheme(): "light" | "dark" {
  const active = getActiveTheme();
  return active === "studio-light" ? "light" : "dark";
}

export function getBadgeAppearance(): BadgeAppearance {
  const theme = getActiveTheme();
  return THEME_BADGE_APPEARANCE[theme] ?? "unified";
}
