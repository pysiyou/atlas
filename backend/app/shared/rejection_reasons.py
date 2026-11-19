"""
Rejection reason registry — GENERATED from contracts/rejection-specimen.json + rejection-analytical.json
and result-rejection-reasons.json. DO NOT EDIT.

Each reason: id, code, label, domain (specimen | analytical).
"""
from __future__ import annotations

from typing import Literal, TypedDict

RejectionDomain = Literal["specimen", "analytical"]


class RejectionReasonDef(TypedDict):
    id: str
    code: str
    label: str
    domain: RejectionDomain


REJECTION_REASONS_BY_ID: dict[str, RejectionReasonDef] = {
    "abnormal": {"id": "abnormal", "code": "abnormal", "label": "Result interpretation is abnormal versus reference", "domain": "analytical"},
    "analytical_range_failed": {"id": "analytical_range_failed", "code": "analytical_range_failed", "label": "Result outside analytical measurement range", "domain": "analytical"},
    "anticoagulant_therapy": {"id": "anticoagulant_therapy", "code": "anticoagulant_therapy", "label": "Patient on anticoagulant medication therapy", "domain": "analytical"},
    "assay_interference": {"id": "assay_interference", "code": "assay_interference", "label": "Preanalytical factor causing assay interference", "domain": "specimen"},
    "associated_order_unverified": {"id": "associated_order_unverified", "code": "associated_order_unverified", "label": "Associated test or order is not verified", "domain": "analytical"},
    "clotted_layered": {"id": "clotted_layered", "code": "clotted_layered", "label": "Specimen is clotted or visibly layered", "domain": "specimen"},
    "collected_too_early": {"id": "collected_too_early", "code": "collected_too_early", "label": "Sample collected before acceptable time window", "domain": "specimen"},
    "consistency_failed": {"id": "consistency_failed", "code": "consistency_failed", "label": "Result failed internal consistency checking rules", "domain": "analytical"},
    "critical_abnormal": {"id": "critical_abnormal", "code": "critical_abnormal", "label": "Critical abnormal interpretation requiring urgent review", "domain": "analytical"},
    "critical_high": {"id": "critical_high", "code": "critical_high", "label": "Critical high value requiring urgent clinical review", "domain": "analytical"},
    "critical_low": {"id": "critical_low", "code": "critical_low", "label": "Critical low value requiring urgent clinical review", "domain": "analytical"},
    "damaged_transport": {"id": "damaged_transport", "code": "damaged_transport", "label": "Specimen was damaged during transport", "domain": "specimen"},
    "delta_check_failed": {"id": "delta_check_failed", "code": "delta_check_failed", "label": "Patient delta check limit exceeded on review", "domain": "analytical"},
    "demographics_incomplete": {"id": "demographics_incomplete", "code": "demographics_incomplete", "label": "Patient demographic information is incomplete", "domain": "specimen"},
    "demographics_mismatch": {"id": "demographics_mismatch", "code": "demographics_mismatch", "label": "Paper demographics do not match electronic record", "domain": "specimen"},
    "diluted": {"id": "diluted", "code": "diluted", "label": "Specimen appears dilute for intended testing", "domain": "specimen"},
    "diluted_discolored": {"id": "diluted_discolored", "code": "diluted_discolored", "label": "Specimen is diluted, discolored, or contaminated", "domain": "specimen"},
    "duplicate_assay": {"id": "duplicate_assay", "code": "duplicate_assay", "label": "Duplicate assay order or result was detected", "domain": "analytical"},
    "equivocal": {"id": "equivocal", "code": "equivocal", "label": "Result is equivocal and requires further review", "domain": "analytical"},
    "expired_filter_paper": {"id": "expired_filter_paper", "code": "expired_filter_paper", "label": "Specimen collected on expired filter paper", "domain": "specimen"},
    "failed_feasible_range": {"id": "failed_feasible_range", "code": "failed_feasible_range", "label": "Result outside instrument feasible reportable range", "domain": "analytical"},
    "hemolyzed": {"id": "hemolyzed", "code": "hemolyzed", "label": "Specimen is hemolyzed affecting analyte integrity", "domain": "specimen"},
    "high": {"id": "high", "code": "high", "label": "Result is high versus laboratory reference interval", "domain": "analytical"},
    "hl7v2_specimen_condition": {"id": "hl7v2_specimen_condition", "code": "hl7v2_specimen_condition", "label": "Condition per HL7v2 specimen condition codes", "domain": "specimen"},
    "icteric": {"id": "icteric", "code": "icteric", "label": "Specimen is icteric with bilirubin interference", "domain": "specimen"},
    "incomplete_circles_dbs": {"id": "incomplete_circles_dbs", "code": "incomplete_circles_dbs", "label": "DBS specimen circles not completely filled", "domain": "specimen"},
    "indeterminate": {"id": "indeterminate", "code": "indeterminate", "label": "Result interpretation remains indeterminate on review", "domain": "analytical"},
    "instrument_error": {"id": "instrument_error", "code": "instrument_error", "label": "Analyzer reported an instrument or system error", "domain": "analytical"},
    "insufficient_saturation_dbs": {"id": "insufficient_saturation_dbs", "code": "insufficient_saturation_dbs", "label": "DBS blood did not soak through filter paper", "domain": "specimen"},
    "interference": {"id": "interference", "code": "interference", "label": "Analytical interference is suspected on this result", "domain": "analytical"},
    "ivig_past_month": {"id": "ivig_past_month", "code": "ivig_past_month", "label": "IVIG infusion received within the past month", "domain": "analytical"},
    "lab_accident": {"id": "lab_accident", "code": "lab_accident", "label": "Analysis prevented by laboratory processing accident", "domain": "specimen"},
    "lactescent": {"id": "lactescent", "code": "lactescent", "label": "Specimen is lactescent or visibly lipemic", "domain": "specimen"},
    "language_issue": {"id": "language_issue", "code": "language_issue", "label": "Collection hindered by language or communication barrier", "domain": "specimen"},
    "low": {"id": "low", "code": "low", "label": "Result is low versus laboratory reference interval", "domain": "analytical"},
    "medical_review_hold": {"id": "medical_review_hold", "code": "medical_review_hold", "label": "Result held pending physician medical review", "domain": "analytical"},
    "multiple_blood_sources_dbs": {"id": "multiple_blood_sources_dbs", "code": "multiple_blood_sources_dbs", "label": "Multiple blood sources detected on filter card", "domain": "specimen"},
    "no_blood": {"id": "no_blood", "code": "no_blood", "label": "No blood present in collection device", "domain": "specimen"},
    "no_sample_received": {"id": "no_sample_received", "code": "no_sample_received", "label": "No physical sample was received", "domain": "specimen"},
    "no_time": {"id": "no_time", "code": "no_time", "label": "Collection not completed due to time constraints", "domain": "specimen"},
    "not_dry_mailing": {"id": "not_dry_mailing", "code": "not_dry_mailing", "label": "Specimen was not dry before mailing", "domain": "specimen"},
    "not_eluting": {"id": "not_eluting", "code": "not_eluting", "label": "Specimen material is not eluting properly", "domain": "specimen"},
    "off_scale_high": {"id": "off_scale_high", "code": "off_scale_high", "label": "Result above measurable high reportable limit", "domain": "analytical"},
    "off_scale_low": {"id": "off_scale_low", "code": "off_scale_low", "label": "Result below measurable low reportable limit", "domain": "analytical"},
    "other": {"id": "other", "code": "other", "label": "Other specimen rejection reason not listed", "domain": "specimen"},
    "other_analytical": {"id": "other_analytical", "code": "other_analytical", "label": "Other analytical rejection reason not listed", "domain": "analytical"},
    "panic_value": {"id": "panic_value", "code": "panic_value", "label": "Panic range value needs immediate clinical attention", "domain": "analytical"},
    "participant_ill": {"id": "participant_ill", "code": "participant_ill", "label": "Collection deferred due to illness or emergency", "domain": "specimen"},
    "patient_refused": {"id": "patient_refused", "code": "patient_refused", "label": "Patient refused to provide a specimen", "domain": "specimen"},
    "phvs_specimen_reject": {"id": "phvs_specimen_reject", "code": "phvs_specimen_reject", "label": "Reason per CDC PHVS HL7v2 reject value set", "domain": "specimen"},
    "physical_limitation": {"id": "physical_limitation", "code": "physical_limitation", "label": "Collection not completed due to physical limitation", "domain": "specimen"},
    "platelet_transfusion_3d": {"id": "platelet_transfusion_3d", "code": "platelet_transfusion_3d", "label": "Platelet transfusion within the last three days", "domain": "analytical"},
    "previous_result": {"id": "previous_result", "code": "previous_result", "label": "Prior performed result conflicts with current testing", "domain": "analytical"},
    "qc_failure": {"id": "qc_failure", "code": "qc_failure", "label": "Quality control run failed for this assay", "domain": "analytical"},
    "qc_not_in_control": {"id": "qc_not_in_control", "code": "qc_not_in_control", "label": "Quality control is out of statistical control", "domain": "analytical"},
    "qc_overdue": {"id": "qc_overdue", "code": "qc_overdue", "label": "Required quality control testing is overdue", "domain": "analytical"},
    "reference_range_failed": {"id": "reference_range_failed", "code": "reference_range_failed", "label": "Result failed configured reference range rules", "domain": "analytical"},
    "rejected": {"id": "rejected", "code": "rejected", "label": "Specimen rejected without further specification", "domain": "specimen"},
    "results_inconsistent": {"id": "results_inconsistent", "code": "results_inconsistent", "label": "Prior specimen results appear inconsistent", "domain": "specimen"},
    "review_range_failed": {"id": "review_range_failed", "code": "review_range_failed", "label": "Result failed configured manual review range", "domain": "analytical"},
    "review_required": {"id": "review_required", "code": "review_required", "label": "Manual technologist clinical review is required", "domain": "analytical"},
    "sample_too_old": {"id": "sample_too_old", "code": "sample_too_old", "label": "Sample exceeds acceptable stability limits", "domain": "specimen"},
    "scratched_abraded": {"id": "scratched_abraded", "code": "scratched_abraded", "label": "Specimen surface is scratched or abraded", "domain": "specimen"},
    "sealed_plastic_container": {"id": "sealed_plastic_container", "code": "sealed_plastic_container", "label": "Specimen arrived in sealed plastic container", "domain": "specimen"},
    "serial_mismatch": {"id": "serial_mismatch", "code": "serial_mismatch", "label": "Filter paper serial number does not match form", "domain": "specimen"},
    "serum_rings": {"id": "serum_rings", "code": "serum_rings", "label": "Specimen shows visible serum separation rings", "domain": "specimen"},
    "significant_change_down": {"id": "significant_change_down", "code": "significant_change_down", "label": "Significant decrease versus prior patient result", "domain": "analytical"},
    "significant_change_up": {"id": "significant_change_up", "code": "significant_change_up", "label": "Significant increase versus prior patient result", "domain": "analytical"},
    "significantly_high": {"id": "significantly_high", "code": "significantly_high", "label": "Result is markedly high needing clinical attention", "domain": "analytical"},
    "significantly_low": {"id": "significantly_low", "code": "significantly_low", "label": "Result is markedly low needing clinical attention", "domain": "analytical"},
    "steroid_treatment": {"id": "steroid_treatment", "code": "steroid_treatment", "label": "Recent steroid therapy may affect results", "domain": "analytical"},
    "supersaturated": {"id": "supersaturated", "code": "supersaturated", "label": "Specimen appears supersaturated on medium", "domain": "specimen"},
    "supplemental_oxygen": {"id": "supplemental_oxygen", "code": "supplemental_oxygen", "label": "Patient receiving supplemental oxygen therapy", "domain": "analytical"},
    "supplies_failed": {"id": "supplies_failed", "code": "supplies_failed", "label": "Collection supplies failed or malfunctioned", "domain": "specimen"},
    "transit_delay": {"id": "transit_delay", "code": "transit_delay", "label": "Specimen compromised by excessive transit delay", "domain": "specimen"},
    "uneven_saturation": {"id": "uneven_saturation", "code": "uneven_saturation", "label": "Filter paper has uneven blood saturation", "domain": "specimen"},
    "unsuitable_other": {"id": "unsuitable_other", "code": "unsuitable_other", "label": "Unsuitable specimen for other documented reasons", "domain": "specimen"},
}

