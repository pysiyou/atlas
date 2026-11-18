/** GENERATED — DO NOT EDIT. Source: contracts/enums.json */

// =============================================================================
// affiliation
// =============================================================================
export const AFFILIATION_DURATION_VALUES = [6, 12, 24] as const;

export type AffiliationDuration = (typeof AFFILIATION_DURATION_VALUES)[number];

export const AFFILIATION_DURATION_CONFIG: Record<AffiliationDuration, { label: string }> = {
  6: { label: "6 Months" },
  12: { label: "1 Year" },
  24: { label: "2 Years" },
};

export const AFFILIATION_DURATION_OPTIONS = AFFILIATION_DURATION_VALUES.map(value => ({
  value,
  label: AFFILIATION_DURATION_CONFIG[value].label,
}));

// =============================================================================
// billing
// =============================================================================
export const CLAIM_STATUS_VALUES = ["submitted", "processing", "approved", "denied", "paid"] as const;

export type ClaimStatus = (typeof CLAIM_STATUS_VALUES)[number];

export const CLAIM_STATUS_CONFIG: Record<ClaimStatus, { label: string }> = {
  "submitted": { label: "Submitted" },
  "processing": { label: "Processing" },
  "approved": { label: "Approved" },
  "denied": { label: "Denied" },
  "paid": { label: "Paid" },
};

export const CLAIM_STATUS_OPTIONS = CLAIM_STATUS_VALUES.map(value => ({
  value,
  label: CLAIM_STATUS_CONFIG[value].label,
}));

// =============================================================================
// container-enums
// =============================================================================
export const CONTAINER_TYPE_VALUES = ["tube", "cup"] as const;

export type ContainerType = (typeof CONTAINER_TYPE_VALUES)[number];

export const CONTAINER_TYPE_CONFIG: Record<ContainerType, { label: string }> = {
  "tube": { label: "Tube" },
  "cup": { label: "Cup" },
};

export const CONTAINER_TYPE_OPTIONS = CONTAINER_TYPE_VALUES.map(value => ({
  value,
  label: CONTAINER_TYPE_CONFIG[value].label,
}));

export const CONTAINER_TOP_COLOR_VALUES = ["red", "purple", "blue", "green", "gray", "yellow", "light-blue", "pink", "white", "black", "orange", "clear"] as const;

export type ContainerTopColor = (typeof CONTAINER_TOP_COLOR_VALUES)[number];

export const CONTAINER_TOP_COLOR_CONFIG: Record<ContainerTopColor, { label: string }> = {
  "red": { label: "Red" },
  "purple": { label: "Purple" },
  "blue": { label: "Blue" },
  "green": { label: "Green" },
  "gray": { label: "Gray" },
  "yellow": { label: "Yellow" },
  "light-blue": { label: "Light Blue" },
  "pink": { label: "Pink" },
  "white": { label: "White" },
  "black": { label: "Black" },
  "orange": { label: "Orange" },
  "clear": { label: "Clear" },
};

export const CONTAINER_TOP_COLOR_OPTIONS = CONTAINER_TOP_COLOR_VALUES.map(value => ({
  value,
  label: CONTAINER_TOP_COLOR_CONFIG[value].label,
}));

// =============================================================================
// container-catalog
// =============================================================================
export const CONTAINER_CATALOG_VALUES = ["red-top","lavender-top","green-top","blue-top","yellow-top","gray-top","light-blue-top","pink-top","black-top","orange-top","royal-blue-top","white-top","tan-top","urine-cup","stool-container","swab-tube","gold-top","tiger-top","clear-top","cup","tube","other"] as const;

export type ContainerCatalogId = (typeof CONTAINER_CATALOG_VALUES)[number];

export const CONTAINER_CATALOG_CONFIG: Record<
  ContainerCatalogId,
  {
    label: string;
    additive?: string;
    commonUses: string;
    textClass?: string;
  }
