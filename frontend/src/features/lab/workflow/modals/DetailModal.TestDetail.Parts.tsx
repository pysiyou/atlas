/**
 * Test-detail modal chrome: header column, badges, footer, and body.
 */

import { Panel } from '@/components/surfaces';
import { useLabCopy } from '@/strings';
import { LazyLabEventLogPanel } from '@/features/audit/LazyLabEventLogPanel';
import {
  formatPipelinePendingMessage,
  OrderTestSampleTabs,
  TestRelatedTestsPanel,
} from '@/features/orders';
import type { Order, OrderTest, Patient, Sample, OrderableTest } from '@/types';
import { text } from '@/theme/recipes';
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import { useSampleRejectionDisplay } from '../../hooks/useSampleRejectionDisplay';
import { ResultValidationPanel } from '../../validation/ResultValidationForm';
import { TestHeaderBadges } from '../../components/LabWorkflowBadges';
import { SampleRejectedBanner } from '../../components/SampleRejectedBanner';
import {
  DetailGrid,
  type LabModalStage,
  type DetailGridSectionConfig,
} from '../shared/DetailModalLayout';
import { TestWorkflowCardLeftColumn } from '../shared/QueueCardLeftColumn';
import {
  countFilledResults,
  resolveTestDetailQueueSince,
  type TestDetailHeaderVariant,
} from '../shared/testDetailHeader';
import { isLabActionAllowed, isTerminalTestStatus } from '../../utils/queueDisplay';
import { canReleaseResults } from '../../pages/laboratoryPageAccess';
import { useAuthStore } from '@/app/authStore';

/** Left-column identity chrome for the test-detail modal header. */
export function TestDetailHeaderColumn({
  row,
  patientName,
  headerVariant,
  modalStage,
  order,
  orderTest,
  analyteCount,
  turnaroundHours,
}: {
  row: LabModalWorkItem;
  patientName: string;
  headerVariant: TestDetailHeaderVariant;
  modalStage: LabModalStage;
  order: Order;
  orderTest: OrderTest;
  analyteCount: number;
  turnaroundHours?: number;
}) {
  const queueSince = resolveTestDetailQueueSince(modalStage, order, orderTest, row);
  const flagCount = orderTest.flags?.length ?? 0;
  const filledCount = countFilledResults(orderTest.results);
  const includeResultEntered = Boolean(orderTest.resultEnteredAt || orderTest.results);

  return (
    <TestWorkflowCardLeftColumn
      row={row}
      patientName={patientName}
      variant={headerVariant}
      queueSince={queueSince}
      emphasizeCritical={headerVariant === 'validation'}
      flagCount={headerVariant === 'validation' ? flagCount : undefined}
      reasonCode={headerVariant === 'escalation' ? row.reasonCode ?? undefined : undefined}
      filledCount={headerVariant === 'entry' ? filledCount : undefined}
      analyteCount={
        headerVariant === 'entry' && analyteCount > 0 ? analyteCount : undefined
      }
      turnaroundHours={headerVariant === 'entry' ? turnaroundHours : undefined}
      includeResultEntered={includeResultEntered}
      tone="modal"
    />
  );
}

/** Status badges in the test-detail modal header. */
export function TestDetailModalHeaderBadges({
  row,
  headerVariant,
}: {
  row: LabModalWorkItem;
  headerVariant: TestDetailHeaderVariant;
}) {
  return <TestHeaderBadges row={row} variant={headerVariant} showStatus />;
}

type TestDetailModalBodyProps = {
  sampleRejection: ReturnType<typeof useSampleRejectionDisplay>;
  hasResults: boolean;
  orderTest: OrderTest | undefined;
  isValidate: boolean;
  comments: string;
  resultsPanelPreset: 'panel.compact.scrollAuto.maxH';
  onCommentsChange: (value: string) => void;
  onApprove: () => void;
  criticalSeen?: boolean;
  ready: boolean;
  order: Order | undefined;
  catalogTest: OrderableTest | undefined;
  relatedSamples: Sample[];
  detailGridSections: DetailGridSectionConfig[] | undefined;
  onViewFullSample: (sampleId: string) => void;
  onOpenLinkedTest: (linkedTest: OrderTest) => void;
  orderTestId: number | undefined;
  patient?: Patient;
};

/** Results, critical-value, sample, and related-test body of the test-detail modal. */
export function TestDetailModalBody({
  sampleRejection,
  hasResults,
  orderTest,
  isValidate,
  comments,
  resultsPanelPreset,
  onCommentsChange,
  onApprove,
  criticalSeen = false,
  ready,
  order,
  catalogTest,
  relatedSamples,
  detailGridSections,
  onViewFullSample,
  onOpenLinkedTest,
  orderTestId,
  patient,
}: TestDetailModalBodyProps) {
  const labCopy = useLabCopy();
  const { hasRole } = useAuthStore();
  const resultsTitle = isValidate ? labCopy.panels.resultValidation : labCopy.panels.recordedResults;
  return (
    <>
      {sampleRejection.showBanner ? (
        <div className="mb-space-4">
          <SampleRejectedBanner
            sampleId={sampleRejection.sampleId}
            sampleRejectionReason={sampleRejection.sampleRejectionReason}
            successorSampleId={sampleRejection.successorSampleId}
          />
        </div>
      ) : null}

      {hasResults && orderTest?.results ? (
        <ResultValidationPanel
          preset={resultsPanelPreset}
          title={resultsTitle}
          results={orderTest.results}
          flags={orderTest.flags}
          testCode={orderTest.testCode}
          patient={patient}
          technicianNotes={orderTest.technicianNotes}
          comments={comments}
          onCommentsChange={onCommentsChange}
          onApprove={isValidate ? onApprove : () => {}}
          readOnly={!isValidate}
          enableApproveShortcut={
            isValidate &&
            canReleaseResults(hasRole) &&
            isLabActionAllowed(
              orderTest.lab?.allowedActions ?? undefined,
              'validate'
            ) &&
            !isTerminalTestStatus(orderTest.status) &&
            (!orderTest.hasCriticalValues || criticalSeen)
          }
        />
      ) : (
        <Panel
          preset={resultsPanelPreset}
          title={resultsTitle}
        >
          <p className={text({ role: 'label' })}>
            {orderTest ? formatPipelinePendingMessage(orderTest) : 'Loading test details…'}
          </p>
        </Panel>
      )}

      {ready && order && orderTest ? (
        <>
          {detailGridSections ? <DetailGrid sections={detailGridSections} /> : null}

          <OrderTestSampleTabs
            samples={relatedSamples}
            linkedSampleId={orderTest.sampleId}
            catalogTest={catalogTest}
            onViewFullSample={onViewFullSample}
          />

          <TestRelatedTestsPanel
            order={order}
            orderTest={orderTest}
            onOpenOrderTest={onOpenLinkedTest}
          />
        </>
      ) : null}

      {orderTestId != null ? <LazyLabEventLogPanel testId={orderTestId} /> : null}
    </>
  );
}
