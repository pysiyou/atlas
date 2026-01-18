import React from 'react';
import { Avatar } from '@/shared/ui';
import { STATUS_TIMELINE_STEPS, getOrderStepProgress, type StepProgress } from './utils';
import type { Order } from '@/types';

interface OrderTimelineProps {
  order: Order;
}

interface StepIndicatorProps {
  progress: StepProgress;
  isInProgress: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ progress, isInProgress }) => {
  const { isFullyComplete, isPartial, percentage } = progress;

  // In progress state - pulsing indicator
  if (isInProgress) {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-sky-500 bg-sky-50 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
      </div>
    );
  }

  // Fully complete - green checkmark
  if (isFullyComplete) {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  // Partial completion - percentage ring
  if (isPartial) {
    const circumference = 2 * Math.PI * 8; // radius = 8
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="w-5 h-5 relative">
        <svg className="w-5 h-5 -rotate-90" viewBox="0 0 20 20">
          {/* Background circle */}
          <circle cx="10" cy="10" r="8" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
          {/* Progress circle */}
          <circle
            cx="10"
            cy="10"
            r="8"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
      </div>
    );
  }

  // Not started - empty circle
  return <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />;
};

interface TestDotsProps {
  progress: StepProgress;
}

const TestDots: React.FC<TestDotsProps> = ({ progress }) => {
  const { completed, total } = progress;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-1.5 ml-3">
      {Array.from({ length: total }).map((_, index) => {
        const isCompleted = index < completed;
        return (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              isCompleted
                ? 'bg-blue-500 ring-2 ring-blue-500/30'
                : 'bg-transparent ring-1 ring-blue-300'
            }`}
          />
        );
      })}
    </div>
  );
};

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  // Get progress for each step
  const stepProgressMap = React.useMemo(() => {
    return STATUS_TIMELINE_STEPS.reduce(
      (acc, step) => {
        acc[step.status] = getOrderStepProgress(order, step.status);
        return acc;
      },
      {} as Record<string, StepProgress>
    );
  }, [order]);

  // Get completion info for each step
  const getStepCompletionInfo = (stepStatus: string): { completedBy?: string; completedAt?: string } => {
    switch (stepStatus) {
      case 'pending':
        return {
          completedBy: order.createdBy,
          completedAt: order.orderDate,
        };
      case 'sample-collected': {
        return {
          completedBy: order.createdBy,
          completedAt: order.createdAt,
        };
      }
      case 'in-progress': {
        const inProgressTest = order.tests.find((t) =>
          ['in-progress', 'completed', 'validated', 'rejected'].includes(t.status)
        );
        return {
          completedBy: inProgressTest?.enteredBy || order.createdBy,
          completedAt: inProgressTest?.resultEnteredAt || order.updatedAt,
        };
      }
      case 'completed': {
        const completedTest = order.tests.find((t) => ['completed', 'validated', 'rejected'].includes(t.status));
        return {
          completedBy: completedTest?.validatedBy || order.createdBy,
          completedAt: completedTest?.resultValidatedAt || order.updatedAt,
        };
      }
      case 'delivered':
        return {
          completedBy: order.createdBy,
          completedAt: order.updatedAt,
        };
      default:
        return {};
    }
  };

  // Format timestamp for display
  const formatTimestamp = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
      }
      return `${Math.floor(diffInHours)}h ago`;
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine the current active step (first step that is started but not fully complete)
  const getActiveStepIndex = (): number => {
    for (let i = 0; i < STATUS_TIMELINE_STEPS.length; i++) {
      const progress = stepProgressMap[STATUS_TIMELINE_STEPS[i].status];
      if (progress.isStarted && !progress.isFullyComplete) {
        return i;
      }
    }
    // If all steps are complete, return -1
    const lastProgress = stepProgressMap[STATUS_TIMELINE_STEPS[STATUS_TIMELINE_STEPS.length - 1].status];
    return lastProgress.isFullyComplete ? -1 : STATUS_TIMELINE_STEPS.length - 1;
  };

  const activeStepIndex = getActiveStepIndex();

  return (
    <div className="p-4 space-y-0">
      {STATUS_TIMELINE_STEPS.map((step, index) => {
        const progress = stepProgressMap[step.status];
        const isLast = index === STATUS_TIMELINE_STEPS.length - 1;
        const nextProgress = !isLast ? stepProgressMap[STATUS_TIMELINE_STEPS[index + 1].status] : null;
        const isInProgress = index === activeStepIndex && progress.isStarted && !progress.isFullyComplete;
        const completionInfo = progress.isStarted ? getStepCompletionInfo(step.status) : {};

        // Determine connecting line color
        const getLineColor = () => {
          if (progress.isFullyComplete && nextProgress?.isStarted) {
            return 'bg-emerald-400';
          }
          if (progress.isFullyComplete) {
            return 'bg-gray-300';
          }
          return 'bg-gray-200';
        };

        // Show test dots for multi-test orders (except 'pending' step which is always 100%)
        const showTestDots = step.status !== 'pending' && order.tests.length > 1;

        return (
          <div key={step.status} className="flex items-start gap-3">
            {/* Timeline Indicator */}
            <div className="flex flex-col items-center">
              <StepIndicator progress={progress} isInProgress={isInProgress} />

              {/* Connecting Line */}
              {!isLast && (
                <div className="flex flex-col items-center py-1">
                  <div className={`w-0.5 h-6 rounded-full ${getLineColor()}`} />
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 flex items-start justify-between pt-0.5 pb-3">
              {/* Left: Label with dots, and Timestamp */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center">
                  <p className={`text-sm font-medium ${progress.isStarted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  {/* Test completion dots */}
                  {showTestDots && <TestDots progress={progress} />}
                </div>

                {/* Status text */}
                {isInProgress && (
                  <p className="text-xs text-sky-600 mt-1">
                    {progress.isPartial
                      ? `${progress.completed}/${progress.total} tests complete`
                      : 'In progress...'}
                  </p>
                )}
                {progress.isFullyComplete && completionInfo.completedAt && (
                  <p className="text-xs text-gray-400 mt-1">{formatTimestamp(completionInfo.completedAt)}</p>
                )}
              </div>

              {/* Right: Avatar of operator */}
              {progress.isFullyComplete && completionInfo.completedBy && (
                <Avatar name={completionInfo.completedBy} size="xs" className="ring-2 ring-white shadow-sm ml-2" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
