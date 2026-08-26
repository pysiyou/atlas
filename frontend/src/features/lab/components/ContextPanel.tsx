/**
 * ContextPanel - Displays historical context from previous workflow stages
 * Surfaces relevant information like collection notes, entry notes, and rejection history
 */

import React, { useState } from 'react';
import { Icon } from '@/components';
import { ICONS, cn } from '@/utils';
import { formatDate } from '@/utils';

export interface ContextItem {
  /** Label for this context item */
  label: string;
  /** Content to display */
  content: string;
  /** Optional metadata (e.g., timestamp, user) */
  metadata?: string;
  /** Icon to show next to label */
  icon?: string;
}

interface ContextPanelProps {
  /** Title for the context panel */
  title?: string;
  /** Context items to display */
  items: ContextItem[];
  /** Whether panel starts collapsed */
  defaultCollapsed?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Variant for styling */
  variant?: 'info' | 'warning';
}

/**
 * ContextPanel component
 * Shows collapsible panel with historical context information
 */
export const ContextPanel: React.FC<ContextPanelProps> = ({
  title = 'Context',
  items,
  defaultCollapsed = false,
  className,
  variant = 'info',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (items.length === 0) {
    return null;
  }

  const variantStyles = {
    info: {
      bg: 'bg-info-bg/50',
      border: 'border-info-stroke',
      icon: 'text-info-fg',
      text: 'text-info-fg',
    },
    warning: {
      bg: 'bg-warning-bg/50',
      border: 'border-warning-stroke',
      icon: 'text-warning-fg',
      text: 'text-warning-fg',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={cn('rounded-lg border', styles.border, styles.bg, className)}>
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon 
            name={ICONS.ui.info} 
            className={cn('w-4 h-4', styles.icon)} 
          />
          <span className={cn('text-xs font-normal', styles.text)}>
            {title}
          </span>
          <span className="text-xxs text-text-disabled">
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
        </div>
        <Icon
          name={isCollapsed ? ICONS.ui.chevronDown : ICONS.ui.chevronUp}
          className={cn('w-4 h-4 text-text-tertiary transition-transform')}
        />
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="px-3 pb-3 space-y-2">
          {items.map((item, index) => (
            <div key={index} className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                {item.icon && (
                  <Icon name={item.icon} className="w-3 h-3 text-text-tertiary" />
                )}
                <span className="text-xxs font-normal text-text-secondary">
                  {item.label}
                </span>
              </div>
              <p className="text-xs text-text-primary leading-tight pl-4">
                {item.content}
              </p>
              {item.metadata && (
                <p className="text-xxs text-text-disabled pl-4">
                  {item.metadata}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Helper to create context items from collection data
 */
export function buildCollectionContext(opts: {
  qualityNotes?: string;
  collectedBy?: string;
  collectedAt?: string;
  collectionNotes?: string;
}): ContextItem[] {
  const items: ContextItem[] = [];

  if (opts.qualityNotes) {
    items.push({
      label: 'Sample Quality Notes',
      content: opts.qualityNotes,
      metadata: opts.collectedBy && opts.collectedAt 
        ? `${opts.collectedBy} • ${formatDate(opts.collectedAt)}`
        : undefined,
      icon: ICONS.dataFields.flask,
    });
  }

  if (opts.collectionNotes && !opts.qualityNotes) {
    items.push({
      label: 'Collection Notes',
      content: opts.collectionNotes,
      metadata: opts.collectedBy && opts.collectedAt
        ? `${opts.collectedBy} • ${formatDate(opts.collectedAt)}`
        : undefined,
      icon: ICONS.dataFields.flask,
    });
  }

  return items;
}

/**
 * Helper to create context items from entry/validation data
 */
export function buildValidationContext(opts: {
  technicianNotes?: string;
  enteredBy?: string;
  enteredAt?: string;
  rejectionHistory?: Array<{ rejectionReason?: string; reason?: string; rejectedAt: string; rejectedBy: string }>;
}): ContextItem[] {
  const items: ContextItem[] = [];

  if (opts.technicianNotes) {
    items.push({
      label: 'Technician Entry Notes',
      content: opts.technicianNotes,
      metadata: opts.enteredBy && opts.enteredAt
        ? `${opts.enteredBy} • ${formatDate(opts.enteredAt)}`
        : undefined,
      icon: ICONS.dataFields.notebook,
    });
  }

  if (opts.rejectionHistory && opts.rejectionHistory.length > 0) {
    const lastRejection = opts.rejectionHistory[opts.rejectionHistory.length - 1];
    const reason = lastRejection.rejectionReason || lastRejection.reason || 'No reason provided';
    items.push({
      label: `Previous Rejection (Attempt ${opts.rejectionHistory.length})`,
      content: reason,
      metadata: `${lastRejection.rejectedBy} • ${formatDate(lastRejection.rejectedAt)}`,
      icon: ICONS.actions.alertCircle,
    });
  }

  return items;
}
