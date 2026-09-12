/**
 * ValidationCard - Responsive card component for result validation workflow.
 * Displays test results with approval/rejection actions, retest/recollection info.
 * Supports both desktop (LabCard) and mobile layouts via isMobile prop.
 *
 * Refactored: mobile and desktop layouts extracted into named sub-components.
 */

/* eslint-disable max-lines */

import React from 'react';
import { Badge, Button, Card, Icon, Alert } from '@/components';
import { formatDate, displayId } from '@/utils';
import { useUserLookup } from '@/lib/api/users.api';
import { usePatientNameLookup } from '@/features/patients';
import { LabCard } from '../components/LabCard';
import { QualityIssueDialog } from '@/features/lab/components';
import { AttemptIndicator } from '../components/AttemptIndicator';
import { QueueAgeBadge } from '../components/QueueAgeBadge';
import { useLabCardClickGuard, useTestWorkItemState } from '@/features/lab/hooks';
import { BlockedReasonBadge } from '../components/StatusBadges';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { formatRejectionReasons } from '../utils/labFormatters';
import { useSampleLookup } from '@/features/lab/api/samples.api';
import type { TestWithContext, Sample } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';
import { ICONS } from '@/config/icons';
import { ResultsParameterGrid } from '../components/ResultsParameterGrid';

function getSampleRejectionReason(
  test: TestWithContext,
  getSample: (sampleId: number) => Sample | undefined,
): string | undefined {
  if (!test.sampleId) return undefined;
  const sample = getSample(test.sampleId);
  if (sample?.status !== 'rejected') return undefined;
  return formatRejectionReasons(sample.rejectionReasons) ?? undefined;
}

// ─── ResultGrid ───────────────────────────────────────────────────────────────

/**
 * SpecimenRejectedAlert - Prominent warning when test has rejected specimen.
 * Shows rejection reason and explains validator authority.
 */
