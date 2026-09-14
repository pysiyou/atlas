/**
 * QualityIssueDialog — layout constants and catalog-backed copy.
 * User-visible strings live in `@/config/feedbackCatalog`.
 */

import { LAB_CONFIG } from '@/features/lab/constants';
import { feedbackTitle } from '@/utils/feedback/copy';
import type { QualityIssueOptions } from '@/types/lab-operations';

export const QUALITY_ISSUE_DIALOG_LAYOUT = {
  /** Width class for loading/error/content containers */
  widthClass: 'w-90 md:w-96',
  /** Textarea rows for rejection/escalation reason */
  reasonTextareaRows: 3,
  /** Popover offset from trigger (px) */
  popoverOffset: LAB_CONFIG.POPOVER_OFFSET,
} as const;

export const QUALITY_ISSUE_DIALOG_COPY = {
  loading: {
    message: feedbackTitle('lab.qualityIssue.dialog.loading'),
  },
  error: {
    cancel: feedbackTitle('lab.qualityIssue.dialog.error.cancel'),
    retry: feedbackTitle('lab.qualityIssue.dialog.error.retry'),
  },
  escalation: {
    title: feedbackTitle('lab.qualityIssue.dialog.reject.title'),
    confirmLabel: feedbackTitle('lab.qualityIssue.dialog.reject.confirm'),
    warningTitle: feedbackTitle('lab.qualityIssue.dialog.escalation.warningTitle'),
    warningBody: feedbackTitle('lab.qualityIssue.dialog.escalation.warningBody'),
    reasonLabel: feedbackTitle('lab.qualityIssue.dialog.escalation.reasonLabel'),
    notesLabel: feedbackTitle('lab.qualityIssue.dialog.notesLabel'),
  },
  reject: {
    title: feedbackTitle('lab.qualityIssue.dialog.reject.title'),
    confirmLabel: feedbackTitle('lab.qualityIssue.dialog.reject.confirm'),
    warningTitle: feedbackTitle('lab.qualityIssue.dialog.reject.warningTitle'),
    warningBody: feedbackTitle('lab.qualityIssue.dialog.reject.warningBody'),
    reasonLabel: feedbackTitle('lab.qualityIssue.dialog.reject.reasonLabel'),
    notesLabel: feedbackTitle('lab.qualityIssue.dialog.notesLabel'),
  },
  actions: {
    followUpLabel: feedbackTitle('lab.qualityIssue.dialog.actions.followUp'),
    retestLabel: feedbackTitle('lab.qualityIssue.dialog.actions.retest'),
    retestDescription: feedbackTitle('lab.qualityIssue.dialog.actions.retestDescription'),
    newSampleLabel: feedbackTitle('lab.qualityIssue.dialog.actions.recollect'),
    newSampleDescription: feedbackTitle('lab.qualityIssue.dialog.actions.recollectDescription'),
    cancelLabel: feedbackTitle('lab.qualityIssue.dialog.actions.cancel'),
    cancelDescription: feedbackTitle('lab.qualityIssue.dialog.actions.cancelDescription'),
    retestLimitDescription: feedbackTitle('lab.qualityIssue.dialog.actions.retestLimit'),
    retestSupervisorHint: feedbackTitle('lab.qualityIssue.dialog.actions.retestHint'),
  },
  recollectBlocked: feedbackTitle('lab.qualityIssue.dialog.recollectBlocked'),
  triggerTitle: feedbackTitle('lab.qualityIssue.dialog.trigger'),
  collection: {
    recollect: {
      warningTitle: feedbackTitle('lab.qualityIssue.collection.recollect.warningTitle'),
      warningBody: feedbackTitle('lab.qualityIssue.collection.recollect.warningBody'),
      reasonLabel: feedbackTitle('lab.qualityIssue.collection.reasonLabel'),
      notesLabel: feedbackTitle('lab.qualityIssue.dialog.notesLabel'),
    },
    escalateResults: {
      warningTitle: feedbackTitle('lab.qualityIssue.collection.escalate.warningTitle'),
      warningBody: feedbackTitle('lab.qualityIssue.collection.escalate.warningBody'),
      reasonLabel: feedbackTitle('lab.qualityIssue.collection.reasonLabel'),
      notesLabel: feedbackTitle('lab.qualityIssue.dialog.notesLabel'),
    },
    actions: {
      followUpLabel: feedbackTitle('lab.qualityIssue.collection.actions.followUp'),
      recollectLabel: feedbackTitle('lab.qualityIssue.collection.actions.recollect'),
      recollectDescription: feedbackTitle('lab.qualityIssue.collection.actions.recollectDescription'),
      cancelUnfinishedLabel: feedbackTitle('lab.qualityIssue.collection.actions.cancelUnfinished'),
      cancelUnfinishedDescription: feedbackTitle(
        'lab.qualityIssue.collection.actions.cancelUnfinishedDescription'
      ),
    },
  },
};

export interface ValidationAlertCopy {
  variant: 'warning' | 'danger';
  warningTitle: string;
  warningBody: string;
  confirmLabel: string;
  reasonLabel: string;
  notesLabel: string;
}

/** Dialog copy for validation rejection — destination is always operator-chosen. */
export function getValidationAlertCopy(options: QualityIssueOptions): ValidationAlertCopy {
  if (options.willEscalate) {
    return {
      variant: 'danger',
      ...QUALITY_ISSUE_DIALOG_COPY.escalation,
    };
  }
  return {
    variant: 'warning',
    warningTitle: QUALITY_ISSUE_DIALOG_COPY.reject.warningTitle,
    warningBody: options.previewMessage || QUALITY_ISSUE_DIALOG_COPY.reject.warningBody,
    confirmLabel: QUALITY_ISSUE_DIALOG_COPY.reject.confirmLabel,
    reasonLabel: QUALITY_ISSUE_DIALOG_COPY.reject.reasonLabel,
    notesLabel: QUALITY_ISSUE_DIALOG_COPY.reject.notesLabel,
  };
}
