/**
 * AttemptProgressBar - Visual indicator for remaining attempts
 * Shows progress bar with remaining attempt count
 */

import React from 'react';
import { cn } from '@/utils';

interface AttemptProgressBarProps {
  /** Current attempts used */
  used: number;
  /** Total attempts allowed */
  total: number;
  /** Label for the action */
  label: string;
  /** Color variant */
  variant?: 'sky' | 'red' | 'warning';
  className?: string;
}

const VARIANT_COLORS = {
  sky: {
    bar: 'bg-sky-500',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    text: 'text-sky-700 dark:text-sky-300',
  },
  red: {
    bar: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
  },
  warning: {
    bar: 'bg-warning-500',
    bg: 'bg-warning-100 dark:bg-warning-900/30',
    text: 'text-warning-700 dark:text-warning-300',
  },
};

/**
 * AttemptProgressBar component
 * Displays a progress bar showing used/remaining attempts
 */
export const AttemptProgressBar: React.FC<AttemptProgressBarProps> = ({
  used,
  total,
  label,
  variant = 'sky',
  className,
}) => {
  const remaining = Math.max(0, total - used);
  const percentage = total > 0 ? ((total - used) / total) * 100 : 0;
  const colors = VARIANT_COLORS[variant];

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xxs">
        <span className="font-normal text-text-secondary">{label}</span>
        <span className={cn('font-normal', colors.text)}>
          {remaining} {remaining === 1 ? 'left' : 'left'}
        </span>
      </div>
      <div className={cn('h-1.5 rounded-full overflow-hidden', colors.bg)}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', colors.bar)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
