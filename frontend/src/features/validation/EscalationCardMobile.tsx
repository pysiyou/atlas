import React from 'react';
import { Badge, Card, Button, Icon } from '@/components';
import { formatDate, displayId } from '@/utils';
import type { TestWithContext } from '@/types';
import { ICONS } from '@/utils';

interface EscalationCardMobileProps {
  test: TestWithContext;
  onClick: () => void;
  handleCardClick: () => void;
  isRetest: boolean;
  hasRejectionHistory: boolean;
}

export const EscalationCardMobile: React.FC<EscalationCardMobileProps> = ({
  test,
  onClick,
  handleCardClick,
  isRetest,
  hasRejectionHistory,
}) => (
  <Card padding="list" hover className="flex flex-col h-full" onClick={handleCardClick}>
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="min-w-0 overflow-hidden">
        <div className="text-sm font-normal text-text-primary truncate">
          {test.testName ?? test.testCode}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-text-secondary font-normal truncate capitalize">
            {test.patientName}
          </div>
          <div className="text-xxs text-text-disabled">•</div>
          <div className="text-xxs text-brand font-normal font-mono truncate">{test.testCode}</div>
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

    <div className="space-y-1">
      {test.collectedAt && (
        <div className="text-xs text-text-tertiary">Collected: {formatDate(test.collectedAt)}</div>
      )}
      {test.resultEnteredAt && (
        <div className="text-xs text-text-tertiary">Entered: {formatDate(test.resultEnteredAt)}</div>
      )}
    </div>

    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-border-subtle">
      <div className="flex items-center gap-2">
        <Badge variant="escalated" size="xs" />
        {test.priority && (
          <Badge variant={test.priority as 'low' | 'medium' | 'high' | 'urgent'} size="xs" />
        )}
        {test.sampleType && (
          <Badge variant={test.sampleType as 'blood' | 'urine' | 'other'} size="xs" />
        )}
        {(isRetest || hasRejectionHistory) && (
          <Badge variant="warning" size="xs">
            RE-TEST
          </Badge>
        )}
      </div>
      <Button
        variant="primary"
        size="sm"
        icon={<Icon name={ICONS.actions.eye} className="text-on-brand" />}
        onClick={e => {
          e.stopPropagation();
          onClick();
        }}
      >
        View
      </Button>
    </div>
  </Card>
);
