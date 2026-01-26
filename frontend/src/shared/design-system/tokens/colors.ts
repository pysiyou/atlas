/**
 * Color Design Tokens
 * 
 * Comprehensive color system ensuring semantic consistency across all components.
 * Same semantic meaning = Same color everywhere.
 */

/**
 * Semantic Colors - MUST be consistent across all components
 * Used by: Button, IconButton, Badge, Alert, Input errors, etc.
 */
export const semanticColors = {
  success: {
    // For buttons, solid backgrounds
    background: 'bg-success',
    backgroundMedium: 'bg-green-500', // Kept for specificity if needed, else could map to bg-success
    backgroundHover: 'hover:opacity-90',
    backgroundActive: 'active:opacity-100',
    text: 'text-text-inverse',
    textOnLight: 'text-green-800', // Could map to text-success if contrast allows
    
    // For badges, alerts, subtle backgrounds
    backgroundLight: 'bg-green-100',
    backgroundLightHover: 'hover:bg-green-200',
    textLight: 'text-green-800',
    border: 'border-green-200', // semantic border colors not fully mapped in CSS yet, using closest or creating new
    borderLight: 'border-green-300',
    
    // For icons, accents
    icon: 'text-success',
    iconLight: 'text-green-500',
    
    // Focus states
    focusRing: 'focus:ring-success',
  },
  
  danger: {
    // For buttons, solid backgrounds
    background: 'bg-danger',
    backgroundHover: 'hover:opacity-90',
    backgroundActive: 'active:opacity-100',
    text: 'text-text-inverse',
    textOnLight: 'text-red-800',
    
    // For badges, alerts, subtle backgrounds
    backgroundLight: 'bg-red-100',
    backgroundLightHover: 'hover:bg-red-200',
    textLight: 'text-red-800',
    textLightMedium: 'text-red-700',
    textLightDarker: 'text-red-900',
    border: 'border-red-200',
    borderLight: 'border-red-300',
    
    // For icons, accents
    icon: 'text-danger',
    iconLight: 'text-red-500',
    iconLighter: 'text-red-400',
    backgroundMedium: 'bg-red-500',
    
    // Error states (inputs, validation)
    inputBorder: 'border-danger',
    errorText: 'text-danger',
    requiredIndicator: 'text-danger',
    
    // Focus states
    focusRing: 'focus:ring-danger',
  },
  
  warning: {
    // For buttons, solid backgrounds
    background: 'bg-warning',
    backgroundHover: 'hover:opacity-90',
    backgroundActive: 'active:opacity-100',
    text: 'text-text-inverse',
    textOnLight: 'text-yellow-800',
    
    // For badges, alerts, subtle backgrounds
    backgroundLight: 'bg-yellow-100',
    backgroundLightHover: 'hover:bg-yellow-200',
    textLight: 'text-yellow-800',
    border: 'border-yellow-200',
    borderLight: 'border-yellow-300',
    
    // For icons, accents, high/low values
    icon: 'text-warning',
    iconLight: 'text-yellow-500',
    iconLighter: 'text-yellow-400',
    valueHigh: 'text-warning', 
    valueLow: 'text-warning',
    
    // Focus states
    focusRing: 'focus:ring-warning',
  },
  
  info: {
    // For buttons, solid backgrounds
    background: 'bg-info',
    backgroundHover: 'hover:opacity-90',
    backgroundActive: 'active:opacity-100',
    text: 'text-text-inverse',
    textOnLight: 'text-brand-text',
    
    // For badges, alerts, subtle backgrounds
    backgroundLight: 'bg-brand-light',
    backgroundLightHover: 'hover:bg-sky-200',
    textLight: 'text-brand-text',
    border: 'border-brand-light',
    borderLight: 'border-brand-light',
    
    // For icons, accents
    icon: 'text-info',
    iconLight: 'text-brand',
    
    // Focus states
    focusRing: 'focus:ring-info',
  },
} as const;

/**
 * State Colors - For specific UI states
 */
export const stateColors = {
  rejection: {
    // Border indicator for cards with rejection history
    borderLeft: 'border-l-4 border-l-yellow-400',
    // Badge for retest/recollection
    badge: 'bg-yellow-100 text-yellow-800',
  },
  
  disabled: {
    background: 'bg-neutral-100',
    text: 'text-text-disabled',
    border: 'border-neutral-300',
    cursor: 'cursor-not-allowed',
  },
  
  selected: {
    background: 'bg-brand-light/50', // Using opacity with brand-light
    text: 'text-brand',
    border: 'border-brand',
  },
} as const;

/**
 * Brand Colors - Primary brand palette
 */
