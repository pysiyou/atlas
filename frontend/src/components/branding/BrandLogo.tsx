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

import React from 'react';
import { useClientConfig } from '@/config/ClientConfigContext';
import { Icon } from '@/components/primitives/Icon';
import { parseIconKey, type IconKey } from '@/config/icons';

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
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', alt }) => {
  const { config, status } = useClientConfig();
  
  // While loading, show a placeholder
  if (status === 'loading' || !config) {
    return (
      <div className={`bg-neutral-200 animate-pulse rounded ${className}`} />
    );
  }
  
  const logoPath = config.branding.logoPath;
  const logoAlt = alt || config.company.displayName;
  
  // Check if logoPath matches icon registry format (starts with /icons/)
  if (logoPath.startsWith('/icons/')) {
    try {
      // Extract the icon name from path (e.g., /icons/here.svg -> here)
      const iconName = logoPath.replace('/icons/', '').replace('.svg', '');
      
      // Try to parse as IconKey
      const iconKey = parseIconKey(iconName) as IconKey;
      
      if (iconKey) {
        return <Icon iconKey={iconKey} className={className} />;
      }
    } catch (error) {
      // If parsing fails, fall through to img tag
      console.warn('Failed to parse logo path as IconKey, using img tag:', error);
    }
  }
  
  // Fallback to img tag for external paths or non-registry icons
  return (
    <img 
      src={logoPath} 
      alt={logoAlt} 
      className={className}
    />
  );
};
