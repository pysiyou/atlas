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
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import type { Order } from '@/types';
import type { CriticalValueRecord } from '../../criticalValues/criticalValues';
import type { EscalationResolveOptions } from '../../validation/EscalationResolutionActions';
import type { EscalationResolutionAction } from '@/types/lab-operations';

function ticketString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function useEscalationFormState() {
  const [validationNotesForceValidate, setValidationNotesForceValidate] = useState('');
  const [reasonAuthorizeRetest, setReasonAuthorizeRetest] = useState('');
  const [reasonAuthorizeRecollect, setReasonAuthorizeRecollect] = useState('');
  const [reasonFinalReject, setReasonFinalReject] = useState('');
  const [readBackProviderName, setReadBackProviderName] = useState('');
  const [readBackProviderContact, setReadBackProviderContact] = useState('');
  const [readBackConfirmed, setReadBackConfirmed] = useState(false);

  const resetForm = useCallback(() => {
    setValidationNotesForceValidate('');
    setReasonAuthorizeRetest('');
    setReasonAuthorizeRecollect('');
    setReasonFinalReject('');
    setReadBackProviderName('');
    setReadBackProviderContact('');
    setReadBackConfirmed(false);
  }, []);

  return {
    validationNotesForceValidate,
    setValidationNotesForceValidate,
    reasonAuthorizeRetest,
    setReasonAuthorizeRetest,
    reasonAuthorizeRecollect,
    setReasonAuthorizeRecollect,
    reasonFinalReject,
    setReasonFinalReject,
    readBackProviderName,
    setReadBackProviderName,
    readBackProviderContact,
    setReadBackProviderContact,
    readBackConfirmed,
    setReadBackConfirmed,
    resetForm,
  };
}

function escalationModalHeader(
  contentReady: boolean,
  chromeRow: ReturnType<typeof useLabModalWorkItemModel>['displayWorkItem'],
  patientName: string,
) {
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
  return { modalTitle, modalSubtitle, headerLeftColumn };
}

function EscalationModalFrame({
  isOpen,
  onClose,
  isActive,
  orderTestId,
  readOnly,
  order,
  chromeRow,
  patientName,
  contentReady,
  form,
  criticalRecord,
  canResolveEscalation,
  resolving,
  resolveAsync,
  onCriticalValueUpdated,
}: {
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  orderTestId: number;
  readOnly: boolean;
  order: Order | undefined;
  chromeRow: LabModalWorkItem | undefined;
  patientName: string;
  contentReady: boolean;
  form: ReturnType<typeof useEscalationFormState>;
  criticalRecord: CriticalValueRecord | null | undefined;
  canResolveEscalation: boolean;
  resolving: boolean;
  resolveAsync: (
    action: EscalationResolutionAction,
    reasonOrNotes?: string,
    options?: EscalationResolveOptions,
  ) => Promise<void>;
  onCriticalValueUpdated: () => void;
}) {
  const hasResults = chromeRow ? hasResultsOnWorkItem(chromeRow) : false;
  const { modalTitle, modalSubtitle, headerLeftColumn } = escalationModalHeader(
    contentReady,
    chromeRow,
    patientName,
  );
  const footer =
    contentReady && chromeRow && !readOnly ? (
      <EscalationResolutionFooter
        orderTestId={chromeRow.orderTestId}
        canResolveEscalation={canResolveEscalation}
        resolving={resolving}
        reasonCode={chromeRow.reasonCode ?? undefined}
        hasResults={hasResults}
        requiresReadBack={chromeRow.reasonCode === 'CRIT-VAL'}
        validationNotesForceValidate={form.validationNotesForceValidate}
        onValidationNotesForceValidateChange={form.setValidationNotesForceValidate}
        readBackProviderName={form.readBackProviderName}
        onReadBackProviderNameChange={form.setReadBackProviderName}
        readBackProviderContact={form.readBackProviderContact}
        onReadBackProviderContactChange={form.setReadBackProviderContact}
        readBackConfirmed={form.readBackConfirmed}
        onReadBackConfirmedChange={form.setReadBackConfirmed}
        reasonAuthorizeRetest={form.reasonAuthorizeRetest}
        onReasonAuthorizeRetestChange={form.setReasonAuthorizeRetest}
        reasonAuthorizeRecollect={form.reasonAuthorizeRecollect}
        onReasonAuthorizeRecollectChange={form.setReasonAuthorizeRecollect}
        reasonFinalReject={form.reasonFinalReject}
        onReasonFinalRejectChange={form.setReasonFinalReject}
        allowForceValidate={chromeRow.allowForceValidate !== false}
        resolveAsync={resolveAsync}
      />
    ) : undefined;
  const body =
    contentReady && chromeRow ? (
      <EscalationResolutionBody
        workItem={chromeRow}
        isOpen={isOpen}
        readOnly={readOnly}
        hasResults={hasResults}
        order={order}
        rejectionReason={ticketString(chromeRow.ticketMetadata?.rejectionReason)}
        rejectionNotes={ticketString(chromeRow.ticketMetadata?.rejectionNotes)}
        criticalRecord={criticalRecord ?? null}
        onCriticalValueUpdated={onCriticalValueUpdated}
      />
    ) : (
      <LabModalPlaceholder variant="escalation" />
    );

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
      footer={footer}
    >
      {body}
    </QueueModalShell>
  );
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

  const form = useEscalationFormState();
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

  const { canResolveEscalation, resolving, resolveAsync } = useEscalationResolution({
    orderTestId,
    onResolved: async () => {
      await invalidatePendingEscalationQueries(queryClient);
    },
    onClose,
    onResetForm: form.resetForm,
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

  return (
    <EscalationModalFrame
      isOpen={isOpen}
      onClose={onClose}
      isActive={isActive}
      orderTestId={orderTestId}
      readOnly={readOnly}
      order={order}
      chromeRow={displayWorkItem}
      patientName={patientName}
      contentReady={contentReady}
      form={form}
      criticalRecord={criticalRecord}
      canResolveEscalation={canResolveEscalation}
      resolving={resolving}
      resolveAsync={resolveAsync}
      onCriticalValueUpdated={handleCriticalValueUpdated}
    />
  );
};
