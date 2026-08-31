import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '@/components';
import { getLabTabPath, type LabTabId } from '@/features/lab/constants/labTabs';
import {
  getStepCompletionInfo,
  type StepProgress,
} from '../utils/orderTimelineUtils';
import {
  formatTimelineTimestamp,
  getTimelineLabelColor,
  getTimelineLineColor,
  getTimelineStatusColor,
  getTimelineStatusMessage,
} from '../utils/orderTimelineDisplay';
import type { Order } from '@/types';
import { StepIndicator, TestDots } from './OrderTimelineIndicators';

const TEST_BASED_STEPS = ['sample-collected', 'results-entered', 'completed'];

interface OrderTimelineStepProps {
  order: Order;
  step: { status: string; label: string };
  progress: StepProgress;
  nextProgress: StepProgress | null;
  isLast: boolean;
  blocked: boolean;
  labTab?: LabTabId;
  getUserName: (userId: number | string) => string;
}

export const OrderTimelineStep: React.FC<OrderTimelineStepProps> = ({
  order,
  step,
  progress,
  nextProgress,
  isLast,
  blocked,
  labTab,
  getUserName,
}) => {
  const completionInfo = progress.isFullyComplete
    ? getStepCompletionInfo(order, step.status)
    : {};
  const statusMessage = getTimelineStatusMessage(step.status, progress, blocked);
  const showTestDots = TEST_BASED_STEPS.includes(step.status) && order.tests.length >= 1;
  const showLabLink = labTab && progress.isStarted && !progress.isFullyComplete && !blocked;

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <StepIndicator progress={progress} isBlocked={blocked} />
        {!isLast && (
          <div className="flex flex-col items-center py-1">
            <div
              className={`w-0.5 h-6 rounded-full ${getTimelineLineColor(progress, nextProgress, blocked)}`}
            />
          </div>
        )}
      </div>

      <div className="flex-1 flex items-start justify-between pt-0.5 pb-3">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center">
            {showLabLink ? (
              <Link
                to={getLabTabPath(labTab)}
                className={`text-xxs uppercase font-normal hover:underline ${getTimelineLabelColor(progress, step.status, blocked)}`}
              >
                {step.label}
              </Link>
            ) : (
              <p
                className={`text-xxs uppercase font-normal ${getTimelineLabelColor(progress, step.status, blocked)}`}
              >
                {step.label}
              </p>
            )}
            {showTestDots && <TestDots progress={progress} />}
          </div>

          {statusMessage && (
            <p className={`text-xs mt-1 ${getTimelineStatusColor(step.status, progress, blocked)}`}>
              {statusMessage}
            </p>
          )}
          {progress.isFullyComplete && completionInfo.completedAt && (
            <p className="text-xxs text-text-tertiary mt-1">
              {formatTimelineTimestamp(completionInfo.completedAt)}
            </p>
          )}
        </div>

        {progress.isFullyComplete && completionInfo.completedBy && (
          <Avatar
            primaryText={getUserName(completionInfo.completedBy)}
            size="xs"
            avatarOnly
            className="ml-2"
          />
        )}
      </div>
    </div>
  );
};
