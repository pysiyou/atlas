/**
 * Report preview test results table section.
 */

import React from 'react';
import { cn } from '@/utils';
import type { ValidatedTestReportPayload } from '../types';
import { TONE, TYPE } from '@/components/theme/recipes';


interface ReportPreviewResultsProps {
  reportData: ValidatedTestReportPayload;
}

export const ReportPreviewResults: React.FC<ReportPreviewResultsProps> = ({ reportData }) => (
  <div className="p-space-6 space-y-space-4">
    {reportData.testResults.map((test, index) => (
      <div key={index} className="space-y-space-4">
        <div className="text-center">
          <h3 className={`${TYPE.pageTitle} font-bold`}>
            {test.testName} ({test.testCode})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className={`${TYPE.value} w-full`}>
            <thead>
              <tr className="bg-surface-page border-b border-border-strong">
                <th className="px-table-cell-x-default py-space-3 text-left font-normal text-text-tertiary uppercase tracking-wider">
                  Investigation
                </th>
                <th className="px-table-cell-x-default py-space-3 text-left font-normal text-text-tertiary uppercase tracking-wider">
                  Result
                </th>
                <th className="px-table-cell-x-default py-space-3 text-left font-normal text-text-tertiary uppercase tracking-wider">
                  Reference Value
                </th>
                <th className="px-table-cell-x-default py-space-3 text-right font-normal text-text-tertiary uppercase tracking-wider">
                  Unit
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-subtle hover:bg-surface-page transition-colors">
                <td className="px-table-cell-x-default py-space-3 text-text-primary">Primary Sample Type :</td>
                <td className="px-table-cell-x-default py-space-3 text-left text-text-primary">
                  {(reportData.order.tests ?? [])[0]?.sampleType?.toUpperCase() || 'N/A'}
                </td>
                <td className="px-table-cell-x-default py-space-3 text-left text-text-secondary"></td>
                <td className="px-table-cell-x-default py-space-3 text-right text-text-secondary"></td>
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
                      className={cn('px-table-cell-x-default py-space-3 text-text-primary', isSectionHeader && 'font-normal')}
                    >
                      {isSectionHeader ? (
                        param.name
                      ) : (
                        <div className="min-w-0">
                          <div className="font-normal text-text-primary truncate">{param.name}</div>
                          {param.code && (
                            <div className={`${TYPE.value} truncate`}>{param.code}</div>
                          )}
                        </div>
                      )}
                    </td>
                    <td
                      className={cn(
                        'px-table-cell-x-default py-space-3 text-left',
                        isAbnormal ? cn(TONE.danger.fg, 'font-normal') : 'text-text-primary'
                      )}
                    >
                      {param.value}
                    </td>
                    <td className="px-table-cell-x-default py-space-3 text-left text-text-secondary">
                      {param.referenceRange || ''}
                    </td>
                    <td className="px-table-cell-x-default py-space-3 text-right text-text-secondary">{param.unit || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className={`space-y-space-2 ${TYPE.value} mt-space-4`}>
          {test.technicianNotes && <p>Instruments: {test.technicianNotes}</p>}
          {test.validationNotes && <p>Interpretation: {test.validationNotes}</p>}
          <p>Thanks for Reference</p>
          <p className="text-center font-normal mt-space-4">****End of Report****</p>
        </div>
      </div>
    ))}
  </div>
);
