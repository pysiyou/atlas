/**
 * Report Preview Modal
 * Preview lab report before generating PDF
 * Uses consistent modal structure matching other detail modals
 */

import React from 'react';
import { Modal, Button, Icon } from '@/shared/ui';
import type { ReportData } from '../types';
import { format } from 'date-fns';
import { cn } from '@/utils';
import { companyConfig } from '@/config';
import { useUserLookup } from '@/hooks/queries';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportData;
  onGenerate: () => void;
  isGenerating?: boolean;
}

// eslint-disable-next-line max-lines-per-function
export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportData,
  onGenerate,
  isGenerating = false,
}) => {
  const { getUserName } = useUserLookup();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Preview"
      subtitle={`${reportData.patientName} - ${reportData.testResults.map(t => t.testName).join(', ')}`}
      size="3xl"
    >
      <div className="flex flex-col h-full bg-app-bg">
        {/* Preview Content - Scrollable */}
        <div className="flex-1 overflow-y-auto ">
          {/* Report Header Section - Two Column Layout */}
          <div className="flex border-b border-border">
            {/* Left Panel: Company Information */}
            <div className="bg-[#E0F2F7] p-6 shrink-0 space-y-2" style={{ width: '40%' }}>
              {/* Logo */}
              {/* <div className="mb-4">
                <div className="w-16 h-16 bg-white rounded-full border border-gray-300 flex items-center justify-center">
                  <Icon 
                    name={companyConfig.getBranding().logoPath.replace('/icons/', '').replace('.svg', '') as IconName} 
                    className="w-8 h-8 text-gray-700" 
                  />
                </div>
              </div> */}
              
              {/* Company Name */}
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                {companyConfig.getName()}
              </h2>
              
              {/* Company Subtitle */}
              {companyConfig.getConfig().company.subtitle && (
                <p className="text-xs text-text-primary font-semibold">{companyConfig.getConfig().company.subtitle}</p>
              )}
              
              {/* Address Lines */}
              <div className="text-xs text-gray-700 space-y-0.5">
                {companyConfig.getContact().address.street && (
                  <p>{companyConfig.getContact().address.street}</p>
                )}
                {(() => {
                  const { city, state, zipCode } = companyConfig.getContact().address;
                  const parts = [city, state, zipCode].filter(Boolean);
                  return parts.length > 0 ? (
                    <p>{parts.join(', ')}</p>
                  ) : null;
                })()}
                {companyConfig.getContact().address.country && (
                  <p>{companyConfig.getContact().address.country}</p>
                )}
              </div>
            </div>

            {/* Right Panel: Report Title and Details */}
            <div className="bg-white p-4 flex-1">
              {/* Report Title */}
              <h1 className="text-base font-bold text-black mb-2">
                {reportData.testResults.length > 0 ? (
                  <>
                    {reportData.testResults.map(t => t.testName).join(', ')} Results ({' '}
                    <span className="text-brand font-mono">
                      {reportData.testResults.map(t => t.testCode).join(', ')}
                    </span>
                    {' '})
                  </>
                ) : (
                  'Test Results'
                )}
              </h1>
              
              {/* Patient and Processing Details - Two Sub-columns */}
              <div className="grid grid-cols-2 gap-2">
                {/* Left Sub-column: Patient Demographics */}
                <div className="space-y-0.5">
                  <p className="text-base font-bold text-gray-800">{reportData.patientName}</p>
                  {reportData.patientAge && (
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-700 min-w-[50px] truncate">Age:</span>
                      <span className="text-xs font-bold text-gray-800">{reportData.patientAge}</span>
                    </div>
                  )}
                  {reportData.patientGender && (
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-700 min-w-[50px] truncate">Gender:</span>
                      <span className="text-xs font-bold text-gray-800">{reportData.patientGender.toUpperCase()}</span>
                    </div>
                  )}
                  {/* Phone or Email - show phone if available, otherwise show email */}
                  {(() => {
                    const orderExtended = reportData.order as typeof reportData.order & { 
                      patientPhone?: string;
                      patientEmail?: string;
                    };
                    if (orderExtended.patientPhone) {
                      return (
                        <div className="flex gap-2">
                          <span className="text-xs text-gray-700 min-w-[50px] truncate">Phone:</span>
                          <span className="text-xs font-bold text-gray-800">{orderExtended.patientPhone}</span>
                        </div>
                      );
                    }
                    if (orderExtended.patientEmail) {
                      return (
                        <div className="flex gap-2">
                          <span className="text-xs text-gray-700 min-w-[50px] truncate">Email:</span>
                          <span className="text-xs font-bold text-gray-800">{orderExtended.patientEmail}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                {/* Right Sub-column: Processing Details */}
                <div className="space-y-0.5">
                  <p className="text-base font-bold text-gray-800">Processing Details</p>
                  {reportData.timestamps?.collectedAt || reportData.sampleCollection?.collectedAt ? (
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-700 min-w-[60px] truncate">Sample:</span>
                      <span className="text-xs font-bold text-gray-800">
                        {format(new Date(reportData.timestamps?.collectedAt || reportData.sampleCollection?.collectedAt || ''), 'yyyy-MM-dd hh:mm a')}
                      </span>
                    </div>
                  ) : null}
                  {reportData.timestamps?.reportedAt ? (
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-700 min-w-[60px] truncate">Results:</span>
                      <span className="text-xs font-bold text-gray-800">
                        {format(new Date(reportData.timestamps.reportedAt), 'yyyy-MM-dd hh:mm a')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-700 min-w-[60px] truncate">Results:</span>
                      <span className="text-xs font-bold text-gray-800">
                        {format(new Date(), 'yyyy-MM-dd hh:mm a')}
                      </span>
                    </div>
                  )}
                  {reportData.testResults[0] && (
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-700 min-w-[60px] truncate">Verified by:</span>
                      <span className="text-xs font-bold text-gray-800">
                        {(() => {
                          const testResult = reportData.testResults[0];
                          if (!testResult) return 'N/A';
                          
                          // Try validatedByName first (pre-resolved)
                          if (testResult.validatedByName && testResult.validatedByName !== 'N/A' && testResult.validatedByName !== 'Unknown') {
                            return testResult.validatedByName;
                          }
                          
                          // Fall back to resolving from validatedBy ID
                          if (testResult.validatedBy) {
                            const resolvedName = getUserName(String(testResult.validatedBy).trim());
                            if (resolvedName && resolvedName !== 'N/A' && resolvedName !== 'Unknown') {
                              return resolvedName;
                            }
                          }
                          
                          // If we have validatedAt but no name, show "N/A"
                          return testResult.validatedAt ? 'N/A' : '-';
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Test Results Section */}
          <div className="p-6 space-y-4">

          {/* Test Results */}
          {reportData.testResults.map((test, index) => (
            <div key={index} className="space-y-4">
              {/* Test Name (centered) */}
              <div className="text-center">
                <h3 className="text-lg font-bold text-text-primary">
                  {test.testName} ({test.testCode})
                </h3>
              </div>

              {/* Parameters Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-black">Investigation</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-black">Result</th>
                      <th className="px-4 py-3 text-left font-semibold border-b-2 border-black">Reference Value</th>
                      <th className="px-4 py-3 text-right font-semibold border-b-2 border-black">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Primary Sample Type Row */}
                    <tr className="border-b border-border">
                      <td className="px-4 py-3 text-text-primary">Primary Sample Type :</td>
                      <td className="px-4 py-3 text-left text-text-primary">
                        {reportData.order.tests[0]?.sampleType?.toUpperCase() || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-left text-text-secondary"></td>
                      <td className="px-4 py-3 text-right text-text-secondary"></td>
                    </tr>
                    
                    {test.parameters.map((param, paramIndex) => {
                      // Check if original parameter name is a section header (all caps, length > 3)
                      const isSectionHeader = param.name === param.name.toUpperCase() && param.name.length > 3 && !param.name.includes(':');
                      
                      // Check if value is abnormal
                      const isAbnormal = param.status && param.status.toLowerCase() !== 'normal';

                      return (
                        <tr
                          key={paramIndex}
                          className="border-b border-border last:border-0"
                        >
                          <td className={cn(
                            'px-4 py-3 text-text-primary',
                            isSectionHeader && 'font-bold'
                          )}>
                            {isSectionHeader ? (
                              param.name
                            ) : (
                              <div className="min-w-0">
                                <div className="font-bold text-text-primary truncate">{param.name}</div>
                                {param.code && (
                                  <div className="text-xs font-medium truncate">{param.code}</div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className={cn(
                            'px-4 py-3 text-left',
                            isAbnormal ? 'text-red-600 font-bold' : 'text-text-primary'
                          )}>
                            {param.value}
                          </td>
                          <td className="px-4 py-3 text-left text-text-secondary">
                            {param.referenceRange || ''}
                          </td>
                          <td className="px-4 py-3 text-right text-text-secondary">
                            {param.unit || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Instrument and Interpretation */}
              <div className="space-y-2 text-xs text-text-primary mt-4">
                {test.technicianNotes && (
                  <p>Instruments: {test.technicianNotes}</p>
                )}
                {test.validationNotes && (
                  <p>Interpretation: {test.validationNotes}</p>
                )}
                <p>Thanks for Reference</p>
                <p className="text-center font-bold mt-4">****End of Report****</p>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-surface p-4 space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs text-text-tertiary">
            <Icon name="info-circle" className="w-4 h-4" />
            <span>
              {companyConfig.getReports().footerText} Generated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
            </span>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="cancel" onClick={onClose} disabled={isGenerating}>
              Close
            </Button>
            <Button variant="download" onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Icon name="clock" className="w-4 h-4 animate-pulse" />
                  Generating...
                </>
              ) : (
                <>
                  <Icon name="download" className="w-4 h-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
