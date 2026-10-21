/**
 * Technician notes and analytical flags below a result grid.
 */
import React, { useMemo } from 'react';
import { Icon } from '@/components/primitives';
import { ICONS } from '@/config/icons';
import {text, FIELD_ERROR, RADIUS, TONE, FG } from '@/theme/recipes';
import { cn } from '@/utils';
import { useParameterLabelMap } from '@/features/catalog';
import {
  analyticalFlagDetail,
  analyticalFlagLabel,
  parseAnalyticalFlags,
} from '../utils/analyticalFlags';

interface ResultContextNotesProps {
  flags?: string[];
  testCode?: string;
  technicianNotes?: string;
  className?: string;
  /** Compact single-block layout for validation modals. */
  compact?: boolean;
}

function AnalyticalFlagsBlock({
  flags,
  testCode,
  compact,
}: {
  flags: string[];
  testCode?: string;
  compact?: boolean;
}) {
  const parameterLabels = useParameterLabelMap(testCode);
  const rows = useMemo(() => parseAnalyticalFlags(flags), [flags]);

  if (rows.length === 0) return null;

  const flagGrid = (
    <div
      className={cn(
        'grid gap-x-space-6 gap-y-space-2 min-w-0',
        compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
      )}
    >
      {rows.map((flag, index) => (
        <div
          key={`${flag.kind}-${flag.code}-${index}`}
          className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-x-space-2 items-baseline min-w-0"
        >
          <span className={`${text({ role: 'label' })} ${FG.labelMuted} truncate`}>
            {analyticalFlagLabel(flag, parameterLabels)}
          </span>
          <span className={`${text({ role: 'caption' })} ${TONE.warning.fg} leading-snug`}>
            {analyticalFlagDetail(flag)}
          </span>
        </div>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="pt-space-4 space-y-space-1-5">
        <p className={`${text({ role: 'caption' })} font-medium ${FG.captionMuted} uppercase tracking-wide`}>
          Analytical flags
        </p>
        {flagGrid}
      </div>
    );
  }

  return (
    <div className={cn(TONE.warning.well, RADIUS.surface, 'px-space-3 py-space-2-5')}>
      <p className={`${text({ role: 'section-title' })} text-warning-fg mb-space-1.5 flex items-center gap-space-1`}>
        <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
        Analytical flags
      </p>
      <div className={FIELD_ERROR}>{flagGrid}</div>
    </div>
  );
}

export const ResultContextNotes: React.FC<ResultContextNotesProps> = ({
  flags,
  testCode,
  technicianNotes,
  className,
  compact = false,
}) => {
  const hasFlags = Boolean(flags?.length);
  const hasNotes = Boolean(technicianNotes?.trim());

  if (!hasFlags && !hasNotes) return null;

  if (compact) {
    return (
      <div className={cn('space-y-space-2', className)}>
        {hasFlags && <AnalyticalFlagsBlock flags={flags!} testCode={testCode} compact />}
        {hasNotes && (
          <p className={`${text({ role: 'caption' })} ${FG.captionMuted} italic leading-snug`}>{technicianNotes}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-space-3', className)}>
      {hasFlags && <AnalyticalFlagsBlock flags={flags!} testCode={testCode} />}
      {hasNotes && (
        <div className={`${RADIUS.surface} border border-border-subtle bg-surface-page/60 px-space-3 py-space-2-5`}>
          <p className={`${text({ role: 'section-title' })} ${FG.captionMuted} mb-space-1.5`}>
            Technician notes
          </p>
          <p className={`${text({ role: 'label' })} leading-snug whitespace-pre-wrap`}>
            {technicianNotes}
          </p>
        </div>
      )}
    </div>
  );
};
