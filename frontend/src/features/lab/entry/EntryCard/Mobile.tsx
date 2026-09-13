/**
 * EntryCardMobile - Mobile layout for result entry workflow
 */

import React from 'react';
import { Badge, Card, IconButton } from '@/components';
import { formatDate, displayId } from '@/utils';
import { BlockedReasonBadge } from '../../components/StatusBadges';
import type { EntryCardSharedData } from './hooks';

export const EntryCardMobile: React.FC<EntryCardSharedData> = ({
  test,
  patientName,
  handleCardClick,
  workItem,
  rejection,
}) => {
  const { isRetest, isSampleRecollection } = rejection;

  return (
    <Card padding="list" hover className="flex flex-col h-full" onClick={handleCardClick}>
      {/* Header: Test name */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="min-w-0 overflow-hidden">
          <div className="text-sm font-normal text-text-primary truncate">{test.testName}</div>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="truncate capitalize">{patientName}</span>
            <span className="text-text-tertiary">•</span>
            {test.id != null && (
              <>
                <span className="entity-id truncate">{displayId.orderTest(test.id)}</span>
                <span className="text-text-tertiary">•</span>
              </>
            )}
            <span className="entity-id truncate">{test.testCode}</span>
            {test.sampleId && (
              <>
                <span className="text-text-tertiary">•</span>
                <span
                  className="entity-id truncate"
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
          {workItem.blockedReason && (
            <BlockedReasonBadge label={workItem.label} size="xs" />
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
};
