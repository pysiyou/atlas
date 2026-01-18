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

import React, { useEffect, useState } from "react";

/**
 * Available icon names - add new icons here as SVG files are added
 */
export type IconName =
  | "logo"
  | "app-logo"
  | "alert-circle"
  | "check"
  | "x"
  | "check-circle"
  | "x-circle"
  | "info-circle"
  | "printer"
  | "package"
  | "user"
  | "calendar"
  | "search"
  | "plus"
  | "pen"
  | "edit"
  | "eye"
  | "file-text"
  | "arrow-left"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "chevron-up"
  | "more-vertical"
  | "arrow-up"
  | "arrow-down"
  | "shield"
  | "phone"
  | "mail"
  | "map-pin"
  | "dollar-sign"
  | "trending-up"
  | "credit-card"
  | "shopping-cart"
  | "clipboard-check"
  | "beaker"
  | "users"
  | "download"
  | "filter"
  | "log-in"
  | "log-out"
  | "chevrons-left"
  | "lab-tube"
  | "lab-cup"
  | "close"
  | "gender"
  | "map"
  | "medicine"
  | "health"
  | "users-group"
  | "pdf"
  | "download"
  | "document"
  | "verified"
  | "user-hands"
  | "cash"
  | "hourglass"
  | "minus-circle"
  | "wallet"
  | "checklist"
  | "pour"
  | "notebook"
  | "shield-check"
  | "sample-collection"
  | "loading"
  | "stethoscope"
  | "clock"
  | "hashtag"
  | "danger-square"
  | "bill"
  | "trash"
  | "folder-open"
  | "medical-kit"
  | "document-medicine"
  | "lock"
  ;

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
export const Icon: React.FC<IconProps> = ({
  name,
  className = "",
  fallback,
  size,
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    const loadIcon = async () => {
      try {
        const content = await loadSvg(name);
        setSvgContent(content);
      } catch (error) {
        console.error(`[Icon] Failed to load icon: ${name}`, error);

        if (fallback && fallback !== name) {
          try {
            const fallbackContent = await loadSvg(fallback);
            setSvgContent(fallbackContent);
          } catch (fallbackError) {
            console.error(`Failed to load fallback icon: ${fallback}`, fallbackError);
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
  const sizeClass = typeof size === 'number' 
    ? `w-${size} h-${size}` 
    : size || '';

  return (
    <span
      className={`inline-block ${sizeClass} ${className} [&>svg]:w-full [&>svg]:h-full [&>svg]:shrink-0`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      aria-hidden="true"
    />
  );
};
