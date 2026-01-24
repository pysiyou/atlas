/**
 * EntryCard - Card component for result entry workflow
 *
 * Displays test information with parameter completion progress.
 * Shows retest banners for tests that are retests of previously rejected results.
 */

import React from 'react';
import { Badge, Alert, Icon } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { LabCard, ProgressBadge } from '../components/LabCard';
import type { Test, TestWithContext } from '@/types';

interface EntryCardProps {
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

// Large component is necessary for comprehensive entry card with multiple status displays, action buttons, and conditional rendering
// eslint-disable-next-line max-lines-per-function
export const EntryCard: React.FC<EntryCardProps> = ({
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

  const parameterCount = testDef.parameters.length;
  const filledCount = Object.values(results).filter(v => v?.trim()).length;

  // Determine if this is a retest (result validation re-test flow)
  const isRetest = test.isRetest === true;
  const retestNumber = test.retestNumber || 0;
  const rejectionHistory = test.resultRejectionHistory || [];
  const lastRejection =
    rejectionHistory.length > 0 ? rejectionHistory[rejectionHistory.length - 1] : null;

  // Determine if this is a sample recollection (sample re-collect flow)
  const isSampleRecollection = test.sampleIsRecollection === true;
  const sampleRecollectionAttempt = test.sampleRecollectionAttempt || 1;
  const sampleRejectionHistory = test.sampleRejectionHistory || [];
  const lastSampleRejection =
    sampleRejectionHistory.length > 0
      ? sampleRejectionHistory[sampleRejectionHistory.length - 1]
      : null;

  // Has any kind of rejection history (either from result validation or sample rejection)
  const hasAnyRejectionHistory = isRetest || isSampleRecollection;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    openModal(ModalType.RESULT_DETAIL, {
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
    });
  };

  // Badges ordered by importance for result entry workflow
  const badges = (
    <>
      <h3 className="text-sm font-medium text-gray-900">{test.testName}</h3>
      <Badge variant={test.priority} size="sm" />
      <Badge variant={test.sampleType} size="sm" />
      <Badge size="sm" variant="default" className="text-gray-600">
        {test.testCode}
      </Badge>
    </>
  );

  // Parameter progress badge
  const actions = (
    <ProgressBadge
      count={filledCount}
      total={parameterCount}
      label="PARAMS"
      isComplete={isComplete}
    />
  );

  // Parameter preview badges
  const content = (
    <div className="flex flex-wrap gap-1.5">
      {testDef.parameters.slice(0, 5).map(param => (
        <Badge
          key={param.code}
          size="sm"
          className={results[param.code] ? 'text-sky-800' : 'text-gray-500'}
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

  // Rejection banner (shows previous rejection info for both re-test and re-collect)
  const rejectionBanner = (() => {
    if (isRetest && lastRejection) {
      return (
        <Alert variant="warning" className="py-2">
          <div className="space-y-0.5">
            <p className="font-medium text-xs">Re-test Required (#{retestNumber})</p>
            <p className="text-xxs opacity-90 leading-tight">
              Previous rejection: {lastRejection.rejectionReason}
            </p>
          </div>
        </Alert>
      );
    }
    if (isSampleRecollection && lastSampleRejection) {
      return (
        <Alert variant="warning" className="py-2">
          <div className="space-y-0.5">
            <p className="font-medium text-xs">Sample Recollection #{sampleRecollectionAttempt}</p>
            <p className="text-xxs opacity-90 leading-tight">
              Previous sample rejected: {lastSampleRejection.rejectionNotes || 'See history'}
            </p>
            {sampleRejectionHistory.length > 1 && (
              <p className="text-xxs opacity-75">
                ({sampleRejectionHistory.length} previous rejection
                {sampleRejectionHistory.length > 1 ? 's' : ''})
              </p>
            )}
          </div>
        </Alert>
      );
    }
    return undefined;
  })();

  // Additional info for retest/recollection tracking
  const additionalInfo = (() => {
    if (isRetest && test.retestOfTestId) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name="alert-circle" className="w-3 h-3" />
            Re-test of {test.retestOfTestId}
          </Badge>
        </div>
      );
    }
    if (isSampleRecollection && test.sampleOriginalSampleId) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name="alert-circle" className="w-3 h-3" />
            Recollection of {test.sampleOriginalSampleId}
          </Badge>
        </div>
      );
    }
    return undefined;
  })();

  return (
    <LabCard
      onClick={handleCardClick}
      className={hasAnyRejectionHistory ? 'border-l-4 border-l-yellow-400' : ''}
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
      additionalInfo={additionalInfo}
      badges={badges}
      actions={actions}
      recollectionBanner={rejectionBanner}
      content={content}
      contentTitle={`Parameters (${parameterCount})`}
    />
  );
};
