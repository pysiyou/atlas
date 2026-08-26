/**
 * EntryCard - Responsive card component for result entry workflow
 *
 * Displays test information with parameter completion progress.
 * Shows retest banners for tests that are retests of previously rejected results.
 * Supports both desktop (LabCard) and mobile layouts via isMobile prop.
 */

import React from 'react';
import { Badge, Card, Alert, Icon, IconButton } from '@/components';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { usePatientNameLookup } from '@/features/patients/api/usePatients';
import { LabCard, ProgressBadge } from '@/features/lab/components/LabCard';
import { AttemptIndicator } from '@/features/lab/components/AttemptIndicator';
import { QueueAgeBadge } from '@/features/lab/components/QueueAgeBadge';
import { useLabCardClickGuard } from '@/features/lab/hooks';
import { LAB_CONFIG } from '@/features/lab/config';
import { deriveTestRejectionContext } from '@/features/lab/utils/deriveTestRejectionContext';
import type { Test, TestWithContext } from '@/types';
import { ICONS } from '@/utils';

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
  onClick: () => void;
  /** When true, renders mobile-optimized layout */
  isMobile?: boolean;
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
  isMobile = false,
}) => {
  const { getPatientName } = usePatientNameLookup();
  const handleCardClick = useLabCardClickGuard(onClick);

  if (!testDef?.parameters) return null;

  const parameterCount = testDef.parameters.length;
  const filledCount = Object.values(results).filter(v => v?.trim()).length;
  const patientName = getPatientName(test.patientId);

  const rejection = deriveTestRejectionContext(test);
  const {
    isRetest,
    retestNumber,
    isSampleRecollection,
    sampleRecollectionAttempt,
    lastResultRejection,
    lastSampleRejection,
    hasAnyRejectionHistory,
  } = rejection;

  // Mobile layout
  if (isMobile) {
    return (
      <Card padding="list" hover className="flex flex-col h-full" onClick={handleCardClick}>
        {/* Header: Test name */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0 overflow-hidden">
            <div className="text-sm font-normal text-text-primary truncate">{test.testName}</div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
              <span className="truncate capitalize">{patientName}</span>
              <span className="text-text-tertiary">•</span>
              <span className="text-brand font-normal font-mono truncate">{test.testCode}</span>
              {test.sampleId && (
                <>
                  <span className="text-text-tertiary">•</span>
                  <span
                    className="text-brand font-normal font-mono truncate"
                    title={displayId.sample(test.sampleId)}
                  >
                    {displayId.sample(test.sampleId)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content: Collection date */}
        <div className="space-y-1 ">
          {test.collectedAt && (
            <div className="text-xs text-text-tertiary mt-1">
              Collected: {formatDate(test.collectedAt)}
            </div>
          )}
        </div>

        {/* Bottom section: Badges (left) + Enter Results button (right) */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            {test.priority && <Badge variant={test.priority} size="xs" />}
            <Badge variant={test.sampleType} size="xs" />
            {(isRetest || isSampleRecollection) && (
              <Badge variant="warning" size="xs">
                {isRetest ? 'RE-TEST' : 'RECOLLECTION'}
              </Badge>
            )}
          </div>
          <IconButton
            variant="edit"
            size="sm"
            title="Enter Results"
            onClick={e => {
              e.stopPropagation();
              handleCardClick();
            }}
          />
        </div>
      </Card>
    );
  }

  // Desktop layout (LabCard)
  // Badges ordered by importance for result entry workflow
  const badges = (
    <>
      {/* Attempt indicator in top corner */}
      {(isRetest || isSampleRecollection) && (
        <AttemptIndicator
          attemptNumber={isRetest ? retestNumber : sampleRecollectionAttempt}
          maxAttempts={
            isRetest ? LAB_CONFIG.MAX_RETEST_ATTEMPTS : LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS
          }
          type={isRetest ? 'retest' : 'recollection'}
          previousReason={
            isRetest
              ? lastResultRejection?.rejectionReason
              : lastSampleRejection?.rejectionNotes || undefined
          }
        />
      )}
      <h3 className="text-sm font-medium text-text-primary">{test.testName}</h3>
      {/* Only show priority badge if urgent or high */}
      {(test.priority === 'urgent' || test.priority === 'high') && (
        <Badge variant={test.priority} size="sm" />
      )}
      <Badge variant={test.sampleType} size="sm" />
      {test.collectedAt && <QueueAgeBadge since={test.collectedAt} />}
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
      {testDef.parameters.slice(0, LAB_CONFIG.PARAMETER_PREVIEW_LIMIT).map(param => (
        <Badge
          key={param.code}
          size="sm"
          className={results[param.code] ? 'text-brand-fg' : 'text-text-tertiary'}
          variant={results[param.code] ? 'primary' : 'default'}
        >
          {param.name}
        </Badge>
      ))}
      {parameterCount > LAB_CONFIG.PARAMETER_PREVIEW_LIMIT && (
        <Badge size="sm" variant="default" className="text-text-tertiary">
          +{parameterCount - LAB_CONFIG.PARAMETER_PREVIEW_LIMIT} more
        </Badge>
      )}
    </div>
  );

  // Additional info for retest/recollection tracking
  const additionalInfo = (() => {
    if (isRetest && test.retestOfTestId) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Re-test of <span className="font-mono text-brand">{displayId.orderTest(test.retestOfTestId)}</span>
          </Badge>
        </div>
      );
    }
    if (isSampleRecollection && test.sampleOriginalSampleId) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection of{' '}
            <span className="font-mono text-brand">
              {displayId.sample(test.sampleOriginalSampleId)}
            </span>
          </Badge>
        </div>
      );
    }
    return undefined;
  })();

  return (
    <LabCard
      onClick={handleCardClick}
      className={hasAnyRejectionHistory ? 'border-warning-stroke-emphasis' : ''}
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
      content={content}
      contentTitle={`Parameters (${parameterCount})`}
    />
  );
};
