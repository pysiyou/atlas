/**
 * FooterInfo - Reusable footer info component for modals and popovers
 *
 * Provides consistent styling for footer information with icon and text.
 * Used in all modals and popovers to display contextual information.
 */

import React from 'react';
import { Icon, type IconName } from './Icon';

interface FooterInfoProps {
  /** Icon name to display */
  icon: IconName;
  /** Text to display (can be string or ReactNode for custom styling) */
  text: string | React.ReactNode;
}

/**
 * FooterInfo component with exact styling from PaymentPopover
 *
 * Style matches:
 * - Container: text-xs text-text-tertiary flex items-center gap-1.5
 * - Icon: w-3.5 h-3.5
 * - Text: span (inherits text-text-tertiary from parent)
 */
export const FooterInfo: React.FC<FooterInfoProps> = ({ icon, text }) => (
  <div className="text-xs text-text-tertiary flex items-center gap-1.5">
    <Icon name={icon} className="w-3.5 h-3.5 text-text-muted" />
    {typeof text === 'string' ? <span>{text}</span> : text}
  </div>
);
