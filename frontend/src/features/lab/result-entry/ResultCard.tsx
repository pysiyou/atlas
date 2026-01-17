import React from 'react';
import { Badge } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/contexts/ModalContext';
import { LabCard, ProgressBadge } from '../shared/LabCard';
import type { Test, Patient } from '@/types';

interface TestWithContext {
  orderId: string;
  patientId: string;
  patientName: string;
  testName: string;
  testCode: string;
  sampleType?: string;
  sampleId?: string;
  priority: string;
  status: string;
  collectedAt?: string;
  collectedBy?: string;
  referringPhysician?: string;
  patient?: Patient;
  [key: string]: unknown;
}

interface ResultEntryCardProps {
  test: TestWithContext;
  testDef: Test | undefined;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onClick?: () => void;
}

export const ResultEntryCard: React.FC<ResultEntryCardProps> = ({
  test,
  testDef,
  resultKey,
  results,
  technicianNotes,
  isComplete,
  onResultsChange,
  onNotesChange,
  onSave,
  onNext,
  onPrev,
  onClick,
}) => {
  const { openModal } = useModal();

  if (!testDef?.parameters) return null;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    openModal(ModalType.RESULT_DETAIL, {
      test, testDef, resultKey, results, technicianNotes, isComplete,
      onResultsChange, onNotesChange, onSave, onNext, onPrev,
    });
  };

  const parameterCount = testDef.parameters.length;
  const filledCount = Object.values(results).filter(v => v?.trim()).length;

  // Badges ordered by importance for result entry workflow
  const badges = (
    <>
      {/* 1. Test name - what test you're entering results for */}
      <h3 className="text-sm font-medium text-gray-900">{test.testName}</h3>
      {/* 2. Priority - urgency affects turnaround time */}
      <Badge variant={test.priority} size="sm" />
      {/* 3. Sample type - context for the specimen */}
      <Badge variant={test.sampleType} size="sm" />
      {/* 4. Test code - reference identifier */}
      <Badge size="sm" variant="default" className="text-gray-600">{test.testCode}</Badge>
    </>
  );

  const actions = (
    <ProgressBadge count={filledCount} total={parameterCount} label="PARAMS" isComplete={isComplete} />
  );

  const content = (
    <div className="flex flex-wrap gap-1.5">
      {testDef.parameters.slice(0, 5).map((param) => (
        <Badge
          key={param.code}
          size="sm"
          className={results[param.code] ? 'text-blue-800' : 'text-gray-500'}
          variant={results[param.code] ? 'primary' : 'default'}
        >
          {param.name}
        </Badge>
      ))}
      {parameterCount > 5 && (
        <Badge size="sm" variant="default" className="text-gray-500">
          +{parameterCount - 5} more
        </Badge>
      )}
    </div>
  );

  return (
    <LabCard
      onClick={handleCardClick}
      context={{
        patientName: test.patientName,
        orderId: test.orderId,
        referringPhysician: test.referringPhysician,
      }}
      sampleInfo={{
        sampleId: test.sampleId,
        collectedAt: test.collectedAt,
        collectedBy: test.collectedBy,
      }}
      badges={badges}
      actions={actions}
      content={content}
      contentTitle={`Parameters (${parameterCount})`}
    />
  );
};
