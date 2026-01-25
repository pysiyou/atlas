/**
 * ValidationMobileCard - Mobile-friendly card component for result validation
 *
 * Simplified card layout for small screens, similar to PatientCard/PaymentCard style.
 * Shows essential information in a compact, touch-friendly format.
 */

import React from 'react';
import { brandColors } from '@/shared/design-system/tokens/colors';
import { Badge, IconButton } from '@/shared/ui';
import { formatDate } from '@/utils';
import { displayId } from '@/utils/id-display';
import { usePatientNameLookup } from '@/hooks/queries';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import type { TestWithContext } from '@/types';
import { RejectionDialog } from '../components';
import { mobileCard } from '@/shared/design-system/tokens/components/card';
import { semanticColors } from '@/shared/design-system/tokens/colors';

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
  const entries = Object.entries(results);
  // Show up to 8 items (4 per row x 2 rows) for compact display
  const maxVisible = 8;
  const visibleEntries = entries.slice(0, maxVisible);
  const remainingCount = entries.length - maxVisible;

  return (
    <div className="grid grid-cols-4 grid-rows-2 gap-x-3 gap-y-0.5">
      {visibleEntries.map(([key, value]) => {
        const { resultValue, unit, status } = parseResultEntry(
          key,
          value,
          flagStatusMap
        );
        const abnormal = status !== 'normal';
        const valueColor = abnormal
          ? isCritical(status)
            ? semanticColors.danger.icon // text-red-600
            : semanticColors.warning.valueHigh
          : 'text-gray-900';

        return (
          <div
            key={key}
            className="grid grid-cols-[1fr_auto] items-baseline whitespace-nowrap"
          >
            <span className="text-xs text-gray-500" title={key}>
              {key}:
            </span>
            <span className={`text-xs font-medium text-left ${valueColor}`}>
              {resultValue}
              {unit && <span className="text-gray-500 font-normal ml-0.5 text-[9px]">{unit}</span>}
            </span>
          </div>
        );
      })}
      {remainingCount > 0 && (
        <div className="text-xs text-gray-500 col-span-full pt-0.5">
          +{remainingCount} more
        </div>
      )}
    </div>
  );
}

interface ValidationMobileCardProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (reason?: string, type?: 're-test' | 're-collect') => void;
  onClick?: () => void;
  orderHasValidatedTests?: boolean;
}

export const ValidationMobileCard: React.FC<ValidationMobileCardProps> = ({
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
  const { getPatientName } = usePatientNameLookup();

  if (!test.results) return null;

  const patientName = getPatientName(test.patientId);
  const hasFlags = test.flags && test.flags.length > 0;
  const isRetest = test.isRetest === true;
  const hasRejectionHistory = test.resultRejectionHistory && test.resultRejectionHistory.length > 0;

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

  const flagStatusMap = statusMapFromFlags(test.flags);

  return (
    <div
      onClick={handleCardClick}
      className={mobileCard.base}
    >
      {/* Header: Test name + Patient name, Test code, Sample ID */}
      <div className={mobileCard.header.container}>
        <div className="min-w-0 overflow-hidden">
          <div className={mobileCard.header.title}>{test.testName}</div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-xs text-gray-700 font-medium truncate">{patientName}</div>
            <div className="text-xxs text-gray-400">•</div>
            <div className={`text-xxs ${brandColors.primary.icon} font-medium font-mono truncate`}>
              {test.testCode}
            </div>
            {test.sampleId && (
              <>
                <div className="text-xs text-gray-400">•</div>
                <div
                  className={`text-xxs ${brandColors.primary.icon} font-medium font-mono truncate`}
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
      <div className={mobileCard.content.container}>
        <div className="space-y-1">
          <div className="mt-2">
            <ResultGrid results={test.results} flagStatusMap={flagStatusMap} />
          </div>
          {test.resultEnteredAt && (
            <div className={mobileCard.content.textSecondary}>
              Entered: {formatDate(test.resultEnteredAt)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom section: Badges (left) + Approve/Reject buttons (right) */}
      <div className={mobileCard.footer.container}>
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
              onReject={() => {
                onReject(undefined, undefined);
              }}
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
};
