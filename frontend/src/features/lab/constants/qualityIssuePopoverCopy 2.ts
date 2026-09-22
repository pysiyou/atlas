/** Quality-issue popover copy, layout, and remedy destination options. */
/**
 * QualityIssuePopover — layout constants and catalog-backed copy.
 * User-visible strings live in `@/config/feedbackCatalog`.
 */

import { LAB_CONFIG } from './labConstants';
import { feedbackTitle } from '@/utils/feedback/copy';
import type { QualityIssueOptions, RemedyType } from '@/types/lab-operations';

export const QUALITY_ISSUE_POPOVER_LAYOUT = {
  /** Width class for loading/error/content containers */
  widthClass: 'w-90 md:w-96',
  /** Textarea rows for rejection/escalation reason */
  reasonTextareaRows: 3,
  /** Popover offset from trigger (px) */
  popoverOffset: LAB_CONFIG.POPOVER_OFFSET,
} as const;

export const QUALITY_ISSUE_POPOVER_COPY = {
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

export interface ValidationFormCopy {
  /** Shown only for true warnings (e.g. re-test limit); not for routine “choose next step” guidance */
  alert: { variant: 'warning'; title: string; description: string } | null;
  confirmLabel: string;
  reasonLabel: string;
  notesLabel: string;
  escalationRequired: boolean;
}

/** Dialog copy for validation rejection — destination is always operator-chosen. */
export function getValidationFormCopy(options: QualityIssueOptions): ValidationFormCopy {
  if (options.willEscalate) {
    const escalation = QUALITY_ISSUE_POPOVER_COPY.escalation;
    return {
      alert: {
        variant: 'warning',
        title: escalation.warningTitle,
        description: escalation.warningBody,
      },
      confirmLabel: escalation.confirmLabel,
      reasonLabel: escalation.reasonLabel,
      notesLabel: escalation.notesLabel,
      escalationRequired: true,
    };
  }

  const reject = QUALITY_ISSUE_POPOVER_COPY.reject;
  return {
    alert: null,
    confirmLabel: reject.confirmLabel,
    reasonLabel: reject.reasonLabel,
    notesLabel: reject.notesLabel,
    escalationRequired: false,
  };
}

/**
 * Remedy destination option builders for validation and collection flows.
 */
export interface RemedyOption {
  value: RemedyType;
  label: string;
  description: string;
  disabled?: boolean;
  hint?: string;
}

const VALIDATION_REMEDY_META: Record<
  Extract<RemedyType, 'retry_same_sample' | 'request_recollection' | 'cancel'>,
  { label: string; description: string }
> = {
  retry_same_sample: {
    label: QUALITY_ISSUE_POPOVER_COPY.actions.retestLabel,
    description: QUALITY_ISSUE_POPOVER_COPY.actions.retestDescription,
  },
  request_recollection: {
    label: QUALITY_ISSUE_POPOVER_COPY.actions.newSampleLabel,
    description: QUALITY_ISSUE_POPOVER_COPY.actions.newSampleDescription,
  },
  cancel: {
    label: QUALITY_ISSUE_POPOVER_COPY.actions.cancelLabel,
    description: QUALITY_ISSUE_POPOVER_COPY.actions.cancelDescription,
  },
};

const SAMPLE_REMEDY_META: Record<
  Extract<RemedyType, 'request_recollection' | 'cancel'>,
  { label: string; description: string }
> = {
  request_recollection: {
    label: QUALITY_ISSUE_POPOVER_COPY.collection.actions.recollectLabel,
    description: QUALITY_ISSUE_POPOVER_COPY.collection.actions.recollectDescription,
  },
  cancel: {
    label: QUALITY_ISSUE_POPOVER_COPY.collection.actions.cancelUnfinishedLabel,
    description: QUALITY_ISSUE_POPOVER_COPY.collection.actions.cancelUnfinishedDescription,
  },
};

export function buildValidationRemedyOptions(
  allowed: RemedyType[] | undefined,
  context?: { retestRemaining?: number }
): RemedyOption[] {
  const order: RemedyType[] = ['retry_same_sample', 'request_recollection', 'cancel'];
  const allowedSet = new Set(allowed ?? order);

  return order
    .filter(value => allowedSet.has(value) && value in VALIDATION_REMEDY_META)
    .map(value => {
      const meta = VALIDATION_REMEDY_META[value as keyof typeof VALIDATION_REMEDY_META];
      let hint: string | undefined;
      let description = meta.description;

      if (
        value === 'retry_same_sample' &&
        context?.retestRemaining != null &&
        context.retestRemaining <= 0
      ) {
        hint = QUALITY_ISSUE_POPOVER_COPY.actions.retestSupervisorHint;
        description = QUALITY_ISSUE_POPOVER_COPY.actions.retestLimitDescription;
      }

      return { value, label: meta.label, description, hint };
    });
}

export function buildSampleRemedyOptions(allowed: RemedyType[] | undefined): RemedyOption[] {
  const order: RemedyType[] = ['request_recollection', 'cancel'];
  const allowedSet = new Set(allowed ?? order);
  return order
    .filter(value => allowedSet.has(value) && value in SAMPLE_REMEDY_META)
    .map(value => {
      const meta = SAMPLE_REMEDY_META[value as keyof typeof SAMPLE_REMEDY_META];
      return { value, label: meta.label, description: meta.description };
    });
}

export function resolveSuggestedRemedy(
  suggested: RemedyType | undefined,
  options: RemedyOption[]
): RemedyType | '' {
  if (!suggested) return '';
  return options.some(option => option.value === suggested) ? suggested : '';
}

