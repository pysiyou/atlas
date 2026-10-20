/**
 * EscalationResolutionModal - Resolve escalated tests (admin/labtech_plus only)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QueueModalShell } from './detailModalLayout';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { TestWorkflowCardLeftColumn } from './queueCard.testWorkflowLeftColumn';
import { buildCriticalValueRecord } from '../criticalValues/criticalValues';
import { invalidateLabWorkflowQueries } from '@/lib/query/invalidate';
import type { TestWithContext } from '@/types';
import { useEscalationResolution } from '../validation/useEscalationResolution';
import {
  EscalationResolutionBody,
  EscalationResolutionFooter,
} from './detailModal.escalation.helpers';

import { labModalHeaderContext } from './detailModalLayout';

function ticketString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

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

  if (test.id == null) return null;

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
        criticalRecord={criticalRecord}
        onCriticalValueUpdated={handleCriticalValueUpdated}
      />
    </QueueModalShell>
  );
};
