/**
 * Icon Component
 *
 * Loads and displays SVG icons dynamically from the public/icons directory.
 *
 * Security: SVG content is injected via dangerouslySetInnerHTML. Only app-controlled
 * paths (public/icons/*.svg) are loaded; never use user-supplied or remote URLs.
 *
 * Usage:
 *   <Icon iconKey={IconKeys.actions.check} className="w-4 h-4" />
 *
 * NOTE: Use Tailwind className for sizing (e.g. "w-4 h-4"). Do NOT pass a number
 *       `size` prop — dynamic class names like `w-${n}` are purged by Tailwind.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { resolveIconKey, type IconKey } from '@/config/icons';
import { logger } from '@/utils/logger';

export interface IconProps {
  /** Semantic icon key from @/config/icons. */
  iconKey: IconKey;
  /** Additional CSS classes to apply (use Tailwind for sizing: "w-4 h-4") */
  className?: string;
  /** Fallback key if primary icon fails to load */
  fallbackIconKey?: IconKey;
}

// ---------------------------------------------------------------------------
// Module-level SVG cache.
// Stores promises so concurrent requests for the same icon share one fetch.
// Without this, 30 <Icon> mounts = 30 parallel fetches for the same files.
// ---------------------------------------------------------------------------
const _svgCache = new Map<string, Promise<string>>();

function fetchSvg(asset: string): Promise<string> {
  if (!_svgCache.has(asset)) {
    const promise = fetch(`/icons/${asset}.svg`).then(r => {
      if (!r.ok) throw new Error(`Failed to load SVG "${asset}": ${r.statusText}`);
      return r.text();
    });
    _svgCache.set(asset, promise);
  }
  return _svgCache.get(asset)!;
}

async function loadSvgAsset(asset: string, fallbackAsset?: string): Promise<string | null> {
  try {
    return await fetchSvg(asset);
  } catch (err) {
    logger.error(`Failed to load icon: ${asset}`, err instanceof Error ? err : undefined);
    if (fallbackAsset && fallbackAsset !== asset) {
      try {
        return await fetchSvg(fallbackAsset);
      } catch (fbErr) {
        logger.error(
          `Failed to load fallback icon: ${fallbackAsset}`,
          fbErr instanceof Error ? fbErr : undefined
        );
      }
    }
    return null;
  }
}

/**
 * Icon Component
 *
 * Renders SVG icons loaded from /icons/{asset}.svg.
 * A module-level cache ensures each unique icon is fetched once regardless
 * of how many <Icon> instances are mounted on the page.
 *
 * A stable invisible placeholder is rendered while the SVG is loading
 * so the surrounding layout does not shift.
 */
export const Icon: React.FC<IconProps> = ({
  iconKey,
  className = '',
  fallbackIconKey,
}) => {
  const asset = useMemo(() => resolveIconKey(iconKey), [iconKey]);
  const fallbackAsset = useMemo(
    () => (fallbackIconKey ? resolveIconKey(fallbackIconKey) : undefined),
    [fallbackIconKey]
  );
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSvgAsset(asset, fallbackAsset).then(content => {
      if (!cancelled) setSvgContent(content);
    });
    return () => {
      cancelled = true;
    };
  }, [asset, fallbackAsset]);

  // Same classes applied whether loading or loaded — prevents layout shift.
  const spanClass = `inline-block text-current ${className} [&>svg]:w-full [&>svg]:h-full [&>svg]:shrink-0`;

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
