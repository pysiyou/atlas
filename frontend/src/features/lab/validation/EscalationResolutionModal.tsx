/**
 * EscalationResolutionModal - Resolve escalated tests (admin/labtech_plus only)
 *
 * Three paths: Force Validate, Authorize Re-test, Final Reject / New Sample.
 */

import React, { useState, useCallback } from 'react';
import { Button, Popover, SectionContainer } from '@/shared/ui';
import { cn, displayId } from '@/utils';
import { inputBase } from '@/shared/ui/inputStyles';
import { ValidationForm } from './ValidationForm';
import {
  LabDetailModal,
  DetailGrid,
  ModalFooter,
  StatusBadgeRow,
} from '../components/LabDetailModal';
import { PopoverForm } from '../components/PopoverForm';
import { EntryRejectionSection } from '../entry/EntryRejectionSection';
import { EntryInfoLine } from '../components/StatusBadges';
import { useResolveEscalation } from '@/hooks/queries/useResultMutations';
import { useAuthStore } from '@/shared/stores/auth.store';
import { toast } from '@/shared/components/feedback';
import type { TestWithContext } from '@/types';
import type { EscalationResolutionAction } from '@/types/lab-operations';

interface EscalationResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: TestWithContext;
  onResolved: () => void | Promise<void>;
}

