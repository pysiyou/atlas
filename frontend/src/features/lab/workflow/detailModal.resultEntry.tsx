/**
 * ResultEntryDetailModal — loads the order-test by id and owns entry drafts/mutations.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { CircularProgress } from '@/components/primitives';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { QueueModalShell, labModalHeaderContext } from './detailModalLayout';
import { LabEventLogPanel } from '@/features/audit';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { TestWorkflowCardLeftColumn } from './queueCard.testWorkflowLeftColumn';
import { useTestCatalog } from '@/features/catalog';
import { LabRelatedTestsPanel } from '../components/LabRelatedWorkflowPanel';
import { EntryDetailMainPanel, EntryDetailModalFooter } from './detailModal.resultEntry.helpers';
import { ResultEntryDetailGrid } from './detailModal.resultEntry.grid';
import { useEnterResults, useOrderTestContext } from '../api/results';
import { useLabDraftStore } from '../state/labDraftStore';
import { formatParameterResults } from '../entry/resultEntry';
import { orderTestKey } from '../utils/labSearchAndLinks';
import { notify } from '@/utils/feedback';
import { logger } from '@/utils/logger';
import { Modal, ModalPageShell } from '@/components/overlays';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import type { ResultDetailModalProps } from '@/lib/context/modalTypes';

function resultsFromTest(results: Record<string, unknown> | undefined): Record<string, string> {
  if (!results) return {};
  return Object.fromEntries(
    Object.entries(results).map(([key, value]) => [key, String(value ?? '')])
  );
}

export const ResultEntryDetailModal: React.FC<ResultDetailModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  orderTestId,
  readOnly = false,
}) => {
  const { test, isLoading } = useOrderTestContext(orderTestId, isOpen);
  const { tests: catalogTests = [], isLoading: catalogLoading } = useTestCatalog();
  const enterMutation = useEnterResults();
  const draft = useLabDraftStore(s => s.entry[orderTestId]);
  const seedEntryDraft = useLabDraftStore(s => s.seedEntryDraft);
  const setEntryResults = useLabDraftStore(s => s.setEntryResults);
  const setEntryNotes = useLabDraftStore(s => s.setEntryNotes);
  const clearEntryDraft = useLabDraftStore(s => s.clearEntryDraft);

  useEffect(() => {
    if (!isOpen || !test || readOnly) return;
    seedEntryDraft(orderTestId, {
      results: resultsFromTest(test.results as Record<string, unknown> | undefined),
      technicianNotes: test.technicianNotes ?? '',
    });
  }, [isOpen, test, readOnly, orderTestId, seedEntryDraft]);

  const resolvedTestDef = test
    ? catalogTests.find(catalogTest => catalogTest.code === test.testCode)
    : undefined;
  const resultKey = orderTestKey(orderTestId);

  const displayResults = useMemo(() => {
    if (readOnly && test?.results) return resultsFromTest(test.results as Record<string, unknown>);
    return draft?.results ?? {};
  }, [readOnly, test, draft]);

  const displayNotes = readOnly ? (test?.technicianNotes ?? '') : (draft?.technicianNotes ?? '');

  const saveAction = useAsyncAction(
    useCallback(
      async (_signal: AbortSignal) => {
        if (!test || !resolvedTestDef) return;
        const formatted = formatParameterResults(displayResults, resolvedTestDef, test);
        if (!formatted) return;
        try {
          await enterMutation.mutateAsync({
            orderId: test.orderId,
            orderTestId,
            results: formatted,
            technicianNotes: displayNotes || undefined,
          });
          notify.toast('lab.entry.save.success');
          clearEntryDraft(orderTestId);
          onClose();
        } catch (error) {
          logger.error('Error saving results', error instanceof Error ? error : undefined);
          notify.apiError('lab.entry.save.error', error);
          throw error;
        }
      },
      [
        test,
        resolvedTestDef,
        displayResults,
        displayNotes,
        enterMutation,
        orderTestId,
        clearEntryDraft,
        onClose,
      ]
    ),
    { minDisplayMs: 100 }
  );
  const isSaving = saveAction.isPending;

  const waitingOnCatalog = Boolean(test) && catalogLoading && !resolvedTestDef;
  if (isOpen && ((isLoading && !test) || waitingOnCatalog)) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Result entry" size="3xl" isActive={isActive}>
        <ModalPageShell>
          <DetailPageSkeleton variant="responsive-detail" />
        </ModalPageShell>
      </Modal>
    );
  }

  if (!test || !resolvedTestDef?.parameters) return null;

  const canEnter = test.allowedActions?.enterResults !== false;
  const filledCount = Object.values(displayResults).filter(value => value?.trim()).length;
  const totalParams = resolvedTestDef.parameters.length;
  const isComplete = filledCount === totalParams;
  const completionPercentage = totalParams > 0 ? Math.round((filledCount / totalParams) * 100) : 0;
  const turnaroundTime = resolvedTestDef.turnaroundTime;
  const showTurnaroundTime =
    typeof turnaroundTime === 'number' && Number.isFinite(turnaroundTime) && turnaroundTime > 0;
  const remainingParams = totalParams - filledCount;

  const handleLocalResultChange = (_key: string, paramCode: string, value: string) => {
    setEntryResults(orderTestId, { ...displayResults, [paramCode]: value });
  };

  const handleLocalNotesChange = (_key: string, notes: string) => {
    setEntryNotes(orderTestId, notes);
  };

  const handleSave = () => {
    if (!isComplete || !canEnter) return;
    saveAction.execute();
  };

  const progressIndicator = (
    <CircularProgress
      size={18}
      percentage={completionPercentage}
      trackColorClass="stroke-border-default"
      progressColorClass={completionPercentage === 100 ? 'stroke-success' : 'stroke-brand'}
      label={`${filledCount}/${totalParams}`}
      className="h-7"
    />
  );

  const patientName = test.patientName || '—';
  const headerBadges = <TestHeaderBadges test={test} variant="entry" showStatus />;
  const { title: modalTitle, subtitle: modalSubtitle } = labModalHeaderContext({
    stage: 'entry',
    contextLabel: test.testName,
    orderId: test.orderId,
    badges: headerBadges,
  });
  const headerLeftColumn = (
    <TestWorkflowCardLeftColumn
      test={test}
      patientName={patientName}
      variant="entry"
      queueSince={test.collectedAt}
      filledCount={filledCount}
      parameterCount={totalParams}
      turnaroundHours={turnaroundTime}
      tone="modal"
    />
  );

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      isActive={isActive}
      title={modalTitle}
      subtitle={modalSubtitle}
      modalKey={readOnly ? `historical-${test.id}` : resultKey}
      disableClose={isSaving}
      headerLeftColumn={headerLeftColumn}
      footer={
        <EntryDetailModalFooter
          readOnly={readOnly}
          isSaving={isSaving}
          isComplete={isComplete}
          canEnter={canEnter}
          denyMessage={test.denyMessage}
          onSave={handleSave}
        />
      }
    >
      <EntryDetailMainPanel
        readOnly={readOnly}
        test={test}
        resolvedTestDef={resolvedTestDef}
        resultKey={resultKey}
        displayResults={displayResults}
        displayNotes={displayNotes}
        progressIndicator={progressIndicator}
        isComplete={isComplete}
        canEnter={canEnter}
        onResultsChange={handleLocalResultChange}
        onNotesChange={handleLocalNotesChange}
        onSave={handleSave}
      />

      <LabRelatedTestsPanel test={test} isOpen={isOpen} />

      <ResultEntryDetailGrid
        test={test}
        totalParams={totalParams}
        filledCount={filledCount}
        isComplete={isComplete}
        remainingParams={remainingParams}
        showTurnaroundTime={showTurnaroundTime}
        turnaroundTime={turnaroundTime}
      />
      {test.id != null && <LabEventLogPanel testId={test.id} />}
    </QueueModalShell>
  );
};
