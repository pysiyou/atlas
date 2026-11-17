/**
 * Unified test-detail modal — full order-test context at any pipeline stage (view or validate).
 * Filename is `DetailModal.TestDetail.tsx` (not a unit test).
 */

import type { TestDetailModalProps } from '@/lib/context/modalTypes';
import { QueueModalShell, labModalHeaderContext } from '../shared/DetailModalLayout';
import { useTestDetailModalView } from '../model/useTestDetailModalView';
import { LabModalPlaceholder } from '../shared/LabModalPlaceholders';
import {
  TestDetailHeaderColumn,
  TestDetailModalBody,
  TestDetailModalFooter,
  TestDetailModalHeaderBadges,
} from './DetailModal.TestDetail.Parts';
import { useModuleListTitles } from '@/strings';

/**
 * Test-detail modal orchestrator: loads the work item, then renders header/body/footer parts.
 */
export function TestDetailModal({
  isOpen,
  onClose,
  isActive = true,
  orderTestId,
  interaction = 'view',
  worklistRow,
}: TestDetailModalProps) {
  const titles = useModuleListTitles();
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
    : { title: titles.testDetail, subtitle: null };

  const headerLeftColumn =
    view.contentReady && view.order && view.orderTest && view.displayWorkItem ? (
      <TestDetailHeaderColumn
        row={view.displayWorkItem}
        patientName={view.patientName}
        headerVariant={view.headerVariant}
        modalStage={view.modalStage}
        order={view.order}
        orderTest={view.orderTest}
        analyteCount={view.catalogTest?.analytes?.length ?? 0}
        turnaroundHours={view.catalogTest?.turnaroundTimeHours}
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
            hasCriticalValues={Boolean(view.orderTest?.hasCriticalValues)}
            criticalSeen={view.criticalSeen}
            onCriticalSeenChange={view.setCriticalSeen}
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
          criticalSeen={view.criticalSeen}
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
}
