/**
 * ValidationCardMobile - Mobile layout for result validation workflow
 */

import React from 'react';
import { Badge, Button, Card } from '@/components';
import { formatDate, displayId } from '@/utils';
import { QualityIssueDialog } from '../../components';
import { BlockedReasonBadge } from '../../components/StatusBadges';
import { ResultsParameterGrid } from '../../components/ResultsParameterGrid';
import { SpecimenRejectedAlert } from './SpecimenRejectedAlert';
import type { ValidationCardSharedData } from './hooks';

export const ValidationCardMobile: React.FC<ValidationCardSharedData> = ({
  test,
  patientName,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejectionReason,
  workItem,
  rejection,
}) => {
  const { showAttemptIndicator, isRetest } = rejection;
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
          {test.flags && test.flags.length > 0 && (
            <Badge variant="danger" size="xs">
              {test.flags.length} FLAG{test.flags.length > 1 ? 'S' : ''}
            </Badge>
          )}
          {test.priority && <Badge variant={test.priority} size="xs" />}
          <Badge variant={test.sampleType} size="xs" />
          {(isRetest || showAttemptIndicator) && (
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
              onReject={onReject}
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
};
