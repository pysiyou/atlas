/**
 * Escalation queue card and resolution modal helpers.
 */

import { Panel } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import { LazyLabEventLogPanel } from '@/features/audit/LazyLabEventLogPanel';
import { AttemptIndicator } from '../../components/LabAttemptIndicators';
import { TestHeaderBadges } from '../../components/LabWorkflowBadges';
import { SupervisorApprovalBadge } from '../../components/LabResultStatusBadges';
import { LabRelatedTestsPanel } from '../../components/LabRelatedWorkflowPanel';
import { CriticalValueActions } from '../../criticalValues/CriticalValueActions';
import type { CriticalValueRecord } from '../../criticalValues/criticalValues';
import { ResultValidationPanel } from '../../validation/ResultValidationForm';
import {
  EscalationResolutionActions,
  type EscalationResolveOptions,
} from '../../validation/EscalationResolutionActions';
import {
  retestContextFromRow,
  type LabModalWorkItem,
  type LabOrderTestQueueRow,
} from '../../types/labQueueChrome';
import { text, WORKLIST_CARD_BADGE_SIZE } from '@/theme/recipes';
import type { Order } from '@/types';
import type { EscalationResolutionAction } from '@/types/lab-operations';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { notify } from '@/feedback';
import { DetailGrid } from './detailModalLayout';

function ticketString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

export function EscalationExceptionBadges({ row }: { row: LabOrderTestQueueRow }) {
  const rejection = retestContextFromRow(row);

  return (
    <>
      <SupervisorApprovalBadge size={WORKLIST_CARD_BADGE_SIZE} />
      <TestHeaderBadges row={row} variant="escalation" showStatus />
      {rejection.showAttemptIndicator ? (
        <AttemptIndicator
          attemptNumber={rejection.attemptNumber}
          maxAttempts={rejection.attemptMax}
          type={rejection.attemptType}
        />
      ) : null}
    </>
  );
}

export function EscalationExceptionReviewBody({ row }: { row: LabOrderTestQueueRow }) {
  const rejectionReason = ticketString(row.ticketMetadata?.rejectionReason);
  const rejectionNotes = ticketString(row.ticketMetadata?.rejectionNotes);
  const denyMessage = row.denyMessage ?? row.lab?.denyMessage ?? undefined;
  const reasonCode = row.reasonCode ? formatStatusBadgeLabel(row.reasonCode) : undefined;

  const hasContent = Boolean(reasonCode || denyMessage || rejectionReason || rejectionNotes);
  if (!hasContent) {
    return (
      <p className={text({ role: 'label' })}>Open to review this exception and choose a resolution.</p>
    );
  }

  return (
    <div className={`space-y-space-1 ${text({ role: 'body' })}`}>
      {reasonCode ? (
        <div>
          <span className={text({ role: 'label' })}>Exception:</span>{' '}
          <span className={text({ role: 'body' })}>{reasonCode}</span>
        </div>
      ) : null}
      {denyMessage ? (
        <div>
          <span className={text({ role: 'label' })}>Blocked:</span>{' '}
          <span className={text({ role: 'body' })}>{denyMessage}</span>
        </div>
      ) : null}
      {rejectionReason ? (
        <div>
          <span className={text({ role: 'label' })}>Reason:</span>{' '}
          <span className={text({ role: 'body' })}>{rejectionReason}</span>
        </div>
      ) : null}
      {rejectionNotes ? (
        <div>
          <span className={text({ role: 'label' })}>Notes:</span>{' '}
          <span className={text({ role: 'body' })}>{rejectionNotes}</span>
        </div>
      ) : null}
    </div>
  );
}

export interface EscalationResolutionBodyProps {
  workItem: LabModalWorkItem;
  isOpen: boolean;
  readOnly: boolean;
  hasResults: boolean;
  order?: Order;
  rejectionReason?: string;
  rejectionNotes?: string;
  criticalRecord: CriticalValueRecord | null;
  onCriticalValueUpdated: () => void;
}

function EscalationResultsPanel({
  workItem,
  readOnly,
}: {
  workItem: LabModalWorkItem;
  readOnly: boolean;
}) {
  return (
    <ResultValidationPanel
      preset="panel.compact.scrollAuto.maxH"
      title={readOnly ? 'Recorded Results' : 'Result Validation'}
      results={workItem.results ?? {}}
      flags={workItem.flags ?? undefined}
      testCode={workItem.testCode}
      technicianNotes={workItem.technicianNotes ?? undefined}
      comments={workItem.validationNotes ?? ''}
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
        This test was escalated before results were entered. Review the context below and choose an
        action.
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
  workItem,
  isOpen,
  readOnly,
  hasResults,
  order,
  rejectionReason,
  rejectionNotes,
  criticalRecord,
  onCriticalValueUpdated,
}: EscalationResolutionBodyProps) {
  return (
    <>
      {hasResults ? (
        <EscalationResultsPanel workItem={workItem} readOnly={readOnly} />
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

      <LabRelatedTestsPanel
        orderId={workItem.orderId}
        orderTestId={workItem.orderTestId}
        isOpen={isOpen}
        order={order}
      />

      <DetailGrid
        sections={[
          {
            preset: 'panel.compact.standard',
            title: 'Collection Information',
            fields: [
              {
                label: 'Sample ID',
                value: workItem.sampleId ? (
                  <RecordId
                    type="sample"
                    value={workItem.sampleId}
                    emphasis="block"
                    className="text-right"
                  />
                ) : undefined,
              },
              {
                label: 'Collected',
                timestamp: workItem.collectedAt ?? undefined,
                user: workItem.collectedBy ?? undefined,
              },
              {
                label: 'Sample Type',
                value: workItem.sampleType ? formatStatusBadgeLabel(workItem.sampleType) : undefined,
              },
            ],
          },
          {
            preset: 'panel.compact.standard',
            title: 'Result Entry Information',
            fields: [
              {
                label: 'Entered',
                timestamp: workItem.resultEnteredAt ?? undefined,
                user: workItem.enteredBy ?? undefined,
              },
              {
                label: 'Test ID',
                value: (
                  <RecordId
                    type="orderTest"
                    value={workItem.orderTestId}
                    emphasis="block"
                    className="text-right"
                  />
                ),
              },
              {
                label: 'Test Code',
                value: workItem.testCode ? (
                  <RecordId emphasis="block" className="text-right">
                    {workItem.testCode}
                  </RecordId>
                ) : undefined,
              },
              {
                label: 'Order ID',
                value: (
                  <RecordId type="order" value={workItem.orderId} emphasis="block" className="text-right" />
                ),
              },
            ],
          },
        ]}
      />
      <LazyLabEventLogPanel testId={workItem.orderTestId} />
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
    options?: EscalationResolveOptions,
  ) => Promise<void>;
}

export function EscalationResolutionFooter(props: EscalationResolutionFooterProps) {
  const { canResolveEscalation, resolving, ...actionProps } = props;

  if (!canResolveEscalation) {
    return (
      <p className={`${text({ role: 'body', intent: 'muted' })} w-full text-right`}>
        You do not have permission to resolve escalations.
      </p>
    );
  }

  return (
    <EscalationResolutionActions
      {...actionProps}
      orderTestId={props.orderTestId}
      hasResults={props.hasResults ?? false}
      allowForceValidate={props.allowForceValidate ?? true}
      resolving={resolving}
      onValidationError={id => notify.show(id)}
    />
  );
}
