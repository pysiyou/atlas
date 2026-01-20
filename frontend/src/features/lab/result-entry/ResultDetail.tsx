/**
 * ResultDetailModal - Extended view for result entry
 * 
 * Provides a larger interface for entering test results with full parameter display.
 */

import React, { useMemo, useState } from 'react';
import { Badge, DetailField, Button, Icon } from '@/shared/ui';
import { ResultForm } from './ResultForm';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';
import { LabDetailModal, DetailSection, DetailGrid, ModalFooter, StatusBadgeRow } from '../shared/LabDetailModal';
import type { Test, TestWithContext } from '@/types';

interface ResultDetailModalProps {
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

export const ResultDetailModal: React.FC<ResultDetailModalProps> = ({
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
}) => {
  const { getUserName } = useUserDisplay();

  // Local state for immediate UI feedback
  const [localResults, setLocalResults] = useState<Record<string, string>>(() => initialResults);
  const [localNotes, setLocalNotes] = useState<string>(() => initialTechnicianNotes);

  const filledCount = useMemo(() => 
    Object.values(localResults).filter(v => v?.trim()).length, [localResults]);

  const isComplete = useMemo(() => {
    if (!testDef?.parameters) return false;
    return filledCount === testDef.parameters.length;
  }, [filledCount, testDef]);

  if (!testDef?.parameters) return null;

  const totalParams = testDef.parameters.length;
  const completionPercentage = totalParams > 0 ? Math.round((filledCount / totalParams) * 100) : 0;
  const turnaroundTime = testDef.turnaroundTime;

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

  // Progress bar for header
  const progressBar = (
    <div className="flex items-center gap-2">
      <div className="w-32 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            completionPercentage === 100 ? 'bg-green-500' :
            completionPercentage >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 font-medium">{completionPercentage}%</span>
    </div>
  );

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
          extraBadges={
            <>
              <Badge size="sm" variant="default" className="text-gray-700">
                {filledCount} / {totalParams} parameters
              </Badge>
              {turnaroundTime && (
                <Badge size="sm" variant="default" className="text-gray-700 flex items-center gap-1.5">
                  <Icon name="clock" className="w-3 h-3 text-gray-600" />
                  {turnaroundTime}h TAT
                </Badge>
              )}
            </>
          }
        />
      }
      contextInfo={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
        referringPhysician: test.referringPhysician,
      }}
      sampleInfo={test.sampleId && test.collectedAt ? {
        sampleId: test.sampleId,
        collectedAt: test.collectedAt,
        collectedBy: test.collectedBy,
      } : undefined}
      additionalContextInfo={
        test.collectedAt && !test.sampleId && (
          <div className="text-xs text-gray-500">
            Collected <span className="font-medium text-gray-700">{formatDate(test.collectedAt)}</span>
            {test.collectedBy && <span> by {getUserName(test.collectedBy)}</span>}
          </div>
        )
      }
      footer={
        <ModalFooter
          statusIcon={isComplete 
            ? <Icon name="checklist" className="w-4 h-4 text-green-500" />
            : <Icon name="warning" className="w-4 h-4 text-yellow-500" />
          }
          statusMessage={isComplete ? 'Ready to submit' : 'Complete all parameters to submit results'}
          statusClassName={isComplete ? 'text-green-600 font-medium' : 'text-gray-600'}
        >
          <Button onClick={onClose} variant="outline" size="md">Cancel</Button>
          <Button
            onClick={handleSave}
            variant="primary"
            size="md"
            icon={<Icon name="checklist" className="w-4 h-4" />}
            disabled={!isComplete}
          >
            Submit Results
          </Button>
          {onNext && (
            <Button onClick={handleSaveAndNext} variant="primary" size="md" disabled={!isComplete}>
              Save & Next
            </Button>
          )}
          {onPrev && (
            <Button onClick={onPrev} variant="outline" size="md">Previous</Button>
          )}
        </ModalFooter>
      }
    >
      {/* Result Entry Form */}
      <DetailSection title="Result Entry" headerRight={progressBar}>
        <ResultForm
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
      </DetailSection>

      {/* Test Details */}
      <DetailGrid>
        <DetailSection title="Test Parameters">
          <div className="space-y-2">
            <DetailField label="Total Parameters" value={<span className="font-semibold">{totalParams}</span>} />
            <DetailField
              label="Filled"
              value={<span className={filledCount === totalParams ? 'text-green-600' : 'text-yellow-600'}>{filledCount}</span>}
            />
            <DetailField
              label="Remaining"
              value={<span className={totalParams - filledCount === 0 ? 'text-green-600' : 'text-gray-600'}>{totalParams - filledCount}</span>}
            />
          </div>
        </DetailSection>

        <DetailSection title="Test Information">
          <div className="space-y-2">
            <DetailField label="Test Code" value={test.testCode} />
            {test.sampleType && (
              <DetailField label="Sample Type" value={<span className="capitalize">{test.sampleType}</span>} />
            )}
            {test.sampleId && <DetailField label="Sample ID" value={test.sampleId} />}
            {turnaroundTime && (
              <DetailField
                label="Turnaround Time"
                value={<span className="flex items-center gap-1"><Icon name="clock" className="w-3.5 h-3.5" />{turnaroundTime} hours</span>}
              />
            )}
          </div>
        </DetailSection>
      </DetailGrid>
    </LabDetailModal>
  );
};
