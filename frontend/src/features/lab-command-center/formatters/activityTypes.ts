/**
 * Shared types and utilities for lab audit log activity formatters.
 */
import type { LabOperationType } from '@/types/lab-operations';

export interface ActivitySegment {
  type: 'text' | 'badge' | 'name';
  value: string;
  variant?: string;
  isId?: boolean;
  link?: string;
}

export type ActivityLines = ActivitySegment[][];

export type ActivityFormatter = (
  log: import('@/types/lab-operations').LabOperationRecord,
  performer: string
) => ActivityLines;

export function formatPerformerName(name: string): string {
  if (!name) return 'System';
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function formatOperationType(type: LabOperationType): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
