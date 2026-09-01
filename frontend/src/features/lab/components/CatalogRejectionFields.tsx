/**
 * Shared catalog-driven rejection reason dropdown and optional notes field.
 */

import React from 'react';
import { Alert } from '@/components';
import { cn } from '@/utils';
import { inputBase } from '@/components/inputs/inputStyles';

export interface CatalogRejectionFieldsProps {
  criteria: string[];
  criteriaLoading?: boolean;
  rejectionReason: string;
  rejectionNotes: string;
  onReasonChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  reasonLabel?: string;
  notesLabel?: string;
  notesRows?: number;
}

export const CatalogRejectionFields: React.FC<CatalogRejectionFieldsProps> = ({
  criteria,
  criteriaLoading = false,
  rejectionReason,
  rejectionNotes,
  onReasonChange,
  onNotesChange,
  reasonLabel = 'Rejection Reason',
  notesLabel = 'Additional Context / Notes',
  notesRows = 2,
}) => {
  if (criteriaLoading) {
    return <p className="text-xs text-text-tertiary">Loading rejection criteria...</p>;
  }

  if (criteria.length === 0) {
    return (
      <Alert variant="danger" className="py-2">
        <p className="text-xs">No rejection criteria are defined for this test in the catalog.</p>
      </Alert>
    );
  }

  return (
    <>
      <div>
        <label className="block text-xs font-normal text-text-tertiary mb-1">
          {reasonLabel} <span className="text-danger-fg">*</span>
        </label>
        <select
          value={rejectionReason}
          onChange={e => onReasonChange(e.target.value)}
          className={cn(inputBase, 'w-full')}
        >
          <option value="">Select a reason...</option>
          {criteria.map(criterion => (
            <option key={criterion} value={criterion}>
              {criterion}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-normal text-text-tertiary mb-1">{notesLabel}</label>
        <textarea
          rows={notesRows}
          placeholder="Optional additional details..."
          value={rejectionNotes}
          onChange={e => onNotesChange(e.target.value)}
          className={cn(inputBase, 'resize-none')}
        />
      </div>
    </>
  );
};
