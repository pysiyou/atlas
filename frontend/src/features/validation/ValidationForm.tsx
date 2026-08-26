/**
 * ValidationForm - Form for reviewing and approving/rejecting test results
 */

import React, { useMemo } from 'react';
import { Textarea } from '@/components';
import { CriticalValueBanner } from './components/PanicValueAlert';
import { statusMapFromFlags, parseResultEntry, isCritical } from '@/features/lab/utils/lab-helpers';
import type { ResultStatus } from '@/types/enums';

interface ValidationFormProps {
  results: Record<string, unknown>;
  flags?: string[];
  technicianNotes?: string;
  comments: string;
  onCommentsChange: (comments: string) => void;
  onApprove: () => void;
  onReject: (reason: string, type: 're-test' | 're-collect') => void;
  testName?: string;
  testCode?: string;
  patientName?: string;
}

export const ValidationForm: React.FC<ValidationFormProps> = ({
  results,
  flags,
  technicianNotes,
  comments,
  onCommentsChange,
  onApprove,
  // Props available for future use when rejection UI is implemented

  onReject: _onReject,

  testName: _testName,

  testCode: _testCode,

  patientName: _patientName,
}) => {
  const hasResults = results && Object.keys(results).length > 0;
  const hasFlags = flags && flags.length > 0;

  // Build flag status map for result parsing
  const flagStatusMap = useMemo(() => statusMapFromFlags(flags), [flags]);

  // Detect critical values
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
    <div className="bg-surface-page rounded border border-border-default p-4 border">
      {/* Critical Value Banner */}
      {criticalValues.length > 0 && (
        <div className="mb-6">
          <CriticalValueBanner criticalParameters={criticalValues} />
        </div>
      )}

      {/* Results Grid */}
      {hasResults && (
        <div className="mb-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,max-content))] gap-x-12 gap-y-1">
            {Object.entries(results).map(([key, rawValue]) => {
              // Parse the result entry to handle different formats
              const { resultValue, unit, status } = parseResultEntry(key, rawValue, flagStatusMap);
              const abnormal = status !== 'normal';
              const valueColor = abnormal
                ? isCritical(status)
                  ? 'text-danger-fg'
                  : 'text-warning-fg'
                : 'text-text-primary';

              return (
                <div
                  key={key}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 whitespace-nowrap"
                >
                  <span className="text-xs text-text-tertiary text-left" title={key}>
                    {key}:
                  </span>
                  <span className={`text-sm font-normal text-left ${valueColor}`}>
                    {resultValue}
                    {unit && <span className="text-text-tertiary font-normal ml-1">{unit}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flags and Notes */}
      {(hasFlags || technicianNotes) && (
        <div className="mb-6 space-y-2 bg-surface-page/50 rounded-md p-3 border border-border-subtle">
          {hasFlags && (
            <div className="flex items-start text-xs text-danger-fg">
              <div className="font-normal">{flags.join(', ')}</div>
            </div>
          )}
          {technicianNotes && (
            <div className="flex items-start text-xs text-text-tertiary">
              <div className="italic">{technicianNotes}</div>
            </div>
          )}
        </div>
      )}

      {/* Validation Notes */}
      <div className="space-y-3 border-t border-border-default pt-4">
        <Textarea
          label="Validation Notes"
          value={comments}
          onChange={e => onCommentsChange(e.target.value)}
          onKeyDown={e => {
            if (e.ctrlKey && e.key === 'Enter') {
              e.preventDefault();
              onApprove();
            }
          }}
          placeholder="Add validation notes..."
          rows={2}
        />
        <span className="text-xs text-text-disabled hidden sm:inline-block">
          Ctrl+Enter to approve
        </span>
      </div>
    </div>
  );
};
