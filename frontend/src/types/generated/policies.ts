/** GENERATED policy bundle — lab, rejection reasons, catalog categories. DO NOT EDIT. */

// --- lab-policy.ts ---
import type { FeedbackId } from './feedback';

export const GENERATED_LAB_CONSTANTS = {
  MAX_RETEST_ATTEMPTS: 2,
  MAX_RECOLLECTION_ATTEMPTS: 2,
  QUEUE_AGE_WARNING_HOURS: 4,
  QUEUE_AGE_CRITICAL_HOURS: 8,
} as const;

export const ATTENTION_REASON_KEYS = [
  "payment_unpaid",
  "sample_rejected",
  "critical_value",
  "amendment_pending",
  "retry_limit",
  "recollection_limit",
  "supervisor_review",
] as const;

export const BLOCKS_PROGRESS_REASONS = new Set<string>(["payment_unpaid", "sample_rejected", "critical_value", "amendment_pending", "retry_limit", "recollection_limit", "supervisor_review"]);

export function reasonBlocksProgress(reason: string | null | undefined): boolean {
  return reason != null && BLOCKS_PROGRESS_REASONS.has(reason);
}

export type LabAttentionReason = "payment_unpaid" | "sample_rejected" | "critical_value" | "amendment_pending" | "retry_limit" | "recollection_limit" | "supervisor_review";

export const ATTENTION_LABELS: Record<LabAttentionReason, string> = {
  "payment_unpaid": "Payment required",
  "sample_rejected": "Sample rejected",
  "critical_value": "Critical value — supervisor review",
  "amendment_pending": "Amendment pending",
  "retry_limit": "Re-test limit reached",
  "recollection_limit": "Recollection limit reached",
  "supervisor_review": "Supervisor approval required",
};

export const ATTENTION_ATTENTION_TYPE: Partial<Record<LabAttentionReason, string>> = {
  "payment_unpaid": "payment_blocked",
  "sample_rejected": "sample_rejected",
  "critical_value": "escalation_critical",
  "amendment_pending": "escalation_amendment",
  "retry_limit": "escalation_retry_limit",
  "recollection_limit": "escalation_recollection_limit",
  "supervisor_review": "supervisor_approval",
};

export const ALLOWED_ACTION_KEYS = ["collect","enterResults","validate","reject"] as const;

export const PIPELINE_STAGES = ["collection","entry","validation","escalation","completed","cancelled"] as const;

export const ATTENTION_TYPE_SORT: Record<string, number> = {
  "escalation_critical": 10,
  "escalation_amendment": 20,
  "escalation_retry_limit": 30,
  "escalation_recollection_limit": 40,
  "supervisor_approval": 45,
  "payment_blocked": 50,
  "sample_rejected": 60,
  "priority_urgent": 82,
  "priority_high": 84,
  "queue_overdue_critical": 90,
  "queue_overdue_warning": 100
};

export const SUPERVISOR_ATTENTION_TYPES = ["escalation_critical","escalation_amendment","escalation_retry_limit","escalation_recollection_limit","supervisor_approval"] as const;

export const PRIORITY_ATTENTION_TYPES = ["priority_urgent","priority_high"] as const;

export const TERMINAL_TEST_STATUSES = ["validated","cancelled","superseded","removed"] as const;

export const ORDER_STATUS_TO_PRIMARY: Record<string, string> = {
  "ordered": "pending",
  "running": "in_progress",
  "partial-results": "partial_results",
  "completed": "completed",
  "cancelled": "cancelled"
};

export const TEST_STATUS_TO_PRIMARY: Record<string, string> = {
  "pending": "pending",
  "sample-collected": "in_progress",
  "resulted": "in_progress",
  "validated": "completed",
  "cancelled": "cancelled",
  "escalated": "escalated",
  "superseded": "superseded",
  "removed": "removed"
};

export const SAMPLE_STATUS_TO_PRIMARY: Record<string, string> = {
  "pending": "pending",
  "collected": "in_progress",
  "rejected": "rejected"
};

