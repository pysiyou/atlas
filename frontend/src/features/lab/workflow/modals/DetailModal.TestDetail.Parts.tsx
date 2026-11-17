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
import type { QualityIssueResult } from '@/types';
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import { useSampleRejectionDisplay } from '../../hooks/useSampleRejectionDisplay';
import { ResultValidationPanel } from '../../validation/ResultValidationForm';
import { QualityIssuePopover } from '../../components/QualityIssuePopover';
import { CriticalSeenConfirm } from '../../validation/CriticalSeenConfirm';
import { TestHeaderBadges } from '../../components/LabWorkflowBadges';
import { SampleRejectedBanner } from '../../components/SampleRejectedBanner';
import {
  DetailGrid,
  ModalFooter,
  type LabModalStage,
  type DetailGridSectionConfig,
} from '../shared/DetailModalLayout';
import { TestWorkflowCardLeftColumn } from '../shared/QueueCardLeftColumn';
import {
  countFilledResults,
  resolveTestDetailQueueSince,
  type TestDetailHeaderVariant,
} from '../shared/testDetailHeader';
import { labModalFooterDenyMessage } from '../../utils/queueDisplay';
import { useLabCopy } from '@/strings';

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
  hasCriticalValues?: boolean;
  criticalSeen?: boolean;
  onCriticalSeenChange?: (checked: boolean) => void;
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
  hasCriticalValues = false,
  criticalSeen = false,
  onCriticalSeenChange,
}: TestDetailModalFooterProps) {
  const navigate = useNavigate();

  if (isValidate) {
    const approveDisabled = !hasResults || (hasCriticalValues && !criticalSeen);
    return (
      <ModalFooter>
        {hasCriticalValues && onCriticalSeenChange ? (
          <CriticalSeenConfirm
            id={`critical-seen-modal-${orderTestId}`}
            checked={criticalSeen}
            onChange={onCriticalSeenChange}
            disabled={isApproving}
          />
        ) : null}
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
          disabled={approveDisabled}
        >
          Approve
        </Button>
      </ModalFooter>
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
  criticalSeen?: boolean;
  ready: boolean;
  order: Order | undefined;
  catalogTest: Test | undefined;
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
  const resultsTitle = isValidate ? labCopy.panels.resultValidation : labCopy.panels.recordedResults;
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
            isValidate && (!orderTest.hasCriticalValues || criticalSeen)
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