> = {
  "red-top": { label: "Red Top", commonUses: "Serum chemistry, serology, immunology", additive: "None", textClass: "text-container-red-text" },
  "lavender-top": { label: "Lavender Top", commonUses: "CBC, blood typing", additive: "EDTA", textClass: "text-container-purple-text" },
  "green-top": { label: "Green Top", commonUses: "Plasma chemistry", additive: "Heparin", textClass: "text-container-green-text" },
  "blue-top": { label: "Blue Top", commonUses: "Coagulation tests", additive: "Sodium citrate", textClass: "text-container-blue-text" },
  "yellow-top": { label: "Yellow Top", commonUses: "Blood bank, HLA typing", additive: "ACD", textClass: "text-container-yellow-text" },
  "gray-top": { label: "Gray Top", commonUses: "Glucose, lactate", additive: "Sodium fluoride", textClass: "text-container-gray-text" },
  "light-blue-top": { label: "Light Blue Top", commonUses: "Coagulation", additive: "Sodium citrate", textClass: "text-cyan-fg-emphasis" },
  "pink-top": { label: "Pink Top", commonUses: "Blood bank", additive: "EDTA", textClass: "text-pink-fg-emphasis" },
  "black-top": { label: "Black Top", commonUses: "ESR", additive: "Sodium citrate", textClass: "text-container-black-text" },
  "orange-top": { label: "Orange Top", commonUses: "STAT serum chemistry", additive: "Thrombin", textClass: "text-orange-fg-emphasis" },
  "royal-blue-top": { label: "Royal Blue Top", commonUses: "Trace elements, toxicology", additive: "None / EDTA / Heparin", textClass: "text-indigo-fg-emphasis" },
  "white-top": { label: "White Top", commonUses: "Molecular diagnostics", additive: "EDTA with gel", textClass: "text-text-muted" },
  "tan-top": { label: "Tan Top", commonUses: "Lead testing", additive: "EDTA", textClass: "text-orange-fg-emphasis" },
  "urine-cup": { label: "Urine Cup", commonUses: "Urinalysis", textClass: "text-container-yellow-text" },
  "stool-container": { label: "Stool Container", commonUses: "Stool analysis", textClass: "text-orange-fg-emphasis" },
  "swab-tube": { label: "Swab Tube", commonUses: "Microbiology cultures", textClass: "text-teal-fg-emphasis" },
  "gold-top": { label: "Gold Top", commonUses: "Serum separator", additive: "Clot activator", textClass: "text-container-yellow-text" },
  "tiger-top": { label: "Tiger Top", commonUses: "Serum separator", additive: "Clot activator", textClass: "text-orange-fg-emphasis" },
  "clear-top": { label: "Clear Top", commonUses: "Discard tube", additive: "None", textClass: "text-text-disabled" },
  "cup": { label: "Cup", commonUses: "Urine, stool", additive: "None", textClass: "text-orange-fg-emphasis" },
  "tube": { label: "Tube", commonUses: "General collection", additive: "Various", textClass: "text-text-muted" },
  "other": { label: "Other", commonUses: "Miscellaneous", additive: "Various", textClass: "text-text-muted" },
};

export const CONTAINER_CATALOG_OPTIONS = CONTAINER_CATALOG_VALUES.map(value => ({
  value,
  label: CONTAINER_CATALOG_CONFIG[value].label,
}));

export const COLLECTION_TOP_COLOR_PRESETS = ["red-top","yellow-top","green-top","black-top","blue-top"] as ContainerCatalogId[];

export const CONTAINER_CATALOG_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Containers" },
  ...CONTAINER_CATALOG_OPTIONS,
];

/** Catalog preset id → API ContainerTopColor wire value for collection submit. */
export const FRONTEND_TO_BACKEND_COLOR: Record<string, ContainerTopColor> = {
  "red-top": "red",
  "lavender-top": "purple",
  "green-top": "green",
  "blue-top": "blue",
  "royal-blue-top": "blue",
  "yellow-top": "yellow",
  "gray-top": "gray",
  "light-blue-top": "light-blue",
  "pink-top": "pink",
  "black-top": "black",
  "orange-top": "orange",
  "white-top": "white",
  "clear-top": "clear",
  "gold-top": "yellow",
  "tiger-top": "orange",
  "tan-top": "orange",
};

// =============================================================================
// gender
// =============================================================================
export const GENDER_VALUES = ["male", "female"] as const;

export type Gender = (typeof GENDER_VALUES)[number];

export const GENDER_CONFIG: Record<Gender, { label: string; icon?: string }> = {
  "male": { label: "Male", icon: "♂" },
  "female": { label: "Female", icon: "♀" },
};

