/**
 * BrandLogo Component
 * 
 * Displays the company logo from client configuration.
 * Automatically handles:
 * - Icon registry paths (e.g., /icons/here.svg) -> uses Icon component
 * - External image paths -> uses <img> tag
 * 
 * Usage:
 *   <BrandLogo className="h-8 w-8" />
 */

import { useClientConfig } from '@/app/clientConfigContext';
import { Icon } from '@/components/primitives/Icon';
import { parseIconKey, type IconKey } from '@/icons';

function logoPathToIconKey(logoPath: string): IconKey | null {
  if (!logoPath.startsWith('/icons/')) return null;
  const iconName = logoPath.replace('/icons/', '').replace('.svg', '');
  try {
    return parseIconKey(iconName) as IconKey;
  } catch {
    return null;
  }
}

export interface BrandLogoProps {
  /** Additional CSS classes for sizing and styling */
  className?: string;
  /** Alt text for the logo (defaults to company display name) */
  alt?: string;
}

/**
 * BrandLogo renders the configured company logo
 * Uses Icon component for icon registry paths, img tag for external images
 */
export function BrandLogo({ className = '', alt }: BrandLogoProps) {
  const { config, status } = useClientConfig();
  
  // While loading, show a placeholder
  if (status === 'loading' || !config) {
    return (
      <div className={`bg-neutral-200 animate-pulse rounded ${className}`} />
    );
  }
  
  const logoPath = config.branding.logoPath;
  const logoAlt = alt || config.company.displayName;
  
  const iconKey = logoPathToIconKey(logoPath);
  if (iconKey) {
    return <Icon iconKey={iconKey} className={className} />;
  }
  
  // Fallback to img tag for external paths or non-registry icons
  return (
    <img 
      src={logoPath} 
      alt={logoAlt} 
      className={className}
    />
  );
}
