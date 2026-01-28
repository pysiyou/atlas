/**
 * Report Preview Modal
 * Preview lab report before generating PDF
 */

import React from 'react';
import { Modal, Button, Icon } from '@/shared/ui';
import type { ReportData } from '../types';
import { format } from 'date-fns';
import { cn } from '@/utils';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: ReportData;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportData,
  onGenerate,
  isGenerating = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Preview"
      size="xl"
    >
      <div className="flex flex-col h-[70vh]">
        {/* Preview Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-6 border border-border rounded">
          {/* Header */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-bold text-brand text-center mb-2">
              Atlas Clinical Laboratories
            </h2>
            <p className="text-center text-sm text-text-tertiary">Laboratory Report</p>
            <div className="mt-4 pt-4 border-t border-border"></div>
          </div>

          {/* Patient Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wide mb-4">
              Patient Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-tertiary">Patient Name:</span>
                <span className="ml-2 font-medium text-text-primary">{reportData.patientName}</span>
              </div>
              <div>
                <span className="text-text-tertiary">Order ID:</span>
                <span className="ml-2 font-medium text-text-primary font-mono">
                  ORD{reportData.order.orderId.toString().padStart(6, '0')}
                </span>
              </div>
              <div>
                <span className="text-text-tertiary">Order Date:</span>
                <span className="ml-2 font-medium text-text-primary">
                  {format(new Date(reportData.order.orderDate), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              <div>
                <span className="text-text-tertiary">Priority:</span>
                <span className="ml-2 font-medium text-text-primary uppercase">
                  {reportData.order.priority}
                </span>
              </div>
              {reportData.patientAge && (
                <div>
                  <span className="text-text-tertiary">Age:</span>
                  <span className="ml-2 font-medium text-text-primary">{reportData.patientAge} years</span>
                </div>
              )}
              {reportData.patientGender && (
                <div>
                  <span className="text-text-tertiary">Gender:</span>
                  <span className="ml-2 font-medium text-text-primary capitalize">
                    {reportData.patientGender}
                  </span>
                </div>
              )}
              {reportData.order.referringPhysician && (
                <div className="col-span-2">
                  <span className="text-text-tertiary">Referring Physician:</span>
                  <span className="ml-2 font-medium text-text-primary">
                    {reportData.order.referringPhysician}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Test Results */}
          {reportData.testResults.map((test, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-base font-bold text-text-primary mb-4">
                {test.testName}
                <span className="ml-2 text-sm font-mono text-text-tertiary">{test.testCode}</span>
              </h3>

              {/* Parameters Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-brand/10">
                      <th className="border border-border p-2 text-left font-semibold text-brand">
                        Parameter
                      </th>
                      <th className="border border-border p-2 text-left font-semibold text-brand">
                        Result
                      </th>
                      <th className="border border-border p-2 text-left font-semibold text-brand">
                        Reference Range
                      </th>
                      <th className="border border-border p-2 text-left font-semibold text-brand">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {test.parameters.map((param, paramIndex) => {
                      const statusColor = param.isCritical
                        ? 'text-red-600 font-bold'
                        : param.status === 'high' || param.status === 'low'
                          ? 'text-amber-600 font-semibold'
                          : 'text-green-600';

                      return (
                        <tr
                          key={paramIndex}
                          className={cn('hover:bg-surface-hover', paramIndex % 2 === 0 ? 'bg-gray-50' : '')}
                        >
                          <td className="border border-border p-2 font-medium">{param.name}</td>
                          <td className="border border-border p-2">
                            {param.value}
                            {param.unit && <span className="ml-1 text-text-tertiary">{param.unit}</span>}
                          </td>
                          <td className="border border-border p-2 text-text-secondary">
                            {param.referenceRange || 'N/A'}
                          </td>
                          <td className={cn('border border-border p-2', statusColor)}>
                            {param.status ? param.status.toUpperCase() : 'NORMAL'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {test.technicianNotes && (
                <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                  <p className="text-xs font-semibold text-text-primary mb-1">Technician Notes:</p>
                  <p className="text-sm text-text-secondary italic">{test.technicianNotes}</p>
                </div>
              )}

              {test.validationNotes && (
                <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                  <p className="text-xs font-semibold text-text-primary mb-1">Validation Notes:</p>
                  <p className="text-sm text-text-secondary italic">{test.validationNotes}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="mt-4 pt-3 border-t border-border text-xs text-text-tertiary">
                {test.enteredBy && (
                  <span className="mr-4">Entered by: {test.enteredBy}</span>
                )}
                {test.validatedBy && (
                  <span>Validated by: {test.validatedBy}</span>
                )}
              </div>
            </div>
          ))}

          {/* Footer */}
          <div className="bg-white p-4 rounded-lg shadow-sm border-t-2 border-border">
            <p className="text-xs text-text-tertiary italic text-center">
              This report contains confidential patient information. Handle according to applicable privacy laws.
            </p>
            <p className="text-xs text-text-tertiary text-center mt-2">
              Generated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
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
    </Modal>
  );
};
