/**
 * Escalation resolution modal — body panels, detail sections, and footer.
 */

import { Panel } from '@/components/surfaces';
import { EntityId } from '@/components/display';
import { DetailGrid, ModalFooter } from './detailModalLayout';
import { ResultValidationPanel } from '../validation/ResultValidationForm';
import { CriticalValueActions } from '../criticalValues/CriticalValueActions';
import type { CriticalValueRecord } from '../criticalValues/criticalValues';
import { LabRelatedTestsPanel } from '../components/LabRelatedWorkflowPanel';
import { LabEventLogPanel } from '@/features/audit';
import type { TestWithContext } from '@/types';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { TYPE } from '@/theme/recipes';
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
      preset={readOnly ? 'lab.modal.recordedResults' : 'lab.modal.resultValidation'}
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
    <Panel preset="lab.modal.escalationSummary">
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
        <Panel preset="lab.modal.criticalValueNotification">
          <CriticalValueActions record={criticalRecord} onUpdated={onCriticalValueUpdated} />
        </Panel>
      )}

      <LabRelatedTestsPanel test={test} isOpen={isOpen} />

      <DetailGrid
        sections={[
          {
            preset: 'lab.modal.collectionInformation',
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
                value: test.sampleType ? formatStatusBadgeLabel(test.sampleType) : undefined,
              },
            ],
          },
          {
            preset: 'lab.modal.resultEntryInformation',
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
}
