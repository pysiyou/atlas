/**
 * Rejection reason registry — GENERATED from contracts/rejection-reasons.json. DO NOT EDIT.
 */

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
