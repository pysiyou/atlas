/**
 * ValidationForm - Form for reviewing and approving test results
 */

import React, { useMemo } from 'react';
import { Textarea } from '@/components';
import { CriticalValueBanner } from './PanicValueAlert';
import { statusMapFromFlags, parseResultEntry, isCritical } from '../utils/labHelpers';
import { ResultsParameterGrid } from '../components/ResultsParameterGrid';
import { ResultContextNotes } from '../components/ResultContextNotes';
import { RESULT_PANEL } from '../components/resultDisplayStyles';

interface ValidationFormProps {
  results: Record<string, unknown>;
  flags?: string[];
  technicianNotes?: string;
  comments: string;
  onCommentsChange: (comments: string) => void;
  onApprove: () => void;
  /** When false, Ctrl+Enter shortcut is disabled (e.g. escalation review modal). */
  enableApproveShortcut?: boolean;
  readOnly?: boolean;
}

export const ValidationForm: React.FC<ValidationFormProps> = ({
  results,
  flags,
  technicianNotes,
  comments,
  onCommentsChange,
  onApprove,
  enableApproveShortcut = true,
  readOnly = false,
}) => {
  const hasResults = results && Object.keys(results).length > 0;
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);

  const criticalValues = useMemo(() => {
    if (!hasResults) return [];

    return Object.entries(results)
      .map(([key, rawValue]) => {
        const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
        if (!isCritical(status)) return null;

        return {
          name: key,
          value: resultValue,
          unit,
        };
      })
      .filter((cv): cv is NonNullable<typeof cv> => cv !== null);
  }, [results, flagStatusMap, hasResults]);

  return (
    <div className="space-y-3">
      {criticalValues.length > 0 && (
        <CriticalValueBanner criticalParameters={criticalValues} className="py-2" />
      )}

      {hasResults && (
        <ResultsParameterGrid results={results} flags={flags} variant="inline" />
      )}

      <ResultContextNotes flags={flags} technicianNotes={technicianNotes} compact />

      {!readOnly && (
        <div className="pt-3 border-t border-border-subtle space-y-2">
          <Textarea
            label="Validation notes"
            value={comments}
            onChange={e => onCommentsChange(e.target.value)}
            onKeyDown={e => {
              if (enableApproveShortcut && e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                onApprove();
              }
            }}
            placeholder="Document review findings or approval rationale…"
            rows={2}
          />
          {enableApproveShortcut && (
            <p className="text-xxs text-text-disabled">Ctrl+Enter to approve</p>
          )}
        </div>
      )}

      {readOnly && comments && (
        <div className="pt-3 border-t border-border-subtle space-y-1">
          <p className={RESULT_PANEL.notesLabel}>Validation notes</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap leading-snug">{comments}</p>
        </div>
      )}
    </div>
  );
};
