/**
 * Sub-components for CollectionRejectionPopover.
 */

import { Alert, Badge } from '@/components';
import { AttemptProgressBar } from '../components/AttemptProgressBar';
import { CheckboxCard } from '../components/PopoverForm';
import { CatalogRejectionFields } from '../components/CatalogRejectionFields';

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
  suspendedTestsCount?: number;
  completedTestsCount?: number;
}

export function RejectionWarningAlert({
  escalationRequired,
  rejectionHistoryUsed,
  patientName,
  suspendedTestsCount = 0,
  completedTestsCount = 0,
}: RejectionWarningAlertProps) {
  if (escalationRequired) {
    return (
      <Alert variant="danger" className="py-2">
        <div className="space-y-0.5">
          <p className="font-normal text-xs">Recollection Limit Reached</p>
          <p className="text-xxs opacity-90 leading-tight">
            Maximum recollection attempts reached. You can still reject this sample, but no new
            collection will be created. Escalate suspended tests to a supervisor.
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

  if (completedTestsCount > 0) {
    return (
      <Alert variant="warning" className="py-2">
        <div className="space-y-0.5">
          <p className="font-normal text-xs">Completed Results on This Sample</p>
          <p className="text-xxs opacity-90 leading-tight">
            {completedTestsCount} test{completedTestsCount > 1 ? 's' : ''} with entered or
            validated results will be escalated to a supervisor for review.
            {suspendedTestsCount > 0
              ? ` ${suspendedTestsCount} other test${suspendedTestsCount > 1 ? 's' : ''} will be suspended pending recollection.`
              : ''}
          </p>
        </div>
      </Alert>
    );
  }

  if (suspendedTestsCount > 0) {
    return (
      <Alert variant="warning" className="py-2">
        <div className="space-y-0.5">
          <p className="font-normal text-xs">Tests Will Be Suspended</p>
          <p className="text-xxs opacity-90 leading-tight">
            {suspendedTestsCount} test{suspendedTestsCount > 1 ? 's' : ''} will be suspended and
            require recollection on a new sample.
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

interface CatalogRejectionReasonSectionProps {
  criteria: string[];
  criteriaLoading: boolean;
  rejectionReason: string;
  rejectionNotes: string;
  onReasonChange: (value: string) => void;
  onNotesChange: (value: string) => void;
}

export function CatalogRejectionReasonSection({
  criteria,
  criteriaLoading,
  rejectionReason,
  rejectionNotes,
  onReasonChange,
  onNotesChange,
}: CatalogRejectionReasonSectionProps) {
  return (
    <CatalogRejectionFields
      criteria={criteria}
      criteriaLoading={criteriaLoading}
      rejectionReason={rejectionReason}
      rejectionNotes={rejectionNotes}
      onReasonChange={onReasonChange}
      onNotesChange={onNotesChange}
    />
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

