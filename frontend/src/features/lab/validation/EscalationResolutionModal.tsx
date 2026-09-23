/**
 * EscalationResolutionModal - Resolve escalated tests (admin/labtech_plus only)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { actionButtonPreset, Badge, Button } from '@/components';
import { LabWorkflowDetailModal, ModalFooter } from '../components/LabWorkflowDetailModal';
import { testHeaderAudit } from '../constants/labWorkflowAuditLines';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { useOrderTestQueueState } from '../hooks';
import { buildCriticalValueRecord } from '../criticalValues/criticalValues';
import { invalidateLabWorkflowQueries } from '@/lib/query/invalidate';
import type { TestWithContext } from '@/types';
import { useEscalationResolution } from './useEscalationResolution';
import { EscalationResolutionFooter } from './EscalationResolutionFooter';
import { EscalationResolutionBody } from './EscalationResolutionBody';
import { labModalSubtitle } from '../components/LabWorkflowModalSubtitles';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';

interface EscalationResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  onResolved: () => void | Promise<void>;
  readOnly?: boolean;
}

function ticketString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
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

  const workItem = useOrderTestQueueState(test);
  if (test.id == null) return null;

  const hasResults = Boolean(test.results && Object.keys(test.results).length > 0);
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
    <LabWorkflowDetailModal
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
            <Button onClick={onClose} {...actionButtonPreset('cancel')} size="md" layout="icon-text">Close</Button>
          </ModalFooter>
        ) : (
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
            resolveAsync={resolveAsync}
          />
        )
      }
    >
      <EscalationResolutionBody
        test={test}
        readOnly={readOnly}
        hasResults={hasResults}
        rejectionReason={ticketString(test.ticketMetadata?.rejectionReason)}
        rejectionNotes={ticketString(test.ticketMetadata?.rejectionNotes)}
        criticalRecord={criticalRecord}
        onCriticalValueUpdated={handleCriticalValueUpdated}
      />
    </LabWorkflowDetailModal>
  );
};
