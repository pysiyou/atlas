/**
 * EntryDetailModal - Extended view for result entry
 *
 * Provides a larger interface for entering test results with full parameter display.
 *
 * Uses centralized components:
 * - DetailGrid with sections config for consistent layout
 * - Panel (lab variant) for form section
 * - CollectionInfoLine for sample metadata
 */

import React, { useCallback, useMemo, useState } from 'react';
import { Badge, Button, Icon, CircularProgress, Panel, EntityId } from '@/components';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { EntryForm } from './EntryForm';
import {
  LabDetailModal,
  DetailGrid,
  ModalFooter,
} from '../components/LabDetailModal';
import { TestHeaderBadges } from '../components/labWorkflowBadges';
import { useTestWorkItemState } from '../hooks';
import { testHeaderAudit } from '../components/labHeaderAudit';
import { ICONS } from '@/config/icons';
import { useTestCatalog } from '@/features/catalog';
import { LabHistoryPanel } from '../components/LabHistoryPanel';
import { labModalSubtitle } from '../components/labModalStages';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';
import { ValidationForm } from '../validation/ValidationForm';
import { hasTestResults } from '../utils/hasTestResults';
import type { Test, TestWithContext } from '@/types';

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

// Large component is necessary for comprehensive entry detail modal with result entry, validation, and multiple conditional sections
// eslint-disable-next-line max-lines-per-function
export const EntryDetailModal: React.FC<EntryDetailModalProps> = ({
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
  // High complexity is necessary for comprehensive result entry logic with validation, conditional rendering, and state management
   
}) => {
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

  const displayNotes = readOnly
    ? (test.technicianNotes ?? initialTechnicianNotes)
    : localNotes;

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

  const workItem = useTestWorkItemState(test);

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
    if (!isComplete) return;
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

  const headerBadges = (
    <TestHeaderBadges
      test={test}
      variant="entry"
      showStatus
      queueSince={test.collectedAt}
      blockedLabel={workItem.blockedReason ? workItem.label : undefined}
      trailing={
        <>
          <Badge size={LAB_CARD_BADGE_SIZE} variant="default" className="text-text-secondary">
            {filledCount} / {totalParams} parameters
          </Badge>
          {turnaroundTime && (
            <Badge
              size={LAB_CARD_BADGE_SIZE}
              variant="default"
              className="text-text-secondary flex items-center gap-1.5"
            >
              <Icon name={ICONS.dataFields.time} className="w-3 h-3 text-text-tertiary" />
              {turnaroundTime}h TAT
            </Badge>
          )}
        </>
      }
    />
  );

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={labModalSubtitle('entry')}
      modalKey={readOnly ? `historical-${test.id}` : resultKey}
      disableClose={isSaving}
      headerBadges={headerBadges}
      contextInfo={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
        orderTestId: test.id,
        entityCode: test.testCode,
        entityName: test.testName,
        referringPhysician: test.referringPhysician,
        sampleId: test.sampleId,
      }}
      headerAudit={testHeaderAudit(test)}
      footer={
        readOnly ? (
          <ModalFooter statusMessage="">
            <Button onClick={onClose} variant="cancel" size="md" layout="icon-text">Close</Button>
          </ModalFooter>
        ) : (
          <ModalFooter statusMessage="">
            <Button onClick={onClose} variant="cancel" size="md" layout="icon-text" disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="save"
              size="md"
              layout="icon-text"
              disabled={!isComplete}
              isLoading={isSaving}
            >
              Save
            </Button>
          </ModalFooter>
        )
      }
    >
      {readOnly && hasTestResults(test) ? (
        <Panel variant="lab" title="Recorded Results">
          <ValidationForm
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
      ) : (
        <Panel variant="lab" title="Result Entry" headerEnd={progressIndicator}>
          <EntryForm
            testDef={resolvedTestDef}
            resultKey={resultKey}
            results={displayResults}
            technicianNotes={displayNotes}
            patient={test.patient}
            onResultsChange={handleLocalResultChange}
            onNotesChange={handleLocalNotesChange}
            onSave={handleSave}
            isComplete={isComplete}
            isModal={true}
            readOnly={readOnly}
          />
        </Panel>
      )}

      {/* Test Details - using declarative sections config */}
      <DetailGrid
        sections={[
          {
            title: 'Test Parameters',
            fields: [
              {
                label: 'Total Parameters',
                value: <span className="font-normal">{totalParams}</span>,
              },
              {
                label: 'Filled',
                value: (
                  <span className={isComplete ? 'text-success-fg' : 'text-warning-fg'}>
                    {filledCount}
                  </span>
                ),
              },
              {
                label: 'Remaining',
                value: (
                  <span
                    className={remainingParams === 0 ? 'text-success-fg' : 'text-text-tertiary'}
                  >
                    {remainingParams}
                  </span>
                ),
              },
            ],
          },
          {
            title: 'Test Information',
            fields: [
              {
                label: 'Test ID',
                value: test.id != null ? <EntityId type="orderTest" value={test.id} variant="block" className="text-right" /> : undefined,
              },
              {
                label: 'Test Code',
                value: test.testCode ? <EntityId variant="block" className="text-right">{test.testCode}</EntityId> : undefined,
              },
              {
                label: 'Sample Type',
                badge: test.sampleType
                  ? { value: test.sampleType, variant: test.sampleType }
                  : undefined,
              },
              {
                label: 'Sample ID',
                value: test.sampleId ? <EntityId type="sample" value={test.sampleId} variant="block" className="text-right" /> : undefined,
              },
              {
                label: 'Turnaround Time',
                value: turnaroundTime ? (
                  <span className="flex items-center gap-1">
                    <Icon name={ICONS.dataFields.time} className="w-3.5 h-3.5" />
                    {turnaroundTime} hours
                  </span>
                ) : undefined,
              },
            ],
          },
        ]}
      />
      {test.id != null && (
        <LabHistoryPanel entityType="order_test" entityId={test.id} />
      )}
    </LabDetailModal>
  );
};
