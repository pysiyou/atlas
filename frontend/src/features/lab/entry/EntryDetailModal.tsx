/**
 * EntryDetailModal - Extended view for result entry
 *
 * Provides a larger interface for entering test results with full parameter display.
 *
 * Uses centralized components:
 * - DetailGrid with sections config for consistent layout
 * - SectionContainer for form section
 * - CollectionInfoLine for sample metadata
 */

import React, { useMemo, useState } from 'react';
import { Badge, Button, Icon, SectionContainer, CircularProgress } from '@/shared/ui';
import { displayId } from '@/utils/id-display';
import { EntryForm } from './EntryForm';
import { EntryRejectionSection } from './EntryRejectionSection';
import {
  LabDetailModal,
  DetailGrid,
  ModalFooter,
  StatusBadgeRow,
} from '../components/LabDetailModal';
import { ICONS } from '@/utils/icon-mappings';
import {
  CollectionInfoLine,
  RetestBadge,
  RecollectionAttemptBadge,
} from '../components/StatusBadges';
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
  onSave: (finalResults?: Record<string, string>, finalNotes?: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
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
  onNext,
  onPrev,
  // High complexity is necessary for comprehensive result entry logic with validation, conditional rendering, and state management
  // eslint-disable-next-line complexity
}) => {
  // Local state for immediate UI feedback
  const [localResults, setLocalResults] = useState<Record<string, string>>(() => initialResults);
  const [localNotes, setLocalNotes] = useState<string>(() => initialTechnicianNotes);

  const filledCount = useMemo(
    () => Object.values(localResults).filter(v => v?.trim()).length,
    [localResults]
  );

  const isComplete = useMemo(() => {
    if (!testDef?.parameters) return false;
    return filledCount === testDef.parameters.length;
  }, [filledCount, testDef]);

  if (!testDef?.parameters) return null;

  const totalParams = testDef.parameters.length;
  const completionPercentage = totalParams > 0 ? Math.round((filledCount / totalParams) * 100) : 0;
  const turnaroundTime = testDef.turnaroundTime;
  const remainingParams = totalParams - filledCount;

  // Determine if this is a retest or recollection
  const isRetest = test.isRetest === true;
  const retestNumber = test.retestNumber || 0;
  const rejectionHistory = test.resultRejectionHistory || [];
  const hasRejectionHistory = rejectionHistory.length > 0;
  const lastRejection = hasRejectionHistory ? rejectionHistory[rejectionHistory.length - 1] : null;
  const isRecollection = lastRejection?.rejectionType === 're-collect';

  const handleLocalResultChange = (key: string, paramCode: string, value: string) => {
    setLocalResults(prev => ({ ...prev, [paramCode]: value }));
    onResultsChange(key, paramCode, value);
  };

  const handleLocalNotesChange = (key: string, notes: string) => {
    setLocalNotes(notes);
    onNotesChange(key, notes);
  };

  const handleSave = () => {
    if (isComplete) {
      onSave(localResults, localNotes);
      onClose();
    }
  };

  const handleSaveAndNext = () => {
    if (isComplete && onNext) {
      onSave(localResults, localNotes);
      onNext();
    }
  };

  /**
   * Circular progress indicator for header
   * Shows completion percentage with color coding matching order progress style
   */
  const progressIndicator = (
    <CircularProgress
      size={18}
      percentage={completionPercentage}
      trackColorClass="stroke-gray-200"
      progressColorClass={completionPercentage === 100 ? 'stroke-emerald-500' : 'stroke-sky-500'}
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
      {isRecollection && !isRetest && (
        <RecollectionAttemptBadge attemptNumber={rejectionHistory.length} />
      )}
      <Badge size="sm" variant="default" className="text-text-secondary">
        {filledCount} / {totalParams} parameters
      </Badge>
      {turnaroundTime && (
        <Badge size="sm" variant="default" className="text-text-secondary flex items-center gap-1.5">
          <Icon name={ICONS.dataFields.time} className="w-3 h-3 text-text-tertiary" />
          {turnaroundTime}h TAT
        </Badge>
      )}
    </>
  );

  /**
   * Build rejection history title based on type
   */
  const rejectionHistoryTitle = isRetest
    ? `Previous Rejection${rejectionHistory.length > 1 ? ` (${rejectionHistory.length} attempts)` : ''}`
    : `Recollection History (${rejectionHistory.length} attempt${rejectionHistory.length > 1 ? 's' : ''})`;

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={`${test.testCode} - ${test.patientName}`}
      modalKey={resultKey}
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
        // Show collection info only if no sampleId (otherwise it's in sampleInfo)
        test.collectedAt &&
        !test.sampleId && (
          <CollectionInfoLine collectedAt={test.collectedAt} collectedBy={test.collectedBy} />
        )
      }
      footer={
        <ModalFooter
          statusIcon={
            isComplete ? (
              <Icon name={ICONS.actions.checkCircle} className="w-4 h-4 text-text-disabled" />
            ) : (
              <Icon name={ICONS.dataFields.clinicalNotes} className="w-4 h-4 text-text-disabled" />
            )
          }
          statusMessage={
            isComplete ? 'Ready to submit' : 'Complete all parameters to submit results'
          }
          statusClassName="text-text-muted"
        >
          <Button onClick={onClose} variant="cancel" size="md">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="save" size="md" disabled={!isComplete}>
            Save
          </Button>
          {onNext && (
            <Button onClick={handleSaveAndNext} variant="save" size="md" disabled={!isComplete}>
              Save & Next
            </Button>
          )}
          {onPrev && (
            <Button onClick={onPrev} variant="previous" size="md">
              Previous
            </Button>
          )}
        </ModalFooter>
      }
    >
      {/* Result Entry Form Section */}
      <SectionContainer title="Result Entry" headerRight={progressIndicator}>
        <EntryForm
          testDef={testDef}
          resultKey={resultKey}
          results={localResults}
          technicianNotes={localNotes}
          patient={test.patient}
          onResultsChange={handleLocalResultChange}
          onNotesChange={handleLocalNotesChange}
          onSave={handleSave}
          isComplete={isComplete}
          isModal={true}
        />
      </SectionContainer>

      {/* Previous Rejection History - show for both retests and recollections */}
      {hasRejectionHistory && (
        <EntryRejectionSection
          title={rejectionHistoryTitle}
          rejectionHistory={rejectionHistory}
          showOnlyLatest={false}
        />
      )}

      {/* Test Details - using declarative sections config */}
      <DetailGrid
        sections={[
          {
            title: 'Test Parameters',
            fields: [
              {
                label: 'Total Parameters',
                value: <span className="font-semibold">{totalParams}</span>,
              },
              {
                label: 'Filled',
                value: (
                  <span className={isComplete ? 'text-emerald-600' : 'text-amber-600'}>
                    {filledCount}
                  </span>
                ),
              },
              {
                label: 'Remaining',
                value: (
                  <span className={remainingParams === 0 ? 'text-emerald-600' : 'text-text-tertiary'}>
                    {remainingParams}
                  </span>
                ),
              },
            ],
          },
          {
            title: 'Test Information',
            fields: [
              { label: 'Test Code', badge: { value: test.testCode, variant: 'primary' } },
              {
                label: 'Sample Type',
                badge: test.sampleType
                  ? { value: test.sampleType, variant: test.sampleType }
                  : undefined,
              },
              {
                label: 'Sample ID',
                badge: test.sampleId
                  ? { value: displayId.sample(test.sampleId), variant: 'primary', className: 'font-mono' }
                  : undefined,
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
    </LabDetailModal>
  );
};
