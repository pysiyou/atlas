/**
 * Report preview test results table section.
 */

import React from 'react';
import { cn } from '@/utils';
import type { ReportData } from '../types';

interface ReportPreviewResultsProps {
  reportData: ReportData;
}

export const ReportPreviewResults: React.FC<ReportPreviewResultsProps> = ({ reportData }) => (
  <div className="p-6 space-y-4">
    {reportData.testResults.map((test, index) => (
      <div key={index} className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-bold text-text-primary">
            {test.testName} ({test.testCode})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-page border-b border-border-strong">
                <th className="px-6 py-3 text-left font-normal text-text-tertiary uppercase tracking-wider">
                  Investigation
                </th>
                <th className="px-6 py-3 text-left font-normal text-text-tertiary uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left font-normal text-text-tertiary uppercase tracking-wider">
                  Reference Value
                </th>
                <th className="px-6 py-3 text-right font-normal text-text-tertiary uppercase tracking-wider">
                  Unit
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-subtle hover:bg-surface-page transition-colors">
                <td className="px-6 py-3 text-text-primary">Primary Sample Type :</td>
                <td className="px-6 py-3 text-left text-text-primary">
                  {reportData.order.tests[0]?.sampleType?.toUpperCase() || 'N/A'}
                </td>
                <td className="px-6 py-3 text-left text-text-secondary"></td>
                <td className="px-6 py-3 text-right text-text-secondary"></td>
              </tr>

              {test.parameters.map((param, paramIndex) => {
                const isSectionHeader =
                  param.name === param.name.toUpperCase() &&
                  param.name.length > 3 &&
                  !param.name.includes(':');
                const isAbnormal = param.status && param.status.toLowerCase() !== 'normal';

                return (
                  <tr
                    key={paramIndex}
                    className={cn(
                      'border-b border-border-subtle last:border-0 hover:bg-surface-page transition-colors',
                      isSectionHeader && 'bg-surface-page/50'
                    )}
                  >
                    <td
                      className={cn('px-6 py-3 text-text-primary', isSectionHeader && 'font-normal')}
                    >
                      {isSectionHeader ? (
                        param.name
                      ) : (
                        <div className="min-w-0">
                          <div className="font-normal text-text-primary truncate">{param.name}</div>
                          {param.code && (
                            <div className="text-xs font-normal truncate">{param.code}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td
                      className={cn(
                        'px-6 py-3 text-left',
                        isAbnormal ? 'text-danger-fg font-normal' : 'text-text-primary'
                      )}
                    >
                      {param.value}
                    </td>
                    <td className="px-6 py-3 text-left text-text-secondary">
                      {param.referenceRange || ''}
                    </td>
                    <td className="px-6 py-3 text-right text-text-secondary">{param.unit || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-2 text-xs text-text-primary mt-4">
          {test.technicianNotes && <p>Instruments: {test.technicianNotes}</p>}
          {test.validationNotes && <p>Interpretation: {test.validationNotes}</p>}
          <p>Thanks for Reference</p>
          <p className="text-center font-normal mt-4">****End of Report****</p>
        </div>
      </div>
    ))}
  </div>
);
