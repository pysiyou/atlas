/**
 * ValidationCard - Card component for result validation workflow.
 * Displays test results with approval/rejection actions, retest/recollection info.
 */

import React from 'react';
import { Badge, Icon, IconButton, Alert } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { formatDate } from '@/utils';
import { useUserLookup } from '@/hooks/queries';
import { LabCard } from '../components/LabCard';
import { RejectionDialog } from '../components';
import type { TestWithContext } from '@/types';
import { ICONS } from '@/utils/icon-mappings';
import { semanticColors } from '@/shared/design-system/tokens/colors';
import { labCard } from '@/shared/design-system/tokens/components/card';

type ResultStatus =
  | 'normal'
  | 'high'
  | 'low'
  | 'critical'
  | 'critical-high'
  | 'critical-low';

const ABNORMAL_STATUSES: ResultStatus[] = [
  'high',
  'low',
  'critical',
  'critical-high',
  'critical-low',
];

function isCritical(s: ResultStatus): boolean {
  return s === 'critical' || s === 'critical-high' || s === 'critical-low';
}

/**
 * Build result key -> status from test.flags.
 * Backend stores "itemCode:status" (e.g. "K:critical-high", "Na:low").
 */
function statusMapFromFlags(
  flags: string[] | undefined
): Record<string, ResultStatus> {
  const map: Record<string, ResultStatus> = {};
  if (!flags?.length) return map;
  const valid = new Set(ABNORMAL_STATUSES);
  for (const f of flags) {
    const i = f.indexOf(':');
    if (i === -1) continue;
    const key = f.slice(0, i).trim();
    const status = f.slice(i + 1).trim().toLowerCase() as ResultStatus;
    if (key && valid.has(status)) map[key] = status;
  }
  return map;
}

/**
 * Parse a single result entry (value may be raw or { value, unit?, status? }).
 */
function parseResultEntry(
  key: string,
  raw: unknown,
  flagStatusMap: Record<string, ResultStatus>
): { resultValue: string; unit: string; status: ResultStatus } {
  const obj =
    typeof raw === 'object' && raw !== null && 'value' in (raw as object)
      ? (raw as { value: unknown; unit?: string; status?: string })
      : null;
  const resultValue = obj ? String(obj.value) : String(raw);
  const unit = obj?.unit ?? '';
  const statusFromResult = obj?.status as ResultStatus | undefined;
  const status = flagStatusMap[key] ?? statusFromResult ?? 'normal';
  return { resultValue, unit, status };
}

function ResultGrid({
  results,
  flagStatusMap,
}: {
  results: Record<string, unknown>;
  flagStatusMap: Record<string, ResultStatus>;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,max-content))] gap-x-8 gap-y-1">
      {Object.entries(results).map(([key, value]) => {
        const { resultValue, unit, status } = parseResultEntry(
          key,
          value,
          flagStatusMap
        );
        const abnormal = status !== 'normal';
        const valueColor = abnormal
          ? isCritical(status)
            ? 'text-red-600'
            : semanticColors.warning.valueHigh
          : 'text-gray-900';

        return (
          <div
            key={key}
            className="grid grid-cols-[1fr_auto] items-baseline gap-x-2 whitespace-nowrap"
          >
            <span className="text-xs text-gray-500 text-right" title={key}>
              {key}:
            </span>
            <span className={`text-sm font-medium text-left ${valueColor}`}>
              {resultValue}
              {unit && <span className="text-gray-500 font-normal ml-1">{unit}</span>}
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
}) => {
  const { openModal } = useModal();
  const { getUserName } = useUserLookup();

  if (!test.results) return null;

  const resultCount = Object.keys(test.results).length;
  const rejectionHistory = test.resultRejectionHistory ?? [];
  const lastRejection = rejectionHistory.at(-1) ?? null;
  const hasRejectionHistory = rejectionHistory.length > 0;
  const isRetest = test.isRetest === true;
  const isRecollection = lastRejection?.rejectionType === 're-collect';

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
    <span className="text-xs text-gray-500">
      Results entered <span className="text-gray-700">{formatDate(test.resultEnteredAt)}</span>
      {test.enteredBy && <span> by {getUserName(test.enteredBy)}</span>}
    </span>
  );

  const content = (
    <ResultGrid results={test.results} flagStatusMap={flagStatusMap} />
  );

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
            Re-test of {test.retestOfTestId}
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
      className={hasRejectionHistory ? labCard.rejectionBorder : ''}
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
