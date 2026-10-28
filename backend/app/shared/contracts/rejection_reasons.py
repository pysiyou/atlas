"""
Rejection reason registry — GENERATED from contracts/rejection-reasons.json. DO NOT EDIT.
"""
from __future__ import annotations

REJECTION_REASON_BY_ID: dict[str, str] = {
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
}

REJECTION_REASON_LABELS: frozenset[str] = frozenset(REJECTION_REASON_BY_ID.values())

REJECTION_REASON_DOMAIN_BY_ID: dict[str, str] = {
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
}

SPECIMEN_REASON_IDS: frozenset[str] = frozenset(
    {
        "clotted",
        "contaminated",
        "hemolyzed_mild",
        "hemolyzed_moderate",
        "hemolyzed_severe",
        "icteric",
        "wrong_container",
        "qns",
        "lipemic",
        "labeling_error_mismatch",
        "transport_delay",
        "labeling_error_unlabeled",
    }
)

LEGACY_ENUM_WIRE_BY_ID: dict[str, str] = {
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
}

_ID_BY_LABEL: dict[str, str] = {label: rid for rid, label in REJECTION_REASON_BY_ID.items()}


def resolve_rejection_reason_label(value: str) -> str:
    """Resolve registry id, canonical label, or legacy enum wire to display label."""
    stripped = (value or "").strip()
    if not stripped:
        return stripped
    if stripped in REJECTION_REASON_BY_ID:
        return REJECTION_REASON_BY_ID[stripped]
    if stripped in REJECTION_REASON_LABELS:
        return stripped
    for rid, wire in LEGACY_ENUM_WIRE_BY_ID.items():
        if stripped == wire:
            return REJECTION_REASON_BY_ID[rid]
    return stripped.replace("_", " ")


def rejection_reason_domain(value: str) -> str | None:
    """Return specimen | analytical for id, label, or legacy enum wire."""
    stripped = (value or "").strip()
    if not stripped:
        return None
    if stripped in REJECTION_REASON_DOMAIN_BY_ID:
        return REJECTION_REASON_DOMAIN_BY_ID[stripped]
    rid = _ID_BY_LABEL.get(stripped)
    if rid:
        return REJECTION_REASON_DOMAIN_BY_ID[rid]
    for rid, wire in LEGACY_ENUM_WIRE_BY_ID.items():
        if stripped == wire:
            return REJECTION_REASON_DOMAIN_BY_ID[rid]
    return None


def is_specimen_rejection_registry_value(value: str) -> bool:
    domain = rejection_reason_domain(value)
    return domain == "specimen"