export const INACTIVE_TEST_STATUSES_FOR_REPORTS = ["removed","superseded"] as const;

export const INACTIVE_TEST_STATUSES_FOR_ROLLUP = ["removed","superseded","cancelled"] as const;

export const INACTIVE_TEST_STATUSES_FOR_BILLING = ["removed","superseded"] as const;

/** Report lines excluded from PDF/list eligibility (subset of rollup inactive). */
export const INACTIVE_REPORTABLE_TEST_STATUSES = new Set<string>(INACTIVE_TEST_STATUSES_FOR_REPORTS);

/** Order lines excluded from billing/receipt totals (lab cancel does not remove lines). */
export const INACTIVE_BILLING_TEST_STATUSES = new Set<string>(INACTIVE_TEST_STATUSES_FOR_BILLING);

export const PRIORITY_RANK: Record<string, number> = {
  "urgent": 0,
  "high": 1,
  "medium": 2,
  "low": 3
};

export const PRIORITY_WEIGHT: Record<string, number> = {
  "urgent": 4,
  "high": 3,
  "medium": 2,
  "low": 1
};

// ── Quality workflow (remedy policy) ───────────────────────────────────

export const VALIDATION_REMEDY_WIRES = ["retry_same_sample","request_recollection","cancel"] as const;

export const SAMPLE_UNFINISHED_REMEDY_WIRES = ["request_recollection","cancel"] as const;

export type QualityIssueSuccessToastWhen = {
  escalationRequired?: boolean;
};

export type QualityIssueSuccessToastRule = {
  remedy: string;
  feedbackId: FeedbackId;
  when: QualityIssueSuccessToastWhen;
};

export const QUALITY_ISSUE_SUCCESS_TOAST_RULES: QualityIssueSuccessToastRule[] = [
  {
    "remedy": "escalate",
    "feedbackId": "lab.qualityIssue.escalate.limitHit",
    "when": {
      "escalationRequired": true
    }
  },
  {
    "remedy": "escalate",
    "feedbackId": "lab.qualityIssue.escalate",
    "when": {}
  },
  {
    "remedy": "retry_same_sample",
    "feedbackId": "lab.qualityIssue.retest.limitHit",
    "when": {
      "escalationRequired": true
    }
  },
  {
    "remedy": "retry_same_sample",
    "feedbackId": "lab.qualityIssue.retest",
    "when": {}
  },
  {
    "remedy": "request_recollection",
    "feedbackId": "lab.qualityIssue.recollection.requested",
    "when": {
      "escalationRequired": false
    }
  },
  {
    "remedy": "request_recollection",
    "feedbackId": "lab.qualityIssue.specimenRejected",
    "when": {}
  },
  {
    "remedy": "cancel",
    "feedbackId": "lab.qualityIssue.cancelled",
    "when": {}
  }
];

export const DEFAULT_QUALITY_ISSUE_SUCCESS_TOAST = "lab.qualityIssue.reported" as FeedbackId;

export type RemedyPresentationContext = 'validation' | 'sample';

export type RemedyPresentationFields = {
  labelFeedbackId: FeedbackId;
  descriptionFeedbackId: FeedbackId;
  limitDescriptionFeedbackId?: FeedbackId;
  supervisorHintFeedbackId?: FeedbackId;
};

export const REMEDY_PRESENTATION: Record<
  string,
  Partial<Record<RemedyPresentationContext, RemedyPresentationFields>>
