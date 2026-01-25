/**
 * ValidationDetailModal - Extended view for result validation
 *
 * Provides a larger interface for validating test results with full review options.
 * Shows previous rejection history for retests.
 *
 * Uses centralized components:
 * - DetailGrid with sections config for consistent layout
 * - RetestBadge, RecollectionAttemptBadge, FlagCountBadge for status indicators
 * - EntryInfoLine for result entry metadata
 */

import React from 'react';
import { Button, Icon, Popover, SectionContainer } from '@/shared/ui';
import { displayId } from '@/utils/id-display';
import { ValidationForm } from './ValidationForm';
import {
  LabDetailModal,
  DetailGrid,
  ModalFooter,
  StatusBadgeRow,
} from '../components/LabDetailModal';
import { RejectionDialogContent } from '../components/RejectionDialog';
import { EntryRejectionSection } from '../entry/EntryRejectionSection';
import {
  RetestBadge,
  RecollectionAttemptBadge,
  FlagCountBadge,
  ReviewRequiredBadge,
  EntryInfoLine,
} from '../components/StatusBadges';
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
  /**
   * When true, the re-collect option is blocked because the order contains
   * validated tests. This prevents contradictory actions where a sample
   * recollection would invalidate already-validated results.
   */
  orderHasValidatedTests?: boolean;
}

// Large component is necessary for comprehensive validation detail modal with result display, validation actions, and conditional rendering
// eslint-disable-next-line max-lines-per-function
export const ValidationDetailModal: React.FC<ValidationDetailModalProps> = ({
  isOpen,
  onClose,
  test,
  commentKey,
  comments,
  onCommentsChange,
  onApprove,
  onReject,
  orderHasValidatedTests = false,
  // High complexity is necessary for comprehensive validation logic with multiple conditional branches and state management
  // eslint-disable-next-line complexity
}) => {
  if (!test.results) return null;

  const handleApprove = () => {
    onApprove();
    onClose();
  };

  // Flags and rejection state
  const hasFlags = test.flags && test.flags.length > 0;
  const flagCount = test.flags?.length || 0;

  // Determine if this is a retest or recollection
  const isRetest = test.isRetest === true;
  const retestNumber = test.retestNumber || 0;
  const rejectionHistory = test.resultRejectionHistory || [];

  // Check if this has any rejection history (covers both re-test and re-collect scenarios)
  const hasRejectionHistory = rejectionHistory.length > 0;
  // For re-collect, the last rejection type will be 're-collect'
  const lastRejection = hasRejectionHistory ? rejectionHistory[rejectionHistory.length - 1] : null;
  const isRecollection = lastRejection?.rejectionType === 're-collect';

  /**
   * Build header badges using centralized badge components
   */
  const headerExtraBadges = (
    <>
      {isRetest && <RetestBadge retestNumber={retestNumber} />}
      {isRecollection && !isRetest && (
        <RecollectionAttemptBadge attemptNumber={rejectionHistory.length} />
      )}
      {hasFlags && <FlagCountBadge count={flagCount} />}
    </>
  );

  /**
   * Build section header badges for the validation form section
   */
  const validationSectionHeaderRight = (
    <>
      {isRetest && <RetestBadge retestNumber={retestNumber} className="mr-2" />}
      {isRecollection && !isRetest && (
        <RecollectionAttemptBadge attemptNumber={rejectionHistory.length} className="mr-2" />
      )}
      {hasFlags && <ReviewRequiredBadge />}
    </>
  );

  /**
   * Build rejection history title based on type
   */
  const rejectionHistoryTitle = isRetest
    ? `Previous Rejection${rejectionHistory.length > 1 ? ` (${rejectionHistory.length} attempts)` : ''}`
    : `Recollection History (${rejectionHistory.length} attempt${rejectionHistory.length > 1 ? 's' : ''})`;

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
          extraBadges={headerExtraBadges}
        />
      }
      contextInfo={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
      }}
      sampleInfo={
        test.sampleId && test.collectedAt
          ? {
              sampleId: test.sampleId,
              collectedAt: test.collectedAt,
              collectedBy: test.collectedBy,
            }
          : undefined
      }
      additionalContextInfo={
        <EntryInfoLine enteredAt={test.resultEnteredAt} enteredBy={test.enteredBy} />
      }
      footer={
        <ModalFooter
          statusIcon={
            hasFlags ? (
              <Icon name="warning" className="w-4 h-4 text-gray-400" />
            ) : (
              <Icon name="pen" className="w-4 h-4 text-gray-400" />
            )
          }
          statusMessage={
            hasFlags
              ? 'Review flags carefully before approving'
              : 'Verify all results match expected values'
          }
          statusClassName="text-gray-500"
        >
          <Popover
            placement="top-end"
            offsetValue={8}
            trigger={
              <Button variant="reject" size="md">
                Reject
              </Button>
            }
          >
            {({ close }) => (
              <div data-popover-content onClick={e => e.stopPropagation()}>
                <RejectionDialogContent
                  orderId={test.orderId}
                  testCode={test.testCode}
                  testName={test.testName}
                  patientName={test.patientName}
                  orderHasValidatedTests={orderHasValidatedTests}
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
      {/* Validation Form Section */}
      <SectionContainer title="Result Validation" headerRight={validationSectionHeaderRight}>
        <ValidationForm
          results={test.results}
          flags={test.flags}
          technicianNotes={test.technicianNotes}
          comments={comments}
          onCommentsChange={value => onCommentsChange(commentKey, value)}
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

      {/* Previous Rejection History - show for both retests and recollections */}
      {hasRejectionHistory && (
        <EntryRejectionSection
          title={rejectionHistoryTitle}
          rejectionHistory={rejectionHistory}
          showOnlyLatest={false}
        />
      )}

      {/* Test Details - using declarative sections config */}
      <DetailGrid
        sections={[
          {
            title: 'Collection Information',
            fields: [
              {
                label: 'Sample ID',
                badge: test.sampleId
                  ? { value: displayId.sample(test.sampleId), variant: 'primary', className: 'font-mono' }
                  : undefined,
              },
              { label: 'Collected', timestamp: test.collectedAt, user: test.collectedBy },
              {
                label: 'Sample Type',
                badge: test.sampleType
                  ? { value: test.sampleType, variant: test.sampleType }
                  : undefined,
              },
            ],
          },
          {
            title: 'Result Entry Information',
            fields: [
              { label: 'Entered', timestamp: test.resultEnteredAt, user: test.enteredBy },
              {
                label: 'Test Code',
                badge: test.testCode ? { value: test.testCode, variant: 'primary' } : undefined,
              },
              {
                label: 'Order ID',
                badge: test.orderId
                  ? { value: displayId.order(test.orderId), variant: 'primary', className: 'font-mono' }
                  : undefined,
              },
            ],
          },
        ]}
      />
    </LabDetailModal>
  );
};
