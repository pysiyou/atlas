import React from 'react';
import { Avatar } from '@/shared/ui';
import { useUserLookup } from '@/hooks/queries';
import {
  STATUS_TIMELINE_STEPS,
  getOrderStepProgress,
  getStepCompletionInfo,
  isStepBlocked,
  type StepProgress,
} from '../../utils/orderTimelineUtils';
import type { Order } from '@/types';
import { semanticColors } from '@/shared/design-system/tokens/colors';

interface OrderTimelineProps {
  order: Order;
}

interface StepIndicatorProps {
  progress: StepProgress;
  isBlocked: boolean;
}

/**
 * StepIndicator - Visual indicator for each step in the timeline.
 * Shows different states: complete, in-progress (with pulsing sky dot), partial, blocked, or pending.
 *
 * Any step that is started but not fully complete will show the pulsing sky dot indicator.
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({ progress, isBlocked }) => {
  const { isFullyComplete, isStarted } = progress;

  // Determine if this step should show the pulsing sky dot (started but not complete)
  const showPulsingDot = isStarted && !isFullyComplete;

  // Fully complete - green checkmark (no animation)
  if (isFullyComplete) {
    return (
      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  // Started but not complete - show pulsing sky dot indicator
  // This applies to ALL incomplete steps that have started (payment, sample collection, etc.)
  if (showPulsingDot) {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-sky-500 bg-sky-50 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
      </div>
    );
  }

  // Blocked state (not started) - lock icon (payment required)
  if (isBlocked) {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-amber-300 bg-amber-50 flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
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

/**
 * TestDots - Visual indicator showing progress for test-based steps.
 * Displays a dot for each test, filled if that test has completed the step.
 * Shows even for single-test orders to maintain visual consistency.
 */
const TestDots: React.FC<TestDotsProps> = ({ progress }) => {
  const { completed, total } = progress;

  // Don't show if there are no tests
  if (total < 1) return null;

  // Limit to max 6 dots for visual clarity
  const maxDots = 6;
  const showDots = total <= maxDots;

  if (!showDots) {
    // For many tests, show count instead of dots
    return (
      <span className="ml-2 text-xs text-gray-500 font-medium">
        {completed}/{total}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 ml-3">
      {Array.from({ length: total }).map((_, index) => {
        const isCompleted = index < completed;
        return (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              isCompleted
                ? 'bg-sky-500 ring-2 ring-sky-500/30'
                : 'bg-transparent ring-1 ring-sky-300'
            }`}
          />
        );
      })}
    </div>
  );
};

/**
 * OrderTimeline - Displays the order progress through the lab workflow.
 *
 * Steps:
 * 1. Order Created - Order placed in system
 * 2. Payment Received - Payment completed (required before collection)
 * 3. Sample Collected - Physical sample obtained
 * 4. Results Entered - Lab technician enters results
 * 5. Results Validated - Pathologist validates results
 * 6. Delivered - Report sent to patient/physician
 */
export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const { getUserName } = useUserLookup();

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

  /**
   * Format timestamp for display.
   * Shows relative time for recent events, full date for older ones.
   */
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

  /**
   * Get the status message for a step that is in progress or blocked.
   */
  const getStatusMessage = (
    stepStatus: string,
    progress: StepProgress,
    blocked: boolean
  ): string | null => {
    // Payment step special handling
    if (stepStatus === 'paid') {
      if (!progress.isFullyComplete) {
        return 'Awaiting payment';
      }
      return null;
    }

    // Blocked steps show lock message
    if (blocked && !progress.isFullyComplete) {
      return 'Awaiting payment';
    }

    // In progress steps
    if (progress.isStarted && !progress.isFullyComplete) {
      if (progress.isPartial) {
        return `${progress.completed}/${progress.total} tests complete`;
      }
      return 'In progress...';
    }

    return null;
  };

  return (
    <div className="p-4 space-y-0">
      {STATUS_TIMELINE_STEPS.map((step, index) => {
        const progress = stepProgressMap[step.status];
        const isLast = index === STATUS_TIMELINE_STEPS.length - 1;
        const nextProgress = !isLast
          ? stepProgressMap[STATUS_TIMELINE_STEPS[index + 1].status]
          : null;
        const blocked = isStepBlocked(order, step.status);
        const completionInfo = progress.isFullyComplete
          ? getStepCompletionInfo(order, step.status)
          : {};
        const statusMessage = getStatusMessage(step.status, progress, blocked);

        // Determine connecting line color
        const getLineColor = () => {
          if (progress.isFullyComplete && nextProgress?.isStarted) {
            return 'bg-green-400'; // Using success color for completed (specific shade for timeline)
          }
          if (progress.isFullyComplete) {
            return 'bg-gray-300';
          }
          if (blocked) {
            return 'bg-yellow-200'; // Warning color for blocked
          }
          return 'bg-gray-200';
        };

        // Show test dots for test-based steps (not for order-level steps like created, paid, delivered)
        // Always show dots even for single-test orders to maintain visual consistency
        const testBasedSteps = ['sample-collected', 'results-entered', 'validated'];
        const showTestDots = testBasedSteps.includes(step.status) && order.tests.length >= 1;

        // Determine label color based on state
        const getLabelColor = () => {
          if (progress.isFullyComplete) return 'text-gray-900';
          if (blocked && step.status !== 'paid') return 'text-gray-400';
          if (progress.isStarted) return 'text-gray-900';
          return 'text-gray-400';
        };

        // Determine status message color
        const getStatusColor = () => {
          if (step.status === 'paid' && !progress.isFullyComplete) return semanticColors.warning.valueHigh;
          if (blocked) return semanticColors.warning.valueHigh;
          return semanticColors.info.icon; // text-sky-600
        };

        return (
          <div key={step.status} className="flex items-start gap-3">
            {/* Timeline Indicator */}
            <div className="flex flex-col items-center">
              <StepIndicator progress={progress} isBlocked={blocked} />

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
                  <p className={`text-sm font-medium ${getLabelColor()}`}>{step.label}</p>
                  {/* Test completion dots */}
                  {showTestDots && <TestDots progress={progress} />}
                </div>

                {/* Status text */}
                {statusMessage && (
                  <p className={`text-xs mt-1 ${getStatusColor()}`}>{statusMessage}</p>
                )}
                {progress.isFullyComplete && completionInfo.completedAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatTimestamp(completionInfo.completedAt)}
                  </p>
                )}
              </div>

              {/* Right: Avatar of operator */}
              {progress.isFullyComplete && completionInfo.completedBy && (
                <Avatar
                  primaryText={getUserName(completionInfo.completedBy)}
                  size="xxs"
                  avatarOnly
                  className="ring-2 ring-white shadow-sm ml-2"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
