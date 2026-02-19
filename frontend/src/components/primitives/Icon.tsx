/**
 * Icon Component
 *
 * Loads and displays SVG icons dynamically from the public/icons directory.
 *
 * Security: SVG content is injected via dangerouslySetInnerHTML. Only app-controlled
 * paths (public/icons/*.svg) are loaded; never use user-supplied or remote URLs.
 *
 * Usage:
 *   <Icon name="check" className="w-4 h-4" />
 *   <Icon name="alert-circle" className="w-5 h-5 text-red-500" />
 *
 * NOTE: Use Tailwind className for sizing (e.g. "w-4 h-4"). Do NOT pass a number
 *       `size` prop — dynamic class names like `w-${n}` are purged by Tailwind.
 */

import React, { useEffect, useState } from 'react';
import { logger } from '@/utils/logger';

/**
 * Available icon names - add new icons here as SVG files are added to public/icons/
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
  | 'up-trend'
  | 'down-trend'
  | 'double-arrow-left'
  | 'double-arrow-right'
  | 'sun'
  | 'moon'
  | 'home'
  | 'settings'
  | 'bell'
  | 'user-cog'
  | 'menu';

export interface IconProps {
  /** Name of the icon to display (must match SVG filename without .svg extension) */
  name: IconName;
  /** Additional CSS classes to apply (use Tailwind for sizing: "w-4 h-4") */
  className?: string;
  /** Fallback icon name if primary icon fails to load */
  fallback?: IconName;
}

// ---------------------------------------------------------------------------
// Module-level SVG cache.
// Stores promises so concurrent requests for the same icon share one fetch.
// Without this, 30 <Icon> mounts = 30 parallel fetches for the same files.
// ---------------------------------------------------------------------------
const _svgCache = new Map<string, Promise<string>>();

function fetchSvg(name: string): Promise<string> {
  if (!_svgCache.has(name)) {
    const promise = fetch(`/icons/${name}.svg`).then(r => {
      if (!r.ok) throw new Error(`Failed to load SVG "${name}": ${r.statusText}`);
      return r.text();
    });
    _svgCache.set(name, promise);
  }
  return _svgCache.get(name)!;
}

async function loadIcon(name: string, fallback?: string): Promise<string | null> {
  try {
    return await fetchSvg(name);
  } catch (err) {
    logger.error(`Failed to load icon: ${name}`, err instanceof Error ? err : undefined);
    if (fallback && fallback !== name) {
      try {
        return await fetchSvg(fallback);
      } catch (fbErr) {
        logger.error(`Failed to load fallback icon: ${fallback}`, fbErr instanceof Error ? fbErr : undefined);
      }
    }
    return null;
  }
}

/**
 * Icon Component
 *
 * Renders SVG icons loaded from /icons/{name}.svg.
 * A module-level cache ensures each unique icon is fetched once regardless
 * of how many <Icon> instances are mounted on the page.
 *
 * A stable invisible placeholder is rendered while the SVG is loading
 * so the surrounding layout does not shift.
 */
export const Icon: React.FC<IconProps> = ({ name, className = '', fallback }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadIcon(name, fallback).then(content => {
      if (!cancelled) setSvgContent(content);
    });
    return () => { cancelled = true; };
  }, [name, fallback]);

  // Same classes applied whether loading or loaded — prevents layout shift.
  const spanClass = `inline-block ${className} [&>svg]:w-full [&>svg]:h-full [&>svg]:shrink-0`;

  if (!svgContent) {
    // Invisible placeholder preserves the space while the SVG loads.
    return <span className={spanClass} aria-hidden="true" />;
  }

  return (
    <span
      className={spanClass}
      // Security: only app-controlled /icons/*.svg paths are loaded here.
      dangerouslySetInnerHTML={{ __html: svgContent }}
      aria-hidden="true"
    />
  );
};
