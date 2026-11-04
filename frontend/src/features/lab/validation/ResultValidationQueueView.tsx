import { EscalationCard, ResultValidationCard } from '../workflow';
import { LabValidationQueueSection } from '../components/LabValidationQueueSection';
import { EmptyState, EMPTY_COPY, PANEL_EMPTY_STATE } from '@/components/display';
import type { TestWithContext } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';

interface ResultValidationQueueViewProps {
  isEmpty: boolean;
  hasEscalated: boolean;
  hasValidation: boolean;
  canResolveEscalation: boolean;
  isMobile: boolean;
  escalatedTests: TestWithContext[];
  validationTests: Array<TestWithContext & { hasCriticalValues?: boolean }>;
  comments: Record<string, string>;
  pendingValidateKey: string | null;
  isValidatePending: boolean;
  getCommentKey: (test: TestWithContext) => string;
  onOpenEscalation: (test: TestWithContext) => void;
  onCommentsChange: (key: string, value: string) => void;
  onApprove: (testId: number, orderId: number) => void;
  onReject: (test: TestWithContext, result: QualityIssueResult) => void;
  onOpenValidation: (test: TestWithContext) => void;
}

export function ResultValidationQueueView({
  isEmpty,
  hasEscalated,
  hasValidation,
  canResolveEscalation,
  isMobile,
  escalatedTests,
  validationTests,
  comments,
  pendingValidateKey,
  isValidatePending,
  getCommentKey,
  onOpenEscalation,
  onCommentsChange,
  onApprove,
  onReject,
  onOpenValidation,
}: ResultValidationQueueViewProps) {
  if (isEmpty) {
    return (
      <EmptyState
        {...PANEL_EMPTY_STATE}
        title={EMPTY_COPY.pendingValidation.title}
        description={EMPTY_COPY.pendingValidation.description}
      />
    );
  }

  return (
    <div className="space-y-space-8">
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
