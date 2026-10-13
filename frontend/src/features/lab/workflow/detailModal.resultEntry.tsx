/**
 * ResultEntryDetailModal - Extended view for result entry
 *
 * Provides a larger interface for entering test results with full parameter display.
 *
 * Uses centralized components:
 * - DetailGrid with sections config for consistent layout
 * - Panel (lab variant) for form section
 * - CollectionInfoLine for sample metadata
 */

import React, { useCallback, useMemo, useState } from 'react';
import { CircularProgress } from '@/components';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { QueueModalShell, labModalSubtitle } from './detailModalLayout';
import { LabEventLogPanel } from '@/features/audit';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { usePatientNameLookup } from '@/features/patients';
import { TestWorkflowCardLeftColumn } from './queueCard.testWorkflowLeftColumn';
import { useTestCatalog } from '@/features/catalog';
import type { Test, TestWithContext } from '@/types';
import { LabRelatedTestsPanel } from '../components/LabRelatedWorkflowPanel';
import { EntryDetailMainPanel, EntryDetailModalFooter } from './detailModal.resultEntry.helpers';
import { ResultEntryDetailGrid } from './detailModal.resultEntry.grid';

interface EntryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  testDef: Test | undefined;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: (finalResults?: Record<string, string>, finalNotes?: string) => void | Promise<void>;
  readOnly?: boolean;
}

export const ResultEntryDetailModal: React.FC<EntryDetailModalProps> = ({
  isOpen,
  onClose,
  test,
  testDef,
  resultKey,
  results: initialResults,
  technicianNotes: initialTechnicianNotes,
  onResultsChange,
  onNotesChange,
  onSave,
  readOnly = false,
}) => {
  const { getPatientName } = usePatientNameLookup();
  const { tests: catalogTests = [] } = useTestCatalog();
  const resolvedTestDef = testDef ?? catalogTests.find(t => t.code === test.testCode);
  const [localResults, setLocalResults] = useState<Record<string, string>>(() => {
    if (readOnly && test.results) {
      return Object.fromEntries(
        Object.entries(test.results).map(([key, value]) => [key, String(value ?? '')])
      );
    }
    return initialResults;
  });
  const [localNotes, setLocalNotes] = useState<string>(() =>
    readOnly ? (test.technicianNotes ?? initialTechnicianNotes) : initialTechnicianNotes
  );

  const displayResults = useMemo(() => {
    if (readOnly && test.results) {
      return Object.fromEntries(
        Object.entries(test.results).map(([key, value]) => [key, String(value ?? '')])
      );
    }
    return localResults;
  }, [readOnly, test.results, localResults]);

  const displayNotes = readOnly ? (test.technicianNotes ?? initialTechnicianNotes) : localNotes;

  const saveAction = useAsyncAction(
    useCallback(
      async (_signal: AbortSignal) => {
        await Promise.resolve(onSave(localResults, localNotes));
        onClose();
      },
      [onSave, localResults, localNotes, onClose]
    ),
    { minDisplayMs: 100 }
  );
  const isSaving = saveAction.isPending;

  const canEnter = test.allowedActions?.enterResults !== false;

  const filledCount = useMemo(
    () => Object.values(displayResults).filter(v => v?.trim()).length,
    [displayResults]
  );

  const isComplete = useMemo(() => {
    if (!resolvedTestDef?.parameters) return false;
    return filledCount === resolvedTestDef.parameters.length;
  }, [filledCount, resolvedTestDef]);

  if (!resolvedTestDef?.parameters) return null;

  const totalParams = resolvedTestDef.parameters.length;
  const completionPercentage = totalParams > 0 ? Math.round((filledCount / totalParams) * 100) : 0;
  const turnaroundTime = resolvedTestDef.turnaroundTime;
  const showTurnaroundTime =
    typeof turnaroundTime === 'number' && Number.isFinite(turnaroundTime) && turnaroundTime > 0;
  const remainingParams = totalParams - filledCount;

  const handleLocalResultChange = (key: string, paramCode: string, value: string) => {
    setLocalResults(prev => ({ ...prev, [paramCode]: value }));
    onResultsChange(key, paramCode, value);
  };

  const handleLocalNotesChange = (key: string, notes: string) => {
    setLocalNotes(notes);
    onNotesChange(key, notes);
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

  const patientName = getPatientName(test.patientId);
  const headerBadges = <TestHeaderBadges test={test} variant="entry" showStatus />;
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
      title={test.testName}
      subtitle={labModalSubtitle('entry')}
      modalKey={readOnly ? `historical-${test.id}` : resultKey}
      disableClose={isSaving}
      headerBadges={headerBadges}
      headerLeftColumn={headerLeftColumn}
      footer={
        <EntryDetailModalFooter
          readOnly={readOnly}
          isSaving={isSaving}
          isComplete={isComplete}
          canEnter={canEnter}
          denyMessage={test.denyMessage}
          onClose={onClose}
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
