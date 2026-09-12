/**
 * Technician notes and analytical flags below a result grid.
 */
import React from 'react';
import { Icon } from '@/components';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';

interface ResultContextNotesProps {
  flags?: string[];
  technicianNotes?: string;
  className?: string;
  /** Compact single-block layout for validation modals. */
  compact?: boolean;
}

export const ResultContextNotes: React.FC<ResultContextNotesProps> = ({
  flags,
  technicianNotes,
  className,
  compact = false,
}) => {
  const hasFlags = Boolean(flags?.length);
  const hasNotes = Boolean(technicianNotes?.trim());

  if (!hasFlags && !hasNotes) return null;

  if (compact) {
    return (
      <div className={cn('space-y-1 text-xs', className)}>
        {hasFlags && (
          <p className="text-danger-fg leading-snug">{flags!.join(', ')}</p>
        )}
        {hasNotes && (
          <p className="text-text-tertiary italic leading-snug">{technicianNotes}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-3', className)}>
      {hasFlags && (
        <div className="rounded-md border border-danger-stroke/40 bg-danger-bg/10 px-3 py-2.5">
          <p className="text-xxs font-medium uppercase tracking-wide text-danger-fg mb-1.5 flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
            Flags
          </p>
          <p className="text-sm text-danger-fg leading-snug">{flags!.join(' · ')}</p>
        </div>
      )}
      {hasNotes && (
        <div className="rounded-md border border-border-subtle bg-surface-page/60 px-3 py-2.5">
          <p className="text-xxs font-medium uppercase tracking-wide text-text-tertiary mb-1.5">
            Technician notes
          </p>
          <p className="text-sm text-text-secondary leading-snug whitespace-pre-wrap">
            {technicianNotes}
          </p>
        </div>
      )}
    </div>
  );
};
