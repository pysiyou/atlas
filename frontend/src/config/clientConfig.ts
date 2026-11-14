/**
 * Client Configuration
 * 
 * Loads white-label configuration from backend API.
 * Configuration is loaded once at app startup.
 */

export interface ClientConfig {
  company: {
    name: string;
    displayName: string;
    fullName?: string;
    subtitle?: string;
    tagline?: string;
    version?: string;
    copyright?: string;
    contact?: {
      address?: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        fullAddress?: string;
      };
      phone?: string[];
      email?: string;
      website?: string;
    };
  };
  branding: {
    logoPath: string;
    primaryColor: string;
    secondaryColor?: string;
    defaultTheme?: string;
    faviconPath?: string;
  };
  terminology?: Record<string, string>;
  features?: Record<string, boolean>;
  workflows?: Record<string, boolean>;
  reports?: {
    headerText?: string;
    footerText?: string;
    includeSignature?: boolean;
  };
  marketing?: {
    features?: string[];
    description?: string;
  };
}

let cachedConfig: ClientConfig | null = null;

/**
 * Load configuration from API
 * Uses relative /api/v1/config in dev (via Vite proxy) or API_CONFIG.baseURL in production
 */
export async function loadClientConfig(): Promise<ClientConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    // In development, use relative URL to leverage Vite proxy
    // In production, use the full baseURL from API_CONFIG
    const isDev = import.meta.env.DEV;
    const configUrl = isDev 
      ? '/api/v1/config' 
      : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/config`;
    
    console.log(`Loading config from: ${configUrl} (dev: ${isDev})`);
    
    const response = await fetch(configUrl);
    if (!response.ok) {
      console.error(`Failed to load config: ${response.status} ${response.statusText}`);
      throw new Error(`Config API returned ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Config API did not return JSON:', contentType);
      const text = await response.text();
      console.error('Response body:', text.substring(0, 200));
      throw new Error('Config API returned non-JSON response');
    }
    
    cachedConfig = await response.json();
    console.log('Successfully loaded client config:', cachedConfig?.company?.displayName);
    return cachedConfig!;
  } catch (error) {
    console.error('Failed to load client config:', error);
    console.warn('Using default configuration as fallback');
    
    // Return default config
    const defaultConfig: ClientConfig = {
      company: {
        name: 'Atlas Lab',
        displayName: 'Atlas Lab',
      },
      branding: {
        logoPath: '/icons/here.svg',
        primaryColor: '#0284c7',
      },
      terminology: {},
      features: {},
      workflows: {},
    };
    
    cachedConfig = defaultConfig;
    return defaultConfig;
  }
}

/**
 * Get cached config (must call loadClientConfig first)
 */
export function getClientConfig(): ClientConfig | null {
  return cachedConfig;
}

/**
 * Get terminology override or fallback to default
 * @param key - The terminology key (e.g., 'patient', 'patients', 'order')
 * @param fallback - Optional fallback if key not found
 * @returns The configured terminology or fallback
 * 
 * @example
 * t('patient', 'Patient') // Returns configured term or 'Patient'
 * t('patients') // Returns configured term or 'patients'
 */
export function t(key: string, fallback?: string): string {
  const config = getClientConfig();
  if (config?.terminology?.[key]) {
    return config.terminology[key];
  }
  return fallback || key;
}

/**
 * Get terminology with first letter capitalized
 * @param key - The terminology key
 * @param fallback - Optional fallback if key not found
 * @returns The configured terminology with first letter uppercase
 * 
 * @example
 * tCap('patient', 'patient') // Returns 'Patient' or 'Client' (capitalized)
 */
export function tCap(key: string, fallback?: string): string {
  const term = t(key, fallback);
  return term.charAt(0).toUpperCase() + term.slice(1);
}

/**
 * Get terminology in all uppercase
 * @param key - The terminology key
 * @param fallback - Optional fallback if key not found
 * @returns The configured terminology in uppercase
 * 
 * @example
 * tUpper('patient', 'patient') // Returns 'PATIENT' or 'CLIENT'
 */
