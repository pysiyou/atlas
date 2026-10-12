/**
 * Lab attention reason vocabulary — GENERATED from contracts/lab-blockers.json. DO NOT EDIT.
 */
export const ATTENTION_REASON_KEYS = [
  "payment_unpaid",
  "sample_rejected",
  "critical_value",
  "amendment_pending",
  "retry_limit",
  "recollection_limit",
  "supervisor_review",
  "recollection_approval",
] as const;

export const BLOCKS_PROGRESS_REASONS = new Set<string>(["payment_unpaid", "sample_rejected", "critical_value", "amendment_pending", "retry_limit", "recollection_limit", "supervisor_review", "recollection_approval"]);

export function reasonBlocksProgress(reason: string | null | undefined): boolean {
  return reason != null && BLOCKS_PROGRESS_REASONS.has(reason);
}

export type LabAttentionReason = "payment_unpaid" | "sample_rejected" | "critical_value" | "amendment_pending" | "retry_limit" | "recollection_limit" | "supervisor_review" | "recollection_approval";

/** @deprecated Use LabAttentionReason */
export type OrderTestBlockReason = LabAttentionReason;

export const ATTENTION_LABELS: Record<LabAttentionReason, string> = {
  "payment_unpaid": "Payment required",
  "sample_rejected": "Sample rejected",
  "critical_value": "Critical value — supervisor review",
  "amendment_pending": "Amendment pending",
  "retry_limit": "Re-test limit reached",
  "recollection_limit": "Recollection limit reached",
  "supervisor_review": "Supervisor approval required",
  "recollection_approval": "Recollection awaiting supervisor approval",
};

/** @deprecated Use ATTENTION_LABELS */
export const BLOCKED_LABELS = ATTENTION_LABELS;

export const ATTENTION_ATTENTION_TYPE: Partial<Record<LabAttentionReason, string>> = {
  "payment_unpaid": "payment_blocked",
  "sample_rejected": "sample_rejected",
  "critical_value": "escalation_critical",
  "amendment_pending": "escalation_amendment",
  "retry_limit": "escalation_retry_limit",
  "recollection_limit": "escalation_recollection_limit",
  "supervisor_review": "supervisor_approval",
  "recollection_approval": "supervisor_recollection_request",
};

/** @deprecated Use ATTENTION_ATTENTION_TYPE */
export const BLOCKED_ATTENTION_TYPE = ATTENTION_ATTENTION_TYPE;

export const ALLOWED_ACTION_KEYS = ["collect","enterResults","validate","reject"] as const;

export const PIPELINE_STAGES = ["collection","entry","validation","escalation","completed","cancelled"] as const;

export const ATTENTION_TYPE_SORT: Record<string, number> = {
  "escalation_critical": 10,
  "escalation_amendment": 20,
  "escalation_retry_limit": 30,
  "escalation_recollection_limit": 40,
  "supervisor_approval": 45,
  "supervisor_recollection_request": 48,
  "payment_blocked": 50,
  "sample_rejected": 60,
  "priority_urgent": 82,
  "priority_high": 84,
  "queue_overdue_critical": 90,
  "queue_overdue_warning": 100
};

export const SUPERVISOR_ATTENTION_TYPES = ["escalation_critical","escalation_amendment","escalation_retry_limit","escalation_recollection_limit","supervisor_approval","supervisor_recollection_request"] as const;

export const PRIORITY_ATTENTION_TYPES = ["priority_urgent","priority_high"] as const;