> = {
  "retry_same_sample": {
    "validation": {
      "labelFeedbackId": "lab.qualityIssue.dialog.actions.retest",
      "descriptionFeedbackId": "lab.qualityIssue.dialog.actions.retestDescription",
      "limitDescriptionFeedbackId": "lab.qualityIssue.dialog.actions.retestLimit",
      "supervisorHintFeedbackId": "lab.qualityIssue.dialog.actions.retestHint"
    }
  },
  "request_recollection": {
    "validation": {
      "labelFeedbackId": "lab.qualityIssue.dialog.actions.recollect",
      "descriptionFeedbackId": "lab.qualityIssue.dialog.actions.recollectDescription"
    },
    "sample": {
      "labelFeedbackId": "lab.qualityIssue.collection.actions.recollect",
      "descriptionFeedbackId": "lab.qualityIssue.collection.actions.recollectDescription"
    }
  },
  "cancel": {
    "validation": {
      "labelFeedbackId": "lab.qualityIssue.dialog.actions.cancel",
      "descriptionFeedbackId": "lab.qualityIssue.dialog.actions.cancelDescription"
    },
    "sample": {
      "labelFeedbackId": "lab.qualityIssue.collection.actions.cancelUnfinished",
      "descriptionFeedbackId": "lab.qualityIssue.collection.actions.cancelUnfinishedDescription"
    }
  }
} as Record<
  string,
  Partial<Record<RemedyPresentationContext, RemedyPresentationFields>>
>;

// --- rejection-reasons.ts ---
export const REJECTION_REASON_BY_ID: Readonly<Record<string, string>> = {
  "aberrant_clotting_curve_repeat_run": "Aberrant clotting curve — repeat run",
  "ambiguous_identification_repeat_workup": "Ambiguous identification — repeat workup",
  "analyzer_flag_repeat_run_on_same_sample": "Analyzer flag — repeat run on same sample",
  "critical_value_repeat_for_verification": "Critical value — repeat for verification",
  "delta_check_failure_repeat_run": "Delta check failure — repeat run",
  "equivocal_result_repeat_run": "Equivocal result — repeat run",
  "fasting_requirements_not_met": "Fasting requirements not met",
  "indeterminate_result_repeat_run": "Indeterminate result — repeat run",
  "instrument_error_repeat_run": "Instrument error — repeat run",
  "insufficient_growth_repeat_incubation": "Insufficient growth — repeat incubation",
  "invalid_coagulation_control_repeat_run": "Invalid coagulation control — repeat run",
  "invalid_device_expired_cartridge": "Invalid device / expired cartridge",
  "invalid_or_expired_reagent_repeat_run": "Invalid or expired reagent — repeat run",
  "leaked_or_broken_container": "Leaked or broken container",
  "not_protected_from_light": "Not protected from light",
  "overfilled_tube": "Overfilled tube",
  "platelet_clumps_aggregation_flags_repeat_count": "Platelet clumps / aggregation flags — repeat count",
  "procedural_error_during_analysis": "Procedural error during analysis",
  "qc_control_failure": "QC / control failure",
  "clotted": "Clotted sample",
  "contaminated": "Contaminated sample",
  "hemolyzed_mild": "Hemolyzed - Mild",
  "hemolyzed_moderate": "Hemolyzed - Moderate",
  "hemolyzed_severe": "Hemolyzed - Severe",
  "icteric": "Icteric sample",
  "wrong_container": "Incorrect container / wrong tube",
  "qns": "Insufficient quantity (QNS)",
  "lipemic": "Lipemic sample",
  "labeling_error_mismatch": "Mislabeled / Patient ID mismatch",
  "transport_delay": "Transport time exceeded",
  "labeling_error_unlabeled": "Unlabeled sample",
};

