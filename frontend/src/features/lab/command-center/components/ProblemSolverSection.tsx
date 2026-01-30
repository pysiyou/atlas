/**
 * ProblemSolverSection - Escalation list + supervisor action feed (role-gated).
 */

import React from 'react';
import { useAuthStore } from '@/shared/stores/auth.store';
import { EscalatedCasesList } from './EscalatedCasesList';
import { SupervisorActionFeed } from './SupervisorActionFeed';
import type { PendingEscalationItem } from '@/types/lab-operations';

export interface ProblemSolverSectionProps {
  escalatedCases: PendingEscalationItem[];
  onEscalatedCaseClick?: (item: PendingEscalationItem) => void;
  onSupervisorResolve?: (item: PendingEscalationItem) => void;
}

export const ProblemSolverSection: React.FC<ProblemSolverSectionProps> = ({
  escalatedCases,
  onEscalatedCaseClick,
  onSupervisorResolve,
}) => {
  const { hasRole } = useAuthStore();
  const canAccessSupervisorActions = hasRole(['administrator', 'lab-technician-plus']);

  if (escalatedCases.length === 0 && !canAccessSupervisorActions) return null;

  return (
    <section className="rounded-lg border border-border-default bg-surface-default p-4 space-y-4">
      <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
        Problem Solver
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EscalatedCasesList
          items={escalatedCases}
          onItemClick={onEscalatedCaseClick}
        />
        {canAccessSupervisorActions && onSupervisorResolve && (
          <SupervisorActionFeed
            items={escalatedCases}
            onResolve={onSupervisorResolve}
          />
        )}
      </div>
    </section>
  );
}
