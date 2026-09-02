/**
 * EscalationResolutionModal - Resolve escalated tests (admin/labtech_plus only)
 *
 * Four paths: Force Validate, Authorize Re-test, Authorize Re-collect, Cancel Test.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SectionPanel, Badge } from '@/components';
import { displayId } from '@/utils';
import { ValidationForm } from './ValidationForm';
import { LabDetailModal, DetailGrid, StatusBadgeRow } from '../components/LabDetailModal';
import { EntryInfoLine } from '../components/StatusBadges';
import { CriticalValueActions } from '@/features/lab/critical-values/CriticalValueActions';
import { buildCriticalValueRecord } from '@/features/lab/critical-values/buildCriticalValueRecord.utils';
import { queryKeys } from '@/lib/query';
import type { TestWithContext } from '@/types';
import { useEscalationResolution } from './useEscalationResolution';
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
  const [reasonAuthorizeRecollect, setReasonAuthorizeRecollect] = useState('');
  const [reasonFinalReject, setReasonFinalReject] = useState('');
  const [readBackProviderName, setReadBackProviderName] = useState('');
  const [readBackProviderContact, setReadBackProviderContact] = useState('');
  const [readBackConfirmed, setReadBackConfirmed] = useState(false);
  const queryClient = useQueryClient();

  const criticalRecord = useMemo(() => buildCriticalValueRecord(test), [test]);

  const handleCriticalValueUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.criticalValues.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() });
  }, [queryClient]);

  const resetForm = useCallback(() => {
    setValidationNotesForceValidate('');
    setReasonAuthorizeRetest('');
    setReasonAuthorizeRecollect('');
    setReasonFinalReject('');
    setReadBackProviderName('');
    setReadBackProviderContact('');
    setReadBackConfirmed(false);
  }, []);

  const { canResolveEscalation, resolving, resolveAsync } = useEscalationResolution({
    orderId: test.orderId,
    testCode: test.testCode,
    onResolved,
    onClose,
    onResetForm: resetForm,
  });

  const requiresReadBack = test.reasonCode === 'CRIT-VAL';

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
            <>
              {test.reasonCode && (
                <Badge size="sm" variant="warning">
                  {test.reasonCode}
                </Badge>
              )}
              <Badge size="sm" variant="danger">
                Requires Supervisor Action
              </Badge>
            </>
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
          reasonCode={test.reasonCode}
          requiresReadBack={requiresReadBack}
          validationNotesForceValidate={validationNotesForceValidate}
          onValidationNotesForceValidateChange={setValidationNotesForceValidate}
          readBackProviderName={readBackProviderName}
          onReadBackProviderNameChange={setReadBackProviderName}
          readBackProviderContact={readBackProviderContact}
          onReadBackProviderContactChange={setReadBackProviderContact}
          readBackConfirmed={readBackConfirmed}
          onReadBackConfirmedChange={setReadBackConfirmed}
          reasonAuthorizeRetest={reasonAuthorizeRetest}
          onReasonAuthorizeRetestChange={setReasonAuthorizeRetest}
          reasonAuthorizeRecollect={reasonAuthorizeRecollect}
          onReasonAuthorizeRecollectChange={setReasonAuthorizeRecollect}
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

      {criticalRecord && (
        <SectionPanel title="Critical Value Notification">
          <CriticalValueActions record={criticalRecord} onUpdated={handleCriticalValueUpdated} />
        </SectionPanel>
      )}

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
    </LabDetailModal>
  );
};
