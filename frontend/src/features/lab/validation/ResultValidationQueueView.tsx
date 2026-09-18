import { ResultValidationCard } from './ResultValidationCard';
import { EscalationCard } from './EscalationCard';
import { LabValidationQueueSection } from '../components/LabValidationQueueSection';
import { EmptyState } from '@/components';
import type { TestWithContext } from '@/types';
import type { RecollectionRequestSummary, QualityIssueResult } from '@/types/lab-operations';
import { SampleRecollectionRequestCard } from './SampleRecollectionRequestCard';

interface ResultValidationQueueViewProps {
  isEmpty: boolean;
  hasRecollection: boolean;
  hasEscalated: boolean;
  hasValidation: boolean;
  canResolveEscalation: boolean;
  isMobile: boolean;
  recollectionRequests: RecollectionRequestSummary[];
  escalatedTests: TestWithContext[];
  validationTests: Array<TestWithContext & { hasCriticalValues?: boolean }>;
  comments: Record<string, string>;
  pendingValidateKey: string | null;
  isApprovingRecollection: boolean;
  isDenyingRecollection: boolean;
  isValidatePending: boolean;
  getCommentKey: (test: TestWithContext) => string;
  onApproveRecollection: (requestId: number, reviewNotes?: string) => Promise<void>;
  onDenyRecollection: (requestId: number, reviewNotes?: string) => Promise<void>;
  onOpenEscalation: (test: TestWithContext) => void;
  onCommentsChange: (key: string, value: string) => void;
  onApprove: (testId: number, orderId: number) => void;
  onReject: (test: TestWithContext, result: QualityIssueResult) => void;
  onOpenValidation: (test: TestWithContext) => void;
}

export function ResultValidationQueueView({
  isEmpty,
  hasRecollection,
  hasEscalated,
  hasValidation,
  canResolveEscalation,
  isMobile,
  recollectionRequests,
  escalatedTests,
  validationTests,
  comments,
  pendingValidateKey,
  isApprovingRecollection,
  isDenyingRecollection,
  isValidatePending,
  getCommentKey,
  onApproveRecollection,
  onDenyRecollection,
  onOpenEscalation,
  onCommentsChange,
  onApprove,
  onReject,
  onOpenValidation,
}: ResultValidationQueueViewProps) {
  if (isEmpty) {
    return (
      <EmptyState
        icon="shield-check"
        title="No Pending Validation"
        description="There are no results waiting for validation or supervisor review."
      />
    );
  }

  return (
    <div className="space-y-space-8">
      {hasRecollection && (
        <LabValidationQueueSection title="Recollection requests" count={recollectionRequests.length}>
          {recollectionRequests.map(request => (
            <SampleRecollectionRequestCard
              key={`recollection-${request.id}`}
              request={request}
              onApprove={onApproveRecollection}
              onDeny={onDenyRecollection}
              isApproving={isApprovingRecollection}
              isDenying={isDenyingRecollection}
              isMobile={isMobile}
            />
          ))}
        </LabValidationQueueSection>
      )}

      {hasEscalated && (
        <LabValidationQueueSection
          title={
            canResolveEscalation ? 'Supervisor exceptions' : 'Awaiting supervisor approval'
          }
          count={escalatedTests.length}
        >
          {escalatedTests.map((test, idx) => (
            <EscalationCard
              key={`escalated-${test.id}-${idx}`}
              test={test}
              onClick={() => onOpenEscalation(test)}
              isMobile={isMobile}
            />
          ))}
        </LabValidationQueueSection>
      )}

      {hasValidation && (
        <LabValidationQueueSection title="Pending validation" count={validationTests.length}>
          {validationTests.map((test, idx) => {
            if (test.id == null) return null;
            const commentKey = getCommentKey(test);
            return (
              <ResultValidationCard
                key={`validation-${test.id}-${idx}`}
                test={test}
                commentKey={commentKey}
                comments={comments[commentKey] || ''}
                onCommentsChange={onCommentsChange}
                onApprove={() => onApprove(test.id!, test.orderId)}
                onReject={result => onReject(test, result)}
                onClick={() => onOpenValidation(test)}
                isApproving={isValidatePending && pendingValidateKey === commentKey}
                isMobile={isMobile}
              />
            );
          })}
        </LabValidationQueueSection>
      )}
    </div>
  );
}
