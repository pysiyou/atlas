/** GENERATED from contracts/enums.json. DO NOT EDIT. */
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

