/**
 * Shared catalog-driven rejection reason dropdown and optional notes field.
 */

import React from 'react';
import { Alert } from '@/components';
import { cn } from '@/utils';
import { inputBase, FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import { TONE, TYPE } from '@/components/theme/recipes';


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
  showReason?: boolean;
  showNotes?: boolean;
}

export const CatalogRejectionCriteriaFields: React.FC<CatalogRejectionFieldsProps> = ({
  criteria,
  criteriaLoading = false,
  rejectionReason,
  rejectionNotes,
  onReasonChange,
  onNotesChange,
  reasonLabel = 'Rejection Reason',
  notesLabel = 'Additional Context / Notes',
  notesRows = 2,
  showReason = true,
  showNotes = true,
}) => {
  if (showReason && criteriaLoading) {
    return <p className={TYPE.meta}>Loading rejection criteria...</p>;
  }

  if (showReason && criteria.length === 0) {
    return (
      <Alert variant="danger" className="py-space-2">
        <p className="text-xs">No rejection criteria are defined for this test in the catalog.</p>
      </Alert>
    );
  }

  return (
    <>
      {showReason && (
        <div>
          <label className={`${FORM_FIELD_LABEL} mb-space-1`}>
            {reasonLabel} <span className={TONE.danger.fg}>*</span>
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
      )}

      {showNotes && (
        <div>
          <label className={`${FORM_FIELD_LABEL} mb-space-1`}>{notesLabel}</label>
          <textarea
            rows={notesRows}
            placeholder="Optional additional details..."
            value={rejectionNotes}
            onChange={e => onNotesChange(e.target.value)}
            className={cn(inputBase, 'resize-none')}
          />
        </div>
      )}
    </>
  );
};
