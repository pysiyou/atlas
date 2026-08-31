/**
 * EscalationResolutionModal - Resolve escalated tests (admin/labtech_plus only)
 *
 * Three paths: Force Validate, Authorize Re-test, Final Reject / New Sample.
 */

import React, { useState, useCallback } from 'react';
import { SectionPanel, Badge } from '@/components';
import { displayId } from '@/utils';
import { ValidationForm } from './ValidationForm';
import { LabDetailModal, DetailGrid, StatusBadgeRow } from '@/features/lab/components/LabDetailModal';
import { RejectionHistorySection } from '@/features/lab/components/RejectionHistorySection';
import { EntryInfoLine } from '@/features/lab/components/StatusBadges';
import type { TestWithContext } from '@/types';
import { useEscalationResolution } from '../hooks/useEscalationResolution';
import { EscalationResolutionFooter } from './EscalationResolutionFooter';

interface EscalationResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  onResolved: () => void | Promise<void>;
}

export const EscalationResolutionModal: React.FC<EscalationResolutionModalProps> = ({
  isOpen,
  onClose,
  test,
  onResolved,
}) => {
  const [validationNotesForceValidate, setValidationNotesForceValidate] = useState('');
  const [reasonAuthorizeRetest, setReasonAuthorizeRetest] = useState('');
  const [reasonFinalReject, setReasonFinalReject] = useState('');

  const resetForm = useCallback(() => {
    setValidationNotesForceValidate('');
    setReasonAuthorizeRetest('');
    setReasonFinalReject('');
  }, []);

  const { canResolveEscalation, resolving, resolveAsync } = useEscalationResolution({
    orderId: test.orderId,
    testCode: test.testCode,
    onResolved,
    onClose,
    onResetForm: resetForm,
  });

  const rejectionHistory = test.resultRejectionHistory || [];
  const hasRejectionHistory = rejectionHistory.length > 0;

  if (!test.results) return null;

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={`${test.testCode} - ${test.patientName} (Escalated)`}
      headerBadges={
        <StatusBadgeRow
          sampleType={test.sampleType}
          priority={test.priority}
          status="escalated"
          extraBadges={
            <Badge size="sm" variant="danger">
              Requires Supervisor Action
            </Badge>
          }
        />
      }
      contextInfo={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
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
      disableClose={resolving}
      footer={
        <EscalationResolutionFooter
          canResolveEscalation={canResolveEscalation}
          resolving={resolving}
          validationNotesForceValidate={validationNotesForceValidate}
          onValidationNotesForceValidateChange={setValidationNotesForceValidate}
          reasonAuthorizeRetest={reasonAuthorizeRetest}
          onReasonAuthorizeRetestChange={setReasonAuthorizeRetest}
          reasonFinalReject={reasonFinalReject}
          onReasonFinalRejectChange={setReasonFinalReject}
          resolveAsync={resolveAsync}
        />
      }
    >
      <SectionPanel title="Result Validation">
        <ValidationForm
          results={test.results}
          flags={test.flags}
          technicianNotes={test.technicianNotes}
          comments=""
          onCommentsChange={() => {}}
          onApprove={() => {}}
          enableApproveShortcut={false}
        />
      </SectionPanel>

      {hasRejectionHistory && (
        <RejectionHistorySection
          variant="result"
          title="Escalation history"
          rejectionHistory={rejectionHistory}
          showOnlyLatest={false}
        />
      )}

      <DetailGrid
        sections={[
          {
            title: 'Collection Information',
            fields: [
              {
                label: 'Sample ID',
                value: test.sampleId ? (
                  <span className="text-brand font-mono">{displayId.sample(test.sampleId)}</span>
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
                label: 'Test Code',
                value: test.testCode ? (
                  <span className="text-brand font-mono">{test.testCode}</span>
                ) : undefined,
              },
              {
                label: 'Order ID',
                value: test.orderId ? (
                  <span className="text-brand font-mono">{displayId.order(test.orderId)}</span>
                ) : undefined,
              },
            ],
          },
        ]}
      />
    </LabDetailModal>
  );
};
