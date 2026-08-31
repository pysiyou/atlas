/**
 * ValidationCard - Responsive card component for result validation workflow.
 * Displays test results with approval/rejection actions, retest/recollection info.
 * Supports both desktop (LabCard) and mobile layouts via isMobile prop.
 *
 * Refactored: mobile and desktop layouts extracted into named sub-components.
 */

/* eslint-disable max-lines */

import React from 'react';
import { Badge, Button, Card, Icon } from '@/components';
import { formatDate, displayId } from '@/utils';
import { useUserLookup } from '@/features/admin';
import { usePatientNameLookup } from '@/features/patients/api/usePatients';
import { LabCard } from '@/features/lab/components/LabCard';
import { LAB_CONFIG } from '@/features/lab/constants';
import { RejectionDialog } from '@/features/lab/components';
import { AttemptIndicator } from '@/features/lab/components/AttemptIndicator';
import { QueueAgeBadge } from '@/features/lab/components/QueueAgeBadge';
import { useLabCardClickGuard } from '@/features/lab/hooks';
import { deriveTestRejectionContext } from '@/features/lab/utils/deriveTestRejectionContext';
import type { TestWithContext } from '@/types';
import { ICONS } from '@/utils';
import {
  type ResultStatus,
  isCritical,
  statusMapFromFlags,
  parseResultEntry,
} from '@/features/lab/utils/labHelpers';

// ─── ResultGrid ───────────────────────────────────────────────────────────────

