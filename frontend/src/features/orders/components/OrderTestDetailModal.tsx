/**
 * Read-only order test detail — follows lab QueueModalShell layout (validation/entry modals).
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { actionButtonPreset, Button, Panel } from '@/components';
import {
  DetailGrid,
  ModalFooter,
  QueueModalShell,
  labModalSubtitle,
  type LabModalStage,
} from '@/features/lab/workflow/detailModalLayout';
import { testHeaderAudit } from '@/features/lab/constants/labWorkflowAuditLines';
import { ResultValidationForm } from '@/features/lab/validation/ResultValidationForm';
import { TestCardAlerts } from '@/features/lab/components/LabWorkflowBadges';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
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
import { displayId } from '@/utils';
import { OrderTestSampleTabs } from './OrderTestSampleTabs';
import { useOrderTestDetailSamples } from '../hooks/useOrderTestDetailSamples';
import { buildTestContextForLabMeta } from '../utils/orderTestDetailSamples';
import { findLinkedOrderTests } from '../utils/orderTestLineage';
import {
  buildOrderTestDetailGridSections,
  formatPipelinePendingMessage,
} from '../utils/orderTestDetailSections';

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

  const detailSections = useMemo(
    () => buildOrderTestDetailGridSections(orderTest, catalogTest, { onCatalogNavigate: onClose }),
    [orderTest, catalogTest, onClose]
  );

  const lineageSection =
    linked.prior || linked.replacement || orderTest.status === 'superseded'
      ? [
          {
            title: 'Test lineage',
            fields: [
              {
                label: 'Status note',
                value:
                  orderTest.status === 'superseded'
                    ? 'This entry was superseded by a later test on the order.'
                    : orderTest.isRetest
                      ? `Retest attempt ${(orderTest.retestNumber ?? 0) + 1}`
                      : undefined,
              },
              {
                label: 'Prior test',
                value: linked.prior ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => openLinkedTest(linked.prior!)}
                  >
                    {displayId.orderTest(linked.prior.id)}
                  </Button>
                ) : undefined,
              },
              {
                label: 'Replacement test',
                value: linked.replacement ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => openLinkedTest(linked.replacement!)}
                  >
                    {displayId.orderTest(linked.replacement.id)}
                  </Button>
                ) : undefined,
              },
            ],
          },
        ]
      : [];

  const headerStatusLine = useMemo(() => {
    const presentation = orderTest.lab?.statusPresentation;
    const statusText = presentation
      ? [formatStatusBadgeLabel(presentation.primary), presentation.secondary]
          .filter(Boolean)
          .join(' — ')
      : formatStatusBadgeLabel(orderTest.status);
    const parts = [
      statusText,
      labContext.sampleType ? formatStatusBadgeLabel(labContext.sampleType) : null,
      labContext.priority === 'urgent' || labContext.priority === 'high'
        ? formatStatusBadgeLabel(labContext.priority)
        : null,
    ].filter((part): part is string => Boolean(part));
    return parts.join(' · ');
  }, [orderTest.status, orderTest.lab?.statusPresentation, labContext.sampleType, labContext.priority]);

  const headerBadges = <span className={TYPE.meta}>{headerStatusLine}</span>;
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

      {hasTestResults(labContext) ? (
        <Panel variant="lab" title="Recorded results">
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
        <Panel variant="lab" title="Recorded results">
          <p className={TYPE.label}>{formatPipelinePendingMessage(orderTest)}</p>
        </Panel>
      )}

      <OrderTestSampleTabs
        samples={relatedSamples}
        linkedSampleId={orderTest.sampleId}
        catalogTest={catalogTest}
        onViewFullSample={handleViewFullSample}
      />

      <DetailGrid sections={[...lineageSection, ...detailSections]} />

      {orderTest.id != null ? <LabEventLogPanel testId={orderTest.id} /> : null}
    </QueueModalShell>
  );
};
