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

import React, { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, SectionPanel } from '@/components';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { displayId } from '@/utils';
import { ValidationForm } from './ValidationForm';
import {
  LabDetailModal,
  DetailGrid,
  ModalFooter,
  StatusBadgeRow,
} from '../components/LabDetailModal';
import { QualityIssueDialog } from '../components/QualityIssueDialog';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { CriticalValueActions } from '@/features/lab/critical-values/CriticalValueActions';
import { buildCriticalValueRecord } from '@/features/lab/critical-values/buildCriticalValueRecord.utils';
import { queryKeys } from '@/lib/query';
import {
  RetestBadge,
  RecollectionAttemptBadge,
  FlagCountBadge,
  ReviewRequiredBadge,
  EntryInfoLine,
} from '../components/StatusBadges';
import type { TestWithContext } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';
import { LabHistoryPanel } from '../components/LabHistoryPanel';
import { hasTestResults } from '../utils/hasTestResults';

interface ValidationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  /** Called after QualityIssueDialog completes (API already called). */
  onReject: (result: QualityIssueResult) => void;
  readOnly?: boolean;
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
  readOnly = false,
  // High complexity is necessary for comprehensive validation logic with multiple conditional branches and state management
   
}) => {
  const queryClient = useQueryClient();
  const approveHandler = useCallback(
    async (_signal: AbortSignal) => {
      await onApprove();
      onClose();
    },
    [onApprove, onClose]
  );
  const { execute: handleApprove, isPending: isApproving } = useAsyncAction(approveHandler, {
    minDisplayMs: 500,
    scope: 'inline',
  });

  const criticalRecord = useMemo(() => buildCriticalValueRecord(test), [test]);

  const handleCriticalValueUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.criticalValues.all });
  }, [queryClient]);

  if (!readOnly && !test.results) return null;

  // Flags and rejection state
  const hasFlags = test.flags && test.flags.length > 0;
  const flagCount = test.flags?.length || 0;

  const {
    isRetest,
    retestNumber,
    showRecollectionBadge,
    sampleRecollectionAttempt,
  } = deriveRetestContext(test);

  /**
   * Build header badges using centralized badge components
   */
  const headerExtraBadges = (
    <>
      {isRetest && <RetestBadge retestNumber={retestNumber} />}
      {showRecollectionBadge && !isRetest && (
        <RecollectionAttemptBadge attemptNumber={sampleRecollectionAttempt} />
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
      {showRecollectionBadge && !isRetest && (
        <RecollectionAttemptBadge attemptNumber={sampleRecollectionAttempt} className="mr-2" />
      )}
      {hasFlags && <ReviewRequiredBadge />}
    </>
  );

  const testIdLabel = test.id != null ? `${displayId.orderTest(test.id)} · ` : '';
  const historicalSubtitle = readOnly
    ? `${testIdLabel}${test.testCode} - ${test.patientName} · ${test.status}`
    : `${testIdLabel}${test.testCode} - ${test.patientName}`;

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={historicalSubtitle}
      modalKey={readOnly ? `historical-${test.id}` : commentKey}
      disableClose={isApproving}
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
        orderTestId: test.id,
        referringPhysician: test.referringPhysician,
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
        readOnly ? (
          <ModalFooter statusMessage="">
            <Button onClick={onClose} variant="cancel" size="md">Close</Button>
          </ModalFooter>
        ) : (
          <ModalFooter statusMessage="" statusClassName="text-text-tertiary">
            <QualityIssueDialog
              orderTestId={test.id!}
              testCode={test.testCode}
              testName={test.testName}
              patientName={test.patientName}
              trigger={
                <Button variant="reject" size="md">
                  Reject
                </Button>
              }
              onReject={result => {
                onReject(result);
                onClose();
              }}
            />
            <Button onClick={handleApprove} variant="approve" size="md" isLoading={isApproving}>
              Approve
            </Button>
          </ModalFooter>
        )
      }
    >
      {/* Validation Form Section */}
      {hasTestResults(test) ? (
        <SectionPanel
          title={readOnly ? 'Recorded Results' : 'Result Validation'}
          headerRight={validationSectionHeaderRight}
        >
          <ValidationForm
            results={test.results!}
            flags={test.flags}
            technicianNotes={test.technicianNotes}
            comments={comments}
            onCommentsChange={value => onCommentsChange(commentKey, value)}
            onApprove={handleApprove}
            readOnly={readOnly}
            enableApproveShortcut={!readOnly}
          />
        </SectionPanel>
      ) : readOnly ? (
        <SectionPanel title="Recorded Results">
          <p className="text-sm text-text-secondary">No results were recorded on this test version.</p>
        </SectionPanel>
      ) : null}

      {criticalRecord && !readOnly && (
        <SectionPanel title="Critical Value Notification">
          <CriticalValueActions
            record={criticalRecord}
            onUpdated={handleCriticalValueUpdated}
          />
        </SectionPanel>
      )}

      {/* Previous Rejection History - show for both retests and recollections */}
      {/* Test Details - using declarative sections config */}
      <DetailGrid
        sections={[
          {
            title: 'Collection Information',
            fields: [
              {
                label: 'Sample ID',
                value: test.sampleId ? (
                  <span className="entity-id">{displayId.sample(test.sampleId)}</span>
                ) : undefined,
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
                label: 'Test ID',
                value: test.id != null ? (
                  <span className="entity-id">{displayId.orderTest(test.id)}</span>
                ) : undefined,
              },
              {
                label: 'Test Code',
                value: test.testCode ? (
                  <span className="entity-id">{test.testCode}</span>
                ) : undefined,
              },
              {
                label: 'Order ID',
                value: test.orderId ? (
                  <span className="entity-id">{displayId.order(test.orderId)}</span>
                ) : undefined,
              },
            ],
          },
        ]}
      />
      {test.id != null && (
        <LabHistoryPanel entityType="order_test" entityId={test.id} />
      )}
    </LabDetailModal>
  );
};
