/**
 * FunnelSteps
 * Vertical list of lab funnel steps (Orders → Collected → Entered → Validated) with counts and %.
 */

import React from 'react';
import { cn } from '@/utils';
import type { FunnelMetrics } from '../types';

export interface FunnelStepChange {
  value: number;
  isPositive: boolean;
}

interface FunnelStepsProps {
  funnel: FunnelMetrics;
  /** Optional period-over-period change per step (e.g. validatedPercent change) */
  stepChanges?: Partial<Record<'orders' | 'collected' | 'entered' | 'validated', FunnelStepChange>>;
}

const STEPS: Array<{ key: keyof FunnelMetrics; label: string }> = [
  { key: 'orders', label: 'Orders' },
  { key: 'collected', label: 'Collected' },
  { key: 'entered', label: 'Entered' },
  { key: 'validated', label: 'Validated' },
];

function percentOf(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 100) / 100;
}

export const FunnelSteps: React.FC<FunnelStepsProps> = ({ funnel, stepChanges = {} }) => {
  const pctFromPrev = [
    percentOf(funnel.orders, funnel.orders),
    percentOf(funnel.collected, funnel.orders),
    percentOf(funnel.entered, funnel.collected || 1),
    percentOf(funnel.validated, funnel.entered || 1),
  ];
  const counts = [funnel.orders, funnel.collected, funnel.entered, funnel.validated];

  return (
    <ul className="space-y-2 text-sm">
      {STEPS.map((step, i) => {
        const change = stepChanges[step.key];
        return (
          <li key={step.key} className="flex items-center justify-between gap-2">
            <span className="text-fg font-normal">{step.label}</span>
            <span className="text-fg-muted">
              {counts[i].toLocaleString()} sessions
            </span>
            <span className="flex items-center gap-1">
              <span className="text-fg font-normal">{pctFromPrev[i]}%</span>
              {change !== undefined && (
                <span
                  className={cn(
                    'text-xs font-normal',
                    change.isPositive ? 'text-success-text' : 'text-danger-fg'
                  )}
                >
                  {change.isPositive ? '↑' : '↓'}
                  {Math.abs(change.value)}%
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
