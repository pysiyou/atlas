/**
 * Technician notes and analytical flags below a result grid.
 */
import React from 'react';
import { Icon } from '@/components';
import { ICONS } from '@/config/icons';
import { TONE, TYPE, RADIUS } from '@/components/theme/recipes';
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
      <div className={cn('space-y-space-1 text-xs', className)}>
        {hasFlags && (
          <p className={`${TONE.danger.fg} leading-snug`}>{flags!.join(', ')}</p>
        )}
        {hasNotes && (
          <p className="text-text-tertiary italic leading-snug">{technicianNotes}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-space-3', className)}>
      {hasFlags && (
        <div className={cn(TONE.danger.well, RADIUS.surface, 'px-space-3 py-space-2-5')}>
          <p className={`${TYPE.sectionTitle} ${TONE.danger.fg} mb-space-1.5 flex items-center gap-space-1`}>
            <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
            Flags
          </p>
          <p className={`text-sm ${TONE.danger.fg} leading-snug`}>{flags!.join(' · ')}</p>
        </div>
      )}
      {hasNotes && (
        <div className={`${RADIUS.surface} border border-border-subtle bg-surface-page/60 px-space-3 py-space-2-5`}>
          <p className={`${TYPE.sectionTitle} text-text-tertiary mb-space-1.5`}>
            Technician notes
          </p>
          <p className={`${TYPE.label} leading-snug whitespace-pre-wrap`}>
            {technicianNotes}
          </p>
        </div>
      )}
    </div>
  );
};
