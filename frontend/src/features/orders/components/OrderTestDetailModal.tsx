/**
 * Read-only order test detail — follows lab QueueModalShell layout (validation/entry modals).
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { actionButtonPreset, Button, Panel } from '@/components';
import {
  ModalFooter,
  QueueModalShell,
  labModalSubtitle,
  type LabModalStage,
} from '@/features/lab/workflow/detailModalLayout';
import { testHeaderAudit } from '@/features/lab/constants/labWorkflowAuditLines';
import { ResultValidationForm } from '@/features/lab/validation/ResultValidationForm';
import { TestCardAlerts, TestHeaderBadges } from '@/features/lab/components/LabWorkflowBadges';
import { useSampleRejectionDisplay } from '@/features/lab/hooks/useSampleRejectionDisplay';
import { SampleRejectedBanner } from '@/features/lab/components/SampleRejectedBanner';
import { getLabQueueUrlForTest } from '@/features/lab';
import { hasTestResults } from '@/features/lab/utils/labSearchAndLinks';
import { LabEventLogPanel } from '@/features/audit';
import { useTestCatalog } from '@/features/catalog';
import { getTestName } from '@/features/catalog/testLookup';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import type { BaseModalProps, OrderTestDetailProps } from '@/lib/context/modalTypes';
import type { LabWorkItemProjection } from '@/types/labProjection';
import type { OrderTest } from '@/types';
import { TYPE } from '@/components/theme/recipes';
import { OrderTestSampleTabs } from './OrderTestSampleTabs';
import { useOrderTestDetailSamples } from '../hooks/useOrderTestDetailSamples';
import { buildTestContextForLabMeta } from '../utils/orderTestDetailSamples';
import { findLinkedOrderTests } from '../utils/orderTestLineage';
import { formatPipelinePendingMessage } from '../utils/orderTestDetailSections';
import { OrderTestOverviewPanel } from './OrderTestOverviewPanel';
import { OrderTestWorkflowPanel } from './OrderTestWorkflowPanel';
import { OrderTestRelatedTestsPanel } from './OrderTestRelatedTestsPanel';

export type OrderTestDetailModalProps = BaseModalProps & OrderTestDetailProps;

function resolveModalStage(lab?: LabWorkItemProjection | null): LabModalStage {
  const stage = lab?.pipelineStage;
  if (stage === 'escalation') return 'escalation';
  if (stage === 'validation' || stage === 'completed') return 'validation';
  if (stage === 'entry') return 'entry';
  if (stage === 'collection') return 'collection';
  return 'validation';
}

function resolveHeaderVariant(
  stage: LabModalStage
): 'entry' | 'validation' | 'escalation' {
  if (stage === 'escalation') return 'escalation';
  if (stage === 'entry' || stage === 'collection') return 'entry';
  return 'validation';
}

// eslint-disable-next-line max-lines-per-function
export const OrderTestDetailModal: React.FC<OrderTestDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  orderTest,
  patient,
}) => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { tests: catalogTests = [] } = useTestCatalog();
  const catalogTest = catalogTests.find(t => t.code === orderTest.testCode);
  const testDisplayName = getTestName(orderTest.testCode, catalogTests);

  const { relatedSamples } = useOrderTestDetailSamples(order.orderId, orderTest, isOpen);
  const activeSample =
    relatedSamples.find(s => s.sampleId === orderTest.sampleId) ?? relatedSamples[0];

  const labContext = useMemo(
    () => buildTestContextForLabMeta(order, orderTest, patient, activeSample),
    [order, orderTest, patient, activeSample]
  );

  const sampleRejection = useSampleRejectionDisplay(labContext);
  const linked = useMemo(() => findLinkedOrderTests(order, orderTest), [order, orderTest]);

  const modalStage = resolveModalStage(orderTest.lab);
  const headerVariant = resolveHeaderVariant(modalStage);
  const flagCount = orderTest.flags?.length ?? 0;

  const labUrl = getLabQueueUrlForTest(orderTest, order.orderId);
  const primarySampleId = orderTest.sampleId ?? relatedSamples[0]?.sampleId;

  const openLinkedTest = useCallback(
    (test: OrderTest) => {
      openModal(ModalType.ORDER_TEST_DETAIL, { order, orderTest: test, patient });
    },
    [openModal, order, patient]
  );

  const handleViewFullSample = useCallback(
    (sampleId: number) => {
      openModal(ModalType.SAMPLE_DETAIL, { sampleId: String(sampleId), readOnly: true });
    },
    [openModal]
  );

  const hasResults = hasTestResults(labContext);
  const omitWorkflowResultDuplicates = hasResults;

  const headerBadges = (
    <TestHeaderBadges test={labContext} variant={headerVariant} showStatus />
  );
  const headerMeta = (
    <TestCardAlerts
      test={labContext}
      variant={headerVariant}
      emphasizeCritical={headerVariant === 'validation'}
      queueSince={orderTest.resultEnteredAt}
      flagCount={headerVariant === 'validation' ? flagCount : undefined}
    />
  );

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={testDisplayName}
      subtitle={labModalSubtitle(modalStage)}
      modalKey={`order-test-${orderTest.id ?? orderTest.testCode}`}
      headerBadges={headerBadges}
      headerMeta={headerMeta}
      contextInfo={{
        patientName: patient?.fullName ?? order.patientName,
        patientId: order.patientId,
        orderId: order.orderId,
        orderTestId: orderTest.id,
        entityCode: orderTest.testCode,
        entityName: testDisplayName,
        referringPhysician: order.referringPhysician,
        sampleId: labContext.sampleId,
      }}
      headerAudit={testHeaderAudit(labContext, { includeResultEntered: true })}
      footer={
        <ModalFooter statusMessage={orderTest.lab?.denyMessage ?? ''}>
          <Button onClick={onClose} {...actionButtonPreset('cancel')} size="md" layout="icon-text">
            Close
          </Button>
          {primarySampleId != null ? (
            <Button
              {...actionButtonPreset('view')}
              size="md"
              layout="icon-text"
              onClick={() => handleViewFullSample(primarySampleId)}
            >
              View sample
            </Button>
          ) : null}
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
      }
    >
      {sampleRejection.showBanner && (
        <div className="mb-space-4">
          <SampleRejectedBanner
            sampleId={sampleRejection.sampleId}
            sampleRejectionReason={sampleRejection.sampleRejectionReason}
          />
        </div>
      )}

      <OrderTestOverviewPanel
        orderTest={orderTest}
        catalogTest={catalogTest}
        onCatalogNavigate={onClose}
      />

      <OrderTestWorkflowPanel
        orderTest={orderTest}
        linked={linked}
        onOpenLinkedTest={openLinkedTest}
        omitResultDuplicates={omitWorkflowResultDuplicates}
      />

      <OrderTestRelatedTestsPanel
        order={order}
        orderTest={orderTest}
        onOpenOrderTest={openLinkedTest}
      />

      <OrderTestSampleTabs
        samples={relatedSamples}
        linkedSampleId={orderTest.sampleId}
        catalogTest={catalogTest}
        onViewFullSample={handleViewFullSample}
      />

      {hasResults ? (
        <Panel variant="lab" title="Recorded Results">
          <ResultValidationForm
            results={orderTest.results!}
            flags={orderTest.flags}
            technicianNotes={orderTest.technicianNotes}
            comments={orderTest.validationNotes ?? ''}
            onCommentsChange={() => {}}
            onApprove={() => {}}
            readOnly
            enableApproveShortcut={false}
          />
        </Panel>
      ) : (
        <Panel variant="lab" title="Recorded Results">
          <p className={TYPE.label}>{formatPipelinePendingMessage(orderTest)}</p>
        </Panel>
      )}

      {orderTest.id != null ? <LabEventLogPanel testId={orderTest.id} /> : null}
    </QueueModalShell>
  );
};
