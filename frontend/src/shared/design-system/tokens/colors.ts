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
    background: 'bg-green-600',
    backgroundHover: 'hover:bg-green-700',
    backgroundActive: 'active:bg-green-800',
    text: 'text-white',
    textOnLight: 'text-green-800',
    
    // For badges, alerts, subtle backgrounds
    backgroundLight: 'bg-green-100',
    backgroundLightHover: 'hover:bg-green-200',
    textLight: 'text-green-800',
    border: 'border-green-200',
    borderLight: 'border-green-300',
    
    // For icons, accents
    icon: 'text-green-600',
    iconLight: 'text-green-500',
    
    // Focus states
    focusRing: 'focus:ring-green-500',
  },
  
  danger: {
    // For buttons, solid backgrounds
    background: 'bg-red-600',
    backgroundHover: 'hover:bg-red-700',
    backgroundActive: 'active:bg-red-800',
    text: 'text-white',
    textOnLight: 'text-red-800',
    
    // For badges, alerts, subtle backgrounds
    backgroundLight: 'bg-red-100',
    backgroundLightHover: 'hover:bg-red-200',
    textLight: 'text-red-800',
    border: 'border-red-200',
    borderLight: 'border-red-300',
    
    // For icons, accents
    icon: 'text-red-600',
    iconLight: 'text-red-500',
    
    // Error states (inputs, validation)
    inputBorder: 'border-red-500',
    errorText: 'text-red-600',
    requiredIndicator: 'text-red-500',
    
    // Focus states
    focusRing: 'focus:ring-red-500',
  },
  
  warning: {
    // For buttons, solid backgrounds
    background: 'bg-yellow-500',
    backgroundHover: 'hover:bg-yellow-600',
    backgroundActive: 'active:bg-yellow-700',
    text: 'text-white',
    textOnLight: 'text-yellow-800',
    
    // For badges, alerts, subtle backgrounds
    backgroundLight: 'bg-yellow-100',
    backgroundLightHover: 'hover:bg-yellow-200',
    textLight: 'text-yellow-800',
    border: 'border-yellow-200',
    borderLight: 'border-yellow-300',
    
    // For icons, accents, high/low values
    icon: 'text-yellow-600',
    iconLight: 'text-yellow-500',
    valueHigh: 'text-yellow-600', // Replaces amber-600 and orange-600
    valueLow: 'text-yellow-600',   // Replaces amber-600 and orange-600
    
    // Focus states
    focusRing: 'focus:ring-yellow-500',
  },
  
  info: {
    // For buttons, solid backgrounds
    background: 'bg-sky-600',
    backgroundHover: 'hover:bg-sky-700',
    backgroundActive: 'active:bg-sky-800',
    text: 'text-white',
    textOnLight: 'text-sky-800',
    
    // For badges, alerts, subtle backgrounds
    backgroundLight: 'bg-sky-100',
    backgroundLightHover: 'hover:bg-sky-200',
    textLight: 'text-sky-800',
    border: 'border-sky-200',
    borderLight: 'border-sky-300',
    
    // For icons, accents
    icon: 'text-sky-600',
    iconLight: 'text-sky-500',
    
    // Focus states
    focusRing: 'focus:ring-sky-500',
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
    background: 'bg-gray-100',
    text: 'text-gray-400',
    border: 'border-gray-300',
    cursor: 'cursor-not-allowed',
  },
  
  selected: {
    background: 'bg-sky-50',
    text: 'text-sky-900',
    border: 'border-sky-500',
  },
} as const;

/**
 * Brand Colors - Primary brand palette
 */
export const brandColors = {
  primary: {
    background: 'bg-sky-600',
    backgroundHover: 'hover:bg-sky-700',
    backgroundActive: 'active:bg-sky-800',
    text: 'text-white',
    textOnLight: 'text-sky-800',
    backgroundLight: 'bg-sky-100',
    textLight: 'text-sky-800',
    border: 'border-sky-200',
    icon: 'text-sky-600',
    focusRing: 'focus:ring-sky-500',
  },
  
  secondary: {
    background: 'bg-gray-200',
    backgroundHover: 'hover:bg-gray-300',
    backgroundActive: 'active:bg-gray-400',
    text: 'text-gray-900',
    textOnLight: 'text-gray-700',
    backgroundLight: 'bg-gray-100',
    textLight: 'text-gray-700',
    border: 'border-gray-300',
    icon: 'text-gray-600',
    focusRing: 'focus:ring-gray-500',
  },
} as const;

/**
 * Neutral Colors - Grayscale palette
 */
export const neutralColors = {
  white: 'bg-white text-gray-900',
  gray: {
    50: 'bg-gray-50 text-gray-900',
    100: 'bg-gray-100 text-gray-900',
    200: 'bg-gray-200 text-gray-900',
    300: 'bg-gray-300 text-gray-900',
  },
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-700',
    tertiary: 'text-gray-600',
    muted: 'text-gray-500',
    disabled: 'text-gray-400',
  },
  border: {
    default: 'border-gray-200',
    medium: 'border-gray-300',
    strong: 'border-gray-400',
  },
} as const;

/**
 * Auth Theme Colors - For authentication pages
 * Replaces hardcoded hex colors in LoginFormCard and LoginBrandingPanel
 */
export const authColors = {
  background: 'bg-[#1a1f2e]',
  backgroundSecondary: 'bg-[#232938]',
  accent: 'bg-[#3d5a66]',
  accentHover: 'hover:bg-[#4a6b7a]',
  text: {
    primary: 'text-[#e8eaed]',
    secondary: 'text-[#b8bcc4]',
    muted: 'text-[#8a8f9a]',
  },
  border: {
    default: 'border-[#2d3548]',
    light: 'border-[#3a4455]',
  },
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
