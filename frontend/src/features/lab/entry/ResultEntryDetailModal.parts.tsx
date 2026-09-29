/**
 * Presentational sections for ResultEntryDetailModal.
 */
import React from 'react';
import { actionButtonPreset, Button, Panel } from '@/components';
import { ModalFooter } from '../components/LabWorkflowDetailModal';
import { ResultEntryForm } from './ResultEntryForm';
import { ResultValidationForm } from '../validation/ResultValidationForm';
import { hasTestResults } from '../utils/labSearchAndLinks';
import type { Test, TestWithContext } from '@/types';

export function EntryDetailModalFooter({
  readOnly,
  isSaving,
  isComplete,
  onClose,
  onSave,
}: {
  readOnly: boolean;
  isSaving: boolean;
  isComplete: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  if (readOnly) {
    return (
      <ModalFooter statusMessage="">
        <Button onClick={onClose} {...actionButtonPreset('cancel')} size="md" layout="icon-text">
          Close
        </Button>
      </ModalFooter>
    );
  }
  return (
    <ModalFooter statusMessage="">
      <Button
        onClick={onClose}
        {...actionButtonPreset('cancel')}
        size="md"
        layout="icon-text"
        disabled={isSaving}
      >
        Cancel
      </Button>
      <Button
        onClick={onSave}
        {...actionButtonPreset('save')}
        size="md"
        layout="icon-text"
        disabled={!isComplete}
        isLoading={isSaving}
      >
        Save
      </Button>
    </ModalFooter>
  );
}

export function EntryDetailMainPanel({
  readOnly,
  test,
  resolvedTestDef,
  resultKey,
  displayResults,
  displayNotes,
  progressIndicator,
  isComplete,
  onResultsChange,
  onNotesChange,
  onSave,
}: {
  readOnly: boolean;
  test: TestWithContext;
  resolvedTestDef: Test;
  resultKey: string;
  displayResults: Record<string, string>;
  displayNotes: string;
  progressIndicator: React.ReactNode;
  isComplete: boolean;
  onResultsChange: (key: string, paramCode: string, value: string) => void;
  onNotesChange: (key: string, notes: string) => void;
  onSave: () => void;
}) {
  if (readOnly && hasTestResults(test)) {
    return (
      <Panel variant="lab" title="Recorded Results">
        <ResultValidationForm
          results={test.results!}
          flags={test.flags}
          technicianNotes={test.technicianNotes}
          comments={test.validationNotes ?? ''}
          onCommentsChange={() => undefined}
          onApprove={() => undefined}
          readOnly
          enableApproveShortcut={false}
        />
      </Panel>
    );
  }
  return (
    <Panel variant="lab" title="Result Entry" headerEnd={progressIndicator}>
      <ResultEntryForm
        testDef={resolvedTestDef}
        resultKey={resultKey}
        results={displayResults}
        technicianNotes={displayNotes}
        patient={test.patient}
        onResultsChange={onResultsChange}
        onNotesChange={onNotesChange}
        onSave={onSave}
        isComplete={isComplete}
        isModal={true}
        readOnly={readOnly}
      />
    </Panel>
  );
}