export function tUpper(key: string, fallback?: string): string {
  return t(key, fallback).toUpperCase();
}

/**
 * Get terminology in all lowercase
 * @param key - The terminology key
 * @param fallback - Optional fallback if key not found
 * @returns The configured terminology in lowercase
 * 
 * @example
 * tLower('Patient', 'Patient') // Returns 'patient' or 'client'
 */
export function tLower(key: string, fallback?: string): string {
  return t(key, fallback).toLowerCase();
}

/**
 * Interpolate entity names in a string using configured terminology
 * Replaces {{key}} placeholders with configured terms
 * 
 * @param template - String with {{key}} placeholders
 * @param context - Optional additional context for replacements
 * @returns String with terminology applied
 * 
 * @example
 * interpolate('The {{patient}} has {{count}} {{orders}}', { count: '3' })
 * // Returns: 'The Client has 3 Requests' (if configured)
 */
export function interpolate(template: string, context: Record<string, string> = {}): string {
  const config = getClientConfig();
  let result = template;
  
  // Replace terminology placeholders
  const terminologyPattern = /\{\{(\w+)\}\}/g;
  result = result.replace(terminologyPattern, (match, key) => {
    // First check context
    if (context[key] !== undefined) {
      return context[key];
    }
    // Then check terminology config
    if (config?.terminology?.[key]) {
      return config.terminology[key];
    }
    // Return key without braces as fallback
    return key;
  });
  
  return result;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
  const config = getClientConfig();
  return config?.features?.[feature] !== false;
}

/**
 * Check if a workflow flag is enabled (defaults to false when unset).
 */
export function isWorkflowEnabled(workflow: string): boolean {
  const config = getClientConfig();
  return config?.workflows?.[workflow] === true;
}

/**
 * Helper to generate color shades from a base color
 */
function generateColorShades(hexColor: string): { base: string; hover: string; muted: string } {
  // Simple approximation: darken for hover, lighten for muted
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Hover: darken by 10%
  const hoverR = Math.max(0, Math.floor(r * 0.9));
  const hoverG = Math.max(0, Math.floor(g * 0.9));
  const hoverB = Math.max(0, Math.floor(b * 0.9));
  const hover = `#${hoverR.toString(16).padStart(2, '0')}${hoverG.toString(16).padStart(2, '0')}${hoverB.toString(16).padStart(2, '0')}`;
  
  // Muted: lighten by adding 30% towards white
  const mutedR = Math.min(255, Math.floor(r + (255 - r) * 0.3));
  const mutedG = Math.min(255, Math.floor(g + (255 - g) * 0.3));
  const mutedB = Math.min(255, Math.floor(b + (255 - b) * 0.3));
  const muted = `#${mutedR.toString(16).padStart(2, '0')}${mutedG.toString(16).padStart(2, '0')}${mutedB.toString(16).padStart(2, '0')}`;
  
  return { base: hexColor, hover, muted };
}

/**
 * Apply branding colors and metadata to the page
 */
export function applyBranding(config: ClientConfig) {
  const root = document.documentElement;
  
  // Apply primary brand color with shades
  if (config.branding.primaryColor) {
    const shades = generateColorShades(config.branding.primaryColor);
    root.style.setProperty('--brand', shades.base);
    root.style.setProperty('--brand-hover', shades.hover);
    root.style.setProperty('--brand-muted', shades.muted);
  }
  
  // Apply secondary color if provided
  if (config.branding.secondaryColor) {
    root.style.setProperty('--color-secondary', config.branding.secondaryColor);
  }
  
  // Update document title
  if (config.company.displayName) {
    document.title = config.company.displayName;
  }
  
  // Update favicon if custom path provided
  if (config.branding.faviconPath && config.branding.faviconPath !== config.branding.logoPath) {
    const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    if (favicon) {
      favicon.href = config.branding.faviconPath;
    } else {
      // Create favicon link if it doesn't exist
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = config.branding.faviconPath;
      document.head.appendChild(newFavicon);
    }
  }
}
