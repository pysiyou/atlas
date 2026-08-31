import React from 'react';
import type { StepProgress } from '../utils/order-timeline-utils';

interface StepIndicatorProps {
  progress: StepProgress;
  isBlocked: boolean;
}

/**
 * StepIndicator - Visual indicator for each step in the timeline.
 */
export const StepIndicator: React.FC<StepIndicatorProps> = ({ progress, isBlocked }) => {
  const { isFullyComplete, isStarted } = progress;
  const showPulsingDot = isStarted && !isFullyComplete;

  if (isFullyComplete) {
    return (
      <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
        <svg
          className="w-3 h-3 text-on-success"
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

  if (showPulsingDot) {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-brand bg-brand-muted flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-brand" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="w-5 h-5 rounded-full border-2 border-warning-stroke bg-warning-bg flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-warning-fg" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  }

  return <div className="w-5 h-5 rounded-full border-2 border-border-default bg-surface" />;
};

interface TestDotsProps {
  progress: StepProgress;
}

/** TestDots - Visual indicator showing progress for test-based steps. */
export const TestDots: React.FC<TestDotsProps> = ({ progress }) => {
  const { completed, total } = progress;

  if (total < 1) return null;

  const maxDots = 6;
  if (total > maxDots) {
    return (
      <span className="ml-2 text-xs text-text-tertiary font-normal">
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
            className={`w-2 h-2 rounded-full ${
              isCompleted
                ? 'bg-brand ring-2 ring-brand ring-opacity-30'
                : 'bg-transparent ring-1 ring-brand'
            }`}
          />
        );
      })}
    </div>
  );
};
