/**
 * Unified test-detail modal — full order-test context at any pipeline stage (view or validate).
 * Filename is `detailModal.testDetail.tsx` (not a unit test).
 */

import React from 'react';
import type { TestDetailModalProps } from '@/lib/context/modalTypes';
import { QueueModalShell, labModalHeaderContext } from '../shared/detailModalLayout';
import { useTestDetailModalView } from '../model/useTestDetailModalView';
import { LabModalPlaceholder } from '../shared/labModalPlaceholders';
import {
  TestDetailHeaderColumn,
  TestDetailModalBody,
  TestDetailModalFooter,
  TestDetailModalHeaderBadges,
} from './detailModal.testDetail.parts';

/**
 * Test-detail modal orchestrator: loads the work item, then renders header/body/footer parts.
 */
export const TestDetailModal: React.FC<TestDetailModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  orderTestId,
  interaction = 'view',
  worklistRow,
}) => {
  const view = useTestDetailModalView({
    isOpen,
    onClose,
    orderTestId,
    interaction,
    worklistRow,
  });

  const headerBadges = view.displayWorkItem ? (
    <TestDetailModalHeaderBadges row={view.displayWorkItem} headerVariant={view.headerVariant} />
  ) : null;

  const modalHeader = view.contentReady
    ? labModalHeaderContext({
        stage: view.modalStage,
        contextLabel: view.testDisplayName,
        orderId: view.order!.orderId,
        badges: headerBadges ?? undefined,
      })
    : { title: 'Test', subtitle: null };

  const headerLeftColumn =
    view.contentReady && view.order && view.orderTest && view.displayWorkItem ? (
      <TestDetailHeaderColumn
        row={view.displayWorkItem}
        patientName={view.patientName}
        headerVariant={view.headerVariant}
        modalStage={view.modalStage}
        order={view.order}
        orderTest={view.orderTest}
        catalogParameterCount={view.catalogTest?.parameters?.length ?? 0}
        turnaroundHours={view.catalogTest?.turnaroundTime}
      />
    ) : null;

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      isActive={isActive}
      title={modalHeader.title}
      subtitle={modalHeader.subtitle ?? ''}
      modalKey={view.modalKey}
      disableClose={view.isApproving}
      headerLeftColumn={headerLeftColumn ?? undefined}
      footer={
        view.contentReady ? (
          <TestDetailModalFooter
            isValidate={view.isValidate}
            orderTestId={orderTestId}
            displayWorkItem={view.displayWorkItem}
            orderTest={view.orderTest}
            testDisplayName={view.testDisplayName}
            patientName={view.patientName}
            hasResults={view.hasResults}
            isApproving={view.isApproving}
            onClose={onClose}
            onApprove={view.handleApprove}
            onReject={view.handleReject}
            labUrl={view.labUrl}
          />
        ) : undefined
      }
    >
      {view.contentReady ? (
        <TestDetailModalBody
          sampleRejection={view.sampleRejection}
          hasResults={view.hasResults}
          orderTest={view.orderTest}
          isValidate={view.isValidate}
          comments={view.comments}
          resultsPanelPreset={view.resultsPanelPreset}
          onCommentsChange={view.onCommentsChange}
          onApprove={view.handleApprove}
          criticalRecord={view.criticalRecord}
          onCriticalValueUpdated={view.handleCriticalValueUpdated}
          ready={view.ready}
          order={view.order}
          catalogTest={view.catalogTest}
          relatedSamples={view.relatedSamples}
          detailGridSections={view.detailGridSections}
          onViewFullSample={view.handleViewFullSample}
          onOpenLinkedTest={view.openLinkedTest}
          orderTestId={view.orderTest?.id}
          patient={view.patient ?? undefined}
        />
      ) : (
        <LabModalPlaceholder variant={view.isValidate ? 'testDetailValidate' : 'testDetailView'} />
      )}
    </QueueModalShell>
  );
};
