/**
 * EscalationResolutionModal - Resolve escalated tests (admin/labtech_plus only)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { actionButtonPreset, Button } from '@/components';
import { QueueModalShell, DetailGrid, ModalFooter } from './detailModalLayout';
import { testHeaderAudit } from '../constants/labWorkflowAuditLines';
import { TestCardAlerts, TestHeaderBadges } from '../components/LabWorkflowBadges';
import { buildCriticalValueRecord } from '../criticalValues/criticalValues';
import { invalidateLabWorkflowQueries } from '@/lib/query/invalidate';
import type { TestWithContext } from '@/types';
import { useEscalationResolution } from '../validation/useEscalationResolution';
import { Panel, EntityId } from '@/components';
import { ResultValidationForm } from '../validation/ResultValidationForm';
import { LabEventLogPanel } from '@/features/audit';
import { CriticalValueActions } from '../criticalValues/CriticalValueActions';
import type { CriticalValueRecord } from '../criticalValues/criticalValues';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import { TYPE } from '@/components/theme/recipes';
import { notify } from '@/utils/feedback';
import type { EscalationResolutionAction } from '@/types/lab-operations';
import { EscalationResolutionActions, type EscalationResolveOptions } from '../validation/EscalationResolutionActions';


import { labModalSubtitle } from './detailModalLayout';

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

  if (test.id == null) return null;

  const hasResults = Boolean(test.results && Object.keys(test.results).length > 0);
  const headerBadges = <TestHeaderBadges test={test} variant="escalation" showStatus />;
  const headerMeta = (
    <TestCardAlerts test={test} variant="escalation" reasonCode={test.reasonCode} />
  );

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={labModalSubtitle('escalation')}
      modalKey={readOnly ? `historical-${test.id}` : `escalation-${test.id}`}
      headerBadges={headerBadges}
      headerMeta={headerMeta}
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
            allowForceValidate={test.allowForceValidate !== false}
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
    </QueueModalShell>
  );
};

interface EscalationResolutionBodyProps {
  test: TestWithContext;
  readOnly: boolean;
  hasResults: boolean;
  rejectionReason?: string;
  rejectionNotes?: string;
  criticalRecord: CriticalValueRecord | null;
  onCriticalValueUpdated: () => void;
}

function EscalationResultsPanel({
  test,
  readOnly,
}: {
  test: TestWithContext;
  readOnly: boolean;
}) {
  return (
    <Panel variant="lab" title={readOnly ? 'Recorded Results' : 'Result Validation'}>
      <ResultValidationForm
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
  );
}

function EscalationSummaryPanel({
  rejectionReason,
  rejectionNotes,
}: {
  rejectionReason?: string;
  rejectionNotes?: string;
}) {
  return (
    <Panel variant="lab" title="Escalation Summary">
      <p className={TYPE.label}>
        This test was escalated before results were entered. Review the context below and choose
        an action.
      </p>
      {(rejectionReason || rejectionNotes) && (
        <dl className={`mt-space-3 space-y-space-2 ${TYPE.amount}`}>
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
  );
}

function EscalationResolutionBody({
  test,
  readOnly,
  hasResults,
  rejectionReason,
  rejectionNotes,
  criticalRecord,
  onCriticalValueUpdated,
}: EscalationResolutionBodyProps) {
  return (
    <>
      {hasResults ? (
        <EscalationResultsPanel test={test} readOnly={readOnly} />
      ) : (
        <EscalationSummaryPanel
          rejectionReason={rejectionReason}
          rejectionNotes={rejectionNotes}
        />
      )}

      {criticalRecord && (
        <Panel variant="lab" title="Critical Value Notification">
          <CriticalValueActions record={criticalRecord} onUpdated={onCriticalValueUpdated} />
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
        <LabEventLogPanel testId={test.id} />
      )}
    </>
  );
}

interface EscalationResolutionFooterProps {
  orderTestId?: number;
  canResolveEscalation: boolean;
  resolving: boolean;
  requiresReadBack: boolean;
  validationNotesForceValidate: string;
  onValidationNotesForceValidateChange: (value: string) => void;
  readBackProviderName: string;
  onReadBackProviderNameChange: (value: string) => void;
  readBackProviderContact: string;
  onReadBackProviderContactChange: (value: string) => void;
  readBackConfirmed: boolean;
  onReadBackConfirmedChange: (value: boolean) => void;
  reasonAuthorizeRetest: string;
  onReasonAuthorizeRetestChange: (value: string) => void;
  reasonAuthorizeRecollect: string;
  onReasonAuthorizeRecollectChange: (value: string) => void;
  reasonFinalReject: string;
  onReasonFinalRejectChange: (value: string) => void;
  reasonCode?: string;
  allowForceValidate?: boolean;
  hasResults?: boolean;
  resolveAsync: (
    action: EscalationResolutionAction,
    reasonOrNotes?: string,
    options?: EscalationResolveOptions
  ) => Promise<void>;
}

function EscalationResolutionFooter(props: EscalationResolutionFooterProps) {
  const { canResolveEscalation, resolving, ...actionProps } = props;

  return (
    <ModalFooter statusMessage="" statusClassName="text-text-tertiary">
      {!canResolveEscalation ? (
        <p className={TYPE.meta}>You do not have permission to resolve escalations.</p>
      ) : (
        <EscalationResolutionActions
          {...actionProps}
          orderTestId={props.orderTestId}
          hasResults={props.hasResults ?? false}
          allowForceValidate={props.allowForceValidate ?? true}
          resolving={resolving}
          onValidationError={id => notify.toast(id)}
        />
      )}
    </ModalFooter>
  );
};