export const GENDER_OPTIONS = GENDER_VALUES.map(value => ({
  value,
  label: GENDER_CONFIG[value].label,
}));

export const GENDER_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Genders" },
  ...GENDER_OPTIONS,
];

// =============================================================================
// lab-quality
// =============================================================================
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

export const ESCALATION_REASON_CODE_VALUES = ["CRIT-VAL", "REJ-SAMP", "LIMIT-HIT", "AMEND-RES", "VAL-REJ"] as const;

export type EscalationReasonCode = (typeof ESCALATION_REASON_CODE_VALUES)[number];

export const ESCALATION_REASON_CODE_CONFIG: Record<EscalationReasonCode, { label: string }> = {
  "CRIT-VAL": { label: "Critical value" },
  "REJ-SAMP": { label: "Rejected sample" },
  "LIMIT-HIT": { label: "Limit hit" },
  "AMEND-RES": { label: "Amend result" },
  "VAL-REJ": { label: "Validation rejected" },
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

// =============================================================================
// order
// =============================================================================
export const ORDER_STATUS_VALUES = ["ordered", "running", "completed", "partial-results", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string }> = {
  "ordered": { label: "Ordered" },
  "running": { label: "Running" },
  "completed": { label: "Completed" },
  "partial-results": { label: "Partial results" },
  "cancelled": { label: "Cancelled" },
};

export const ORDER_STATUS_OPTIONS = ORDER_STATUS_VALUES.map(value => ({
  value,
  label: ORDER_STATUS_CONFIG[value].label,
}));

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Status" },
  ...ORDER_STATUS_OPTIONS,
];

export const ORDER_STATUS_TIMELINE = ORDER_STATUS_VALUES.map(status => ({
  status,
  label: ORDER_STATUS_CONFIG[status].label,
}));

export const PAYMENT_STATUS_VALUES = ["unpaid", "partial", "paid"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string }> = {
  "unpaid": { label: "Unpaid" },
  "partial": { label: "Partial" },
  "paid": { label: "Paid" },
};

export const PAYMENT_STATUS_OPTIONS = PAYMENT_STATUS_VALUES.map(value => ({
  value,
  label: PAYMENT_STATUS_CONFIG[value].label,
}));

export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Status" },
  ...PAYMENT_STATUS_OPTIONS,
];

export const PRIORITY_LEVEL_VALUES = ["low", "medium", "high", "urgent"] as const;

export type PriorityLevel = (typeof PRIORITY_LEVEL_VALUES)[number];

export const PRIORITY_LEVEL_CONFIG: Record<PriorityLevel, { label: string; turnaroundHours: number }> = {
  "low": { label: "Low", turnaroundHours: 48 },
  "medium": { label: "Medium", turnaroundHours: 24 },
  "high": { label: "High", turnaroundHours: 4 },
  "urgent": { label: "Urgent", turnaroundHours: 1 },
};

export const PRIORITY_LEVEL_OPTIONS = PRIORITY_LEVEL_VALUES.map(value => ({
  value,
  label: PRIORITY_LEVEL_CONFIG[value].label,
}));

export const PRIORITY_LEVEL_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Priorities" },
  ...PRIORITY_LEVEL_OPTIONS,
];

export const PAYMENT_METHOD_VALUES = ["cash", "credit-card", "debit-card", "insurance", "bank-transfer", "mobile"] as const;

export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; enabled: boolean; iconKey: string }> = {
  "cash": { label: "Cash", enabled: true, iconKey: "dataFields.cash" },
  "credit-card": { label: "Credit Card", enabled: false, iconKey: "dataFields.creditCard" },
  "debit-card": { label: "Debit Card", enabled: false, iconKey: "dataFields.creditCard" },
  "insurance": { label: "Insurance", enabled: false, iconKey: "ui.shield" },
  "bank-transfer": { label: "Bank Transfer", enabled: false, iconKey: "dataFields.wallet" },
  "mobile": { label: "Mobile", enabled: true, iconKey: "dataFields.phone" },
};

// =============================================================================
// presentation
// =============================================================================
export const PRESENTATION_PRIMARY_VALUES = ["pending", "blocked", "in_progress", "partial_results", "completed", "cancelled", "superseded", "removed", "escalated", "rejected"] as const;

