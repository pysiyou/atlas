/**
 * Validation Detail Modal - Extended view for result validation
 * 
 * Provides a larger, more spacious interface for validating test results.
 * Similar to ResultDetailModal, this extends the card view with more space
 * and options for validation review and approval.
 */

import React from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Badge, SectionContainer, DetailField, Button, Icon, Popover } from '@/shared/ui';
import { ValidationForm } from './ValidationForm';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';
import { AlertTriangle } from 'lucide-react';
import type { TestWithContext } from '@/types';
import { ResultRejectionPopoverContent } from './ResultRejectionPopover';

interface ValidationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (reason: string, type: 're-test' | 're-collect') => void;
}

export const ValidationDetailModal: React.FC<ValidationDetailModalProps> = ({
  isOpen,
  onClose,
  test,
  commentKey,
  comments,
  onCommentsChange,
  onApprove,
  onReject,
}) => {
  const { getUserName } = useUserDisplay();
  // Don't render if test has no results
  if (!test.results) {
    return null;
  }

  // Handle approve and close
  const handleApprove = () => {
    onApprove();
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={test.testName}
        subtitle={`${test.testCode} - ${test.patientName}`}
        size="3xl"
      >
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Header Section */}
          <SectionContainer hideHeader>
            <div className="flex flex-col gap-4">
              {/* Row 1: Badges and status */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge variant={test.sampleType} size="sm" />

                  {/* Priority badge */}
                  {test.priority && (
                    <Badge variant={test.priority} size="sm" />
                  )}

                  {/* Status badge */}
                  {test.status && (
                  <Badge variant={test.status} size="sm" />
                  )}

                  {/* Flags indicator */}
                  {test.flags && test.flags.length > 0 && (
                    <Badge size="sm" variant="danger" className="flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-red-600" />
                      {test.flags.length} flag{test.flags.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Row 2: Patient & Order context */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                  <span className="font-semibold text-gray-900">{test.patientName}</span>
                  <span className="text-gray-300">|</span>
                  <span className="font-medium text-gray-900 text-xs">{test.patientId}</span>
                  <span className="text-gray-300">|</span>
                  <span className="font-medium text-gray-900 text-xs">{test.orderId}</span>
                </div>

                {/* Collection info */}
                {test.collectedAt && test.sampleId && (
                  <span className="text-xs text-gray-500">
                    Sample <span className="font-medium text-gray-900">{test.sampleId}</span> collected{' '}
                    <span className="text-gray-700">{formatDate(test.collectedAt)}</span>
                    {test.collectedBy && <span> by {getUserName(test.collectedBy)}</span>}
                  </span>
                )}

                {/* Result entry info */}
                {test.resultEnteredAt && (
                  <span className="text-xs text-gray-500">
                    Results entered <span className="font-medium text-gray-700">{formatDate(test.resultEnteredAt)}</span>
                    {test.enteredBy && <span> by {getUserName(test.enteredBy)}</span>}
                  </span>
                )}
              </div>
            </div>
          </SectionContainer>

          {/* Validation Form - Expanded */}
          <SectionContainer
            title="Result Validation"
            headerRight={
              <div className="flex items-center gap-2">
                {test.flags && test.flags.length > 0 && (
                  <Badge size="sm" variant="danger" className="flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Review Required
                  </Badge>
                )}
              </div>
            }
          >
            <ValidationForm
              results={test.results}
              flags={test.flags}
              technicianNotes={test.technicianNotes}
              comments={comments}
              onCommentsChange={(value) => onCommentsChange(commentKey, value)}
              onApprove={handleApprove}
              onReject={(reason, type) => {
                 onReject(reason, type);
                 onClose();
              }}
              testName={test.testName}
              testCode={test.testCode}
              patientName={test.patientName}
            />
          </SectionContainer>

          {/* Test Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionContainer title="Collection Information">
              <div className="space-y-2">
              {test.sampleId && (
                <DetailField label="Sample ID" value={<span className="">{test.sampleId}</span>} />
              )}
              {test.collectedAt && (
                <DetailField 
                  label="Collected" 
                  value={
                    <div className="text-right">
                      <div>{formatDate(test.collectedAt)}</div>
                      {test.collectedBy && (
                        <div className="text-xs text-gray-500">{getUserName(test.collectedBy)}</div>
                      )}
                    </div>
                  }
                />
              )}
              {test.sampleType && (
                <DetailField label="Sample Type" value={test.sampleType.toUpperCase()} />
              )}
              </div>
            </SectionContainer>

            <SectionContainer title="Result Entry Information">
              <div className="space-y-2">
              {test.resultEnteredAt && (
                <DetailField 
                  label="Entered" 
                  value={
                    <div className="text-right">
                      <div>{formatDate(test.resultEnteredAt)}</div>
                      {test.enteredBy && (
                        <div className="text-xs text-gray-500">{getUserName(test.enteredBy)}</div>
                      )}
                    </div>
                  }
                />
              )}
              {test.testCode && (
                <DetailField label="Test Code" value={<span className="">{test.testCode}</span>} />
              )}
              {test.orderId && (
                <DetailField label="Order ID" value={<span className="">{test.orderId}</span>} />
              )}
              </div>
            </SectionContainer>
          </div>
        </div>

        {/* Action Footer */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {test.flags && test.flags.length > 0 ? (
                  <>
                    <AlertTriangle size={16} className="text-red-500" />
                    <span>Review flags carefully before approving</span>
                  </>
                ) : (
                  <span>Verify all results match expected values</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Popover
                  placement="top-end"
                  offsetValue={8}
                  trigger={
                    <Button 
                      variant="danger" 
                      size="md" 
                      icon={<Icon name="close" />}
                    >
                      Reject
                    </Button>
                  }
                >
                  {({ close }) => (
                    <div data-popover-content onClick={(e) => e.stopPropagation()}>
                      <ResultRejectionPopoverContent
                        onConfirm={(reason, type) => {
                          onReject(reason, type);
                          close();
                          onClose();
                        }}
                        onCancel={close}
                        testName={test.testName}
                        testCode={test.testCode}
                        patientName={test.patientName}
                      />
                    </div>
                  )}
                </Popover>

                <Button 
                  onClick={handleApprove} 
                  variant="success" 
                  size="md"
                  icon={<Icon name="check" />}
                >
                  Approve
                </Button>
              </div>
            </div>
        </div>
      </div>
      </Modal>
    </>
  );
};
