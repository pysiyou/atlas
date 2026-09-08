export type ThemeName = 'studio-light' | 'github' | 'noir-studio';

/** Badge background behaviour: unified = same bg for all; tinted = per-variant bg/text from semantic tokens */
export type BadgeAppearance = 'unified' | 'tinted';

const THEME_ATTRIBUTE = 'data-theme';
const DEFAULT_THEME: ThemeName = 'noir-studio';
const STORAGE_KEY = 'atlas-theme';
const VALID_THEMES = new Set<ThemeName>(['studio-light', 'github', 'noir-studio']);

const THEME_BADGE_APPEARANCE: Record<ThemeName, BadgeAppearance> = {
  'studio-light': 'tinted',
  github: 'unified',
  'noir-studio': 'unified',
};

/** Known test category slugs with theme tokens (see theme.css --category-*). */
const CATEGORY_COLOR_SLUGS = new Set([
  'hematology',
  'biochemistry',
  'chemistry',
  'microbiology',
  'serology',
  'urinalysis',
  'imaging',
  'immunology',
  'molecular',
  'toxicology',
  'coagulation',
]);

const CATEGORY_FALLBACK_BAR_CLASSES = [
  'bg-chart-brand',
  'bg-chart-accent',
  'bg-chart-success',
  'bg-chart-accent-muted',
] as const;

/** Tailwind bg class for a test category segment (theme token: bg-category-*). */
export function getCategoryBarColorClass(category: string, index = 0): string {
  const slug = category.toLowerCase();
  if (CATEGORY_COLOR_SLUGS.has(slug)) {
    return `bg-category-${slug}`;
  }
  return CATEGORY_FALLBACK_BAR_CLASSES[index % CATEGORY_FALLBACK_BAR_CLASSES.length];
}

const isValidTheme = (value: string): value is ThemeName => VALID_THEMES.has(value as ThemeName);

export function getActiveTheme(): ThemeName {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  const currentTheme = document.documentElement.getAttribute(THEME_ATTRIBUTE);
  if (currentTheme && isValidTheme(currentTheme)) return currentTheme;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && isValidTheme(stored) ? stored : DEFAULT_THEME;
}

const THEME_TRANSITION_CLASS = 'theme-transitioning';
const THEME_TRANSITION_MS = 420;

export function setTheme(theme: ThemeName): void {
  if (!isValidTheme(theme)) {
    console.warn(
      `Only ${Array.from(VALID_THEMES).join(', ')} themes are supported. Using default.`
    );
    theme = DEFAULT_THEME;
  }
  const root = document.documentElement;
  root.classList.add(THEME_TRANSITION_CLASS);
  requestAnimationFrame(() => {
    root.setAttribute(THEME_ATTRIBUTE, theme);
    localStorage.setItem(STORAGE_KEY, theme);
    setTimeout(() => root.classList.remove(THEME_TRANSITION_CLASS), THEME_TRANSITION_MS);
  });
}

export function initializeTheme(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isValidTheme(stored)) {
    setTheme(stored);
    return;
  }
  setTheme(DEFAULT_THEME);
}

export function getBadgeAppearance(): BadgeAppearance {
  const theme = getActiveTheme();
  return THEME_BADGE_APPEARANCE[theme] ?? 'unified';
}
