import { Panel, EntityId } from '@/components';
import { ResultValidationForm } from './ResultValidationForm';
import { DetailGrid } from '../components/LabWorkflowDetailModal';
import { CriticalValueActions } from '../criticalValues/CriticalValueActions';
import { LabEntityTimelinePanel } from '../components/LabEntityTimelinePanel';
import type { TestWithContext } from '@/types';
import type { CriticalValueRecord } from '../criticalValues/criticalValues';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import { TYPE } from '@/components/theme/recipes';

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

export function EscalationResolutionBody({
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
        <LabEntityTimelinePanel entityType="order_test" entityId={test.id} />
      )}
    </>
  );
}