export const EscalationResolutionModal: React.FC<EscalationResolutionModalProps> = ({
  isOpen,
  onClose,
  test,
  onResolved,
}) => {
  const [validationNotesForceValidate, setValidationNotesForceValidate] = useState('');
  const [reasonAuthorizeRetest, setReasonAuthorizeRetest] = useState('');
  const [reasonFinalReject, setReasonFinalReject] = useState('');

  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const resolveEscalation = useResolveEscalation();
  const resolving = resolveEscalation.isPending;

  const resolve = useCallback(
    async (action: EscalationResolutionAction, rejectionReasonOrNotes?: string) => {
      if (!canResolveEscalation || resolving) return;

      const messages: Record<EscalationResolutionAction, string> = {
        force_validate: 'Results force-validated.',
        authorize_retest: 'Authorized re-test created.',
        final_reject: 'Sample rejected; new sample requested.',
      };

      resolveEscalation.mutate(
        {
          orderId: test.orderId,
          testCode: test.testCode,
          action,
          validationNotes: action === 'force_validate' ? rejectionReasonOrNotes?.trim() : undefined,
          rejectionReason:
            action === 'authorize_retest'
              ? rejectionReasonOrNotes?.trim() || 'Authorized re-test (escalation resolution)'
              : action === 'final_reject'
                ? (rejectionReasonOrNotes ?? '').trim()
                : undefined,
        },
        {
          onSuccess: async () => {
            await onResolved();
            onClose();
            toast.success({
              title: messages[action] ?? 'Operation completed.',
              subtitle: 'The escalation has been resolved and the test status updated.',
            });
            setValidationNotesForceValidate('');
            setReasonAuthorizeRetest('');
            setReasonFinalReject('');
          },
          onError: (err) => {
            const apiError = err as { message?: string };
            const msg =
              apiError && typeof apiError === 'object' && typeof apiError.message === 'string'
                ? apiError.message
                : 'Failed to resolve escalation.';
            toast.error({
              title: msg,
              subtitle: 'The escalation could not be resolved. Check the details and try again.',
            });
          },
        }
      );
    },
    [test.orderId, test.testCode, onResolved, onClose, resolving, resolveEscalation, canResolveEscalation]
  );

  const handleForceValidate = useCallback(
    () => resolve('force_validate', validationNotesForceValidate),
    [resolve, validationNotesForceValidate]
  );

  const rejectionHistory = test.resultRejectionHistory || [];
  const hasRejectionHistory = rejectionHistory.length > 0;

  if (!test.results) return null;

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={test.testName}
      subtitle={`${test.testCode} - ${test.patientName} (Escalated)`}
      headerBadges={
        <StatusBadgeRow
          sampleType={test.sampleType}
          priority={test.priority}
          status="escalated"
        />
      }
      contextInfo={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
        referringPhysician: test.referringPhysician,
      }}
      sampleInfo={
        test.sampleId && test.collectedAt
          ? {
              sampleId: test.sampleId,
              collectedAt: test.collectedAt,
              collectedBy: test.collectedBy,
            }
          : undefined
      }
      additionalContextInfo={
        <EntryInfoLine enteredAt={test.resultEnteredAt} enteredBy={test.enteredBy} />
      }
      footer={
        <ModalFooter statusMessage="" statusClassName="text-text-tertiary">
          {!canResolveEscalation ? (
            <p className="text-sm text-text-tertiary">You do not have permission to resolve escalations.</p>
          ) : (
            <>
          <Popover
            placement="top-end"
            offsetValue={8}
            trigger={
              <Button variant="approve" size="md" disabled={resolving}>
                Force Validate
              </Button>
            }
          >
            {({ close }) => (
              <div data-popover-content onClick={e => e.stopPropagation()}>
                <PopoverForm
                  title="Force Validate"
                  subtitle="Validation notes (optional)"
                  onCancel={close}
                  onConfirm={() => {
                    handleForceValidate();
                    close();
                  }}
                  confirmLabel="Confirm"
                  confirmVariant="success"
                  isSubmitting={resolving}
                >
                  <div>
                    <label className="sr-only" htmlFor="escalation-force-validate-notes">
                      Validation notes
                    </label>
                    <textarea
                      id="escalation-force-validate-notes"
                      className={cn(inputBase, 'min-h-[80px] resize-none')}
                      placeholder="e.g. Supervisor override after review"
                      value={validationNotesForceValidate}
                      onChange={e => setValidationNotesForceValidate(e.target.value)}
                      maxLength={1000}
                    />
                  </div>
                </PopoverForm>
              </div>
            )}
          </Popover>
          <Popover
            placement="top-end"
            offsetValue={8}
            trigger={
              <Button variant="secondary" size="md" disabled={resolving}>
                Authorize Re-test
              </Button>
            }
          >
            {({ close }) => (
              <div data-popover-content onClick={e => e.stopPropagation()}>
                <PopoverForm
                  title="Authorize Re-test"
                  subtitle="Reason (recommended)"
                  onCancel={close}
                  onConfirm={() => {
                    resolve(
                      'authorize_retest',
                      reasonAuthorizeRetest || 'Authorized re-test (escalation resolution)'
                    );
                    close();
                  }}
                  confirmLabel="Confirm"
                  confirmVariant="success"
                  isSubmitting={resolving}
                >
                  <div>
                    <label className="sr-only" htmlFor="escalation-authorize-retest-reason">
                      Reason
                    </label>
                    <textarea
                      id="escalation-authorize-retest-reason"
                      className={cn(inputBase, 'min-h-[80px] resize-none')}
                      placeholder="e.g. One more run with senior tech"
                      value={reasonAuthorizeRetest}
                      onChange={e => setReasonAuthorizeRetest(e.target.value)}
                      maxLength={1000}
                    />
                  </div>
                </PopoverForm>
              </div>
            )}
          </Popover>
          <Popover
            placement="top-end"
            offsetValue={8}
            trigger={
              <Button variant="reject" size="md" disabled={resolving}>
                Final Reject / New Sample
              </Button>
            }
          >
            {({ close }) => (
              <div data-popover-content onClick={e => e.stopPropagation()}>
                <PopoverForm
                  title="Final Reject / New Sample"
                  subtitle="Reason (required)"
                  onCancel={close}
                  onConfirm={() => {
                    if (!reasonFinalReject.trim()) {
                      toast.error({
                        title: 'Please provide a reason for final reject.',
                        subtitle: 'A reason is required when final rejecting. This will request a new sample from the patient.',
                      });
                      return;
                    }
                    resolve('final_reject', reasonFinalReject.trim());
                    close();
                  }}
                  confirmLabel="Confirm"
                  confirmVariant="danger"
                  isSubmitting={resolving}
                  disabled={!reasonFinalReject.trim()}
                >
                  <div>
                    <label className="sr-only" htmlFor="escalation-final-reject-reason">
                      Reason
                    </label>
                    <textarea
                      id="escalation-final-reject-reason"
                      className={cn(inputBase, 'min-h-[80px] resize-none')}
                      placeholder="e.g. Sample compromised; request new collection"
                      value={reasonFinalReject}
                      onChange={e => setReasonFinalReject(e.target.value)}
                      maxLength={1000}
                    />
                  </div>
                </PopoverForm>
              </div>
            )}
          </Popover>
            </>
          )}
        </ModalFooter>
      }
    >
      <SectionContainer title="Result Validation">
        <ValidationForm
          results={test.results}
          flags={test.flags}
          technicianNotes={test.technicianNotes}
          comments=""
          onCommentsChange={() => {}}
          onApprove={handleForceValidate}
          onReject={() => {}}
          testName={test.testName}
          testCode={test.testCode}
          patientName={test.patientName}
        />
      </SectionContainer>

      {hasRejectionHistory && (
        <EntryRejectionSection
          title="Escalation history"
          rejectionHistory={rejectionHistory}
          showOnlyLatest={false}
        />
      )}

      <DetailGrid
        sections={[
          {
            title: 'Collection Information',
            fields: [
              {
                label: 'Sample ID',
                value: test.sampleId ? (
                  <span className="text-brand font-mono">{displayId.sample(test.sampleId)}</span>
                ) : undefined,
              },
              { label: 'Collected', timestamp: test.collectedAt, user: test.collectedBy },
              {
                label: 'Sample Type',
                badge: test.sampleType
                  ? { value: test.sampleType, variant: test.sampleType }
                  : undefined,
              },
            ],
          },
          {
            title: 'Result Entry Information',
            fields: [
              { label: 'Entered', timestamp: test.resultEnteredAt, user: test.enteredBy },
              {
                label: 'Test Code',
                value: test.testCode ? (
                  <span className="text-brand font-mono">{test.testCode}</span>
                ) : undefined,
              },
              {
                label: 'Order ID',
                value: test.orderId ? (
                  <span className="text-brand font-mono">{displayId.order(test.orderId)}</span>
                ) : undefined,
              },
            ],
          },
        ]}
      />
    </LabDetailModal>
  );
};
