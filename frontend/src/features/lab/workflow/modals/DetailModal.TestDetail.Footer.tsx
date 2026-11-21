/**
 * Approve/reject and print/open-in-lab footers for the test-detail modal.
 */
import { useNavigate } from 'react-router-dom';
import { actionButtonPreset, Button } from '@/components/primitives';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { useAuthStore } from '@/app/authStore';
import { canReleaseResults } from '../../pages/laboratoryPageAccess';
import { usePanelCopy } from '@/strings';
import type { OrderTest, UserRole } from '@/types';
import type { QualityIssueResult } from '@/types';
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import { QualityIssuePopover } from '../../components/QualityIssuePopover';
import { CriticalSeenConfirm } from '../../validation/CriticalSeenConfirm';
import { ModalFooter } from '../shared/DetailModalLayout';
import { isLabActionAllowed, isTerminalTestStatus, labModalFooterDenyMessage } from '../../utils/queueDisplay';

export type TestDetailModalFooterProps = {
  isValidate: boolean;
  orderTestId: number;
  displayWorkItem: LabModalWorkItem | undefined;
  orderTest: OrderTest | undefined;
  testDisplayName: string;
  patientName: string;
  hasResults: boolean;
  isApproving: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void | Promise<void>;
  labUrl: string | undefined;
  hasCriticalValues?: boolean;
  criticalSeen?: boolean;
  onCriticalSeenChange?: (checked: boolean) => void;
};

function validationFooterActions(
  hasRole: (roles: UserRole | UserRole[]) => boolean,
  orderTest: OrderTest | undefined,
  displayWorkItem: LabModalWorkItem | undefined,
  orderTestId: number,
) {
  const allowedActions = orderTest?.lab?.allowedActions ?? displayWorkItem?.allowedActions;
  const isTerminal = isTerminalTestStatus(orderTest?.status ?? displayWorkItem?.status);
  return {
    canValidate:
      canReleaseResults(hasRole) && isLabActionAllowed(allowedActions, 'validate') && !isTerminal,
    canReject: isLabActionAllowed(allowedActions, 'reject') && !isTerminal,
    liveOrderTestId: orderTest?.retestOrderTestId ?? orderTestId,
  };
}

function TestDetailValidateFooter({
  orderTestId,
  displayWorkItem,
  orderTest,
  testDisplayName,
  patientName,
  hasResults,
  isApproving,
  onApprove,
  onReject,
  hasCriticalValues,
  criticalSeen,
  onCriticalSeenChange,
}: Omit<TestDetailModalFooterProps, 'isValidate' | 'onClose' | 'labUrl'>) {
  const { hasRole } = useAuthStore();
  const { canValidate, canReject, liveOrderTestId } = validationFooterActions(
    hasRole,
    orderTest,
    displayWorkItem,
    orderTestId,
  );
  const approveDisabled = !canValidate || !hasResults || (hasCriticalValues && !criticalSeen);

  return (
    <ModalFooter>
      {hasCriticalValues && onCriticalSeenChange ? (
        <CriticalSeenConfirm
          id={`critical-seen-modal-${orderTestId}`}
          checked={Boolean(criticalSeen)}
          onChange={onCriticalSeenChange}
          disabled={isApproving || !canValidate}
        />
      ) : null}
      <QualityIssuePopover
        orderTestId={liveOrderTestId}
        testCode={displayWorkItem?.testCode ?? orderTest?.testCode ?? ''}
        testName={displayWorkItem?.testName ?? orderTest?.testName ?? testDisplayName}
        patientName={patientName}
        disabled={!canReject}
        trigger={
          <Button {...actionButtonPreset('reject')} size="sm" layout="icon-text" disabled={!canReject}>
            Reject
          </Button>
        }
        onReject={result => {
          void onReject(result);
        }}
      />
      <Button
        onClick={onApprove}
        {...actionButtonPreset('approve')}
        size="sm"
        layout="icon-text"
        isLoading={isApproving}
        disabled={approveDisabled}
      >
        Approve
      </Button>
    </ModalFooter>
  );
}

function TestDetailViewFooter({
  displayWorkItem,
  orderTest,
  onClose,
  labUrl,
}: Pick<TestDetailModalFooterProps, 'displayWorkItem' | 'orderTest' | 'onClose' | 'labUrl'>) {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const panels = usePanelCopy();
  const orderId = displayWorkItem?.orderId;
  const status = orderTest?.status ?? displayWorkItem?.status;
  const canPrintReleased = Boolean(orderId) && status === 'validated';
  const footerStatus = labModalFooterDenyMessage(orderTest?.lab, displayWorkItem);

  if (!labUrl && !canPrintReleased) {
    return <ModalFooter statusMessage={footerStatus} />;
  }

  return (
    <ModalFooter statusMessage={footerStatus}>
      {canPrintReleased && orderId ? (
        <Button
          variant="secondary"
          size="sm"
          layout="icon-text"
          onClick={() => openModal({ type: ModalType.REPORT_PREVIEW, orderId })}
        >
          {panels.actions.print}
        </Button>
      ) : null}
      {labUrl ? (
        <Button
          variant="primary"
          size="sm"
          layout="icon-text"
          onClick={() => {
            onClose();
            navigate(labUrl);
          }}
        >
          Open in lab
        </Button>
      ) : null}
    </ModalFooter>
  );
}

/** Approve/reject or print / open-in-lab footer for the test-detail modal. */
export function TestDetailModalFooter(props: TestDetailModalFooterProps) {
  if (props.isValidate) {
    return <TestDetailValidateFooter {...props} />;
  }
  return <TestDetailViewFooter {...props} />;
}
