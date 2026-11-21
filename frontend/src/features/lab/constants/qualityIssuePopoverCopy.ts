/**
 * QualityIssuePopover — layout constants and catalog-backed copy.
 * User-visible strings live in contracts/feedback.json (codegen → `@/types/generated/feedback`).
 * Remedy allow-list order and presentation ids live in contracts/lab-policy.json → policies.
 */

import { LAB_CONFIG } from './labConstants';
import { feedbackTitle } from '@/feedback';
import type { QualityIssueOptions } from '@/types';
import type { RemedyType } from '@/types';
import {
  REMEDY_PRESENTATION,
  SAMPLE_UNFINISHED_REMEDY_WIRES,
  VALIDATION_REMEDY_WIRES,
  type RemedyPresentationContext,
  type RemedyPresentationFields,
} from '@/types/generated/policies';

export const QUALITY_ISSUE_POPOVER_LAYOUT = {
  widthClass: 'w-90 md:w-96',
  reasonTextareaRows: 3,
  popoverOffset: LAB_CONFIG.POPOVER_OFFSET,
} as const;

export const QUALITY_ISSUE_POPOVER_COPY = {
  error: {
    cancel: feedbackTitle('lab.qualityIssue.dialog.error.cancel'),
    retry: feedbackTitle('lab.qualityIssue.dialog.error.retry'),
  },
  reject: {
    title: feedbackTitle('lab.qualityIssue.dialog.reject.title'),
    confirmLabel: feedbackTitle('lab.qualityIssue.dialog.reject.confirm'),
    reasonLabel: feedbackTitle('lab.qualityIssue.dialog.reject.reasonLabel'),
    notesLabel: feedbackTitle('lab.qualityIssue.dialog.notesLabel'),
  },
  followUpLabel: feedbackTitle('lab.qualityIssue.dialog.actions.followUp'),
  triggerTitle: feedbackTitle('lab.qualityIssue.dialog.trigger'),
  collection: {
    reasonLabel: feedbackTitle('lab.qualityIssue.collection.reasonLabel'),
    notesLabel: feedbackTitle('lab.qualityIssue.dialog.notesLabel'),
    resultedWarning: feedbackTitle('lab.qualityIssue.collection.escalate.warningBody'),
    followUpLabel: feedbackTitle('lab.qualityIssue.collection.actions.followUp'),
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

export function validationPreviewAlert(options: QualityIssueOptions): string | null {
  return options.sampleRejected
    ? feedbackTitle('lab.qualityIssue.dialog.sampleRejected')
    : null;
}

export interface RemedyOption {
  value: RemedyType;
  label: string;
  description: string;
  disabled?: boolean;
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
  allowed: RemedyType[] | undefined
): RemedyOption[] {
  const allowedSet = new Set(allowed ?? displayOrder);
  const result: RemedyOption[] = [];

  for (const wire of displayOrder) {
    const pres = presentationFor(wire, context);
    if (!pres) {
      continue;
    }
    const isAllowed = allowedSet.has(wire as RemedyType);
    const isValidationRetest = wire === 'retry_same_sample' && context === 'validation';

    if (!isAllowed && !isValidationRetest) {
      continue;
    }

    result.push({
      value: wire as RemedyType,
      label: feedbackTitle(pres.labelFeedbackId),
      description: feedbackTitle(pres.descriptionFeedbackId),
      ...(!isAllowed && isValidationRetest ? { disabled: true as const } : {}),
    });
  }

  return result;
}

export function buildValidationRemedyOptions(allowed: RemedyType[] | undefined): RemedyOption[] {
  return buildRemedyOptions(VALIDATION_REMEDY_WIRES, 'validation', allowed);
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