function SpecimenRejectedAlert({
  sampleId,
  sampleRejectionReason,
  size = 'default',
}: {
  sampleId?: number;
  sampleRejectionReason?: string;
  size?: 'default' | 'compact';
}) {
  if (!sampleId) return null;

  const isCompact = size === 'compact';

  return (
    <Alert variant="warning" className={isCompact ? 'py-1.5' : 'py-2'}>
      <div className="space-y-1">
        <div>
          <p className={`font-semibold ${isCompact ? 'text-xxs' : 'text-xs'}`}>
            Specimen Rejected — Validator Decision Required
          </p>
          <p className={`text-text-secondary leading-tight mt-0.5 ${isCompact ? 'text-xxs' : 'text-xs'}`}>
            Sample {displayId.sample(sampleId)} was rejected
            {sampleRejectionReason && (
              <>: <span className="italic">{sampleRejectionReason}</span></>
            )}
          </p>
        </div>
        <div className={`space-y-0.5 ${isCompact ? 'text-xxs' : 'text-xs'} text-text-tertiary leading-tight`}>
          <p>⚠️ This result was entered before specimen rejection.</p>
          <p className="font-medium">You may still approve this result (clinical judgment) or choose another action:</p>
          <ul className="list-disc list-inside pl-2 space-y-0.5 mt-1">
            <li>Approve result (add validation notes explaining decision)</li>
            <li>Request recollection with new sample</li>
            <li>Cancel this test</li>
          </ul>
        </div>
      </div>
    </Alert>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ValidationCardProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void;
  onClick: () => void;
  /** When true, approve action is in progress (show loading on approve button) */
  isApproving?: boolean;
  /** When true, renders mobile-optimized layout */
  isMobile?: boolean;
}

// ─── Shared derived state helper ──────────────────────────────────────────────

function deriveCardState(test: TestWithContext) {
  const rejection = deriveRetestContext(test);
  const hasFlags = test.flags && test.flags.length > 0;
  return {
    hasRejectionHistory: rejection.showAttemptIndicator,
    isRetest: rejection.isRetest,
    isRecollection: rejection.showRecollectionBadge,
    showRetestBadge: rejection.showRetestBadge,
    showRecollectionBadge: rejection.showRecollectionBadge,
    showAttemptIndicator: rejection.showAttemptIndicator,
    attemptNumber: rejection.attemptNumber,
    attemptMax: rejection.attemptMax,
    attemptType: rejection.attemptType,
    hasFlags,
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
  sampleRejectionReason,
}: {
  test: TestWithContext;
  patientName: string;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void;
  isApproving: boolean;
  handleCardClick: () => void;
  sampleRejectionReason?: string;
}) {
  const { hasFlags, isRetest, hasRejectionHistory } = deriveCardState(test);
  const workItem = useTestWorkItemState(test);
  const handleRejectionResult = (result: QualityIssueResult) => onReject(result);
  const isSpecimenRejected = workItem.blockedReason === 'sample_rejected';

  return (
    <Card padding="list" hover className="flex flex-col h-full" onClick={handleCardClick}>
      {/* Specimen Rejection Alert */}
      {isSpecimenRejected && (
        <div className="mb-3">
          <SpecimenRejectedAlert
            sampleId={test.sampleId}
            sampleRejectionReason={sampleRejectionReason}
            size="compact"
          />
        </div>
      )}
      
      {/* Header: Test name + Patient name, Test code, Sample ID */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0 overflow-hidden">
          <div className="text-sm font-normal text-text-primary truncate">{test.testName}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs text-text-secondary font-normal truncate capitalize">
              {patientName}
            </div>
            {test.id != null && (
              <>
                <div className="text-xxs text-text-disabled">•</div>
                <div className="entity-id entity-id--secondary truncate">
                  {displayId.orderTest(test.id)}
                </div>
              </>
            )}
            <div className="text-xxs text-text-disabled">•</div>
            <div className="entity-id entity-id--secondary truncate">
              {test.testCode}
            </div>
            {test.sampleId && (
              <>
                <div className="text-xs text-text-disabled">•</div>
                <div
                  className="entity-id entity-id--secondary truncate"
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
            <ResultsParameterGrid
              results={test.results!}
              flags={test.flags}
              variant="inline"
              dense
            />
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
          {workItem.blockedReason && (
            <BlockedReasonBadge label={workItem.label} size="xs" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <div onClick={e => e.stopPropagation()}>
            <QualityIssueDialog
              orderTestId={test.id!}
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
  sampleRejectionReason,
}: {
  test: TestWithContext;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void;
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
  sampleRejectionReason?: string;
}) {
  const {
    hasRejectionHistory,
    showRetestBadge,
    showRecollectionBadge,
    showAttemptIndicator,
    attemptNumber,
    attemptMax,
    attemptType,
  } = deriveCardState(test);
  const workItem = useTestWorkItemState(test);
  const handleRejectionResult = (result: QualityIssueResult) => onReject(result);
  const resultCount = Object.keys(test.results!).length;
  const isSpecimenRejected = workItem.blockedReason === 'sample_rejected';

  const badges = (
    <>
      {/* Attempt indicator in top corner */}
      {showAttemptIndicator && (
        <AttemptIndicator
          attemptNumber={attemptNumber}
          maxAttempts={attemptMax}
          type={attemptType}
          previousReason={undefined}
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
      {workItem.blockedReason && <BlockedReasonBadge label={workItem.label} size="sm" />}
    </>
  );

  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
      <QualityIssueDialog
        orderTestId={test.id!}
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
            Re-test of <span className="entity-id">{displayId.orderTest(test.retestOfTestId)}</span>
          </Badge>
        )}
        {showRecollectionBadge && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection attempt #{attemptNumber}
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
        orderTestId: test.id,
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
      content={
        <>
          {isSpecimenRejected && (
            <div className="mb-3">
              <SpecimenRejectedAlert
                sampleId={test.sampleId}
                sampleRejectionReason={sampleRejectionReason}
              />
            </div>
          )}
          <ResultsParameterGrid results={test.results!} flags={test.flags} variant="inline" />
        </>
      }
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
  const { getSample } = useSampleLookup();
  const handleCardClick = useLabCardClickGuard(onClick);

  if (!test.results) return null;

  const patientName = getPatientName(test.patientId);
  const sampleRejectionReason = getSampleRejectionReason(test, getSample);

  if (isMobile) {
    return (
      <ValidationCardMobile
        test={test}
        patientName={patientName}
        onApprove={onApprove}
        onReject={onReject}
        isApproving={isApproving}
        handleCardClick={handleCardClick}
        sampleRejectionReason={sampleRejectionReason}
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
      sampleRejectionReason={sampleRejectionReason}
    />
  );
};
