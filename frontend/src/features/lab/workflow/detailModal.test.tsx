/**
 * Unified test detail modal — full order-test context at any pipeline stage (view or validate).
 */

import React, { useMemo } from 'react';
import type { BaseModalProps, TestDetailProps } from '@/lib/context/modalTypes';
import type { TestWithContext } from '@/types';
import { buildCriticalValueRecord } from '../criticalValues/criticalValues';
import { useSampleRejectionDisplay } from '../hooks/useSampleRejectionDisplay';
import { useTestDetailModalActions } from './useTestDetailModalActions';
import { QueueModalShell, labModalSubtitle } from './detailModalLayout';
import { useTestDetailModel } from './useTestDetailModel';
import { useTestDetailModalDerived } from './useTestDetailModalDerived';
import {
  TestDetailHeaderColumn,
  TestDetailModalBody,
  TestDetailModalFooter,
  TestDetailModalHeaderBadges,
} from './detailModal.test.helpers';

export type TestDetailModalProps = BaseModalProps & TestDetailProps;

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
  orderTestId,
  order: orderProp,
  orderTest: orderTestProp,
  patient: patientProp,
  test: testProp,
  interaction = 'view',
  validation,
}) => {
  const isValidate = interaction === 'validate' && validation != null;

  const model = useTestDetailModel({
    isOpen,
    orderTestId,
    order: orderProp,
    orderTest: orderTestProp,
    patient: patientProp,
    test: testProp,
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

  const sampleRejection = useSampleRejectionDisplay(labContext ?? testProp ?? EMPTY_REJECTION_CONTEXT);
  const criticalRecord = useMemo(() => {
    if (!labContext) return undefined;
    return buildCriticalValueRecord(labContext) ?? undefined;
  }, [labContext]);

  const {
    handleApprove,
    isApproving,
    handleCriticalValueUpdated,
    openLinkedTest,
    handleViewFullSample,
  } = useTestDetailModalActions({
    validation,
    onClose,
    order,
    patientProp,
    modelPatient: model.patient,
  });

  const {
    hasResults,
    detailGridSections,
    labUrl,
    modalKey,
    comments,
    commentKey,
    resultsPanelTitle,
  } = useTestDetailModalDerived({
    order,
    orderTest,
    linked,
    catalogTest,
    openLinkedTest,
    onClose,
    labContext,
    isValidate,
    validation,
    orderTestId,
  });

  const headerBadges = labContext
    ? <TestDetailModalHeaderBadges labContext={labContext} headerVariant={headerVariant} />
    : null;

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
      title={testDisplayName}
      subtitle={labModalSubtitle(modalStage)}
      modalKey={modalKey}
      disableClose={isApproving}
      headerBadges={headerBadges}
      headerLeftColumn={headerLeftColumn}
      footer={
        <TestDetailModalFooter
          isValidate={isValidate}
          validation={validation}
          orderTestId={orderTestId}
          labContext={labContext}
          orderTest={orderTest}
          testDisplayName={testDisplayName}
          patientName={patientName}
          hasResults={hasResults}
          isApproving={isApproving}
          onClose={onClose}
          onApprove={handleApprove}
          labUrl={labUrl}
        />
      }
    >
      <TestDetailModalBody
        sampleRejection={sampleRejection}
        hasResults={hasResults}
        orderTest={orderTest}
        isValidate={isValidate}
        validation={validation}
        comments={comments}
        commentKey={commentKey}
        resultsPanelTitle={resultsPanelTitle}
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
