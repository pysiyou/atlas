/**
 * Report preview header — company info and patient/processing details.
 */

import React from 'react';
import { format } from 'date-fns';
import { companyConfig } from '@/config';
import type { ReportData } from '../types';

interface ReportPreviewHeaderProps {
  reportData: ReportData;
  getUserName: (id: string) => string;
}

export const ReportPreviewHeader: React.FC<ReportPreviewHeaderProps> = ({
  reportData,
  getUserName,
}) => {
  const orderExtended = reportData.order as typeof reportData.order & {
    patientPhone?: string;
    patientEmail?: string;
  };

  const resolveVerifiedBy = (): string => {
    const testResult = reportData.testResults[0];
    if (!testResult) return 'N/A';

    if (
      testResult.validatedByName &&
      testResult.validatedByName !== 'N/A' &&
      testResult.validatedByName !== 'Unknown'
    ) {
      return testResult.validatedByName;
    }

    if (testResult.validatedBy) {
      const resolvedName = getUserName(String(testResult.validatedBy).trim());
      if (resolvedName && resolvedName !== 'N/A' && resolvedName !== 'Unknown') {
        return resolvedName;
      }
    }

    return testResult.validatedAt ? 'N/A' : '-';
  };

  const collectedAt =
    reportData.timestamps?.collectedAt || reportData.sampleCollection?.collectedAt;
  const reportedAt = reportData.timestamps?.reportedAt;

  return (
    <div className="flex border-b border-border-default">
      <div className="bg-surface-report p-6 shrink-0 space-y-2" style={{ width: '40%' }}>
        <h2 className="text-2xl font-bold text-text-primary mb-3">{companyConfig.getName()}</h2>
        {companyConfig.getConfig().company.subtitle && (
          <p className="text-xs text-text-primary font-normal">
            {companyConfig.getConfig().company.subtitle}
          </p>
        )}
        <div className="text-xs text-text-secondary space-y-0.5">
          {companyConfig.getContact().address.street && (
            <p>{companyConfig.getContact().address.street}</p>
          )}
          {(() => {
            const { city, state, zipCode } = companyConfig.getContact().address;
            const parts = [city, state, zipCode].filter(Boolean);
            return parts.length > 0 ? <p>{parts.join(', ')}</p> : null;
          })()}
          {companyConfig.getContact().address.country && (
            <p>{companyConfig.getContact().address.country}</p>
          )}
        </div>
      </div>

      <div className="bg-surface p-4 flex-1">
        <h1 className="text-base font-bold text-text-primary mb-2">
          {reportData.testResults.length > 0 ? (
            <>
              {reportData.testResults.map(t => t.testName).join(', ')} Results ({' '}
              <span className="entity-id">
                {reportData.testResults.map(t => t.testCode).join(', ')}
              </span>{' '}
              )
            </>
          ) : (
            'Test Results'
          )}
        </h1>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <p className="text-base font-normal text-text-primary">{reportData.patientName}</p>
            {reportData.patientAge && (
              <div className="flex gap-2">
                <span className="text-xs text-text-secondary min-w-[50px] truncate">Age:</span>
                <span className="text-xs font-normal text-text-primary">{reportData.patientAge}</span>
              </div>
            )}
            {reportData.patientGender && (
              <div className="flex gap-2">
                <span className="text-xs text-text-secondary min-w-[50px] truncate">Gender:</span>
                <span className="text-xs font-normal text-text-primary">
                  {reportData.patientGender.toUpperCase()}
                </span>
              </div>
            )}
            {orderExtended.patientPhone && (
              <div className="flex gap-2">
                <span className="text-xs text-text-secondary min-w-[50px] truncate">Phone:</span>
                <span className="text-xs font-normal text-text-primary">
                  {orderExtended.patientPhone}
                </span>
              </div>
            )}
            {!orderExtended.patientPhone && orderExtended.patientEmail && (
              <div className="flex gap-2">
                <span className="text-xs text-text-secondary min-w-[50px] truncate">Email:</span>
                <span className="text-xs font-normal text-text-primary">
                  {orderExtended.patientEmail}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-base font-normal text-text-primary">Processing Details</p>
            {collectedAt && (
              <div className="flex gap-2">
                <span className="text-xs text-text-secondary min-w-[60px] truncate">Sample:</span>
                <span className="text-xs font-normal text-text-primary">
                  {format(new Date(collectedAt), 'yyyy-MM-dd hh:mm a')}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-xs text-text-secondary min-w-[60px] truncate">Results:</span>
              <span className="text-xs font-normal text-text-primary">
                {reportedAt
                  ? format(new Date(reportedAt), 'yyyy-MM-dd hh:mm a')
                  : format(new Date(), 'yyyy-MM-dd hh:mm a')}
              </span>
            </div>
            {reportData.testResults[0] && (
              <div className="flex gap-2">
                <span className="text-xs text-text-secondary min-w-[60px] truncate">Verified by:</span>
                <span className="text-xs font-normal text-text-primary">{resolveVerifiedBy()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
