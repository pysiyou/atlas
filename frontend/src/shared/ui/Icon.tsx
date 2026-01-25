/**
 * Icon Component
 *
 * Loads and displays SVG icons dynamically from the public/icons directory.
 * Follows the same pattern as cargoplan software for consistency.
 *
 * Usage:
 *   <Icon name="check" className="w-4 h-4" />
 *   <Icon name="alert-circle" className="w-5 h-5 text-red-500" />
 */

import React, { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';

/**
 * Available icon names - add new icons here as SVG files are added
 */
export type IconName =
  | 'app-logo'
  | 'alert-circle'
  | 'check'
  | 'check-circle'
  | 'info-circle'
  | 'printer'
  | 'user'
  | 'calendar'
  | 'search'
  | 'plus'
  | 'pen'
  | 'edit'
  | 'eye'
  | 'file-text'
  | 'arrow-left'
  | 'arrow-right'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'chevron-up'
  | 'arrow-up'
  | 'arrow-down'
  | 'shield'
  | 'phone'
  | 'mail'
  | 'map-pin'
  | 'dollar-sign'
  | 'trending-up'
  | 'credit-card'
  | 'download'
  | 'filter'
  | 'log-out'
  | 'lab-tube'
  | 'lab-cup'
  | 'close'
  | 'map'
  | 'medicine'
  | 'health'
  | 'users-group'
  | 'pdf'
  | 'document'
  | 'verified'
  | 'user-hands'
  | 'cash'
  | 'hourglass'
  | 'wallet'
  | 'checklist'
  | 'notebook'
  | 'shield-check'
  | 'sample-collection'
  | 'loading'
  | 'stethoscope'
  | 'clock'
  | 'hashtag'
  | 'danger-square'
  | 'bill'
  | 'trash'
  | 'medical-kit'
  | 'document-medicine'
  | 'lock'
  | 'smartphone'
  | 'dna-landing-page'
  | 'atom-landing-page'
  | 'beaker-landing-page'
  | 'bond-molecule-landing-page'
  | 'drops-droplet-landing-page'
  | 'microscope-landing-page'
  | 'flask-chemical-landing-page'
  | 'flask-education-landing-page'
  | 'medicines-medicine-landing-page'
  | 'syringe-landing-page'
  | 'test-tube-landing-page'
  | 'thermometer-landing-page'
  | 'vial-landing-page'
  | 'flask'
  | 'dashboard'
  | 'warning'
  | 'cross'
  | 'menu-dots'
  | 'save'
  | 'close-circle'
  | 'book'
  | 'category'
  | 'ruler'
  | 'weight'
  | 'city'
  | 'link'
  | 'thermometer'
  | 'heart-pulse'
  | 'pulse'
  | 'blood'

interface IconProps {
  /** Name of the icon to display (must match SVG filename without .svg extension) */
  name: IconName;
  /** Additional CSS classes to apply */
  className?: string;
  /** Fallback icon name if primary icon fails to load */
  fallback?: IconName;
  /** Size prop for convenience (maps to Tailwind size classes) */
  size?: number | string;
}

/**
 * Load SVG content from public icons directory
 */
const loadSvg = async (name: string): Promise<string> => {
  const response = await fetch(`/icons/${name}.svg`);
  if (!response.ok) {
    throw new Error(`Failed to load SVG: ${response.statusText}`);
  }
  return await response.text();
};

/**
 * Icon Component
 *
 * Dynamically loads SVG icons and renders them inline.
 * Icons are loaded from /icons/{name}.svg
 */
export const Icon: React.FC<IconProps> = ({ name, className = '', fallback, size }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        const content = await loadSvg(name);
        setSvgContent(content);
      } catch (error) {
        logger.error(`Failed to load icon: ${name}`, error instanceof Error ? error : undefined);

        if (fallback && fallback !== name) {
          try {
            const fallbackContent = await loadSvg(fallback);
            setSvgContent(fallbackContent);
          } catch (fallbackError) {
            logger.error(
              `Failed to load fallback icon: ${fallback}`,
              fallbackError instanceof Error ? fallbackError : undefined
            );
            setSvgContent(null);
          }
        } else {
          setSvgContent(null);
        }
      }
    };

    loadIcon();
  }, [name, fallback]);

  if (!svgContent) {
    return null;
  }

  // Handle size prop - convert to Tailwind classes if number provided
  const sizeClass = typeof size === 'number' ? `w-${size} h-${size}` : size || '';

  return (
    <span
      className={`inline-block ${sizeClass} ${className} [&>svg]:w-full [&>svg]:h-full [&>svg]:shrink-0`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      aria-hidden="true"
    />
  );
};
