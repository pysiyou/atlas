/**
 * Sub-components for CollectionRejectionPopover.
 */

import { Alert, Badge } from '@/components';
import { AttemptProgressBar } from '../components/AttemptProgressBar';
import { CheckboxCard } from '../components/PopoverForm';
import { cn } from '@/utils';
import type { RejectionReason } from '@/types';
import { inputBase } from '@/components/inputs/inputStyles';
import { REJECTION_REASONS } from './collectionRejectionPopover.helpers';

interface RejectionHeaderBadgesProps {
  isRecollection: boolean;
  rejectionHistoryCount: number;
}

export function RejectionHeaderBadges({
  isRecollection,
  rejectionHistoryCount,
}: RejectionHeaderBadgesProps) {
  return (
    <>
      {isRecollection && (
        <Badge size="sm" variant="warning">
          Recollection
        </Badge>
      )}
      {rejectionHistoryCount > 0 && (
        <Badge size="sm" variant="error">
          {rejectionHistoryCount} Previous Rejection{rejectionHistoryCount > 1 ? 's' : ''}
        </Badge>
      )}
    </>
  );
}

interface RejectionWarningAlertProps {
  escalationRequired: boolean;
  rejectionHistoryUsed: number;
  patientName?: string;
}

export function RejectionWarningAlert({
  escalationRequired,
  rejectionHistoryUsed,
  patientName,
}: RejectionWarningAlertProps) {
  if (escalationRequired) {
    return (
      <Alert variant="danger" className="py-2">
        <div className="space-y-0.5">
          <p className="font-normal text-xs">Escalation Required</p>
          <p className="text-xxs opacity-90 leading-tight">
            Maximum recollection attempts reached. Escalate to supervisor before rejecting.
          </p>
        </div>
      </Alert>
    );
  }

  if (rejectionHistoryUsed > 1) {
    return (
      <Alert variant="danger" className="py-2">
        <div className="space-y-0.5">
          <p className="font-normal text-xs">Multiple Rejections Detected</p>
          <p className="text-xxs opacity-90 leading-tight">
            This sample has been rejected {rejectionHistoryUsed} times already. Consider escalating
            to supervisor.
          </p>
        </div>
      </Alert>
    );
  }

  return (
    <Alert variant="warning" className="py-2">
      <div className="space-y-0.5">
        <p className="font-normal text-xs">Action Required</p>
        <p className="text-xxs opacity-90 leading-tight">
          {patientName
            ? `Sample for ${patientName} will be marked as rejected.`
            : 'The sample will be marked as rejected.'}
        </p>
      </div>
    </Alert>
  );
}

interface RejectionHistorySectionProps {
  rejectionHistoryUsed: number;
  maxAttempts: number;
  optionsLoading: boolean;
}

export function RejectionHistorySection({
  rejectionHistoryUsed,
  maxAttempts,
  optionsLoading,
}: RejectionHistorySectionProps) {
  if (rejectionHistoryUsed <= 0) return null;

  return (
    <div className="space-y-1">
      <label className="block text-xs font-normal text-text-tertiary">Rejection History</label>
      <AttemptProgressBar
        used={rejectionHistoryUsed}
        total={maxAttempts}
        label="Rejection"
        variant="warning"
      />
      {optionsLoading && <p className="text-xxs text-text-tertiary">Loading attempt limits...</p>}
    </div>
  );
}

interface RejectionReasonsSectionProps {
  reasons: RejectionReason[];
  onToggleReason: (value: RejectionReason) => void;
}

export function RejectionReasonsSection({ reasons, onToggleReason }: RejectionReasonsSectionProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-normal text-text-tertiary">Rejection Reasons</label>
      <div className="border border-border-default rounded-md max-h-[200px] overflow-y-auto">
        {REJECTION_REASONS.map(r => (
          <label
            key={r.value}
            className={`flex items-start p-2 hover:bg-surface-page cursor-pointer border-b border-border-subtle last:border-0 transition-colors ${reasons.includes(r.value) ? 'bg-brand-muted' : ''}`}
          >
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={reasons.includes(r.value)}
                onChange={() => onToggleReason(r.value)}
                className="h-4 w-4 text-brand border-border-strong rounded focus:ring-brand"
              />
            </div>
            <div className="ml-2 text-xs">
              <div className="font-normal text-text-primary">{r.label}</div>
              <div className="text-text-tertiary">{r.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

interface RecollectionToggleSectionProps {
  requireRecollection: boolean;
  canRequireRecollection: boolean;
  disabledReason?: string;
  onToggle: () => void;
}

export function RecollectionToggleSection({
  requireRecollection,
  canRequireRecollection,
  disabledReason,
  onToggle,
}: RecollectionToggleSectionProps) {
  return (
    <div>
      <label className="block text-xs font-normal text-text-tertiary mb-1">Next Step</label>
      <CheckboxCard
        checked={requireRecollection}
        onChange={onToggle}
        label="Require Recollection"
        description="A new pending sample will be automatically created and linked to this rejection."
        disabled={!canRequireRecollection}
      />
      {!canRequireRecollection && disabledReason && (
        <p className="text-xs text-warning-fg mt-1">{disabledReason}</p>
      )}
    </div>
  );
}

interface RejectionNotesSectionProps {
  reasons: RejectionReason[];
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function RejectionNotesSection({
  reasons,
  notes,
  onNotesChange,
}: RejectionNotesSectionProps) {
  const otherSelected = reasons.includes('other');

  return (
    <div>
      <label className="block text-xs font-normal text-text-tertiary mb-1">
        Notes {otherSelected && <span className="text-danger-fg">*</span>}
      </label>
      <textarea
        rows={2}
        placeholder="Additional details..."
        value={notes}
        onChange={e => onNotesChange(e.target.value)}
        className={cn(inputBase, 'resize-none')}
      />
      {otherSelected && !notes.trim() && (
        <p className="text-xs text-danger-fg mt-1">Required when "Other" is selected</p>
      )}
    </div>
  );
}