function ResultGrid({
  results,
  flagStatusMap,
  compact = false,
}: {
  results: Record<string, unknown>;
  flagStatusMap: Record<string, ResultStatus>;
  compact?: boolean;
}) {
  const entries = Object.entries(results);

  if (compact) {
    const maxVisible = LAB_CONFIG.COMPACT_RESULT_GRID_LIMIT;
    const visibleEntries = entries.slice(0, maxVisible);
    const remainingCount = entries.length - maxVisible;

    return (
      <div className="grid grid-cols-4 grid-rows-2 gap-x-3 gap-y-0.5">
        {visibleEntries.map(([key, value]) => {
          const { resultValue, unit, status } = parseResultEntry(key, value, flagStatusMap);
          const abnormal = status !== 'normal';
          const valueColor = abnormal
            ? isCritical(status)
              ? 'text-danger-fg'
              : 'text-warning-fg'
            : 'text-text-primary';

          return (
            <div key={key} className="grid grid-cols-[1fr_auto] items-baseline whitespace-nowrap">
              <span className="text-xxs text-text-tertiary" title={key}>
                {key}:
              </span>
              <span className={`text-xxs font-normal text-left ${valueColor}`}>
                {resultValue}
                {unit && (
                  <span className="text-text-tertiary font-normal ml-0.5 text-[9px]">{unit}</span>
                )}
              </span>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="text-xxs text-text-tertiary col-span-full pt-0.5">
            +{remainingCount} more
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,max-content))] gap-x-8 gap-y-1">
      {entries.map(([key, value]) => {
        const { resultValue, unit, status } = parseResultEntry(key, value, flagStatusMap);
        const abnormal = status !== 'normal';
        const valueColor = abnormal
          ? isCritical(status)
            ? 'text-danger-fg'
            : 'text-warning-fg'
          : 'text-text-primary';

        return (
          <div
            key={key}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 whitespace-nowrap"
          >
            <span className="text-xxs text-text-tertiary text-right" title={key}>
              {key}:
            </span>
            <span className={`text-xs font-normal text-left ${valueColor}`}>
              {resultValue}
              {unit && <span className="text-text-tertiary font-normal ml-1 text-xxs">{unit}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationCardProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onClick: () => void;
  /** When true, approve action is in progress (show loading on approve button) */
  isApproving?: boolean;
  /** When true, renders mobile-optimized layout */
  isMobile?: boolean;
}

// ─── Shared derived state helper ──────────────────────────────────────────────

function deriveCardState(test: TestWithContext) {
  const rejection = deriveTestRejectionContext(test);
  const hasFlags = test.flags && test.flags.length > 0;
  const flagStatusMap = statusMapFromFlags(test.flags);
  return {
    rejectionHistory: rejection.resultRejectionHistory,
    lastRejection: rejection.lastResultRejection,
    hasRejectionHistory: rejection.hasResultRejectionHistory,
    isRetest: rejection.isRetest,
    isRecollection: rejection.isResultRecollection,
    showRetestBadge: rejection.showRetestBadge,
    showRecollectionBadge: rejection.showRecollectionBadge,
    showAttemptIndicator: rejection.showAttemptIndicator,
    attemptNumber: rejection.attemptNumber,
    attemptMax: rejection.attemptMax,
    attemptType: rejection.attemptType,
    previousReason: rejection.previousReason,
    hasFlags,
    flagStatusMap,
  };
}

// ─── ValidationCardMobile ─────────────────────────────────────────────────────

function ValidationCardMobile({
  test,
  patientName,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
}: {
  test: TestWithContext;
  patientName: string;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  handleCardClick: () => void;
}) {
  const { hasFlags, isRetest, hasRejectionHistory, flagStatusMap } = deriveCardState(test);
  const handleRejectionResult = () => onReject();

  return (
    <Card padding="list" hover className="flex flex-col h-full" onClick={handleCardClick}>
      {/* Header: Test name + Patient name, Test code, Sample ID */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0 overflow-hidden">
          <div className="text-sm font-normal text-text-primary truncate">{test.testName}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs text-text-secondary font-normal truncate capitalize">
              {patientName}
            </div>
            <div className="text-xxs text-text-disabled">•</div>
            <div className="text-xxs text-brand font-normal font-mono truncate">
              {test.testCode}
            </div>
            {test.sampleId && (
              <>
                <div className="text-xs text-text-disabled">•</div>
                <div
                  className="text-xxs text-brand font-normal font-mono truncate"
                  title={displayId.sample(test.sampleId)}
                >
                  {displayId.sample(test.sampleId)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content: Results, entry date */}
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="mt-2">
            <ResultGrid results={test.results!} flagStatusMap={flagStatusMap} compact />
          </div>
          {test.resultEnteredAt && (
            <div className="text-xs text-text-tertiary">
              Entered: {formatDate(test.resultEnteredAt)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Badges (left) + Approve/Reject buttons (right) */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          {hasFlags && (
            <Badge variant="danger" size="xs">
              {test.flags!.length} FLAG{test.flags!.length > 1 ? 'S' : ''}
            </Badge>
          )}
          {test.priority && <Badge variant={test.priority} size="xs" />}
          <Badge variant={test.sampleType} size="xs" />
          {(isRetest || hasRejectionHistory) && (
            <Badge variant="warning" size="xs">
              RE-TEST
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div onClick={e => e.stopPropagation()}>
            <RejectionDialog
              orderId={test.orderId}
              testCode={test.testCode}
              testName={test.testName}
              patientName={patientName}
              onReject={handleRejectionResult}
            />
          </div>
          <Button
            variant="approve"
            size="sm"
            title="Approve Results"
            isLoading={isApproving}
            onClick={e => {
              e.stopPropagation();
              onApprove();
            }}
          >
            Approve
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── ValidationCardDesktop ────────────────────────────────────────────────────

function ValidationCardDesktop({
  test,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  getUserName,
}: {
  test: TestWithContext;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
}) {
  const {
    rejectionHistory,
    lastRejection: _lastRejection,
    hasRejectionHistory,
    showRetestBadge,
    showRecollectionBadge,
    showAttemptIndicator,
    attemptNumber,
    attemptMax,
    attemptType,
    previousReason,
    flagStatusMap,
  } = deriveCardState(test);
  const handleRejectionResult = () => onReject();
  const resultCount = Object.keys(test.results!).length;

  const badges = (
    <>
      {/* Attempt indicator in top corner */}
      {showAttemptIndicator && (
        <AttemptIndicator
          attemptNumber={attemptNumber}
          maxAttempts={attemptMax}
          type={attemptType}
          previousReason={previousReason}
        />
      )}
      <h3 className="text-sm font-medium text-text-primary">{test.testName}</h3>
      {/* Merge priority and critical flags into single alert badge */}
      {test.hasCriticalValues ? (
        <Badge variant="danger" size="sm" className="flex items-center gap-1">
          <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
          CRITICAL
        </Badge>
      ) : test.priority === 'urgent' || test.priority === 'high' ? (
        <Badge variant={test.priority} size="sm" />
      ) : null}
      <Badge variant={test.sampleType} size="sm" />
      {test.resultEnteredAt && <QueueAgeBadge since={test.resultEnteredAt} />}
    </>
  );

  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
      <RejectionDialog
        orderId={test.orderId}
        testCode={test.testCode}
        testName={test.testName}
        patientName={test.patientName}
        onReject={handleRejectionResult}
      />
      <Button
        variant="approve"
        size="sm"
        title="Approve Results"
        isLoading={isApproving}
        onClick={e => {
          e.stopPropagation();
          onApprove();
        }}
      >
        Approve
      </Button>
    </div>
  );

  const additionalInfo = test.resultEnteredAt && (
    <span className="text-xs text-text-tertiary">
      Results entered{' '}
      <span className="text-text-secondary">{formatDate(test.resultEnteredAt)}</span>
      {test.enteredBy && (
        <>
          {' '}
          by <span className="text-text-secondary">{getUserName(test.enteredBy)}</span>
        </>
      )}
    </span>
  );

  const rejectionTrackingInfo =
    hasRejectionHistory && (showRetestBadge || showRecollectionBadge) ? (
      <div className="flex items-center gap-2 flex-wrap">
        {showRetestBadge && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Re-test of <span className="font-mono text-brand">{displayId.orderTest(test.retestOfTestId)}</span>
          </Badge>
        )}
        {showRecollectionBadge && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection attempt #{rejectionHistory.length}
          </Badge>
        )}
      </div>
    ) : undefined;

  return (
    <LabCard
      onClick={handleCardClick}
      className={hasRejectionHistory ? 'border-warning-stroke-emphasis' : ''}
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
      additionalInfo={
        <>
          {additionalInfo}
          {rejectionTrackingInfo}
        </>
      }
      badges={badges}
      actions={actions}
      content={<ResultGrid results={test.results!} flagStatusMap={flagStatusMap} />}
      contentTitle={`Results (${resultCount})`}
    />
  );
}

// ─── ValidationCard (dispatcher) ─────────────────────────────────────────────

export const ValidationCard: React.FC<ValidationCardProps> = ({
  test,
  commentKey: _commentKey,
  comments: _comments,
  onCommentsChange: _onCommentsChange,
  onApprove,
  onReject,
  onClick,
  isApproving = false,
  isMobile = false,
}) => {
  const { getUserName } = useUserLookup();
  const { getPatientName } = usePatientNameLookup();
  const handleCardClick = useLabCardClickGuard(onClick);

  if (!test.results) return null;

  const patientName = getPatientName(test.patientId);

  if (isMobile) {
    return (
      <ValidationCardMobile
        test={test}
        patientName={patientName}
        onApprove={onApprove}
        onReject={onReject}
        isApproving={isApproving}
        handleCardClick={handleCardClick}
      />
    );
  }

  return (
    <ValidationCardDesktop
      test={test}
      onApprove={onApprove}
      onReject={onReject}
      isApproving={isApproving}
      handleCardClick={handleCardClick}
      getUserName={getUserName}
    />
  );
};
