/** GENERATED from contracts/enums.json. DO NOT EDIT. */
export const QUALITY_STAGE_VALUES = ["collection", "validation"] as const;

export type QualityStage = (typeof QUALITY_STAGE_VALUES)[number];

export const QUALITY_STAGE_CONFIG: Record<QualityStage, { label: string }> = {
  "collection": { label: "Collection" },
  "validation": { label: "Validation" },
};

export const QUALITY_STAGE_OPTIONS = QUALITY_STAGE_VALUES.map(value => ({
  value,
  label: QUALITY_STAGE_CONFIG[value].label,
}));

export const QUALITY_DOMAIN_VALUES = ["specimen", "analytical", "clinical"] as const;

export type QualityDomain = (typeof QUALITY_DOMAIN_VALUES)[number];

export const QUALITY_DOMAIN_CONFIG: Record<QualityDomain, { label: string }> = {
  "specimen": { label: "Specimen" },
  "analytical": { label: "Analytical" },
  "clinical": { label: "Clinical" },
};

export const QUALITY_DOMAIN_OPTIONS = QUALITY_DOMAIN_VALUES.map(value => ({
  value,
  label: QUALITY_DOMAIN_CONFIG[value].label,
}));

export const REMEDY_TYPE_VALUES = ["retry_same_sample", "recollect", "request_recollection", "escalate", "cancel"] as const;

export type RemedyType = (typeof REMEDY_TYPE_VALUES)[number];

export const REMEDY_TYPE_CONFIG: Record<RemedyType, { label: string }> = {
  "retry_same_sample": { label: "Retry same sample" },
  "recollect": { label: "Recollect" },
  "request_recollection": { label: "Request recollection" },
  "escalate": { label: "Escalate" },
  "cancel": { label: "Cancel" },
};

export const REMEDY_TYPE_OPTIONS = REMEDY_TYPE_VALUES.map(value => ({
  value,
  label: REMEDY_TYPE_CONFIG[value].label,
}));

export const RECOLLECTION_REQUEST_STATUS_VALUES = ["pending-approval", "approved", "denied", "fulfilled", "cancelled"] as const;

export type RecollectionRequestStatus = (typeof RECOLLECTION_REQUEST_STATUS_VALUES)[number];

export const RECOLLECTION_REQUEST_STATUS_CONFIG: Record<RecollectionRequestStatus, { label: string }> = {
  "pending-approval": { label: "Pending approval" },
  "approved": { label: "Approved" },
  "denied": { label: "Denied" },
  "fulfilled": { label: "Fulfilled" },
  "cancelled": { label: "Cancelled" },
};

export const RECOLLECTION_REQUEST_STATUS_OPTIONS = RECOLLECTION_REQUEST_STATUS_VALUES.map(value => ({
  value,
  label: RECOLLECTION_REQUEST_STATUS_CONFIG[value].label,
}));

export const QUALITY_ISSUE_TARGET_TYPE_VALUES = ["sample", "test"] as const;

export type QualityIssueTargetType = (typeof QUALITY_ISSUE_TARGET_TYPE_VALUES)[number];

export const QUALITY_ISSUE_TARGET_TYPE_CONFIG: Record<QualityIssueTargetType, { label: string }> = {
  "sample": { label: "Sample" },
  "test": { label: "Test" },
};

export const QUALITY_ISSUE_TARGET_TYPE_OPTIONS = QUALITY_ISSUE_TARGET_TYPE_VALUES.map(value => ({
  value,
  label: QUALITY_ISSUE_TARGET_TYPE_CONFIG[value].label,
}));

export const ESCALATION_REASON_CODE_VALUES = ["CRIT-VAL", "REJ-SAMP", "LIMIT-HIT", "AMEND-RES"] as const;

export type EscalationReasonCode = (typeof ESCALATION_REASON_CODE_VALUES)[number];

export const ESCALATION_REASON_CODE_CONFIG: Record<EscalationReasonCode, { label: string }> = {
  "CRIT-VAL": { label: "Critical value" },
  "REJ-SAMP": { label: "Rejected sample" },
  "LIMIT-HIT": { label: "Limit hit" },
  "AMEND-RES": { label: "Amend result" },
};

export const ESCALATION_REASON_CODE_OPTIONS = ESCALATION_REASON_CODE_VALUES.map(value => ({
  value,
  label: ESCALATION_REASON_CODE_CONFIG[value].label,
}));

export const ESCALATION_TICKET_STATUS_VALUES = ["OPEN", "RESOLVED"] as const;

export type EscalationTicketStatus = (typeof ESCALATION_TICKET_STATUS_VALUES)[number];

export const ESCALATION_TICKET_STATUS_CONFIG: Record<EscalationTicketStatus, { label: string }> = {
  "OPEN": { label: "Open" },
  "RESOLVED": { label: "Resolved" },
};

export const ESCALATION_TICKET_STATUS_OPTIONS = ESCALATION_TICKET_STATUS_VALUES.map(value => ({
  value,
  label: ESCALATION_TICKET_STATUS_CONFIG[value].label,
}));

export const ESCALATION_SEVERITY_VALUES = ["CRITICAL", "STANDARD"] as const;

export type EscalationSeverity = (typeof ESCALATION_SEVERITY_VALUES)[number];

export const ESCALATION_SEVERITY_CONFIG: Record<EscalationSeverity, { label: string }> = {
  "CRITICAL": { label: "Critical" },
  "STANDARD": { label: "Standard" },
};

export const ESCALATION_SEVERITY_OPTIONS = ESCALATION_SEVERITY_VALUES.map(value => ({
  value,
  label: ESCALATION_SEVERITY_CONFIG[value].label,
}));

export const ESCALATION_RESOLUTION_ACTION_VALUES = ["force_validate", "authorize_retest", "authorize_recollect", "apply_amendment", "cancel_test"] as const;

export type EscalationResolutionAction = (typeof ESCALATION_RESOLUTION_ACTION_VALUES)[number];

export const ESCALATION_RESOLUTION_ACTION_CONFIG: Record<EscalationResolutionAction, { label: string }> = {
  "force_validate": { label: "Force validate" },
  "authorize_retest": { label: "Authorize retest" },
  "authorize_recollect": { label: "Authorize recollect" },
  "apply_amendment": { label: "Apply amendment" },
  "cancel_test": { label: "Cancel test" },
};

export const ESCALATION_RESOLUTION_ACTION_OPTIONS = ESCALATION_RESOLUTION_ACTION_VALUES.map(value => ({
  value,
  label: ESCALATION_RESOLUTION_ACTION_CONFIG[value].label,
}));