REJECTION_REASON_BY_ID: dict[str, str] = {
    "abnormal": "Result interpretation is abnormal versus reference",
    "analytical_range_failed": "Result outside analytical measurement range",
    "anticoagulant_therapy": "Patient on anticoagulant medication therapy",
    "assay_interference": "Preanalytical factor causing assay interference",
    "associated_order_unverified": "Associated test or order is not verified",
    "clotted_layered": "Specimen is clotted or visibly layered",
    "collected_too_early": "Sample collected before acceptable time window",
    "consistency_failed": "Result failed internal consistency checking rules",
    "critical_abnormal": "Critical abnormal interpretation requiring urgent review",
    "critical_high": "Critical high value requiring urgent clinical review",
    "critical_low": "Critical low value requiring urgent clinical review",
    "damaged_transport": "Specimen was damaged during transport",
    "delta_check_failed": "Patient delta check limit exceeded on review",
    "demographics_incomplete": "Patient demographic information is incomplete",
    "demographics_mismatch": "Paper demographics do not match electronic record",
    "diluted": "Specimen appears dilute for intended testing",
    "diluted_discolored": "Specimen is diluted, discolored, or contaminated",
    "duplicate_assay": "Duplicate assay order or result was detected",
    "equivocal": "Result is equivocal and requires further review",
    "expired_filter_paper": "Specimen collected on expired filter paper",
    "failed_feasible_range": "Result outside instrument feasible reportable range",
    "hemolyzed": "Specimen is hemolyzed affecting analyte integrity",
    "high": "Result is high versus laboratory reference interval",
    "hl7v2_specimen_condition": "Condition per HL7v2 specimen condition codes",
    "icteric": "Specimen is icteric with bilirubin interference",
    "incomplete_circles_dbs": "DBS specimen circles not completely filled",
    "indeterminate": "Result interpretation remains indeterminate on review",
    "instrument_error": "Analyzer reported an instrument or system error",
    "insufficient_saturation_dbs": "DBS blood did not soak through filter paper",
    "interference": "Analytical interference is suspected on this result",
    "ivig_past_month": "IVIG infusion received within the past month",
    "lab_accident": "Analysis prevented by laboratory processing accident",
    "lactescent": "Specimen is lactescent or visibly lipemic",
    "language_issue": "Collection hindered by language or communication barrier",
    "low": "Result is low versus laboratory reference interval",
    "medical_review_hold": "Result held pending physician medical review",
    "multiple_blood_sources_dbs": "Multiple blood sources detected on filter card",
    "no_blood": "No blood present in collection device",
    "no_sample_received": "No physical sample was received",
    "no_time": "Collection not completed due to time constraints",
    "not_dry_mailing": "Specimen was not dry before mailing",
    "not_eluting": "Specimen material is not eluting properly",
    "off_scale_high": "Result above measurable high reportable limit",
    "off_scale_low": "Result below measurable low reportable limit",
    "other": "Other specimen rejection reason not listed",
    "other_analytical": "Other analytical rejection reason not listed",
    "panic_value": "Panic range value needs immediate clinical attention",
    "participant_ill": "Collection deferred due to illness or emergency",
    "patient_refused": "Patient refused to provide a specimen",
    "phvs_specimen_reject": "Reason per CDC PHVS HL7v2 reject value set",
    "physical_limitation": "Collection not completed due to physical limitation",
    "platelet_transfusion_3d": "Platelet transfusion within the last three days",
    "previous_result": "Prior performed result conflicts with current testing",
    "qc_failure": "Quality control run failed for this assay",
    "qc_not_in_control": "Quality control is out of statistical control",
    "qc_overdue": "Required quality control testing is overdue",
    "reference_range_failed": "Result failed configured reference range rules",
    "rejected": "Specimen rejected without further specification",
    "results_inconsistent": "Prior specimen results appear inconsistent",
    "review_range_failed": "Result failed configured manual review range",
    "review_required": "Manual technologist clinical review is required",
    "sample_too_old": "Sample exceeds acceptable stability limits",
    "scratched_abraded": "Specimen surface is scratched or abraded",
    "sealed_plastic_container": "Specimen arrived in sealed plastic container",
    "serial_mismatch": "Filter paper serial number does not match form",
    "serum_rings": "Specimen shows visible serum separation rings",
    "significant_change_down": "Significant decrease versus prior patient result",
    "significant_change_up": "Significant increase versus prior patient result",
    "significantly_high": "Result is markedly high needing clinical attention",
    "significantly_low": "Result is markedly low needing clinical attention",
    "steroid_treatment": "Recent steroid therapy may affect results",
    "supersaturated": "Specimen appears supersaturated on medium",
    "supplemental_oxygen": "Patient receiving supplemental oxygen therapy",
    "supplies_failed": "Collection supplies failed or malfunctioned",
    "transit_delay": "Specimen compromised by excessive transit delay",
    "uneven_saturation": "Filter paper has uneven blood saturation",
    "unsuitable_other": "Unsuitable specimen for other documented reasons",
}