export type PresentationPrimary = (typeof PRESENTATION_PRIMARY_VALUES)[number];

export const PRESENTATION_PRIMARY_CONFIG: Record<PresentationPrimary, { label: string; badgeVariant: string }> = {
  "pending": { label: "PENDING", badgeVariant: "neutral" },
  "blocked": { label: "BLOCKED", badgeVariant: "warning" },
  "in_progress": { label: "RUNNING", badgeVariant: "info" },
  "partial_results": { label: "PARTIAL", badgeVariant: "info" },
  "completed": { label: "COMPLETED", badgeVariant: "success" },
  "cancelled": { label: "CANCELLED", badgeVariant: "danger" },
  "superseded": { label: "SUPERSEDED", badgeVariant: "neutral" },
  "removed": { label: "REMOVED", badgeVariant: "neutral" },
  "escalated": { label: "ESCALATED", badgeVariant: "danger" },
  "rejected": { label: "REJECTED", badgeVariant: "danger" },
};

export const PRESENTATION_PRIMARY_OPTIONS = PRESENTATION_PRIMARY_VALUES.map(value => ({
  value,
  label: PRESENTATION_PRIMARY_CONFIG[value].label,
}));

export const PRESENTATION_BADGE_VARIANTS = Object.fromEntries(
  PRESENTATION_PRIMARY_VALUES.map(value => [value, PRESENTATION_PRIMARY_CONFIG[value].badgeVariant])
) as Record<PresentationPrimary, string>;

export const PRESENTATION_DISPLAY_LABELS = Object.fromEntries(
  PRESENTATION_PRIMARY_VALUES.map(value => [value, PRESENTATION_PRIMARY_CONFIG[value].label])
) as Record<PresentationPrimary, string>;

export type CanonicalPresentationPrimary = PresentationPrimary;
export const CANONICAL_PRIMARY_VALUES = PRESENTATION_PRIMARY_VALUES;

// =============================================================================
// relationship
// =============================================================================
export const RELATIONSHIP_VALUES = ["spouse", "parent", "sibling", "child", "friend", "other"] as const;

export type Relationship = (typeof RELATIONSHIP_VALUES)[number];

export const RELATIONSHIP_CONFIG: Record<Relationship, { label: string }> = {
  "spouse": { label: "Spouse" },
  "parent": { label: "Parent" },
  "sibling": { label: "Sibling" },
  "child": { label: "Child" },
  "friend": { label: "Friend" },
  "other": { label: "Other" },
};

export const RELATIONSHIP_OPTIONS = RELATIONSHIP_VALUES.map(value => ({
  value,
  label: RELATIONSHIP_CONFIG[value].label,
}));

export const RELATIONSHIP_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Relationships" },
  ...RELATIONSHIP_OPTIONS,
];

// =============================================================================
// result
// =============================================================================
export const RESULT_STATUS_VALUES = ["normal", "high", "low", "critical", "critical-high", "critical-low"] as const;

export type ResultStatus = (typeof RESULT_STATUS_VALUES)[number];

export const RESULT_STATUS_CONFIG: Record<ResultStatus, { label: string }> = {
  "normal": { label: "Normal" },
  "high": { label: "High" },
  "low": { label: "Low" },
  "critical": { label: "Critical" },
  "critical-high": { label: "Critical High" },
  "critical-low": { label: "Critical Low" },
};

export const RESULT_STATUS_OPTIONS = RESULT_STATUS_VALUES.map(value => ({
  value,
  label: RESULT_STATUS_CONFIG[value].label,
}));

// =============================================================================
// sample
// =============================================================================
export const SAMPLE_STATUS_VALUES = ["pending", "collected", "rejected"] as const;

export type SampleStatus = (typeof SAMPLE_STATUS_VALUES)[number];

export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, { label: string }> = {
  "pending": { label: "Pending" },
  "collected": { label: "Collected" },
  "rejected": { label: "Rejected" },
};

export const SAMPLE_STATUS_OPTIONS = SAMPLE_STATUS_VALUES.map(value => ({
  value,
  label: SAMPLE_STATUS_CONFIG[value].label,
}));

export const SAMPLE_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Status" },
  ...SAMPLE_STATUS_OPTIONS,
];

