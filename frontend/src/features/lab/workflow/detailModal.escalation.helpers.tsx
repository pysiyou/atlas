/**
 * Escalation resolution modal — body panels, detail sections, and footer.
 */

import { Panel } from '@/components/surfaces';
import { RecordId } from '@/features/shared/components';
import { DetailGrid, ModalFooter } from './detailModalLayout';
import { ResultValidationPanel } from '../validation/ResultValidationForm';
import { CriticalValueActions } from '../criticalValues/CriticalValueActions';
import type { CriticalValueRecord } from '../criticalValues/criticalValues';
import { LabRelatedTestsPanel } from '../components/LabRelatedWorkflowPanel';
import { LabEventLogPanel } from '@/features/audit';
import type { TestWithContext } from '@/types';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { text , FG } from '@/theme/recipes';
import { notify } from '@/utils/feedback';
import type { EscalationResolutionAction } from '@/types/lab-operations';
import { EscalationResolutionActions, type EscalationResolveOptions } from '../validation/EscalationResolutionActions';

export interface EscalationResolutionBodyProps {
  test: TestWithContext;
  isOpen: boolean;
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
    <ResultValidationPanel
      preset="panel.compact.scrollAuto.maxH"
      title={readOnly ? 'Recorded Results' : 'Result Validation'}
      results={test.results!}
      flags={test.flags}
      testCode={test.testCode}
      patient={test.patient}
      technicianNotes={test.technicianNotes}
      comments={test.validationNotes ?? ''}
      onCommentsChange={() => {}}
      onApprove={() => {}}
      readOnly={readOnly}
      enableApproveShortcut={false}
    />
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
    <Panel preset="panel.compact.standard" title="Escalation Summary">
      <p className={text({ role: 'label' })}>
        This test was escalated before results were entered. Review the context below and choose
        an action.
      </p>
      {(rejectionReason || rejectionNotes) && (
        <dl className={`mt-space-3 space-y-space-2 ${text({ role: 'amount' })}`}>
          {rejectionReason && (
            <div>
              <dt className={text({ role: 'label', intent: 'muted' })}>Rejection reason</dt>
              <dd className={text({ role: 'body' })}>{rejectionReason}</dd>
            </div>
          )}
          {rejectionNotes && (
            <div>
              <dt className={text({ role: 'label', intent: 'muted' })}>Notes</dt>
              <dd className={`${text({ role: 'body' })} whitespace-pre-wrap`}>{rejectionNotes}</dd>
            </div>
          )}
        </dl>
      )}
    </Panel>
  );
}

export function EscalationResolutionBody({
  test,
  isOpen,
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
        <Panel preset="panel.compact.standard" title="Critical Value Notification">
          <CriticalValueActions record={criticalRecord} onUpdated={onCriticalValueUpdated} />
        </Panel>
      )}

      <LabRelatedTestsPanel test={test} isOpen={isOpen} />

      <DetailGrid
        sections={[
          {
            preset: 'panel.compact.standard', title: 'Collection Information',
            fields: [
              {
                label: 'Sample ID',
                value: test.sampleId ? (
                  <RecordId type="sample" value={test.sampleId} emphasis="block" className="text-right" />
                ) : undefined,
              },
              { label: 'Collected', timestamp: test.collectedAt, user: test.collectedBy },
              {
                label: 'Sample Type',
                value: test.sampleType ? formatStatusBadgeLabel(test.sampleType) : undefined,
              },
            ],
          },
          {
            preset: 'panel.compact.standard', title: 'Result Entry Information',
            fields: [
              { label: 'Entered', timestamp: test.resultEnteredAt, user: test.enteredBy },
              {
                label: 'Test ID',
                value: test.id != null ? (
                  <RecordId type="orderTest" value={test.id} emphasis="block" className="text-right" />
                ) : undefined,
              },
              {
                label: 'Test Code',
                value: test.testCode ? (
                  <RecordId emphasis="block" className="text-right">{test.testCode}</RecordId>
                ) : undefined,
              },
              {
                label: 'Order ID',
                value: test.orderId ? (
                  <RecordId type="order" value={test.orderId} emphasis="block" className="text-right" />
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

export interface EscalationResolutionFooterProps {
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

export function EscalationResolutionFooter(props: EscalationResolutionFooterProps) {
  const { canResolveEscalation, resolving, ...actionProps } = props;

  return (
    <ModalFooter statusMessage="" statusClassName={FG.modalStatus}>
      {!canResolveEscalation ? (
        <p className={text({ role: 'body', intent: 'muted' })}>You do not have permission to resolve escalations.</p>
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
}
