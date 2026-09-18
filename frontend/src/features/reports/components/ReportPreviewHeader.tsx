/**
 * Report preview header — company info and patient/processing details.
 */

import React from 'react';
import { formatDateTime } from '@/utils';
import { EntityId } from '@/components';
import { companyConfig } from '@/config';
import type { ValidatedTestReportPayload } from '../types';
import { TYPE } from '@/components/theme/recipes';


interface ReportPreviewHeaderProps {
  reportData: ValidatedTestReportPayload;
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
      <div className="bg-surface-report p-space-6 shrink-0 space-y-2" style={{ width: '40%' }}>
        <h2 className="text-2xl font-bold text-text-primary mb-3">{companyConfig.getName()}</h2>
        {companyConfig.getConfig().company.subtitle && (
          <p className={`${TYPE.value} font-normal`}>
            {companyConfig.getConfig().company.subtitle}
          </p>
        )}
        <div className={`${TYPE.label} space-y-0.5`}>
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

      <div className="bg-surface p-panel flex-1">
        <h1 className="text-base font-bold text-text-primary mb-2">
          {reportData.testResults.length > 0 ? (
            <>
              {reportData.testResults.map(t => t.testName).join(', ')} Results ({' '}
              <EntityId>{reportData.testResults.map(t => t.testCode).join(', ')}</EntityId>{' '}
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
                <span className={`${TYPE.label} min-w-[50px] truncate`}>Age:</span>
                <span className={`${TYPE.value} font-normal`}>{reportData.patientAge}</span>
              </div>
            )}
            {reportData.patientGender && (
              <div className="flex gap-2">
                <span className={`${TYPE.label} min-w-[50px] truncate`}>Gender:</span>
                <span className={`${TYPE.value} font-normal`}>
                  {reportData.patientGender.toUpperCase()}
                </span>
              </div>
            )}
            {orderExtended.patientPhone && (
              <div className="flex gap-2">
                <span className={`${TYPE.label} min-w-[50px] truncate`}>Phone:</span>
                <span className={`${TYPE.value} font-normal`}>
                  {orderExtended.patientPhone}
                </span>
              </div>
            )}
            {!orderExtended.patientPhone && orderExtended.patientEmail && (
              <div className="flex gap-2">
                <span className={`${TYPE.label} min-w-[50px] truncate`}>Email:</span>
                <span className={`${TYPE.value} font-normal`}>
                  {orderExtended.patientEmail}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <p className="text-base font-normal text-text-primary">Processing Details</p>
            {collectedAt && (
              <div className="flex gap-2">
                <span className={`${TYPE.label} min-w-[60px] truncate`}>Sample:</span>
                <span className={`${TYPE.value} font-normal`}>
                  {formatDateTime(collectedAt)}
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <span className={`${TYPE.label} min-w-[60px] truncate`}>Results:</span>
              <span className={`${TYPE.value} font-normal`}>
                {reportedAt ? formatDateTime(reportedAt) : formatDateTime(new Date())}
              </span>
            </div>
            {reportData.testResults[0] && (
              <div className="flex gap-2">
                <span className={`${TYPE.label} min-w-[60px] truncate`}>Verified by:</span>
                <span className={`${TYPE.value} font-normal`}>{resolveVerifiedBy()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
