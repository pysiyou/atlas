/**
 * Technician notes and analytical flags below a result grid.
 */
import React, { useMemo } from 'react';
import { Icon } from '@/components/primitives';
import { ICONS } from '@/config/icons';
import { FIELD_ERROR, RADIUS, TONE, TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';
import { useParameterLabelMap } from '@/features/catalog';
import {
  analyticalFlagDetail,
  analyticalFlagLabel,
  parseAnalyticalFlags,
} from '../utils/analyticalFlags';

const FLAG_TABLE_CELL = 'py-space-1 pr-space-4 align-top text-left last:pr-0';

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

  const table = (
    <div className="overflow-x-auto min-w-0">
      <table className="w-full min-w-[20rem] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[40%]" />
          <col className="w-[60%]" />
        </colgroup>
        <tbody>
          {rows.map((flag, index) => (
            <tr key={`${flag.kind}-${flag.code}-${index}`}>
              <td className={`${TYPE.label} text-text-secondary ${FLAG_TABLE_CELL}`}>
                {analyticalFlagLabel(flag, parameterLabels)}
              </td>
              <td className={`${TYPE.caption} ${TONE.warning.fg} leading-snug ${FLAG_TABLE_CELL}`}>
                {analyticalFlagDetail(flag)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (compact) {
    return (
      <div className="pt-space-2 space-y-space-2">
        <p className={`${TYPE.caption} font-medium text-text-tertiary uppercase tracking-wide`}>
          Analytical flags
        </p>
        {table}
      </div>
    );
  }

  return (
    <div className={cn(TONE.warning.well, RADIUS.surface, 'px-space-3 py-space-2-5')}>
      <p className={`${TYPE.sectionTitle} text-warning-fg mb-space-1.5 flex items-center gap-space-1`}>
        <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
        Analytical flags
      </p>
      <div className={FIELD_ERROR}>{table}</div>
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
          <p className={`${TYPE.caption} text-text-tertiary italic leading-snug`}>{technicianNotes}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-space-3', className)}>
      {hasFlags && <AnalyticalFlagsBlock flags={flags!} testCode={testCode} />}
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
