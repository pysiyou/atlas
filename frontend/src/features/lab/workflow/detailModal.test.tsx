/**
 * Unified test detail modal — full order-test context at any pipeline stage (view or validate).
 */

import React, { useMemo } from 'react';
import type { TestDetailModalProps } from '@/lib/context/modalTypes';
import type { TestWithContext } from '@/types';
import { buildCriticalValueRecord } from '../criticalValues/criticalValues';
import { useSampleRejectionDisplay } from '../hooks/useSampleRejectionDisplay';
import { useTestDetailModalActions } from './useTestDetailModalActions';
import { QueueModalShell, labModalHeaderContext } from './detailModalLayout';
import { useTestDetailModel } from './useTestDetailModel';
import { useTestDetailModalDerived } from './useTestDetailModalDerived';
import {
  TestDetailHeaderColumn,
  TestDetailModalBody,
  TestDetailModalFooter,
  TestDetailModalHeaderBadges,
} from './detailModal.test.helpers';
import { useOrderTestContext } from '../api/results';
import { Modal, ModalPageShell } from '@/components/overlays';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';

const EMPTY_REJECTION_CONTEXT: TestWithContext = {
  orderId: 0,
  patientId: 0,
  patientName: '',
  testName: '',
  testCode: '',
  priority: 'routine',
  status: 'pending',
};

export const TestDetailModal: React.FC<TestDetailModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  orderTestId,
  interaction = 'view',
}) => {
  const { test: fetchedTest, isLoading: isContextLoading } = useOrderTestContext(orderTestId, isOpen);

  const model = useTestDetailModel({
    isOpen,
    orderTestId,
    test: fetchedTest,
  });

  const {
    order,
    orderTest,
    labContext,
    catalogTest,
    testDisplayName,
    relatedSamples,
    linked,
    modalStage,
    headerVariant,
    patientName,
    patient,
    ready,
  } = model;

  const sampleRejection = useSampleRejectionDisplay(labContext ?? fetchedTest ?? EMPTY_REJECTION_CONTEXT);
  const criticalRecord = useMemo(() => {
    if (!labContext) return undefined;
    return buildCriticalValueRecord(labContext) ?? undefined;
  }, [labContext]);

  const {
    handleApprove,
    isApproving,
    handleReject,
    handleCriticalValueUpdated,
    openLinkedTest,
    handleViewFullSample,
  } = useTestDetailModalActions({
    interaction,
    orderTestId,
    orderId: order?.orderId ?? fetchedTest?.orderId,
    onClose,
  });

  const {
    isValidate,
    hasResults,
    detailGridSections,
    labUrl,
    modalKey,
    comments,
    resultsPanelPreset,
    onCommentsChange,
  } = useTestDetailModalDerived({
    order,
    orderTest,
    linked,
    catalogTest,
    openLinkedTest,
    onClose,
    labContext,
    interaction,
    orderTestId,
  });

  if (isOpen && isContextLoading && !fetchedTest && !ready) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Test" size="3xl" isActive={isActive}>
        <ModalPageShell>
          <DetailPageSkeleton variant="responsive-detail" />
        </ModalPageShell>
      </Modal>
    );
  }

  const headerBadges = labContext
    ? <TestDetailModalHeaderBadges labContext={labContext} headerVariant={headerVariant} />
    : null;

  const modalHeader =
    ready && order
      ? labModalHeaderContext({
          stage: modalStage,
          contextLabel: testDisplayName,
          orderId: order.orderId,
          badges: headerBadges ?? undefined,
        })
      : { title: testDisplayName, subtitle: null };

  const headerLeftColumn =
    ready && labContext && order && orderTest ? (
      <TestDetailHeaderColumn
        labContext={labContext}
        patientName={patientName}
        headerVariant={headerVariant}
        modalStage={modalStage}
        order={order}
        orderTest={orderTest}
        catalogParameterCount={catalogTest?.parameters?.length ?? 0}
        turnaroundHours={catalogTest?.turnaroundTime}
      />
    ) : null;

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      isActive={isActive}
      title={modalHeader.title}
      subtitle={modalHeader.subtitle ?? ''}
      modalKey={modalKey}
      disableClose={isApproving}
      headerLeftColumn={headerLeftColumn}
      footer={
        <TestDetailModalFooter
          isValidate={isValidate}
          orderTestId={orderTestId}
          labContext={labContext}
          orderTest={orderTest}
          testDisplayName={testDisplayName}
          patientName={patientName}
          hasResults={hasResults}
          isApproving={isApproving}
          onClose={onClose}
          onApprove={handleApprove}
          onReject={handleReject}
          labUrl={labUrl}
        />
      }
    >
      <TestDetailModalBody
        sampleRejection={sampleRejection}
        hasResults={hasResults}
        orderTest={orderTest}
        isValidate={isValidate}
        comments={comments}
        resultsPanelPreset={resultsPanelPreset}
        onCommentsChange={onCommentsChange}
        onApprove={handleApprove}
        criticalRecord={criticalRecord}
        onCriticalValueUpdated={handleCriticalValueUpdated}
        ready={ready}
        order={order}
        catalogTest={catalogTest}
        relatedSamples={relatedSamples}
        detailGridSections={detailGridSections}
        onViewFullSample={handleViewFullSample}
        onOpenLinkedTest={openLinkedTest}
        orderTestId={orderTest?.id}
        patient={patient ?? undefined}
      />
    </QueueModalShell>
  );
};
