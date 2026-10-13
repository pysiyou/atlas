/**
 * Presentational sections for TestDetailModal (keeps main modal file under lint limits).
 */
import { useNavigate } from 'react-router-dom';
import { actionButtonPreset, Button, Panel } from '@/components';
import { LabEventLogPanel } from '@/features/audit';
import {
  buildOrderTestOverviewFields,
  buildOrderTestWorkflowFields,
  formatPipelinePendingMessage,
  OrderTestSampleTabs,
  TestRelatedTestsPanel,
} from '@/features/orders';
import type { Order, OrderTest, Test, TestWithContext } from '@/types';
import { TYPE } from '@/components/theme/recipes';
import type { TestDetailProps } from '@/lib/context/modalTypes';
import { ResultValidationForm } from '../validation/ResultValidationForm';
import { QualityIssuePopover } from '../components/QualityIssuePopover';
import { CriticalValueActions } from '../criticalValues/CriticalValueActions';
import type { CriticalValueRecord } from '../criticalValues/criticalValues';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { SampleRejectedBanner } from '../components/SampleRejectedBanner';
import { TestWorkflowCardLeftColumn } from './queueCard.testWorkflowLeftColumn';
import { DetailGrid, ModalFooter } from './detailModalLayout';
import type { LabModalStage } from './detailModalLayout';
import type { DetailGridSectionConfig } from './detailModalLayout';
import {
  countFilledResults,
  resolveTestDetailQueueSince,
  type TestDetailHeaderVariant,
} from './testDetailHeader';
import type { Sample } from '@/types';

export function TestDetailHeaderColumn({
  labContext,
  patientName,
  headerVariant,
  modalStage,
  order,
  orderTest,
  catalogParameterCount,
  turnaroundHours,
}: {
  labContext: TestWithContext;
  patientName: string;
  headerVariant: TestDetailHeaderVariant;
  modalStage: LabModalStage;
  order: Order;
  orderTest: OrderTest;
  catalogParameterCount: number;
  turnaroundHours?: number;
}) {
  const queueSince = resolveTestDetailQueueSince(modalStage, order, orderTest, labContext);
  const flagCount = orderTest.flags?.length ?? 0;
  const filledCount = countFilledResults(orderTest.results);
  const includeResultEntered = Boolean(orderTest.resultEnteredAt || orderTest.results);

  return (
    <TestWorkflowCardLeftColumn
      test={labContext}
      patientName={patientName}
      variant={headerVariant}
      queueSince={queueSince}
      emphasizeCritical={headerVariant === 'validation'}
      flagCount={headerVariant === 'validation' ? flagCount : undefined}
      reasonCode={headerVariant === 'escalation' ? labContext.reasonCode : undefined}
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

export function TestDetailModalHeaderBadges({
  labContext,
  headerVariant,
}: {
  labContext: TestWithContext;
  headerVariant: TestDetailHeaderVariant;
}) {
  return <TestHeaderBadges test={labContext} variant={headerVariant} showStatus />;
}

type TestDetailModalFooterProps = {
  isValidate: boolean;
  validation: TestDetailProps['validation'];
  orderTestId: number;
  labContext: TestWithContext | undefined;
  orderTest: OrderTest | undefined;
  testDisplayName: string;
  patientName: string;
  hasResults: boolean;
  isApproving: boolean;
  onClose: () => void;
  onApprove: () => void;
  labUrl: string | undefined;
};

export function TestDetailModalFooter({
  isValidate,
  validation,
  orderTestId,
  labContext,
  orderTest,
  testDisplayName,
  patientName,
  hasResults,
  isApproving,
  onClose,
  onApprove,
  labUrl,
}: TestDetailModalFooterProps) {
  const navigate = useNavigate();

  if (isValidate && validation) {
    return (
      <ModalFooter statusMessage="" statusClassName="text-text-tertiary">
        <QualityIssuePopover
          orderTestId={orderTestId}
          testCode={labContext?.testCode ?? orderTest?.testCode ?? ''}
          testName={labContext?.testName ?? orderTest?.testName ?? testDisplayName}
          patientName={patientName}
          trigger={
            <Button {...actionButtonPreset('reject')} size="md" layout="icon-text">
              Reject
            </Button>
          }
          onReject={result => {
            validation.onReject(result);
            onClose();
          }}
        />
        <Button
          onClick={onApprove}
          {...actionButtonPreset('approve')}
          size="md"
          layout="icon-text"
          isLoading={isApproving}
          disabled={!hasResults}
        >
          Approve
        </Button>
      </ModalFooter>
    );
  }

  return (
    <ModalFooter statusMessage={orderTest?.lab?.denyMessage ?? ''}>
      <Button onClick={onClose} {...actionButtonPreset('cancel')} size="md" layout="icon-text">
        Close
      </Button>
      {labUrl ? (
        <Button
          variant="primary"
          size="md"
          layout="icon-text"
          onClick={() => {
            onClose();
            navigate(labUrl);
          }}
        >
          Open in lab
        </Button>
      ) : null}
    </ModalFooter>
  );
}

type TestDetailModalBodyProps = {
  sampleRejection: ReturnType<typeof import('../hooks/useSampleRejectionDisplay').useSampleRejectionDisplay>;
  hasResults: boolean;
  orderTest: OrderTest | undefined;
  isValidate: boolean;
  validation: TestDetailProps['validation'];
  comments: string;
  commentKey: string;
  resultsPanelTitle: string;
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
};

export function TestDetailModalBody({
  sampleRejection,
  hasResults,
  orderTest,
  isValidate,
  validation,
  comments,
  commentKey,
  resultsPanelTitle,
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
        <Panel variant="lab" title={resultsPanelTitle}>
          <ResultValidationForm
            results={orderTest.results}
            flags={orderTest.flags}
            technicianNotes={orderTest.technicianNotes}
            comments={comments}
            onCommentsChange={
              isValidate && validation
                ? value => validation.onCommentsChange(commentKey, value)
                : () => {}
            }
            onApprove={isValidate ? onApprove : () => {}}
            readOnly={!isValidate}
            enableApproveShortcut={isValidate}
          />
        </Panel>
      ) : (
        <Panel variant="lab" title={resultsPanelTitle}>
          <p className={TYPE.label}>
            {orderTest ? formatPipelinePendingMessage(orderTest) : 'Loading test details…'}
          </p>
        </Panel>
      )}

      {isValidate && criticalRecord ? (
        <Panel variant="lab" title="Critical Value Notification">
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

      {orderTestId != null ? <LabEventLogPanel testId={orderTestId} /> : null}
    </>
  );
}

export function buildTestDetailGridSections(
  orderTest: OrderTest,
  linked: ReturnType<typeof import('@/features/orders').findLinkedOrderTests>,
  catalogTest: Test | undefined,
  options: {
    onOpenLinkedTest?: (linkedTest: OrderTest) => void;
    omitWorkflowResultDuplicates: boolean;
    onCatalogNavigate: () => void;
  }
): DetailGridSectionConfig[] {
  return [
    {
      title: 'Workflow',
      fields: buildOrderTestWorkflowFields(orderTest, {
        linked,
        onOpenLinkedTest: options.onOpenLinkedTest,
        omitResultDuplicates: options.omitWorkflowResultDuplicates,
      }),
    },
    {
      title: 'Test overview',
      fields: buildOrderTestOverviewFields(orderTest, catalogTest, {
        onCatalogNavigate: options.onCatalogNavigate,
      }),
    },
  ];
}
