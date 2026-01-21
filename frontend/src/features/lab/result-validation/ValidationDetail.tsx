/**
 * ValidationDetailModal - Extended view for result validation
 * 
 * Provides a larger interface for validating test results with full review options.
 * Shows previous rejection history for retests.
 */

import React from 'react';
import { Badge, DetailField, Button, Icon, Popover } from '@/shared/ui';
import { ValidationForm } from './ValidationForm';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';
import { LabDetailModal, DetailSection, DetailGrid, ModalFooter, StatusBadgeRow } from '../shared/LabDetailModal';
import { RejectionDialogContent } from '../shared/RejectionDialog';
import { ResultRejectionSection } from '../result-entry/ResultRejectionSection';
import type { TestWithContext } from '@/types';

interface ValidationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  /** 
   * Called when rejection is performed.
   * When RejectionDialogContent is used, it calls the API directly.
   * Passing undefined values signals that the API was already called and
   * the parent should only refresh data.
   */
  onReject: (reason?: string, type?: 're-test' | 're-collect') => void;
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

  if (!test.results) return null;

  const handleApprove = () => {
    onApprove();
    onClose();
  };

  const hasFlags = test.flags && test.flags.length > 0;
  
  // Determine if this is a retest or recollection
  const isRetest = test.isRetest === true;
  const retestNumber = test.retestNumber || 0;
  const rejectionHistory = test.resultRejectionHistory || [];
  
  // Check if this has any rejection history (covers both re-test and re-collect scenarios)
  const hasRejectionHistory = rejectionHistory.length > 0;
  // For re-collect, the last rejection type will be 're-collect'
  const lastRejection = hasRejectionHistory ? rejectionHistory[rejectionHistory.length - 1] : null;
  const isRecollection = lastRejection?.rejectionType === 're-collect';

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={`${test.testCode} - ${test.patientName}`}
      headerBadges={
        <StatusBadgeRow
          sampleType={test.sampleType}
          priority={test.priority}
          status={test.status}
          extraBadges={
            <>
              {isRetest && (
                <Badge size="sm" variant="warning" className="flex items-center gap-1.5">
                  <Icon name="loading" className="w-3 h-3" />
                  Re-test #{retestNumber}
                </Badge>
              )}
              {isRecollection && !isRetest && (
                <Badge size="sm" variant="warning" className="flex items-center gap-1.5">
                  <Icon name="loading" className="w-3 h-3" />
                  Re-collect #{rejectionHistory.length}
                </Badge>
              )}
              {hasFlags && (
                <Badge size="sm" variant="danger" className="flex items-center gap-1.5">
                  <Icon name="warning" className="w-3 h-3 text-red-600" />
                  {test.flags!.length} flag{test.flags!.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </>
          }
        />
      }
      contextInfo={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
      }}
      sampleInfo={test.sampleId && test.collectedAt ? {
        sampleId: test.sampleId,
        collectedAt: test.collectedAt,
        collectedBy: test.collectedBy,
      } : undefined}
      additionalContextInfo={
        test.resultEnteredAt && (
          <span className="text-xs text-gray-500">
            Results entered <span className="font-medium text-gray-700">{formatDate(test.resultEnteredAt)}</span>
            {test.enteredBy && <span> by {getUserName(test.enteredBy)}</span>}
          </span>
        )
      }
      footer={
        <ModalFooter
          statusIcon={hasFlags && <Icon name="warning" className="w-4 h-4 text-red-500" />}
          statusMessage={hasFlags ? 'Review flags carefully before approving' : 'Verify all results match expected values'}
        >
          <Popover
            placement="top-end"
            offsetValue={8}
            trigger={
              <Button variant="reject" size="md">Reject</Button>
            }
          >
            {({ close }) => (
              <div data-popover-content onClick={(e) => e.stopPropagation()}>
                <RejectionDialogContent
                  orderId={test.orderId}
                  testCode={test.testCode}
                  testName={test.testName}
                  patientName={test.patientName}
                  onConfirm={() => {
                    // RejectionDialogContent already calls the API via useRejectionManager.
                    // Signal to parent to refresh data without making another API call
                    // by passing undefined values (see ResultValidationView.handleValidate).
                    onReject(undefined, undefined);
                    close();
                    onClose();
                  }}
                  onCancel={close}
                />
              </div>
            )}
          </Popover>
          <Button onClick={handleApprove} variant="approve" size="md">
            Approve
          </Button>
        </ModalFooter>
      }
    >
      {/* Validation Form */}
      <DetailSection
        title="Result Validation"
        headerRight={
          <>
            {isRetest && (
              <Badge size="sm" variant="warning" className="flex items-center gap-1 mr-2">
                <Icon name="loading" className="w-3 h-3" />
                Re-test #{retestNumber}
              </Badge>
            )}
            {isRecollection && !isRetest && (
              <Badge size="sm" variant="warning" className="flex items-center gap-1 mr-2">
                <Icon name="loading" className="w-3 h-3" />
                Re-collect #{rejectionHistory.length}
              </Badge>
            )}
            {hasFlags && (
              <Badge size="sm" variant="danger" className="flex items-center gap-1">
                <Icon name="warning" className="w-3 h-3" />
                Review Required
              </Badge>
            )}
          </>
        }
      >
        <ValidationForm
          results={test.results}
          flags={test.flags}
          technicianNotes={test.technicianNotes}
          comments={comments}
          onCommentsChange={(value) => onCommentsChange(commentKey, value)}
          onApprove={handleApprove}
          onReject={(reason, type) => { onReject(reason, type); onClose(); }}
          testName={test.testName}
          testCode={test.testCode}
          patientName={test.patientName}
        />
      </DetailSection>

      {/* Previous Rejection History - show for both retests and recollections */}
      {hasRejectionHistory && (
        <ResultRejectionSection
          title={
            isRetest 
              ? `Previous Rejection${rejectionHistory.length > 1 ? ` (${rejectionHistory.length} attempts)` : ''}`
              : `Recollection History (${rejectionHistory.length} attempt${rejectionHistory.length > 1 ? 's' : ''})`
          }
          rejectionHistory={rejectionHistory}
          getUserName={getUserName}
          showOnlyLatest={false}
        />
      )}

      {/* Test Details */}
      <DetailGrid>
        <DetailSection title="Collection Information">
          <div className="space-y-2">
            {test.sampleId && <DetailField label="Sample ID" value={test.sampleId} />}
            {test.collectedAt && (
              <DetailField
                label="Collected"
                value={
                  <div className="text-right">
                    <div>{formatDate(test.collectedAt)}</div>
                    {test.collectedBy && <div className="text-xs text-gray-500">{getUserName(test.collectedBy)}</div>}
                  </div>
                }
              />
            )}
            {test.sampleType && <DetailField label="Sample Type" value={test.sampleType.toUpperCase()} />}
          </div>
        </DetailSection>

        <DetailSection title="Result Entry Information">
          <div className="space-y-2">
            {test.resultEnteredAt && (
              <DetailField
                label="Entered"
                value={
                  <div className="text-right">
                    <div>{formatDate(test.resultEnteredAt)}</div>
                    {test.enteredBy && <div className="text-xs text-gray-500">{getUserName(test.enteredBy)}</div>}
                  </div>
                }
              />
            )}
            {test.testCode && <DetailField label="Test Code" value={test.testCode} />}
            {test.orderId && <DetailField label="Order ID" value={test.orderId} />}
          </div>
        </DetailSection>
      </DetailGrid>
    </LabDetailModal>
  );
};
