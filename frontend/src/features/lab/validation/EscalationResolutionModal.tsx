/**
 * EscalationResolutionModal - Resolve escalated tests (admin/labtech_plus only)
 *
 * Four paths: Force Validate, Authorize Re-test, Authorize Re-collect, Cancel Test.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge, Panel, Button, EntityId } from '@/components';
import { ValidationForm } from './ValidationForm';
import { LabDetailModal, DetailGrid, ModalFooter } from '../components/LabDetailModal';
import { testHeaderAudit } from '../components/labHeaderAudit';
import { TestHeaderBadges } from '../components/labWorkflowBadges';
import { useTestWorkItemState } from '../hooks';
import { CriticalValueActions } from '@/features/lab/critical-values/CriticalValueActions';
import { buildCriticalValueRecord } from '@/features/lab/critical-values/buildCriticalValueRecord.utils';
import { invalidateLabWorkflowQueries } from '@/lib/query/invalidate';
import type { TestWithContext } from '@/types';
import { useEscalationResolution } from './useEscalationResolution';
import { EscalationResolutionFooter } from './EscalationResolutionFooter';
import { LabHistoryPanel } from '../components/LabHistoryPanel';
import { labModalSubtitle } from '../components/labModalStages';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';

interface EscalationResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  onResolved: () => void | Promise<void>;
  readOnly?: boolean;
}

export const EscalationResolutionModal: React.FC<EscalationResolutionModalProps> = ({
  isOpen,
  onClose,
  test,
  onResolved,
  readOnly = false,
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
    invalidateLabWorkflowQueries(queryClient, {
      criticalValues: true,
      pendingEscalation: true,
    });
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
    orderTestId: test.id ?? 0,
    onResolved,
    onClose,
    onResetForm: resetForm,
  });

  const requiresReadBack = test.reasonCode === 'CRIT-VAL';
  const hasResults = Boolean(test.results && Object.keys(test.results).length > 0);
  const rejectionReason =
    typeof test.ticketMetadata?.rejectionReason === 'string'
      ? test.ticketMetadata.rejectionReason
      : undefined;
  const rejectionNotes =
    typeof test.ticketMetadata?.rejectionNotes === 'string'
      ? test.ticketMetadata.rejectionNotes
      : undefined;

  const workItem = useTestWorkItemState(test);

  if (test.id == null) return null;

  const headerBadges = (
    <TestHeaderBadges
      test={test}
      variant="escalation"
      reasonCode={test.reasonCode}
      blockedLabel={workItem.blockedReason ? workItem.label : undefined}
      trailing={
        <Badge size={LAB_CARD_BADGE_SIZE} variant="danger">
          Requires Supervisor Action
        </Badge>
      }
    />
  );

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={labModalSubtitle('escalation')}
      modalKey={readOnly ? `historical-${test.id}` : `escalation-${test.id}`}
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
      disableClose={resolving}
      footer={
        readOnly ? (
          <ModalFooter statusMessage="">
            <Button onClick={onClose} variant="cancel" size="md" layout="icon-text">Close</Button>
          </ModalFooter>
        ) : (
          <EscalationResolutionFooter
            orderTestId={test.id}
            canResolveEscalation={canResolveEscalation}
            resolving={resolving}
            reasonCode={test.reasonCode}
            hasResults={hasResults}
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
        )
      }
    >
      {hasResults ? (
        <Panel variant="lab" title={readOnly ? 'Recorded Results' : 'Result Validation'}>
          <ValidationForm
            results={test.results!}
            flags={test.flags}
            technicianNotes={test.technicianNotes}
            comments={test.validationNotes ?? ''}
            onCommentsChange={() => {}}
            onApprove={() => {}}
            readOnly={readOnly}
            enableApproveShortcut={false}
          />
        </Panel>
      ) : (
        <Panel variant="lab" title="Escalation Summary">
          <p className="text-sm text-text-secondary">
            This test was escalated before results were entered. Review the context below and choose
            an action.
          </p>
          {(rejectionReason || rejectionNotes) && (
            <dl className="mt-3 space-y-2 text-sm">
              {rejectionReason && (
                <div>
                  <dt className="text-text-tertiary">Rejection reason</dt>
                  <dd className="text-text-primary">{rejectionReason}</dd>
                </div>
              )}
              {rejectionNotes && (
                <div>
                  <dt className="text-text-tertiary">Notes</dt>
                  <dd className="text-text-primary whitespace-pre-wrap">{rejectionNotes}</dd>
                </div>
              )}
            </dl>
          )}
        </Panel>
      )}

      {criticalRecord && (
        <Panel variant="lab" title="Critical Value Notification">
          <CriticalValueActions record={criticalRecord} onUpdated={handleCriticalValueUpdated} />
        </Panel>
      )}

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
        <LabHistoryPanel entityType="order_test" entityId={test.id} />
      )}
    </LabDetailModal>
  );
};
