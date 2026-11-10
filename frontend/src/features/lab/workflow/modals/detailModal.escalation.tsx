/**
 * EscalationResolutionModal — loads the escalated test by id and owns resolution.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QueueModalShell } from '../shared/detailModalLayout';
import { TestHeaderBadges } from '../../components/LabWorkflowBadges';
import { TestWorkflowCardLeftColumn } from '../shared/queueCardLeftColumn';
import { buildCriticalValueRecord } from '../../criticalValues/criticalValues';
import {
  invalidateAfterLabMutation,
  invalidatePendingEscalationQueries,
} from '@/lib/query/invalidate';
import { useEscalationResolution } from '../../validation/useEscalationResolution';
import {
  EscalationResolutionBody,
  EscalationResolutionFooter,
} from '../shared/escalation.shared';
import { labModalHeaderContext } from '../shared/detailModalLayout';
import { hasResultsOnWorkItem } from '../../utils/labSearchAndLinks';
import { LabModalPlaceholder } from '../shared/labModalPlaceholders';
import type { EscalationResolutionModalProps } from '@/lib/context/modalTypes';
import { useLabModalWorkItemModel } from '../model/useLabModalWorkItemModel';

function ticketString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export const EscalationResolutionModal: React.FC<EscalationResolutionModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  orderTestId,
  readOnly = false,
  escalationSnapshot,
}) => {
  const {
    order,
    displayWorkItem,
    patientName,
    orderTestSnapshot,
    isContextLoading,
    isOrderLoading,
    ready,
  } = useLabModalWorkItemModel({
    isOpen,
    orderTestId,
    escalationSnapshot,
  });

  const [validationNotesForceValidate, setValidationNotesForceValidate] = useState('');
  const [reasonAuthorizeRetest, setReasonAuthorizeRetest] = useState('');
  const [reasonAuthorizeRecollect, setReasonAuthorizeRecollect] = useState('');
  const [reasonFinalReject, setReasonFinalReject] = useState('');
  const [readBackProviderName, setReadBackProviderName] = useState('');
  const [readBackProviderContact, setReadBackProviderContact] = useState('');
  const [readBackConfirmed, setReadBackConfirmed] = useState(false);
  const queryClient = useQueryClient();

  const criticalRecord = useMemo(
    () => (displayWorkItem ? buildCriticalValueRecord(displayWorkItem) : undefined),
    [displayWorkItem]
  );

  const handleCriticalValueUpdated = useCallback(() => {
    const orderId = order?.orderId ?? displayWorkItem?.orderId ?? orderTestSnapshot?.orderId;
    void invalidateAfterLabMutation(queryClient, {
      kind: 'criticalValue',
      orderId,
    });
    void invalidatePendingEscalationQueries(queryClient);
  }, [queryClient, order?.orderId, displayWorkItem?.orderId, orderTestSnapshot?.orderId]);

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
      await invalidatePendingEscalationQueries(queryClient);
    },
    onClose,
    onResetForm: resetForm,
  });

  const awaitingOpen = isOpen && (isContextLoading || isOrderLoading) && !ready;
  if (!isOpen) {
    return null;
  }
  if (!displayWorkItem && !awaitingOpen) {
    return null;
  }

  const contentReady = readOnly
    ? Boolean(displayWorkItem && !isContextLoading)
    : Boolean(ready && displayWorkItem && !isOrderLoading);
  const chromeRow = displayWorkItem;
  const hasResults = chromeRow ? hasResultsOnWorkItem(chromeRow) : false;
  const headerBadges =
    contentReady && chromeRow ? (
      <TestHeaderBadges row={chromeRow} variant="escalation" showStatus />
    ) : null;
  const { title: modalTitle, subtitle: modalSubtitle } =
    contentReady && chromeRow
      ? labModalHeaderContext({
          stage: 'escalation',
          contextLabel: chromeRow.testName,
          orderId: chromeRow.orderId,
          badges: headerBadges ?? undefined,
        })
      : { title: 'Escalation', subtitle: '' };

  const headerLeftColumn =
    contentReady && chromeRow ? (
      <TestWorkflowCardLeftColumn
        row={chromeRow}
        patientName={patientName || chromeRow.patientName || '—'}
        variant="escalation"
        reasonCode={chromeRow.reasonCode ?? undefined}
        includeResultEntered
        tone="modal"
      />
    ) : undefined;

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      isActive={isActive}
      title={modalTitle}
      subtitle={modalSubtitle}
      modalKey={readOnly ? `historical-escalation-${orderTestId}` : `escalation-${orderTestId}`}
      headerLeftColumn={headerLeftColumn}
      disableClose={resolving}
      footer={
        contentReady && chromeRow && !readOnly ? (
          <EscalationResolutionFooter
            orderTestId={chromeRow.orderTestId}
            canResolveEscalation={canResolveEscalation}
            resolving={resolving}
            reasonCode={chromeRow.reasonCode ?? undefined}
            hasResults={hasResults}
            requiresReadBack={chromeRow.reasonCode === 'CRIT-VAL'}
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
            allowForceValidate={chromeRow.allowForceValidate !== false}
            resolveAsync={resolveAsync}
          />
        ) : undefined
      }
    >
      {contentReady && chromeRow ? (
        <EscalationResolutionBody
          workItem={chromeRow}
          isOpen={isOpen}
          readOnly={readOnly}
          hasResults={hasResults}
          order={order}
          rejectionReason={ticketString(chromeRow.ticketMetadata?.rejectionReason)}
          rejectionNotes={ticketString(chromeRow.ticketMetadata?.rejectionNotes)}
          criticalRecord={criticalRecord ?? null}
          onCriticalValueUpdated={handleCriticalValueUpdated}
        />
      ) : (
        <LabModalPlaceholder variant="escalation" />
      )}
    </QueueModalShell>
  );
};
