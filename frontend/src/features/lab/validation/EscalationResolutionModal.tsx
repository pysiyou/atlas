/**
 * EscalationResolutionModal - Resolve escalated tests (admin/labtech_plus only)
 *
 * Three paths: Force Validate, Authorize Re-test, Final Reject / New Sample.
 */

import React, { useState, useCallback } from 'react';
import { Button, Popover, SectionContainer } from '@/shared/ui';
import { displayId } from '@/utils';
import { ValidationForm } from './ValidationForm';
import {
  LabDetailModal,
  DetailGrid,
  ModalFooter,
  StatusBadgeRow,
} from '../components/LabDetailModal';
import { EntryRejectionSection } from '../entry/EntryRejectionSection';
import { EntryInfoLine } from '../components/StatusBadges';
import { resultAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import type { TestWithContext } from '@/types';
import type { EscalationResolutionAction, EscalationResolveRequest } from '@/types/lab-operations';

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
  const [resolving, setResolving] = useState(false);
  const [reasonAuthorizeRetest, setReasonAuthorizeRetest] = useState('');
  const [reasonFinalReject, setReasonFinalReject] = useState('');

  const resolve = useCallback(
    async (action: EscalationResolutionAction, rejectionReason?: string) => {
      if (resolving) return;
      setResolving(true);
      try {
        const payload: EscalationResolveRequest = {
          action,
          validationNotes: action === 'force_validate' ? undefined : undefined,
          ...(action === 'authorize_retest' && {
            rejectionReason: rejectionReason?.trim() || 'Authorized re-test (escalation resolution)',
          }),
          ...(action === 'final_reject' && {
            rejectionReason: (rejectionReason ?? '').trim(),
          }),
        };
        await resultAPI.resolveEscalation(test.orderId, test.testCode, payload);
        await onResolved();
        onClose();
        const messages: Record<EscalationResolutionAction, string> = {
          force_validate: 'Results force-validated.',
          authorize_retest: 'Authorized re-test created.',
          final_reject: 'Sample rejected; new sample requested.',
        };
        toast.success(messages[action]);
      } catch (err) {
        const apiError = err as { message?: string };
        logger.error('Escalation resolve failed', apiError?.message ?? err);
        const msg =
          apiError && typeof apiError === 'object' && typeof apiError.message === 'string'
            ? apiError.message
            : 'Failed to resolve escalation.';
        toast.error(msg);
      } finally {
        setResolving(false);
        setReasonAuthorizeRetest('');
        setReasonFinalReject('');
      }
    },
    [test.orderId, test.testCode, onResolved, onClose, resolving]
  );

  const handleForceValidate = useCallback(() => resolve('force_validate'), [resolve]);

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
          <Button
            variant="approve"
            size="md"
            onClick={handleForceValidate}
            disabled={resolving}
          >
            Force Validate
          </Button>
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
              <div data-popover-content className="p-3 w-80" onClick={e => e.stopPropagation()}>
                <p className="text-sm text-text-secondary mb-2">Reason (recommended):</p>
                <textarea
                  className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px] mb-3"
                  placeholder="e.g. One more run with senior tech"
                  value={reasonAuthorizeRetest}
                  onChange={e => setReasonAuthorizeRetest(e.target.value)}
                  maxLength={1000}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={close}>
                    Cancel
                  </Button>
                  <Button
                    variant="approve"
                    size="sm"
                    onClick={() => {
                      resolve(
                        'authorize_retest',
                        reasonAuthorizeRetest || 'Authorized re-test (escalation resolution)'
                      );
                      close();
                    }}
                    disabled={resolving}
                  >
                    Confirm
                  </Button>
                </div>
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
              <div data-popover-content className="p-3 w-80" onClick={e => e.stopPropagation()}>
                <p className="text-sm text-text-secondary mb-2">Reason (required):</p>
                <textarea
                  className="w-full border rounded px-2 py-1.5 text-sm min-h-[60px] mb-3"
                  placeholder="e.g. Sample compromised; request new collection"
                  value={reasonFinalReject}
                  onChange={e => setReasonFinalReject(e.target.value)}
                  maxLength={1000}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={close}>
                    Cancel
                  </Button>
                  <Button
                    variant="reject"
                    size="sm"
                    onClick={() => {
                      if (!reasonFinalReject.trim()) {
                        toast.error('Please provide a reason for final reject.');
                        return;
                      }
                      resolve('final_reject', reasonFinalReject.trim());
                      close();
                    }}
                    disabled={resolving || !reasonFinalReject.trim()}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </Popover>
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