REJECTION_REASON_LABELS: frozenset[str] = frozenset(REJECTION_REASON_BY_ID.values())

REJECTION_REASON_DOMAIN_BY_ID: dict[str, str] = {
    "abnormal": "analytical",
    "analytical_range_failed": "analytical",
    "anticoagulant_therapy": "analytical",
    "assay_interference": "specimen",
    "associated_order_unverified": "analytical",
    "clotted_layered": "specimen",
    "collected_too_early": "specimen",
    "consistency_failed": "analytical",
    "critical_abnormal": "analytical",
    "critical_high": "analytical",
    "critical_low": "analytical",
    "damaged_transport": "specimen",
    "delta_check_failed": "analytical",
    "demographics_incomplete": "specimen",
    "demographics_mismatch": "specimen",
    "diluted": "specimen",
    "diluted_discolored": "specimen",
    "duplicate_assay": "analytical",
    "equivocal": "analytical",
    "expired_filter_paper": "specimen",
    "failed_feasible_range": "analytical",
    "hemolyzed": "specimen",
    "high": "analytical",
    "hl7v2_specimen_condition": "specimen",
    "icteric": "specimen",
    "incomplete_circles_dbs": "specimen",
    "indeterminate": "analytical",
    "instrument_error": "analytical",
    "insufficient_saturation_dbs": "specimen",
    "interference": "analytical",
    "ivig_past_month": "analytical",
    "lab_accident": "specimen",
    "lactescent": "specimen",
    "language_issue": "specimen",
    "low": "analytical",
    "medical_review_hold": "analytical",
    "multiple_blood_sources_dbs": "specimen",
    "no_blood": "specimen",
    "no_sample_received": "specimen",
    "no_time": "specimen",
    "not_dry_mailing": "specimen",
    "not_eluting": "specimen",
    "off_scale_high": "analytical",
    "off_scale_low": "analytical",
    "other": "specimen",
    "other_analytical": "analytical",
    "panic_value": "analytical",
    "participant_ill": "specimen",
    "patient_refused": "specimen",
    "phvs_specimen_reject": "specimen",
    "physical_limitation": "specimen",
    "platelet_transfusion_3d": "analytical",
    "previous_result": "analytical",
    "qc_failure": "analytical",
    "qc_not_in_control": "analytical",
    "qc_overdue": "analytical",
    "reference_range_failed": "analytical",
    "rejected": "specimen",
    "results_inconsistent": "specimen",
    "review_range_failed": "analytical",
    "review_required": "analytical",
    "sample_too_old": "specimen",
    "scratched_abraded": "specimen",
    "sealed_plastic_container": "specimen",
    "serial_mismatch": "specimen",
    "serum_rings": "specimen",
    "significant_change_down": "analytical",
    "significant_change_up": "analytical",
    "significantly_high": "analytical",
    "significantly_low": "analytical",
    "steroid_treatment": "analytical",
    "supersaturated": "specimen",
    "supplemental_oxygen": "analytical",
    "supplies_failed": "specimen",
    "transit_delay": "specimen",
    "uneven_saturation": "specimen",
    "unsuitable_other": "specimen",
}

