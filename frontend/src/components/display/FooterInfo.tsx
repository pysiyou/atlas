/**
 * FooterInfo - Icon-only footer marker for modals and popovers
 *
 * Uses the same module icons as the sidebar menu. Text is omitted for space;
 * an optional label is available for screen readers.
 */

import React from 'react';
import { Icon, type IconName } from '@/components/primitives/Icon';

interface FooterInfoProps {
  /** Icon name to display */
  icon: IconName;
  /** Screen-reader label (not shown visually) */
  label?: string;
  /** Icon size — md for modals, sm for popovers (default) */
  size?: 'sm' | 'md';
}

const ICON_SIZE_CLASSES = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
} as const;

export const FooterInfo: React.FC<FooterInfoProps> = ({ icon, label, size = 'sm' }) => (
  <div className="flex items-center shrink-0" aria-label={label} role={label ? 'img' : undefined}>
    <Icon name={icon} className={`${ICON_SIZE_CLASSES[size]} text-text-muted`} />
  </div>
);