export const REJECTION_REASON_DOMAIN_BY_ID: Readonly<Record<string, 'specimen' | 'analytical'>> = {
  "aberrant_clotting_curve_repeat_run": "analytical",
  "ambiguous_identification_repeat_workup": "analytical",
  "analyzer_flag_repeat_run_on_same_sample": "analytical",
  "critical_value_repeat_for_verification": "analytical",
  "delta_check_failure_repeat_run": "analytical",
  "equivocal_result_repeat_run": "analytical",
  "fasting_requirements_not_met": "analytical",
  "indeterminate_result_repeat_run": "analytical",
  "instrument_error_repeat_run": "analytical",
  "insufficient_growth_repeat_incubation": "analytical",
  "invalid_coagulation_control_repeat_run": "analytical",
  "invalid_device_expired_cartridge": "analytical",
  "invalid_or_expired_reagent_repeat_run": "analytical",
  "leaked_or_broken_container": "analytical",
  "not_protected_from_light": "analytical",
  "overfilled_tube": "analytical",
  "platelet_clumps_aggregation_flags_repeat_count": "analytical",
  "procedural_error_during_analysis": "analytical",
  "qc_control_failure": "analytical",
  "clotted": "specimen",
  "contaminated": "specimen",
  "hemolyzed_mild": "specimen",
  "hemolyzed_moderate": "specimen",
  "hemolyzed_severe": "specimen",
  "icteric": "specimen",
  "wrong_container": "specimen",
  "qns": "specimen",
  "lipemic": "specimen",
  "labeling_error_mismatch": "specimen",
  "transport_delay": "specimen",
  "labeling_error_unlabeled": "specimen",
};

export const LEGACY_ENUM_WIRE_BY_ID: Readonly<Record<string, string>> = {
  "clotted": "clotted",
  "contaminated": "contaminated",
  "hemolyzed_severe": "hemolyzed",
  "icteric": "icteric",
  "wrong_container": "wrong_container",
  "qns": "qns",
  "lipemic": "lipemic",
  "labeling_error_mismatch": "labeling_error",
  "transport_delay": "transport_delay",
  "labeling_error_unlabeled": "labeling_error",
};

const LABEL_TO_ID: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(REJECTION_REASON_BY_ID).map(([id, label]) => [label, id]),
);

/** Resolve registry id, canonical label, or legacy enum wire to display label. */
export function resolveRejectionReasonLabel(value: string | null | undefined): string {
  const stripped = (value ?? '').trim();
  if (!stripped) return stripped;
  if (REJECTION_REASON_BY_ID[stripped]) {
    return REJECTION_REASON_BY_ID[stripped];
  }
  if (LABEL_TO_ID[stripped] !== undefined) {
    return stripped;
  }
  for (const [id, wire] of Object.entries(LEGACY_ENUM_WIRE_BY_ID)) {
    if (stripped === wire) {
      return REJECTION_REASON_BY_ID[id] ?? stripped;
    }
  }
  return stripped.replace(/_/g, ' ');
}

export function rejectionReasonDomain(value: string): 'specimen' | 'analytical' | undefined {
  const stripped = value.trim();
  if (!stripped) return undefined;
  if (REJECTION_REASON_DOMAIN_BY_ID[stripped]) {
    return REJECTION_REASON_DOMAIN_BY_ID[stripped];
  }
  const id = LABEL_TO_ID[stripped];
  if (id) return REJECTION_REASON_DOMAIN_BY_ID[id];
  for (const [rid, wire] of Object.entries(LEGACY_ENUM_WIRE_BY_ID)) {
    if (stripped === wire) {
      return REJECTION_REASON_DOMAIN_BY_ID[rid];
    }
  }
  return undefined;
}

// --- catalog-categories.ts ---
export const TEST_CATEGORY_VALUES = ["biochemistry","coagulation","hematology","microbiology","serology","urinalysis"] as const;

export type GeneratedTestCategory = (typeof TEST_CATEGORY_VALUES)[number];

export const TEST_CATEGORY_CONFIG: Record<
  GeneratedTestCategory,
  { label: string; color: string }
> = {
  "biochemistry": { label: "Biochemistry", color: "biochemistry" },
  "coagulation": { label: "Coagulation", color: "coagulation" },
  "hematology": { label: "Hematology", color: "hematology" },
  "microbiology": { label: "Microbiology", color: "microbiology" },
  "serology": { label: "Serology", color: "serology" },
  "urinalysis": { label: "Urinalysis", color: "urinalysis" },
};

export function getGeneratedCategoryLabel(category: string): string {
  const known = TEST_CATEGORY_CONFIG[category as GeneratedTestCategory];
  if (known) return known.label;
  return category.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}
