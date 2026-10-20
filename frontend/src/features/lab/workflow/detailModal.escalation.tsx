/**
 * EscalationResolutionModal — loads the escalated test by id and owns resolution.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QueueModalShell } from './detailModalLayout';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { TestWorkflowCardLeftColumn } from './queueCard.testWorkflowLeftColumn';
import { buildCriticalValueRecord } from '../criticalValues/criticalValues';
import { invalidateLabWorkflowQueries } from '@/lib/query/invalidate';
import { useEscalationResolution } from '../validation/useEscalationResolution';
import {
  EscalationResolutionBody,
  EscalationResolutionFooter,
} from './detailModal.escalation.helpers';
import { labModalHeaderContext } from './detailModalLayout';
import { useOrderTestContext } from '../api/results';
import { Modal, ModalPageShell } from '@/components/overlays';
import type { EscalationResolutionModalProps } from '@/lib/context/modalTypes';

function ticketString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export const EscalationResolutionModal: React.FC<EscalationResolutionModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  orderTestId,
  readOnly = false,
}) => {
  const { test, isLoading } = useOrderTestContext(orderTestId, isOpen);
  const [validationNotesForceValidate, setValidationNotesForceValidate] = useState('');
  const [reasonAuthorizeRetest, setReasonAuthorizeRetest] = useState('');
  const [reasonAuthorizeRecollect, setReasonAuthorizeRecollect] = useState('');
  const [reasonFinalReject, setReasonFinalReject] = useState('');
  const [readBackProviderName, setReadBackProviderName] = useState('');
  const [readBackProviderContact, setReadBackProviderContact] = useState('');
  const [readBackConfirmed, setReadBackConfirmed] = useState(false);
  const queryClient = useQueryClient();

  const criticalRecord = useMemo(
    () => (test ? buildCriticalValueRecord(test) : undefined),
    [test]
  );
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
    orderTestId,
    onResolved: async () => {
      await invalidateLabWorkflowQueries(queryClient, { pendingEscalation: true });
    },
    onClose,
    onResetForm: resetForm,
  });

  if (isOpen && isLoading && !test) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Escalation" size="3xl" isActive={isActive}>
        <ModalPageShell loading />
      </Modal>
    );
  }

  if (!test || test.id == null) return null;

  const hasResults = Boolean(test.results && Object.keys(test.results).length > 0);
  const patientName = test.patientName || '—';
  const headerBadges = <TestHeaderBadges test={test} variant="escalation" showStatus />;
  const { title: modalTitle, subtitle: modalSubtitle } = labModalHeaderContext({
    stage: 'escalation',
    contextLabel: test.testName,
    orderId: test.orderId,
    badges: headerBadges,
  });
  const headerLeftColumn = (
    <TestWorkflowCardLeftColumn
      test={test}
      patientName={patientName}
      variant="escalation"
      reasonCode={test.reasonCode}
      includeResultEntered
      tone="modal"
    />
  );

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      isActive={isActive}
      title={modalTitle}
      subtitle={modalSubtitle}
      modalKey={readOnly ? `historical-${test.id}` : `escalation-${test.id}`}
      headerLeftColumn={headerLeftColumn}
      disableClose={resolving}
      footer={
        readOnly ? undefined : (
          <EscalationResolutionFooter
            orderTestId={test.id}
            canResolveEscalation={canResolveEscalation}
            resolving={resolving}
            reasonCode={test.reasonCode}
            hasResults={hasResults}
            requiresReadBack={test.reasonCode === 'CRIT-VAL'}
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
            allowForceValidate={test.allowForceValidate !== false}
            resolveAsync={resolveAsync}
          />
        )
      }
    >
      <EscalationResolutionBody
        test={test}
        isOpen={isOpen}
        readOnly={readOnly}
        hasResults={hasResults}
        rejectionReason={ticketString(test.ticketMetadata?.rejectionReason)}
        rejectionNotes={ticketString(test.ticketMetadata?.rejectionNotes)}
        criticalRecord={criticalRecord ?? null}
        onCriticalValueUpdated={handleCriticalValueUpdated}
      />
    </QueueModalShell>
  );
};
