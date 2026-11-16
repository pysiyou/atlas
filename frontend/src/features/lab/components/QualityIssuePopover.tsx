/**
 * QualityIssuePopover — reject a resulted test and pick retest, recollect, or cancel.
 */

import React, { useState } from 'react';
import { text } from '@/theme/recipes';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Popover } from '@/components/overlays';
import { Alert } from '@/components/display';

import { LabFormPopoverChrome } from './LabActionPopover';
import { useQualityIssuePopover } from '../hooks/useQualityIssuePopover';
import type { QualityIssueResult } from '@/types';
import {
  QUALITY_ISSUE_POPOVER_LAYOUT,
  QUALITY_ISSUE_POPOVER_COPY,
  type ValidationFormCopy } from '../constants/qualityIssuePopoverCopy';
import { CatalogRejectionCriteriaFields } from './CatalogRejectionCriteriaFields';
import { QualityIssuePopoverLoadingView, QualityIssuePopoverErrorView } from './QualityIssuePopoverStates';
import { QualityIssueInlineWarning } from './QualityIssueInlineWarning';
import { QualityIssueRemedyPicker } from './QualityIssueRemedyPicker';
import type { RemedyOption } from '../constants/qualityIssuePopoverCopy';
import type { RemedyType } from '@/types';

/** Re-export views for consumers that render them directly */
export { QualityIssuePopoverLoadingView, QualityIssuePopoverErrorView } from './QualityIssuePopoverStates';

/** Grouped state for form body (readability and future prop additions). */
export interface QualityIssuePopoverState {
  error: string | null;
  escalationRequired: boolean;
  formCopy: ValidationFormCopy | null;
  rejectionReason: string;
  rejectionNotes: string;
  allowedCriteria: string[];
  criteriaLoading: boolean;
  remedyOptions: RemedyOption[];
  preferredRemedy: RemedyType | '';
}

/** Grouped actions for form body. */
export interface QualityIssueFormActions {
  onReasonChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onPreferredRemedyChange: (value: RemedyType) => void;
}

interface QualityIssuePopoverFormBodyProps {
  state: QualityIssuePopoverState;
  actions: QualityIssueFormActions;
}

export function QualityIssuePopoverFormBody({
  state,
  actions,
}: QualityIssuePopoverFormBodyProps) {
  const {
    error,
    formCopy,
    rejectionReason,
    rejectionNotes,
    allowedCriteria,
    criteriaLoading,
    remedyOptions,
    preferredRemedy,
  } = state;
  const { onReasonChange, onNotesChange, onPreferredRemedyChange } = actions;
  const copy =
    formCopy ?? {
      alert: null,
      confirmLabel: QUALITY_ISSUE_POPOVER_COPY.reject.confirmLabel,
      reasonLabel: QUALITY_ISSUE_POPOVER_COPY.reject.reasonLabel,
      notesLabel: QUALITY_ISSUE_POPOVER_COPY.reject.notesLabel,
      escalationRequired: false,
    };

  return (
    <>
      {error && (
        <Alert variant="danger" className="py-space-2">
          <p className={text({ role: 'body' })}>{error}</p>
        </Alert>
      )}

      {copy.alert && <QualityIssueInlineWarning message={copy.alert.message} />}

      <CatalogRejectionCriteriaFields
        criteria={allowedCriteria}
        criteriaLoading={criteriaLoading}
        rejectionReason={rejectionReason}
        rejectionNotes={rejectionNotes}
        onReasonChange={onReasonChange}
        onNotesChange={onNotesChange}
        reasonLabel={copy.reasonLabel}
        showNotes={false}
      />

      <QualityIssueRemedyPicker
        options={remedyOptions}
        value={preferredRemedy}
        onChange={onPreferredRemedyChange}
      />

      <CatalogRejectionCriteriaFields
        criteria={allowedCriteria}
        rejectionReason={rejectionReason}
        rejectionNotes={rejectionNotes}
        onReasonChange={onReasonChange}
        onNotesChange={onNotesChange}
        notesLabel={copy.notesLabel}
        notesRows={QUALITY_ISSUE_POPOVER_LAYOUT.reasonTextareaRows}
        showReason={false}
      />
    </>
  );
}

interface QualityIssuePopoverContentProps {
  orderTestId: number;
  testName?: string;
  testCode?: string;
  patientName?: string;
  onConfirm: (result: QualityIssueResult) => void;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

function QualityIssuePopoverContent({
  orderTestId,
  testName,
  testCode,
  patientName,
  onConfirm,
  onCancel,
  onSubmittingChange,
}: QualityIssuePopoverContentProps) {
  const {
    rejectionReason,
    setRejectionReason,
    rejectionNotes,
    setRejectionNotes,
    preferredRemedy,
    setPreferredRemedy,
    remedyOptions,
    isConfirmDisabled,
    isLoading,
    isRejecting,
    error,
    optionsLoadFailed,
    options,
    formCopy,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  } = useQualityIssuePopover({
    orderTestId,
    testName,
    testCode,
    patientName,
    onConfirm,
    onCancel,
    onSubmittingChange,
  });

  if (isLoading) return <QualityIssuePopoverLoadingView />;
  if (optionsLoadFailed) {
    return <QualityIssuePopoverErrorView onRetry={handleRetry} onCancel={onCancel} />;
  }

  return (
    <LabFormPopoverChrome
      title={copy.title}
      subtitle={subtitle || undefined}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel={copy.confirmLabel}
      confirmVariant="danger"
      isSubmitting={isRejecting}
      disabled={isConfirmDisabled}
    >
      <QualityIssuePopoverFormBody
        state={{
          error,
          escalationRequired: formCopy?.escalationRequired ?? false,
          formCopy,
          rejectionReason,
          rejectionNotes,
          allowedCriteria: options?.allowedCriteria ?? [],
          criteriaLoading: isLoading,
          remedyOptions,
          preferredRemedy,
        }}
        actions={{
          onReasonChange: setRejectionReason,
          onNotesChange: setRejectionNotes,
          onPreferredRemedyChange: setPreferredRemedy,
        }}
      />
    </LabFormPopoverChrome>
  );
}

interface QualityIssuePopoverProps {
  orderTestId: number;
  testCode?: string;
  testName?: string;
  patientName?: string;
  onReject: (result: QualityIssueResult) => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export function QualityIssuePopover({
  orderTestId,
  testCode,
  testName,
  patientName,
  onReject,
  trigger,
  disabled = false,
}: QualityIssuePopoverProps) {
  const [effectiveSubmitting, setEffectiveSubmitting] = useState(false);

  return (
    <Popover
      placement="bottom-end"
      offsetValue={QUALITY_ISSUE_POPOVER_LAYOUT.popoverOffset}
      preventClose={effectiveSubmitting}
      trigger={
        trigger ?? (
          <Button
            {...actionButtonPreset('reject')}
            size="sm"
            title={QUALITY_ISSUE_POPOVER_COPY.triggerTitle}
            disabled={disabled}
          >
            {QUALITY_ISSUE_POPOVER_COPY.triggerTitle}
          </Button>
        )
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <QualityIssuePopoverContent
            orderTestId={orderTestId}
            testCode={testCode}
            testName={testName}
            patientName={patientName}
            onSubmittingChange={setEffectiveSubmitting}
            onConfirm={result => {
              onReject(result);
              close();
            }}
            onCancel={close}
          />
        </div>
      )}
    </Popover>
  );
}