export const SAMPLE_TYPE_VALUES = ["blood", "urine", "stool", "saliva", "swab", "tissue", "sputum", "csf", "pleural_fluid", "serum", "plasma", "other"] as const;

export type SampleType = (typeof SAMPLE_TYPE_VALUES)[number];

export const SAMPLE_TYPE_CONFIG: Record<SampleType, { label: string; isDerived: boolean; collectionSource?: SampleType }> = {
  "blood": { label: "Blood", isDerived: false },
  "urine": { label: "Urine", isDerived: false },
  "stool": { label: "Stool", isDerived: false },
  "saliva": { label: "Saliva", isDerived: false },
  "swab": { label: "Swab", isDerived: false },
  "tissue": { label: "Tissue", isDerived: false },
  "sputum": { label: "Sputum", isDerived: false },
  "csf": { label: "CSF", isDerived: false },
  "pleural_fluid": { label: "Pleural Fluid", isDerived: false },
  "serum": { label: "Serum", isDerived: true, collectionSource: "blood" },
  "plasma": { label: "Plasma", isDerived: true, collectionSource: "blood" },
  "other": { label: "Other", isDerived: false },
};

export const SAMPLE_TYPE_OPTIONS = SAMPLE_TYPE_VALUES.map(value => ({
  value,
  label: SAMPLE_TYPE_CONFIG[value].label,
}));

export const SAMPLE_TYPE_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Sample Types" },
  ...SAMPLE_TYPE_OPTIONS,
];

export const BASE_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  type => !SAMPLE_TYPE_CONFIG[type].isDerived
);

export const DERIVED_SAMPLE_TYPES = SAMPLE_TYPE_VALUES.filter(
  type => SAMPLE_TYPE_CONFIG[type].isDerived
);

// =============================================================================
// test
// =============================================================================
export const TEST_STATUS_VALUES = ["pending", "sample-collected", "resulted", "validated", "cancelled", "escalated", "superseded", "removed"] as const;

export type TestStatus = (typeof TEST_STATUS_VALUES)[number];

export const TEST_STATUS_CONFIG: Record<TestStatus, { label: string }> = {
  "pending": { label: "Pending" },
  "sample-collected": { label: "Sample Collected" },
  "resulted": { label: "Resulted" },
  "validated": { label: "Validated" },
  "cancelled": { label: "Cancelled" },
  "escalated": { label: "Escalated" },
  "superseded": { label: "Superseded" },
  "removed": { label: "Removed" },
};

export const TEST_STATUS_OPTIONS = TEST_STATUS_VALUES.map(value => ({
  value,
  label: TEST_STATUS_CONFIG[value].label,
}));

export const TEST_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Status" },
  ...TEST_STATUS_OPTIONS,
];

// =============================================================================
// user
// =============================================================================
export const USER_ROLE_VALUES = ["administrator", "receptionist", "lab-technician", "lab-technician-plus"] as const;

export type UserRole = (typeof USER_ROLE_VALUES)[number];

export const USER_ROLE_CONFIG: Record<UserRole, { label: string; description: string }> = {
  "administrator": { label: "Administrator", description: "Full system access" },
  "receptionist": { label: "Receptionist", description: "Front desk and patient registration" },
  "lab-technician": { label: "Lab Technician", description: "Sample collection and processing" },
  "lab-technician-plus": { label: "Lab Tech Plus", description: "Extended lab access including result validation" },
};

export const USER_ROLE_OPTIONS = USER_ROLE_VALUES.map(value => ({
  value,
  label: USER_ROLE_CONFIG[value].label,
}));

export const ALL_ROLES = [...USER_ROLE_VALUES] as UserRole[];

// =============================================================================
// validation
// =============================================================================
export const VALIDATION_DECISION_VALUES = ["approved", "rejected"] as const;

export type ValidationDecision = (typeof VALIDATION_DECISION_VALUES)[number];

export const VALIDATION_DECISION_CONFIG: Record<ValidationDecision, { label: string }> = {
  "approved": { label: "Approved" },
  "rejected": { label: "Rejected" },
};

export const VALIDATION_DECISION_OPTIONS = VALIDATION_DECISION_VALUES.map(value => ({
  value,
  label: VALIDATION_DECISION_CONFIG[value].label,
}));
