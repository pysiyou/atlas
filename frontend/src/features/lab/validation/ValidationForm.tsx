/**
 * ValidationForm - Form for reviewing and approving/rejecting test results
 */

import React, { useMemo } from 'react';
import { Textarea } from '@/shared/ui';
import { semanticColors } from '@/shared/design-system/tokens/colors';

type ResultStatus =
  | 'normal'
  | 'high'
  | 'low'
  | 'critical'
  | 'critical-high'
  | 'critical-low';

const ABNORMAL_STATUSES: ResultStatus[] = [
  'high',
  'low',
  'critical',
  'critical-high',
  'critical-low',
];

/**
 * Build result key -> status from test.flags.
 * Backend stores "itemCode:status" (e.g. "K:critical-high", "Na:low").
 */
function statusMapFromFlags(
  flags: string[] | undefined
): Record<string, ResultStatus> {
  const map: Record<string, ResultStatus> = {};
  if (!flags?.length) return map;
  const valid = new Set(ABNORMAL_STATUSES);
  for (const f of flags) {
    const i = f.indexOf(':');
    if (i === -1) continue;
    const key = f.slice(0, i).trim();
    const status = f.slice(i + 1).trim().toLowerCase() as ResultStatus;
    if (key && valid.has(status)) map[key] = status;
  }
  return map;
}

/**
 * Parse a single result entry (value may be raw or { value, unit?, status? }).
 */
function parseResultEntry(
  key: string,
  raw: unknown,
  flagStatusMap: Record<string, ResultStatus>
): { resultValue: string; unit: string; status: ResultStatus } {
  const obj =
    typeof raw === 'object' && raw !== null && 'value' in (raw as object)
      ? (raw as { value: unknown; unit?: string; status?: string })
      : null;
  const resultValue = obj ? String(obj.value) : String(raw);
  const unit = obj?.unit ?? '';
  const statusFromResult = obj?.status as ResultStatus | undefined;
  const status = flagStatusMap[key] ?? statusFromResult ?? 'normal';
  return { resultValue, unit, status };
}

function isCritical(s: ResultStatus): boolean {
  return s === 'critical' || s === 'critical-high' || s === 'critical-low';
}

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

  return (
    <div className="bg-gray-50 rounded border border-gray-200 p-4">
      {/* Results Grid */}
      {hasResults && (
        <div className="mb-6">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,max-content))] gap-x-12 gap-y-1">
            {Object.entries(results).map(([key, rawValue]) => {
              // Parse the result entry to handle different formats
              const { resultValue, unit, status } = parseResultEntry(
                key,
                rawValue,
                flagStatusMap
              );
              const abnormal = status !== 'normal';
              const valueColor = abnormal
                ? isCritical(status)
                  ? semanticColors.danger.icon // text-red-600
                  : semanticColors.warning.valueHigh
                : neutralColors.text.primary; // text-gray-900
              
              return (
                <div
                  key={key}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 whitespace-nowrap"
                >
                  <span className="text-xs text-gray-500 text-left" title={key}>
                    {key}:
                  </span>
                  <span className={`text-sm font-medium text-left ${valueColor}`}>
                    {resultValue}
                    {unit && <span className="text-gray-500 font-normal ml-1">{unit}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flags and Notes */}
      {(hasFlags || technicianNotes) && (
        <div className="mb-6 space-y-2 bg-gray-50/50 rounded-md p-3 border border-gray-100">
          {hasFlags && (
            <div className="flex items-start text-xs text-red-600">
              <div className="font-medium">{flags.join(', ')}</div>
            </div>
          )}
          {technicianNotes && (
            <div className="flex items-start text-xs text-gray-500">
              <div className="italic">{technicianNotes}</div>
            </div>
          )}
        </div>
      )}

      {/* Validation Notes */}
      <div className="space-y-3 border-t border-gray-200 pt-4">
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
        <span className="text-xs text-gray-400 hidden sm:inline-block">Ctrl+Enter to approve</span>
      </div>
    </div>
  );
};
