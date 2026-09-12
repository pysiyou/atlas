/**
 * EntryDetailModal - Extended view for result entry
 *
 * Provides a larger interface for entering test results with full parameter display.
 *
 * Uses centralized components:
 * - DetailGrid with sections config for consistent layout
 * - SectionPanel for form section
 * - CollectionInfoLine for sample metadata
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Icon, SectionPanel, CircularProgress } from '@/components';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { displayId } from '@/utils';
import { EntryForm } from './EntryForm';
import {
  LabDetailModal,
  DetailGrid,
  ModalFooter,
  StatusBadgeRow,
} from '../components/LabDetailModal';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { ICONS } from '@/config/icons';
import {
  CollectionInfoLine,
  RetestBadge,
  RecollectionAttemptBadge,
} from '../components/StatusBadges';
import { useTestCatalog } from '@/features/catalog';
import { LabHistoryPanel } from '../components/LabHistoryPanel';
import { labModalSubtitle } from '../components/labModalStages';
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

  useEffect(() => {
    if (!readOnly) return;
    if (test.results) {
      setLocalResults(
        Object.fromEntries(
          Object.entries(test.results).map(([key, value]) => [key, String(value ?? '')]),
        ),
      );
    }
    setLocalNotes(test.technicianNotes ?? initialTechnicianNotes);
  }, [readOnly, test.id, test.results, test.technicianNotes, initialTechnicianNotes]);

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

  const filledCount = useMemo(
    () => Object.values(localResults).filter(v => v?.trim()).length,
    [localResults]
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

  const {
    isRetest,
    retestNumber,
    showRecollectionBadge,
    sampleRecollectionAttempt,
  } = deriveRetestContext(test);

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

  /**
   * Circular progress indicator for header
   * Shows completion percentage with color coding matching order progress style
   */
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

  /**
   * Extra header badges for parameter count, TAT, and retest/recollection status
   */
  const headerExtraBadges = (
    <>
      {isRetest && <RetestBadge retestNumber={retestNumber} />}
      {showRecollectionBadge && !isRetest && (
        <RecollectionAttemptBadge attemptNumber={sampleRecollectionAttempt} />
      )}
      <Badge size="sm" variant="default" className="text-text-secondary">
        {filledCount} / {totalParams} parameters
      </Badge>
      {turnaroundTime && (
        <Badge
          size="sm"
          variant="default"
          className="text-text-secondary flex items-center gap-1.5"
        >
          <Icon name={ICONS.dataFields.time} className="w-3 h-3 text-text-tertiary" />
          {turnaroundTime}h TAT
        </Badge>
      )}
    </>
  );

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={labModalSubtitle('entry')}
      modalKey={readOnly ? `historical-${test.id}` : resultKey}
      disableClose={isSaving}
      headerBadges={
        <StatusBadgeRow
          sampleType={test.sampleType}
          priority={test.priority}
          status={test.status}
          extraBadges={headerExtraBadges}
        />
      }
      contextInfo={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
        orderTestId: test.id,
        entityCode: test.testCode,
        referringPhysician: test.referringPhysician,
      }}
      sampleInfo={
        test.sampleId && test.collectedAt
          ? {
              sampleId: test.sampleId,
              collectedAt: test.collectedAt,
              collectedBy: test.collectedBy,
            }
          : undefined
      }
      additionalContextInfo={
        // Show collection info only if no sampleId (means collection info not in sampleInfo above)
        test.collectedAt && !test.sampleId ? (
          <CollectionInfoLine collectedAt={test.collectedAt} collectedBy={test.collectedBy} />
        ) : undefined
      }
      footer={
        readOnly ? (
          <ModalFooter statusMessage="">
            <Button onClick={onClose} variant="cancel" size="md">Close</Button>
          </ModalFooter>
        ) : (
          <ModalFooter statusMessage="">
            <Button onClick={onClose} variant="cancel" size="md" disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="save"
              size="md"
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
        <SectionPanel title="Recorded Results">
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
        </SectionPanel>
      ) : (
        <SectionPanel title="Result Entry" headerRight={progressIndicator}>
          <EntryForm
            testDef={resolvedTestDef}
            resultKey={resultKey}
            results={localResults}
            technicianNotes={localNotes}
            patient={test.patient}
            onResultsChange={handleLocalResultChange}
            onNotesChange={handleLocalNotesChange}
            onSave={handleSave}
            isComplete={isComplete}
            isModal={true}
            readOnly={readOnly}
          />
        </SectionPanel>
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
                value: test.id != null ? (
                  <span className="entity-id">{displayId.orderTest(test.id)}</span>
                ) : undefined,
              },
              {
                label: 'Test Code',
                value: <span className="entity-id">{test.testCode}</span>,
              },
              {
                label: 'Sample Type',
                badge: test.sampleType
                  ? { value: test.sampleType, variant: test.sampleType }
                  : undefined,
              },
              {
                label: 'Sample ID',
                value: test.sampleId ? (
                  <span className="entity-id">{displayId.sample(test.sampleId)}</span>
                ) : undefined,
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
