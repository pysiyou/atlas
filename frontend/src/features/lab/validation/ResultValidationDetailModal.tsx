/**
 * ResultValidationDetailModal - Extended view for result validation
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
import { actionButtonPreset, Button, Panel, EntityId } from '@/components';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { ResultValidationForm } from './ResultValidationForm';
import {
  LabWorkflowDetailModal,
  DetailGrid,
  ModalFooter,
} from '../components/LabWorkflowDetailModal';
import { ReviewRequiredBadge } from '../components/LabResultStatusBadges';
import { testHeaderAudit } from '../constants/labWorkflowAuditLines';
import { QualityIssuePopover } from '../components/QualityIssuePopover';
import { CriticalValueActions } from '../criticalValues/CriticalValueActions';
import { buildCriticalValueRecord } from '../criticalValues/criticalValues';
import { invalidateLabWorkflowQueries } from '@/lib/query/invalidate';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { useOrderTestQueueState } from '../hooks';
import { useSampleRejectionDisplay } from '../hooks/useSampleRejectionDisplay';
import { SampleRejectedBanner } from '../components/SampleRejectedBanner';
import type { TestWithContext } from '@/types';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import { TYPE } from '@/components/theme/recipes';
import type { QualityIssueResult } from '@/types/lab-operations';
import { LabEntityTimelinePanel } from '../components/LabEntityTimelinePanel';
import { labModalSubtitle } from '../components/LabWorkflowModalSubtitles';
import { hasTestResults } from '../utils/labSearchAndLinks';

interface ValidationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  /** Called after QualityIssuePopover completes (API already called). */
  onReject: (result: QualityIssueResult) => void;
  readOnly?: boolean;
}

// Large component is necessary for comprehensive validation detail modal with result display, validation actions, and conditional rendering
// eslint-disable-next-line max-lines-per-function
export const ResultValidationDetailModal: React.FC<ValidationDetailModalProps> = ({
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
    invalidateLabWorkflowQueries(queryClient, { criticalValues: true });
  }, [queryClient]);

  const workItem = useOrderTestQueueState(test);
  const sampleRejection = useSampleRejectionDisplay(test);

  if (!readOnly && !test.results) return null;

  // Flags and rejection state
  const hasFlags = test.flags && test.flags.length > 0;
  const flagCount = test.flags?.length || 0;

  const headerBadges = (
    <TestHeaderBadges
      test={test}
      variant="validation"
      emphasizeCritical
      showStatus
      queueSince={test.resultEnteredAt}
      blockedLabel={workItem.blockedReason ? workItem.label : undefined}
      flagCount={flagCount}
    />
  );

  const validationSectionHeaderRight = hasFlags ? <ReviewRequiredBadge /> : null;

  return (
    <LabWorkflowDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={labModalSubtitle('validation')}
      modalKey={readOnly ? `historical-${test.id}` : commentKey}
      disableClose={isApproving}
      headerBadges={headerBadges}
      contextInfo={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
        orderTestId: test.id,
        entityCode: test.testCode,
        entityName: test.testName,
        referringPhysician: test.referringPhysician,
        sampleId: test.sampleId,
      }}
      headerAudit={testHeaderAudit(test, { includeResultEntered: true })}
      footer={
        readOnly ? (
          <ModalFooter statusMessage="">
            <Button onClick={onClose} {...actionButtonPreset('cancel')} size="md" layout="icon-text">Close</Button>
          </ModalFooter>
        ) : (
          <ModalFooter statusMessage="" statusClassName="text-text-tertiary">
            <QualityIssuePopover
              orderTestId={test.id!}
              testCode={test.testCode}
              testName={test.testName}
              patientName={test.patientName}
              trigger={
                <Button {...actionButtonPreset('reject')} size="md" layout="icon-text">
                  Reject
                </Button>
              }
              onReject={result => {
                onReject(result);
                onClose();
              }}
            />
            <Button onClick={handleApprove} {...actionButtonPreset('approve')} size="md" layout="icon-text" isLoading={isApproving}>
              Approve
            </Button>
          </ModalFooter>
        )
      }
    >
      {sampleRejection.showBanner && (
        <div className="mb-space-4">
          <SampleRejectedBanner
            sampleId={sampleRejection.sampleId}
            sampleRejectionReason={sampleRejection.sampleRejectionReason}
          />
        </div>
      )}

      {/* Validation Form Section */}
      {hasTestResults(test) ? (
        <Panel
          variant="lab"
          title={readOnly ? 'Recorded Results' : 'Result Validation'}
          headerEnd={validationSectionHeaderRight}
        >
          <ResultValidationForm
            results={test.results!}
            flags={test.flags}
            technicianNotes={test.technicianNotes}
            comments={comments}
            onCommentsChange={value => onCommentsChange(commentKey, value)}
            onApprove={handleApprove}
            readOnly={readOnly}
            enableApproveShortcut={!readOnly}
          />
        </Panel>
      ) : readOnly ? (
        <Panel variant="lab" title="Recorded Results">
          <p className={TYPE.label}>No results were recorded on this test version.</p>
        </Panel>
      ) : null}

      {criticalRecord && !readOnly && (
        <Panel variant="lab" title="Critical Value Notification">
          <CriticalValueActions
            record={criticalRecord}
            onUpdated={handleCriticalValueUpdated}
          />
        </Panel>
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
                  <EntityId type="sample" value={test.sampleId} variant="block" className="text-right" />
                ) : undefined,
              },
              { label: 'Collected', timestamp: test.collectedAt, user: test.collectedBy },
              {
                label: 'Sample Type',
                badge: test.sampleType
                  ? { value: test.sampleType, variant: resolveStatusBadgeColor(test.sampleType) }
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
                  <EntityId type="orderTest" value={test.id} variant="block" className="text-right" />
                ) : undefined,
              },
              {
                label: 'Test Code',
                value: test.testCode ? (
                  <EntityId variant="block" className="text-right">{test.testCode}</EntityId>
                ) : undefined,
              },
              {
                label: 'Order ID',
                value: test.orderId ? (
                  <EntityId type="order" value={test.orderId} variant="block" className="text-right" />
                ) : undefined,
              },
            ],
          },
        ]}
      />
      {test.id != null && (
        <LabEntityTimelinePanel entityType="order_test" entityId={test.id} />
      )}
    </LabWorkflowDetailModal>
  );
};
