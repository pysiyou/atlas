import React from 'react';
import { EMPTY } from '@/components/theme/recipes';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { cn } from '@/utils';

/**
 * Unified empty UI for tables, panels, sections, and feeds.
 * Copy: see EMPTY_COPY / emptySubtitle in emptyStateCopy.ts and @/utils/constants.
 */
interface EmptyStateProps {
  /** When omitted, only title and description are shown */
  icon?: IconName;
  /** Primary heading (optional when iconOnly) */
  title?: string;
  /** Secondary line under the title */
  description?: string;
  /** Icon only — no visible title or description; use title for aria-label when provided */
  iconOnly?: boolean;
  action?: React.ReactNode;
  className?: string;
  /** default = section/page; compact = tables; dense = lab dashboard panels */
  variant?: 'default' | 'compact' | 'dense';
  /** Grow to fill parent flex/grid area and center content */
  fill?: boolean;
}

type EmptyStateVariant = NonNullable<EmptyStateProps['variant']>;

function emptyStateVariantStyles(variant: EmptyStateVariant) {
  switch (variant) {
    case 'dense':
      return {
        container: EMPTY.containerDense,
        iconWrap: EMPTY.iconWrapDense,
        icon: 'w-4 h-4 text-text-disabled',
        title: EMPTY.titleDense,
        description: EMPTY.descriptionDense,
      };
    case 'compact':
      return {
        container: EMPTY.containerCompact,
        iconWrap: EMPTY.iconWrapCompact,
        icon: 'w-5 h-5 text-text-disabled',
        title: EMPTY.titleCompact,
        description: EMPTY.description,
      };
    default:
      return {
        container: EMPTY.containerDefault,
        iconWrap: EMPTY.iconWrapDefault,
        icon: 'w-8 h-8 text-text-disabled',
        title: EMPTY.titleDefault,
        description: EMPTY.description,
      };
  }
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
  variant = 'default',
  fill = false,
  iconOnly = false,
}) => {
  const styles = emptyStateVariantStyles(variant);
  const ariaLabel =
    iconOnly && title ? (description ? `${title}. ${description}` : title) : undefined;

  return (
    <div
      className={cn(styles.container, fill && 'h-full w-full flex-1 min-h-0', className)}
      role={iconOnly ? 'status' : undefined}
      aria-label={ariaLabel}
    >
      {icon != null && (
        <div className={styles.iconWrap}>
          <Icon name={icon} className={styles.icon} aria-hidden={iconOnly ? true : undefined} />
        </div>
      )}
      {!iconOnly && title != null && title !== '' && <p className={styles.title}>{title}</p>}
      {!iconOnly && description != null && description !== '' && (
        <p className={styles.description}>{description}</p>
      )}
      {action && <div className={EMPTY.actionWrap}>{action}</div>}
    </div>
  );
};