SPECIMEN_REASON_IDS: frozenset[str] = frozenset(
    rid for rid, row in REJECTION_REASONS_BY_ID.items() if row["domain"] == "specimen"
)

ANALYTICAL_REASON_IDS: frozenset[str] = frozenset(
    rid for rid, row in REJECTION_REASONS_BY_ID.items() if row["domain"] == "analytical"
)

_ID_BY_LABEL: dict[str, str] = {label: rid for rid, label in REJECTION_REASON_BY_ID.items()}


def resolve_rejection_reason_label(value: str) -> str:
    """Resolve registry id or canonical label to display label."""
    stripped = (value or "").strip()
    if not stripped:
        return stripped
    if stripped in REJECTION_REASON_BY_ID:
        return REJECTION_REASON_BY_ID[stripped]
    if stripped in REJECTION_REASON_LABELS:
        return stripped
    return stripped.replace("_", " ")


def rejection_reason_domain(value: str) -> str | None:
    """Return specimen | analytical for registry id or canonical label."""
    stripped = (value or "").strip()
    if not stripped:
        return None
    if stripped in REJECTION_REASON_DOMAIN_BY_ID:
        return REJECTION_REASON_DOMAIN_BY_ID[stripped]
    rid = _ID_BY_LABEL.get(stripped)
    if rid:
        return REJECTION_REASON_DOMAIN_BY_ID[rid]
    return None


def is_specimen_rejection_registry_value(value: str) -> bool:
    domain = rejection_reason_domain(value)
    return domain == "specimen"
