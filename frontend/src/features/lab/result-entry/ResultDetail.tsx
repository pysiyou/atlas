/**
 * Result Detail Modal - Extended view for result entry
 * 
 * Provides a larger, more spacious interface for entering test results.
 * Similar to SampleDetailModal, this extends the card view with more space
 * and options for result compilation.
 */

import React, { useMemo, useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Badge, SectionContainer, DetailField, Button } from '@/shared/ui';
import { ResultForm } from './ResultForm';
import { formatDate } from '@/utils';
import { useUserDisplay } from '@/hooks';

import type { Test, TestWithContext } from '@/types';
import { Clock, ClipboardCheck, AlertTriangle } from 'lucide-react';



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

  // Maintain internal state for the modal to ensure inputs are fully controllable
  // State will be reset automatically when resultKey changes due to key prop on Modal
  // The key prop forces React to remount the component, resetting all state
  const [localResults, setLocalResults] = useState<Record<string, string>>(() => initialResults);
  const [localNotes, setLocalNotes] = useState<string>(() => initialTechnicianNotes);

  // Calculate completion status based on local state
  const filledCount = useMemo(() => {
    return Object.values(localResults).filter(v => v && v.trim() !== '').length;
  }, [localResults]);

  // Calculate if form is complete based on local state
  const isComplete = useMemo(() => {
    if (!testDef?.parameters) return false;
    return filledCount === testDef.parameters.length;
  }, [filledCount, testDef]);

  if (!testDef?.parameters) {
    return null;
  }

  const totalParams = testDef.parameters.length;
  const completionPercentage = totalParams > 0 ? Math.round((filledCount / totalParams) * 100) : 0;

  // Get test metadata
  const turnaroundTime = testDef.turnaroundTime;

  /**
   * Handle local result result changes
   * Updates both local state (for immediate UI feedback) and parent state (for persistence)
   */
  const handleLocalResultChange = (key: string, paramCode: string, value: string) => {
    setLocalResults(prev => ({
      ...prev,
      [paramCode]: value,
    }));
    // Also update parent state
    onResultsChange(key, paramCode, value);
  };

  /**
   * Handle local notes changes
   * Updates both local state and parent state
   */
  const handleLocalNotesChange = (key: string, notes: string) => {
    setLocalNotes(notes);
    // Also update parent state
    onNotesChange(key, notes);
  };

  // Handle save and close
  const handleSave = () => {
    if (isComplete) {
      // Pass the current local state to ensure we have the latest values
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

  return (
    <Modal
      key={resultKey}
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={`${test.testCode} - ${test.patientName}`}
      size="3xl"
    >
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Header Section */}
          <SectionContainer hideHeader>
            <div className="flex flex-col gap-4">
              {/* Row 1: Badges and status */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Sample type badge */}
                  <Badge variant={test.sampleType} size="sm" />

                  {/* Priority badge */}
                  {test.priority && (
                    <Badge variant={test.priority} size="sm" />
                  )}

                  {/* Status badge */}
                  <Badge variant={test.status} size="sm" />

                  {/* Completion indicator */}
                  <Badge size="sm" variant="default" className="text-gray-700">
                    {filledCount} / {totalParams} parameters
                  </Badge>

                  {/* Turnaround time */}
                  {turnaroundTime && (
                    <Badge size="sm" variant="default" className="text-gray-700 flex items-center gap-1.5">
                      <Clock size={12} className="text-gray-600" />
                      {turnaroundTime}h TAT
                    </Badge>
                  )}
                </div>
              </div>

              {/* Row 2: Patient & Order context */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                  <span className="font-semibold text-gray-900">{test.patientName}</span>
                  <span className="text-gray-300">|</span>
                  <span className="font-medium text-gray-900 text-xs">{test.patientId}</span>
                  <span className="text-gray-300">|</span>
                  <span className="font-medium text-gray-900 text-xs">{test.orderId}</span>
                  {test.referringPhysician && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-600">{test.referringPhysician}</span>
                    </>
                  )}
                </div>

                {/* Collection info - matches SampleCard format */}
                {test.collectedAt && test.sampleId && (
                  <span className="text-xs text-gray-500">
                    Sample <span className="font-medium text-gray-900">{test.sampleId}</span> collected{' '}
                    <span className="text-gray-700">{formatDate(test.collectedAt)}</span>
                    {test.collectedBy && <span> by {getUserName(test.collectedBy)}</span>}
                  </span>
                )}
                {test.collectedAt && !test.sampleId && (
                  <div className="text-xs text-gray-500">
                    Collected <span className="font-medium text-gray-700">{formatDate(test.collectedAt)}</span>
                    {test.collectedBy && <span> by {getUserName(test.collectedBy)}</span>}
                  </div>
                )}
              </div>
            </div>
          </SectionContainer>


          {/* Result Entry Form - Expanded */}
          <SectionContainer
            title="Result Entry"
            headerRight={
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      completionPercentage === 100
                        ? 'bg-green-500'
                        : completionPercentage >= 50
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 font-medium">{completionPercentage}%</span>
              </div>
            }
          >

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
          </SectionContainer>

          {/* Test Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Test Parameters Info */}
            <SectionContainer title="Test Parameters">
              <div className="space-y-2">
              <DetailField 
                label="Total Parameters" 
                value={<span className="font-semibold">{totalParams}</span>} 
              />
              <DetailField 
                label="Filled" 
                value={
                  <span className={filledCount === totalParams ? 'text-green-600' : 'text-yellow-600'}>
                    {filledCount}
                  </span>
                } 
              />
              <DetailField 
                label="Remaining" 
                value={
                  <span className={totalParams - filledCount === 0 ? 'text-green-600' : 'text-gray-600'}>
                    {totalParams - filledCount}
                  </span>
                } 
              />
              </div>
            </SectionContainer>

            {/* Test Metadata */}
            <SectionContainer title="Test Information">
              <div className="space-y-2">
              <DetailField label="Test Code" value={test.testCode} />
              {test.sampleType && (
                <DetailField label="Sample Type" value={<span className="capitalize">{test.sampleType}</span>} />
              )}
              {test.sampleId && (
                <DetailField label="Sample ID" value={test.sampleId} />
              )}
              {turnaroundTime && (
                <DetailField 
                  label="Turnaround Time" 
                  value={
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {turnaroundTime} hours
                    </span>
                  } 
                />
              )}
              </div>
            </SectionContainer>
          </div>
        </div>

        {/* Action Footer */}
        <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {!isComplete && (
                <>
                  <AlertTriangle size={16} className="text-yellow-500" />
                  <span>Complete all parameters to submit results</span>
                </>
              )}
              {isComplete && (
                <>
                  <ClipboardCheck size={16} className="text-green-500" />
                  <span className="text-green-600 font-medium">Ready to submit</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={onClose} variant="outline" size="md">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="primary"
                size="md"
                icon={<ClipboardCheck size={16} />}
                disabled={!isComplete}
              >
                Submit Results
              </Button>
              {onNext && (
                <Button
                  onClick={handleSaveAndNext}
                  variant="primary"
                  size="md"
                  disabled={!isComplete}
                >
                  Save & Next
                </Button>
              )}
              {onPrev && (
                <Button onClick={onPrev} variant="outline" size="md">
                  Previous
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
