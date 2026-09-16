/**
 * Remedy destination option builders for validation and collection flows.
 */
import type { RemedyType } from '@/types/lab-operations';
import { QUALITY_ISSUE_POPOVER_COPY } from './qualityIssuePopoverCopy';
import type { RemedyOption } from './QualityIssueRemedyPicker';

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
