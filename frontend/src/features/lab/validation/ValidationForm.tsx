/**
 * ValidationForm - Form for reviewing and approving/rejecting test results
 */

import React from 'react';
import { Badge, Textarea } from '@/shared/ui';
import type { TestResult } from '@/types';

interface ValidationFormProps {
  results: Record<string, TestResult>;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onReject: _onReject,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  testName: _testName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  testCode: _testCode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  patientName: _patientName,
}) => {
  const hasResults = results && Object.keys(results).length > 0;
  const hasFlags = flags && flags.length > 0;

  return (
    <div className="bg-gray-50 rounded border border-gray-200 p-4">
      {/* Results Grid */}
      {hasResults && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            {Object.entries(results).map(([key, result]) => (
              <div key={key} className="flex items-center justify-between py-2">
                <span className="text-xs font-medium text-gray-600">{key}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${
                    result.status === 'high' || result.status === 'low' ? 'text-amber-600' :
                    result.status === 'critical' ? 'text-red-600 font-bold' : 'text-gray-900'
                  }`}>
                    {result.value}{' '}
                    <span className="text-xs text-gray-400 font-sans ml-0.5">{result.unit}</span>
                  </span>
                  {result.status !== 'normal' && (
                    <Badge
                      size="sm"
                      variant={result.status === 'critical' ? 'danger' : 'warning'}
                      className="border-none font-medium"
                    >
                      {result.status.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flags and Notes */}
      {(hasFlags || technicianNotes) && (
        <div className="mb-6 space-y-2 bg-gray-50/50 rounded-md p-3 border border-gray-100">
          {hasFlags && (
            <div className="flex items-start gap-2 text-xs text-red-600">
              <span>⚠️</span>
              <div className="font-medium">{flags.join(', ')}</div>
            </div>
          )}
          {technicianNotes && (
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <span>📝</span>
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
          onChange={(e) => onCommentsChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.ctrlKey && e.key === 'Enter') {
              e.preventDefault();
              onApprove();
            }
          }}
          placeholder="Add validation notes..."
          rows={2}
        />
        <span className="text-xs text-gray-400 hidden sm:inline-block">
          Ctrl+Enter to approve
        </span>
      </div>
    </div>
  );
};
