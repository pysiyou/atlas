/**
 * ValidationCard - Responsive card component for result validation workflow.
 * Displays test results with approval/rejection actions, retest/recollection info.
 * Supports both desktop (LabCard) and mobile layouts via isMobile prop.
 */

import React from 'react';
import { Badge, Icon, IconButton, Alert } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { formatDate } from '@/utils';
import { displayId } from '@/utils';
import { useUserLookup, usePatientNameLookup } from '@/hooks/queries';
import { LabCard } from '../components/LabCard';
import { RejectionDialog } from '../components';
import type { TestWithContext } from '@/types';
import { ICONS } from '@/utils';
import {
  type ResultStatus,
  isCritical,
  statusMapFromFlags,
  parseResultEntry,
} from '../utils/lab-helpers';

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
    // Mobile: Show up to 8 items (4 per row x 2 rows) for compact display
    const maxVisible = 8;
    const visibleEntries = entries.slice(0, maxVisible);
    const remainingCount = entries.length - maxVisible;

    return (
      <div className="grid grid-cols-4 grid-rows-2 gap-x-3 gap-y-0.5">
        {visibleEntries.map(([key, value]) => {
          const { resultValue, unit, status } = parseResultEntry(key, value, flagStatusMap);
          const abnormal = status !== 'normal';
          const valueColor = abnormal
            ? isCritical(status)
              ? 'text-red-600'
              : 'text-amber-600'
            : 'text-text-primary';

          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_auto] items-baseline whitespace-nowrap"
            >
              <span className="text-xs text-text-tertiary" title={key}>
                {key}:
              </span>
              <span className={`text-xs font-medium text-left ${valueColor}`}>
                {resultValue}
                {unit && (
                  <span className="text-text-tertiary font-normal ml-0.5 text-[9px]">{unit}</span>
                )}
              </span>
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div className="text-xs text-text-tertiary col-span-full pt-0.5">
            +{remainingCount} more
          </div>
        )}
      </div>
    );
  }

  // Desktop: Full grid
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,max-content))] gap-x-8 gap-y-1">
      {entries.map(([key, value]) => {
        const { resultValue, unit, status } = parseResultEntry(key, value, flagStatusMap);
        const abnormal = status !== 'normal';
        const valueColor = abnormal
          ? isCritical(status)
            ? 'text-red-600'
            : 'text-amber-600'
          : 'text-text-primary';

        return (
          <div
            key={key}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 whitespace-nowrap"
          >
            <span className="text-xs text-text-tertiary text-right" title={key}>
              {key}:
            </span>
            <span className={`text-sm font-medium text-left ${valueColor}`}>
              {resultValue}
              {unit && <span className="text-text-tertiary font-normal ml-1">{unit}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface ValidationCardProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (reason?: string, type?: 're-test' | 're-collect') => void;
  onClick?: () => void;
  /** When true, re-collect is disabled (order has validated tests). */
  orderHasValidatedTests?: boolean;
  /** When true, renders mobile-optimized layout */
  isMobile?: boolean;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({
  test,
  commentKey,
  comments,
  onCommentsChange,
  onApprove,
  onReject,
  onClick,
  orderHasValidatedTests = false,
  isMobile = false,
}) => {
  const { openModal } = useModal();
  const { getUserName } = useUserLookup();
  const { getPatientName } = usePatientNameLookup();

  if (!test.results) return null;

  const resultCount = Object.keys(test.results).length;
  const patientName = getPatientName(test.patientId);
  const rejectionHistory = test.resultRejectionHistory ?? [];
  const lastRejection = rejectionHistory.at(-1) ?? null;
  const hasRejectionHistory = rejectionHistory.length > 0;
  const isRetest = test.isRetest === true;
  const isRecollection = lastRejection?.rejectionType === 're-collect';
  const hasFlags = test.flags && test.flags.length > 0;

  const handleCardClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    openModal(ModalType.VALIDATION_DETAIL, {
      test,
      commentKey,
      comments,
      onCommentsChange,
      onApprove,
      onReject,
      orderHasValidatedTests,
    });
  };

  /** RejectionDialog calls API; we signal parent to refresh only (no second request). */
  const handleRejectionResult = () => onReject(undefined, undefined);

  const flagStatusMap = statusMapFromFlags(test.flags);

  // Mobile layout
  if (isMobile) {
    return (
      <div
        onClick={handleCardClick}
        className="bg-surface border border-border rounded-md p-3 duration-200 cursor-pointer flex flex-col h-full"
      >
        {/* Header: Test name + Patient name, Test code, Sample ID */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0 overflow-hidden">
            <div className="text-sm font-medium text-text-primary truncate">{test.testName}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs text-text-secondary font-medium truncate">{patientName}</div>
              <div className="text-xxs text-text-disabled">•</div>
              <div className="text-xxs text-brand font-medium font-mono truncate">
                {test.testCode}
              </div>
              {test.sampleId && (
                <>
                  <div className="text-xs text-text-disabled">•</div>
                  <div
                    className="text-xxs text-brand font-medium font-mono truncate"
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
              <ResultGrid results={test.results} flagStatusMap={flagStatusMap} compact />
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
                orderHasValidatedTests={orderHasValidatedTests}
                onReject={handleRejectionResult}
              />
            </div>
            <IconButton
              variant="approve"
              size="sm"
              title="Approve Results"
              onClick={e => {
                e.stopPropagation();
                onApprove();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout (LabCard)
  const badges = (
    <>
      <h3 className="text-sm font-medium text-text-primary">{test.testName}</h3>
      <Badge variant={test.priority} size="sm" />
      <Badge variant={test.sampleType} size="sm" />
      <span className="text-xs text-brand font-mono">{test.testCode}</span>
    </>
  );

  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
      <RejectionDialog
        orderId={test.orderId}
        testCode={test.testCode}
        testName={test.testName}
        patientName={test.patientName}
        orderHasValidatedTests={orderHasValidatedTests}
        onReject={handleRejectionResult}
      />
      <IconButton
        onClick={e => {
          e.stopPropagation();
          onApprove();
        }}
        variant="approve"
        size="sm"
        title="Approve Results"
      />
    </div>
  );

  const additionalInfo = test.resultEnteredAt && (
    <span className="text-xs text-text-tertiary">
      Results entered <span className="text-text-secondary">{formatDate(test.resultEnteredAt)}</span>
      {test.enteredBy && <span> by {getUserName(test.enteredBy)}</span>}
    </span>
  );

  const content = <ResultGrid results={test.results} flagStatusMap={flagStatusMap} />;

  const rejectionBanner =
    hasRejectionHistory && lastRejection ? (
      <Alert variant="warning" className="py-2">
        <div className="space-y-0.5">
          <p className="font-medium text-xs">
            {isRetest
              ? `Re-test #${test.retestNumber ?? 0} - Previous Result Rejected`
              : `Re-collect #${rejectionHistory.length} - Previous Sample Rejected`}
          </p>
          <p className="text-xxs opacity-90 leading-tight">
            Reason: {lastRejection.rejectionReason}
          </p>
          {rejectionHistory.length > 1 && (
            <p className="text-xxs opacity-75">
              ({rejectionHistory.length} previous rejection
              {rejectionHistory.length > 1 ? 's' : ''})
            </p>
          )}
        </div>
      </Alert>
    ) : undefined;

  const showRetestBadge = isRetest && test.retestOfTestId;
  const showRecollectionBadge = isRecollection && !isRetest;
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
      className={hasRejectionHistory ? 'border-amber-500' : ''}
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
      recollectionBanner={rejectionBanner}
      content={content}
      contentTitle={`Results (${resultCount})`}
    />
  );
};
