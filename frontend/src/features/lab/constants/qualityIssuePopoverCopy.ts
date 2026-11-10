/** Quality-issue popover copy, layout, and remedy destination options. */
/**
 * QualityIssuePopover — layout constants and catalog-backed copy.
 * User-visible strings live in contracts/feedback.json (codegen → `@/types/generated/feedbackCatalog`).
 * Remedy allow-list order and presentation ids live in contracts/lab.json → labContract.
 */

import { LAB_CONFIG } from './labConstants';
import { feedbackTitle } from '@/feedback';
import type { QualityIssueOptions, RemedyType } from '@/types/lab-operations';
import {
  REMEDY_PRESENTATION,
  SAMPLE_UNFINISHED_REMEDY_WIRES,
  VALIDATION_REMEDY_WIRES,
  type RemedyPresentationContext,
  type RemedyPresentationFields,
} from '@/types/generated/labContract';

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

/** Shared retest path labels (validation remedy picker + escalation retest popover). */
export const RETEST_PATH_RADIO_COPY = {
  sameSample: {
    label: feedbackTitle('lab.qualityIssue.dialog.actions.retest'),
    description: feedbackTitle('lab.qualityIssue.dialog.actions.retestDescription'),
  },
  recollection: {
    label: feedbackTitle('lab.qualityIssue.dialog.actions.recollect'),
    description: feedbackTitle('lab.qualityIssue.dialog.actions.recollectDescription'),
  },
} as const;

export interface ValidationFormCopy {
  /** Shown only for true warnings (e.g. re-test limit); single-line icon + text */
  alert: { message: string } | null;
  confirmLabel: string;
  reasonLabel: string;
  notesLabel: string;
  escalationRequired: boolean;
}

/** Dialog copy for validation rejection — supervisor approves remedy on escalation. */
export function getValidationFormCopy(options: QualityIssueOptions): ValidationFormCopy {
  const escalation = QUALITY_ISSUE_POPOVER_COPY.escalation;
  const reject = QUALITY_ISSUE_POPOVER_COPY.reject;
  const alertMessage =
    options.willEscalate
      ? escalation.warningTitle
      : 'Rejecting sends this test to a supervisor to approve retest, recollection, or cancellation.';
  return {
    alert: { message: alertMessage },
    confirmLabel: reject.confirmLabel,
    reasonLabel: reject.reasonLabel,
    notesLabel: reject.notesLabel,
    escalationRequired: true,
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

function presentationFor(
  remedy: string,
  context: RemedyPresentationContext
): RemedyPresentationFields | undefined {
  return REMEDY_PRESENTATION[remedy]?.[context];
}

function buildRemedyOptions(
  displayOrder: readonly string[],
  context: RemedyPresentationContext,
  allowed: RemedyType[] | undefined,
  options?: { retestRemaining?: number }
): RemedyOption[] {
  const allowedSet = new Set(allowed ?? displayOrder);
  const result: RemedyOption[] = [];

  for (const wire of displayOrder) {
    if (!allowedSet.has(wire as RemedyType)) {
      continue;
    }
    const pres = presentationFor(wire, context);
    if (!pres) {
      continue;
    }
    let hint: string | undefined;
    let description = feedbackTitle(pres.descriptionFeedbackId);
    if (
      wire === 'retry_same_sample' &&
      context === 'validation' &&
      options?.retestRemaining != null &&
      options.retestRemaining <= 0
    ) {
      if (pres.supervisorHintFeedbackId) {
        hint = feedbackTitle(pres.supervisorHintFeedbackId);
      }
      if (pres.limitDescriptionFeedbackId) {
        description = feedbackTitle(pres.limitDescriptionFeedbackId);
      }
    }
    result.push({
      value: wire as RemedyType,
      label: feedbackTitle(pres.labelFeedbackId),
      description,
      ...(hint ? { hint } : {}),
    });
  }

  return result;
}

export function buildValidationRemedyOptions(
  allowed: RemedyType[] | undefined,
  context?: { retestRemaining?: number }
): RemedyOption[] {
  return buildRemedyOptions(VALIDATION_REMEDY_WIRES, 'validation', allowed, context);
}

export function buildSampleRemedyOptions(allowed: RemedyType[] | undefined): RemedyOption[] {
  return buildRemedyOptions(SAMPLE_UNFINISHED_REMEDY_WIRES, 'sample', allowed);
}

export function resolveSuggestedRemedy(
  suggested: RemedyType | undefined,
  options: RemedyOption[]
): RemedyType | '' {
  if (!suggested) return '';
  return options.some(option => option.value === suggested) ? suggested : '';
}