export const brandColors = {
  primary: {
    background: 'bg-brand',
    backgroundMedium: 'bg-brand', // Mapping to main brand for now
    backgroundLight: 'bg-accent', // Sky-400 maps to accent
    backgroundHover: 'hover:opacity-90',
    backgroundActive: 'active:opacity-100',
    text: 'text-text-inverse',
    textOnLight: 'text-brand',
    backgroundLightBg: 'bg-brand-light',
    textLight: 'text-brand', // Sky-800 -> text-brand? Or text-primary? Kept branded
    textLightMedium: 'text-brand', 
    border: 'border-brand-light',
    borderMedium: 'border-brand',
    borderLight: 'border-accent',
    borderLighter: 'border-brand-light',
    icon: 'text-brand',
    iconLight: 'text-accent',
    focusRing: 'focus:ring-brand',
    focusRingLight: 'focus:ring-accent',
    ring20: 'ring-brand/20',
    ring30: 'ring-brand/30',
  },
  
  secondary: {
    background: 'bg-neutral-200',
    backgroundHover: 'hover:bg-neutral-300',
    backgroundActive: 'active:bg-neutral-400',
    text: 'text-text-primary',
    textOnLight: 'text-text-secondary',
    backgroundLight: 'bg-neutral-100',
    textLight: 'text-text-secondary',
    border: 'border-neutral-300',
    icon: 'text-text-tertiary',
    focusRing: 'focus:ring-neutral-500',
  },
} as const;

/**
 * Branding Colors - For specific brand elements (e.g., affiliation plans)
 * These are intentional brand colors that differ from semantic colors
 */
export const brandingColors = {
  affiliation: {
    // Orange branding for affiliation plans - Keeping hardcoded as specific branding
    background: 'bg-orange-500',
    backgroundHover: 'hover:bg-orange-600',
    backgroundLight: 'bg-orange-50',
    backgroundLightOpacity: 'bg-orange-50/50',
    border: 'border-orange-500',
    borderLight: 'border-orange-400',
    text: 'text-white',
    icon: 'text-orange-500',
    focusRing: 'focus:ring-orange-500',
  },
} as const;

/**
 * Neutral Colors - Grayscale palette
 */
export const neutralColors = {
  white: 'bg-surface text-text-primary',
  gray: {
    50: 'bg-neutral-50 text-text-primary',
    100: 'bg-neutral-100 text-text-primary',
    200: 'bg-neutral-200 text-text-primary',
    300: 'bg-neutral-300 text-text-primary',
  },
  text: {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    tertiary: 'text-text-tertiary',
    muted: 'text-text-muted',
    disabled: 'text-text-disabled',
  },
  border: {
    default: 'border-border', // gray-200
    medium: 'border-border-strong', // gray-300 -> strong or medium?
    strong: 'border-neutral-400',
  },
} as const;

/**
 * Auth Theme Colors - For authentication pages
 * Replaces all hardcoded hex colors in auth components
 * Covers: LoginForm, LoginFormCard, LoginBrandingPanel, LoginBackground
 */
export const authColors = {
  // Background colors
  background: 'bg-auth-bg',
  backgroundSecondary: 'bg-auth-bg-secondary',
  backgroundTertiary: 'bg-auth-bg-tertiary',
  backgroundHover: 'hover:bg-auth-bg-hover',
  
  // Accent colors
  accent: 'bg-auth-accent',
  accentHover: 'hover:bg-auth-accent-hover',
  accentMedium: 'bg-auth-accent-medium',
  accentLight: 'bg-auth-accent-light',
  accentBlur: 'bg-auth-accent-medium', // For blur effects
  
  // Text colors
  text: {
    primary: 'text-auth-text-primary',
    secondary: 'text-auth-text-secondary',
    tertiary: 'text-auth-text-secondary', // Using secondary/muted map
    muted: 'text-auth-text-muted',
    light: 'text-auth-text-light',
    dark: 'text-auth-text-muted', // Fallback
    placeholder: 'placeholder-auth-text-muted',
    tagline: 'text-auth-text-muted',
  },
  
  // Border colors
  border: {
    default: 'border-auth-border',
    light: 'border-auth-border-light',
    hover: 'hover:border-auth-border-hover',
    focus: 'focus:border-auth-border-focus',
    accent: 'border-auth-accent',
    accentLight: 'border-auth-accent-medium',
    accentHover: 'border-auth-accent-hover',
  },
  
  // Error state colors (for login errors)
  error: {
    background: 'bg-[#3d2a2e]',
    backgroundLight: 'bg-[#4a3035]',
    border: 'border-[#5a3a40]',
    text: 'text-[#d4989d]',
    icon: 'text-[#c9787e]',
  },
  
  // Feature card colors
  featureCard: {
    background: 'bg-[#232938]',
    backgroundHover: 'hover:bg-[#283040]',
    border: 'border-[#2d3548]',
    borderHover: 'hover:border-[#3d4760]',
    iconBackground: 'bg-[#2d4550]',
    iconBackgroundHover: 'hover:bg-[#3a5663]',
    iconBorder: 'border-[#3d5a66]',
  },
  
  // User badge colors
  userBadge: {
    background: 'bg-[#3a4556]',
    border: 'border-2 border-[#1a1f2e]',
    icon: 'text-[#8892a6]',
  },
  
  // Focus ring colors
  focusRing: 'focus:ring-[#4a6670]/50',
  focusRingOffset: 'focus:ring-offset-[#232938]',
} as const;

/**
 * Helper function to get semantic color classes
 */
export const getSemanticColor = (
  semantic: keyof typeof semanticColors,
  variant: 'background' | 'backgroundLight' | 'text' | 'textLight' | 'border' | 'icon' | 'focusRing'
): string => {
  return semanticColors[semantic][variant];
};

/**
 * Helper function to get state color classes
 */
export const getStateColor = (
  state: keyof typeof stateColors,
  variant: string
): string => {
  return (stateColors[state] as Record<string, string>)[variant] || '';
};
