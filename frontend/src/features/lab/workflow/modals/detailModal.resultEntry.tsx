/**
 * ResultEntryDetailModal — loads the order-test by id and owns entry drafts/mutations.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { actionButtonPreset, Button, CircularProgress } from '@/components/primitives';
import { Panel } from '@/components/surfaces';
import { ResultEntryForm } from '../../entry/ResultEntryForm';
import { ResultValidationPanel } from '../../validation/ResultValidationForm';
import type { Test } from '@/types';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useListLoadErrorToast } from '@/hooks/listPage/useListLoadErrorToast';
import { ModalFooter, QueueModalShell, labModalHeaderContext } from '../shared/detailModalLayout';
import { LazyLabEventLogPanel } from '@/features/audit/LazyLabEventLogPanel';
import { TestHeaderBadges } from '../../components/LabWorkflowBadges';
import { TestWorkflowCardLeftColumn } from '../shared/queueCardLeftColumn';
import { useTest } from '@/features/catalog';
import { LabRelatedTestsPanel } from '../../components/LabRelatedWorkflowPanel';
import { ResultEntryDetailGrid } from './detailModal.resultEntry.grid';
import { useEnterResults } from '../../api/results';
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import { entryDraftLifecycleKey, useLabDraftStore } from '../../state/labDraftStore';
import { toRawResultPayload } from '../../entry/resultEntry';
import { resultsFromOrderTest } from '../../entry/orderTestResults';
import { hasResultsOnWorkItem, orderTestKey } from '../../utils/labSearchAndLinks';
import {
  isLabActionAllowed,
  labDisabledActionTooltip,
  labModalFooterDenyMessage,
} from '../../utils/queueDisplay';
import { notify } from '@/feedback';
import { logger } from '@/utils/logger';
import { Modal, ModalPageShell } from '@/components/overlays';
import { LabModalPlaceholder } from '../shared/labModalPlaceholders';
import type { ResultDetailModalProps } from '@/lib/context/modalTypes';
import { useLabModalWorkItemModel } from '../model/useLabModalWorkItemModel';

export const ResultEntryDetailModal: React.FC<ResultDetailModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  orderTestId,
  readOnly = false,
  worklistRow,
}) => {
  const queryClient = useQueryClient();
  const {
    order,
    orderTest,
    displayWorkItem,
    patientName,
    orderTestSnapshot,
    isContextLoading,
    isContextError,
    isOrderLoading,
    contextError,
    refetchContext,
    ready,
  } = useLabModalWorkItemModel({
    isOpen,
    orderTestId,
    worklistRow,
  });

  const testCode =
    orderTest?.testCode ?? displayWorkItem?.testCode ?? orderTestSnapshot?.testCode ?? undefined;
  const {
    test: resolvedTestDef,
    isLoading: catalogLoading,
    isError: catalogError,
    error: catalogQueryError,
  } = useTest(isOpen ? testCode : undefined);
  const enterMutation = useEnterResults();
  const draft = useLabDraftStore(s => s.entry[orderTestId]);
  const seedEntryDraft = useLabDraftStore(s => s.seedEntryDraft);
  const setEntryResults = useLabDraftStore(s => s.setEntryResults);
  const setEntryNotes = useLabDraftStore(s => s.setEntryNotes);
  const clearEntryDraft = useLabDraftStore(s => s.clearEntryDraft);

  const seedStatus = orderTest?.status ?? orderTestSnapshot?.status;
  const seedResultEnteredAt = orderTest?.resultEnteredAt ?? orderTestSnapshot?.resultEnteredAt;
  const seedResults = orderTest?.results ?? orderTestSnapshot?.results;
  const seedNotes = orderTest?.technicianNotes ?? orderTestSnapshot?.technicianNotes;

  useEffect(() => {
    if (!isOpen || readOnly) return;
    if (seedStatus == null && !orderTestSnapshot && !orderTest) return;
    seedEntryDraft(orderTestId, {
      results: resultsFromOrderTest(seedResults as Record<string, unknown> | undefined),
      technicianNotes: seedNotes ?? '',
      lifecycleKey: entryDraftLifecycleKey(seedStatus, seedResultEnteredAt),
    });
  }, [
    isOpen,
    readOnly,
    orderTest,
    orderTestSnapshot,
    orderTestId,
    seedEntryDraft,
    seedStatus,
    seedResultEnteredAt,
    seedResults,
    seedNotes,
  ]);

  const resultKey = orderTestKey(orderTestId);

  const displayResults = useMemo(() => {
    if (readOnly && (orderTest?.results || orderTestSnapshot?.results)) {
      const raw = (orderTest?.results ?? orderTestSnapshot?.results) as
        | Record<string, unknown>
        | undefined;
      return resultsFromOrderTest(raw);
    }
    return draft?.results ?? {};
  }, [readOnly, orderTest, orderTestSnapshot, draft]);

  const displayNotes = readOnly
    ? (orderTest?.technicianNotes ?? orderTestSnapshot?.technicianNotes ?? '')
    : (draft?.technicianNotes ?? '');

  const contextLoadFailed = isOpen && (isContextError || catalogError);
  const mergedContextError = contextError ?? catalogQueryError;
  const retryContextLoad = useCallback(() => {
    refetchContext();
  }, [refetchContext]);

  useListLoadErrorToast(
    'lab.entry.context.loadFailed',
    contextLoadFailed,
    mergedContextError,
    retryContextLoad
  );

  const orderIdForSave =
    order?.orderId ?? displayWorkItem?.orderId ?? orderTestSnapshot?.orderId;

  const saveAction = useAsyncAction(
    useCallback(
      async (_signal: AbortSignal) => {
        if (!resolvedTestDef || orderIdForSave == null) return;
        const rawResults = toRawResultPayload(displayResults, resolvedTestDef);
        if (!rawResults) return;
        try {
          await enterMutation.mutateAsync({
            orderId: orderIdForSave,
            orderTestId,
            results: rawResults,
            technicianNotes: displayNotes || undefined,
          });
          notify.show('lab.entry.save.success');
          clearEntryDraft(orderTestId);
          onClose();
        } catch (error) {
          logger.error('Error saving results', error instanceof Error ? error : undefined);
          notify.apiError('lab.entry.save.error', error);
          throw error;
        }
      },
      [
        resolvedTestDef,
        orderIdForSave,
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

  const catalogReady = !testCode || (Boolean(resolvedTestDef?.parameters) && !catalogLoading);
  const awaitingOpen = isOpen && !displayWorkItem && (isContextLoading || Boolean(orderTestSnapshot));
  const contentReady = Boolean(
    displayWorkItem &&
      (readOnly && hasResultsOnWorkItem(displayWorkItem)
        ? !isContextLoading
        : ready && catalogReady && !isOrderLoading)
  );

  if (!isOpen) {
    return null;
  }

  if (isOpen && contextLoadFailed) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Result entry" size="3xl" isActive={isActive}>
        <ModalPageShell>
          <div className="flex justify-center p-panel">
            <Button {...actionButtonPreset('retry')} size="sm" onClick={retryContextLoad}>
              Retry
            </Button>
          </div>
        </ModalPageShell>
      </Modal>
    );
  }

  if (!displayWorkItem && !awaitingOpen) {
    return null;
  }

  if (isOpen && catalogError && !contentReady) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Result entry" size="3xl" isActive={isActive}>
        <ModalPageShell>
          <div className="flex justify-center p-panel">
            <Button
              {...actionButtonPreset('retry')}
              size="sm"
              onClick={() => {
                if (testCode) {
                  void queryClient.invalidateQueries({
                    queryKey: queryKeys.tests.byCode(testCode),
                  });
                }
              }}
            >
              Retry
            </Button>
          </div>
        </ModalPageShell>
      </Modal>
    );
  }

  const allowedActions =
    orderTest?.lab?.allowedActions ??
    displayWorkItem?.allowedActions ??
    orderTestSnapshot?.allowedActions;
  const canEnter = isLabActionAllowed(allowedActions ?? undefined, 'enterResults');
  const denyMessage =
    orderTest?.lab?.denyMessage ??
    displayWorkItem?.denyMessage ??
    orderTestSnapshot?.denyMessage;
  const testDisplayName = orderTest?.testName ?? displayWorkItem?.testName ?? '';
  const orderId = order?.orderId ?? displayWorkItem?.orderId ?? orderTestSnapshot?.orderId ?? 0;
  const filledCount = Object.values(displayResults).filter(value => value?.trim()).length;
  const totalParams = resolvedTestDef?.parameters?.length ?? 0;
  const isComplete = filledCount === totalParams;
  const completionPercentage = totalParams > 0 ? Math.round((filledCount / totalParams) * 100) : 0;
  const turnaroundTime = resolvedTestDef?.turnaroundTime;
  const showTurnaroundTime =
    typeof turnaroundTime === 'number' && Number.isFinite(turnaroundTime) && turnaroundTime > 0;
  const remainingParams = totalParams - filledCount;

  const handleLocalResultChange = (_key: string, paramCode: string, value: string) => {
    setEntryResults(orderTestId, { ...displayResults, [paramCode]: value ?? '' });
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

  const workItem = displayWorkItem;
  const headerBadges =
    contentReady && workItem ? (
      <TestHeaderBadges row={workItem} variant="entry" showStatus />
    ) : null;
  const { title: modalTitle, subtitle: modalSubtitle } = contentReady
    ? labModalHeaderContext({
        stage: 'entry',
        contextLabel: testDisplayName,
        orderId,
        badges: headerBadges ?? undefined,
      })
    : { title: 'Result entry', subtitle: '' };
  const headerLeftColumn =
    contentReady && resolvedTestDef && workItem ? (
      <TestWorkflowCardLeftColumn
        row={workItem}
        patientName={patientName || workItem.patientName || '—'}
        variant="entry"
        queueSince={workItem.collectedAt ?? undefined}
        filledCount={filledCount}
        parameterCount={totalParams}
        turnaroundHours={turnaroundTime}
        tone="modal"
      />
    ) : undefined;

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      isActive={isActive}
      title={modalTitle}
      subtitle={modalSubtitle}
      modalKey={readOnly ? `historical-${orderTestId}` : resultKey}
      disableClose={isSaving}
      headerLeftColumn={headerLeftColumn}
      footer={
        contentReady ? (
          <EntryDetailModalFooter
            readOnly={readOnly}
            isSaving={isSaving}
            isComplete={isComplete}
            canEnter={canEnter}
            footerDenyStatus={
              !canEnter
                ? labModalFooterDenyMessage(
                    orderTest?.lab,
                    displayWorkItem,
                    orderTestSnapshot
                  )
                : ''
            }
            saveDisabledTitle={
              !canEnter
                ? labDisabledActionTooltip(
                    { denyMessage },
                    orderTest?.lab,
                    displayWorkItem,
                    orderTestSnapshot
                  )
                : undefined
            }
            onSave={handleSave}
          />
        ) : undefined
      }
    >
      {contentReady && resolvedTestDef && workItem ? (
        <>
          <EntryDetailMainPanel
            readOnly={readOnly}
            workItem={workItem}
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

          <LabRelatedTestsPanel
            orderId={workItem.orderId}
            orderTestId={workItem.orderTestId}
            isOpen={isOpen}
            order={order}
          />

          <ResultEntryDetailGrid
            workItem={workItem}
            totalParams={totalParams}
            filledCount={filledCount}
            isComplete={isComplete}
            remainingParams={remainingParams}
            showTurnaroundTime={showTurnaroundTime}
            turnaroundTime={turnaroundTime}
          />
          <LazyLabEventLogPanel testId={workItem.orderTestId} />
        </>
      ) : (
        <LabModalPlaceholder variant="resultEntry" />
      )}
    </QueueModalShell>
  );
};

function EntryDetailModalFooter({
  readOnly,
  isSaving,
  isComplete,
  canEnter,
  footerDenyStatus,
  saveDisabledTitle,
  onSave,
}: {
  readOnly: boolean;
  isSaving: boolean;
  isComplete: boolean;
  canEnter: boolean;
  footerDenyStatus: string;
  saveDisabledTitle?: string;
  onSave: () => void;
}) {
  if (readOnly) {
    return null;
  }
  return (
    <ModalFooter statusMessage={footerDenyStatus}>
      <Button
        onClick={onSave}
        {...actionButtonPreset('save')}
        size="sm"
        layout="icon-text"
        disabled={!isComplete || !canEnter}
        title={saveDisabledTitle}
        isLoading={isSaving}
      >
        Save
      </Button>
    </ModalFooter>
  );
}

function EntryDetailMainPanel({
  readOnly,
  workItem,
  resolvedTestDef,
  resultKey,
  displayResults,
  displayNotes,
  progressIndicator,
  isComplete,
  canEnter,
  onResultsChange,
  onNotesChange,
  onSave,
}: {
  readOnly: boolean;
  workItem: LabModalWorkItem;
  resolvedTestDef: Test;
  resultKey: string;
  displayResults: Record<string, string>;
  displayNotes: string;
  progressIndicator: React.ReactNode;
  isComplete: boolean;
  canEnter: boolean;
  onResultsChange: (key: string, paramCode: string, value: string) => void;
  onNotesChange: (key: string, notes: string) => void;
  onSave: () => void;
}) {
  if (readOnly && hasResultsOnWorkItem(workItem)) {
    return (
      <ResultValidationPanel
        preset="panel.compact.scrollAuto.maxH"
        title="Recorded Results"
        results={workItem.results ?? {}}
        flags={workItem.flags ?? undefined}
        testCode={workItem.testCode}
        technicianNotes={workItem.technicianNotes ?? undefined}
        comments={workItem.validationNotes ?? ''}
        onCommentsChange={() => undefined}
        onApprove={() => undefined}
        readOnly
        enableApproveShortcut={false}
      />
    );
  }
  return (
    <Panel preset="panel.compact.standard" title="Result Entry" headerEnd={progressIndicator}>
      <ResultEntryForm
        testDef={resolvedTestDef}
        resultKey={resultKey}
        results={displayResults}
        technicianNotes={displayNotes}
        onResultsChange={onResultsChange}
        onNotesChange={onNotesChange}
        onSave={onSave}
        isComplete={isComplete}
        isModal={true}
        readOnly={readOnly}
        canEnter={canEnter}
        denyMessage={workItem.denyMessage}
      />
    </Panel>
  );
}
