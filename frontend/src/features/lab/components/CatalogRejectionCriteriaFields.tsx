/**
 * Shared catalog-driven rejection reason dropdown and optional notes field.
 */

import { Alert } from '@/components/display';
import { FormNotesField } from '@/components/primitives';

import { cn } from '@/utils';
import { text, inputBase, FORM_FIELD_LABEL } from '@/theme/recipes';
import { TONE } from '@/theme/recipes';


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

export function CatalogRejectionCriteriaFields({
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
}: CatalogRejectionFieldsProps) {
  if (showReason && criteriaLoading) {
    return <p className={text({ role: 'body', intent: 'muted' })}>Loading rejection criteria...</p>;
  }

  if (showReason && criteria.length === 0) {
    return (
      <Alert variant="danger" className="py-space-2">
        <p className={text({ role: 'body' })}>No rejection criteria are defined for this test in the catalog.</p>
      </Alert>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-space-3">
      {showReason && (
        <div className="w-full min-w-0">
          <label className={`${FORM_FIELD_LABEL} mb-space-1 block`}>
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
        <FormNotesField
          label={notesLabel}
          rows={notesRows}
          value={rejectionNotes}
          onChange={onNotesChange}
        />
      )}
    </div>
  );
}
