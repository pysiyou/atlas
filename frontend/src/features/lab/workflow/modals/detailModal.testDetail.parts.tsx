/**
 * Test-detail modal chrome: header column, badges, footer, and body.
 */

import { useNavigate } from 'react-router-dom';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Panel } from '@/components/surfaces';
import { LazyLabEventLogPanel } from '@/features/audit/LazyLabEventLogPanel';
import {
  formatPipelinePendingMessage,
  OrderTestSampleTabs,
  TestRelatedTestsPanel,
} from '@/features/orders';
import type { Order, OrderTest, Patient, Sample, Test } from '@/types';
import { text } from '@/theme/recipes';
import type { QualityIssueResult } from '@/types/lab-operations';
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import type { CriticalValueRecord } from '../../criticalValues/criticalValues';
import { useSampleRejectionDisplay } from '../../hooks/useSampleRejectionDisplay';
import { ResultValidationPanel } from '../../validation/ResultValidationForm';
import { QualityIssuePopover } from '../../components/QualityIssuePopover';
import { CriticalValueActions } from '../../criticalValues/CriticalValueActions';
import { TestHeaderBadges } from '../../components/LabWorkflowBadges';
import { SampleRejectedBanner } from '../../components/SampleRejectedBanner';
import {
  DetailGrid,
  ModalFooter,
  type LabModalStage,
  type DetailGridSectionConfig,
} from '../shared/detailModalLayout';
import { TestWorkflowCardLeftColumn } from '../shared/queueCardLeftColumn';
import {
  countFilledResults,
  resolveTestDetailQueueSince,
  type TestDetailHeaderVariant,
} from '../shared/testDetailHeader';
import { labModalFooterDenyMessage } from '../../utils/queueDisplay';

/** Left-column identity chrome for the test-detail modal header. */
export function TestDetailHeaderColumn({
  row,
  patientName,
  headerVariant,
  modalStage,
  order,
  orderTest,
  catalogParameterCount,
  turnaroundHours,
}: {
  row: LabModalWorkItem;
  patientName: string;
  headerVariant: TestDetailHeaderVariant;
  modalStage: LabModalStage;
  order: Order;
  orderTest: OrderTest;
  catalogParameterCount: number;
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
      parameterCount={
        headerVariant === 'entry' && catalogParameterCount > 0 ? catalogParameterCount : undefined
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

type TestDetailModalFooterProps = {
  isValidate: boolean;
  orderTestId: number;
  displayWorkItem: LabModalWorkItem | undefined;
  orderTest: OrderTest | undefined;
  testDisplayName: string;
  patientName: string;
  hasResults: boolean;
  isApproving: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void | Promise<void>;
  labUrl: string | undefined;
};

/** Approve/reject or "open in lab" footer for the test-detail modal. */
export function TestDetailModalFooter({
  isValidate,
  orderTestId,
  displayWorkItem,
  orderTest,
  testDisplayName,
  patientName,
  hasResults,
  isApproving,
  onClose,
  onApprove,
  onReject,
  labUrl,
}: TestDetailModalFooterProps) {
  const navigate = useNavigate();

  if (isValidate) {
    return (
      <div className="flex items-center gap-space-2 flex-nowrap justify-end w-full">
        <QualityIssuePopover
          orderTestId={orderTestId}
          testCode={displayWorkItem?.testCode ?? orderTest?.testCode ?? ''}
          testName={displayWorkItem?.testName ?? orderTest?.testName ?? testDisplayName}
          patientName={patientName}
          trigger={
            <Button {...actionButtonPreset('reject')} size="sm" layout="icon-text">
              Reject
            </Button>
          }
          onReject={result => {
            void onReject(result);
          }}
        />
        <Button
          onClick={onApprove}
          {...actionButtonPreset('approve')}
          size="sm"
          layout="icon-text"
          isLoading={isApproving}
          disabled={!hasResults}
        >
          Approve
        </Button>
      </div>
    );
  }

  const footerStatus = labModalFooterDenyMessage(orderTest?.lab, displayWorkItem);

  if (!labUrl) {
    return <ModalFooter statusMessage={footerStatus} />;
  }

  return (
    <ModalFooter statusMessage={footerStatus}>
      <Button
        variant="primary"
        size="sm"
        layout="icon-text"
        onClick={() => {
          onClose();
          navigate(labUrl);
        }}
      >
        Open in lab
      </Button>
    </ModalFooter>
  );
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
  criticalRecord: CriticalValueRecord | undefined;
  onCriticalValueUpdated: () => void;
  ready: boolean;
  order: Order | undefined;
  catalogTest: Test | undefined;
  relatedSamples: Sample[];
  detailGridSections: DetailGridSectionConfig[] | undefined;
  onViewFullSample: (sampleId: number) => void;
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
  criticalRecord,
  onCriticalValueUpdated,
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
  return (
    <>
      {sampleRejection.showBanner ? (
        <div className="mb-space-4">
          <SampleRejectedBanner
            sampleId={sampleRejection.sampleId}
            sampleRejectionReason={sampleRejection.sampleRejectionReason}
          />
        </div>
      ) : null}

      {hasResults && orderTest?.results ? (
        <ResultValidationPanel
          preset={resultsPanelPreset}
          title={isValidate ? 'Result Validation' : 'Recorded Results'}
          results={orderTest.results}
          flags={orderTest.flags}
          testCode={orderTest.testCode}
          patient={patient}
          technicianNotes={orderTest.technicianNotes}
          comments={comments}
          onCommentsChange={onCommentsChange}
          onApprove={isValidate ? onApprove : () => {}}
          readOnly={!isValidate}
          enableApproveShortcut={isValidate}
        />
      ) : (
        <Panel
          preset={resultsPanelPreset}
          title={isValidate ? 'Result Validation' : 'Recorded Results'}
        >
          <p className={text({ role: 'label' })}>
            {orderTest ? formatPipelinePendingMessage(orderTest) : 'Loading test details…'}
          </p>
        </Panel>
      )}

      {isValidate && criticalRecord ? (
        <Panel preset="panel.compact.standard" title="Critical Value Notification">
          <CriticalValueActions record={criticalRecord} onUpdated={onCriticalValueUpdated} />
        </Panel>
      ) : null}

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
