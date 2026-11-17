/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:rejection */

export type RejectionDomain = 'specimen' | 'analytical';

export interface RejectionReasonDef {
  id: string;
  code: string;
  label: string;
  domain: RejectionDomain;
  description?: string;
  category?: string;
  stage?: string;
  requires_recollection?: boolean;
  blocks_autoverification?: boolean;
}

export const REJECTION_REASONS_BY_ID: Readonly<Record<string, RejectionReasonDef>> = {
  "anticoagulant_therapy": {"id":"anticoagulant_therapy","code":"anticoagulant_therapy","label":"Anticoagulant therapy","domain":"analytical","stage":"linearity_interference","blocks_autoverification":true},
  "assay_interference": {"id":"assay_interference","code":"assay_interference","label":"Assay interference","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "collection_supplies_malfunctioned": {"id":"collection_supplies_malfunctioned","code":"collection_supplies_malfunctioned","label":"Collection supplies malfunctioned","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "demographic_information_is_incomplete_or_invalid": {"id":"demographic_information_is_incomplete_or_invalid","code":"demographic_information_is_incomplete_or_invalid","label":"Demographic information is incomplete or invalid","domain":"specimen","category":"identification_labeling","requires_recollection":true},
  "demographic_information_on_filter_paper_does_not_match_electronically_submitted_information": {"id":"demographic_information_on_filter_paper_does_not_match_electronically_submitted_information","code":"demographic_information_on_filter_paper_does_not_match_electronically_submitted_information","label":"Demographic information on filter paper does not match electronically submitted information","domain":"specimen","category":"identification_labeling","requires_recollection":true},
  "diluted": {"id":"diluted","code":"diluted","label":"Diluted","domain":"specimen","category":"serum_index","requires_recollection":true},
  "hemolyzed": {"id":"hemolyzed","code":"hemolyzed","label":"Hemolyzed","domain":"specimen","category":"serum_index","requires_recollection":true},
  "icteric": {"id":"icteric","code":"icteric","label":"Icteric","domain":"specimen","category":"serum_index","requires_recollection":true},
  "ivig_therapy_in_the_past_month": {"id":"ivig_therapy_in_the_past_month","code":"ivig_therapy_in_the_past_month","label":"IVIG therapy in the past month","domain":"analytical","stage":"linearity_interference","blocks_autoverification":true},
  "lactescent": {"id":"lactescent","code":"lactescent","label":"Lactescent","domain":"specimen","category":"serum_index","requires_recollection":true},
  "language_issue": {"id":"language_issue","code":"language_issue","label":"Language issue","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "no_blood": {"id":"no_blood","code":"no_blood","label":"No blood","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "no_sample_received": {"id":"no_sample_received","code":"no_sample_received","label":"No sample received","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "no_time": {"id":"no_time","code":"no_time","label":"No time","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "observationinterpretationcodes_hl7_fhir": {"id":"observationinterpretationcodes_hl7_fhir","code":"observationinterpretationcodes_hl7_fhir","label":"ObservationInterpretationCodes_HL7_FHIR","domain":"analytical","description":"LOINC external answer list LL5433-9; http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation","stage":"clinical_review","blocks_autoverification":true},
  "other": {"id":"other","code":"other","label":"Other","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "participant_ill_or_emergency": {"id":"participant_ill_or_emergency","code":"participant_ill_or_emergency","label":"Participant ill or emergency","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "patient_refused": {"id":"patient_refused","code":"patient_refused","label":"Patient refused","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "phvs_specimenrejectreason_hl7_2x": {"id":"phvs_specimenrejectreason_hl7_2x","code":"phvs_specimenrejectreason_hl7_2x","label":"PHVS_SpecimenRejectReason_HL7_2x","domain":"specimen","description":"LOINC external answer list LL5353-9; https://phinvads.cdc.gov/vads/ViewValueSet.action?oid=2.16.840.1.114222.4.11.1044","category":"specimen_integrity","requires_recollection":true},
  "physical_limitation": {"id":"physical_limitation","code":"physical_limitation","label":"Physical limitation","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "platelet_transfusion_in_the_last_3_days": {"id":"platelet_transfusion_in_the_last_3_days","code":"platelet_transfusion_in_the_last_3_days","label":"Platelet transfusion in the last 3 days","domain":"analytical","stage":"linearity_interference","blocks_autoverification":true},
  "rejected": {"id":"rejected","code":"rejected","label":"Rejected","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "sample_collected_too_early": {"id":"sample_collected_too_early","code":"sample_collected_too_early","label":"Sample collected too early","domain":"specimen","category":"stability_transport","requires_recollection":true},
  "sample_too_old": {"id":"sample_too_old","code":"sample_too_old","label":"Sample too old","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "serial_number_on_filter_paper_does_not_match_serial_number_on_patient_information_form": {"id":"serial_number_on_filter_paper_does_not_match_serial_number_on_patient_information_form","code":"serial_number_on_filter_paper_does_not_match_serial_number_on_patient_information_form","label":"Serial number on filter paper does not match serial number on patient information form","domain":"specimen","category":"identification_labeling","requires_recollection":true},
  "specimen_appears_clotted_or_layered": {"id":"specimen_appears_clotted_or_layered","code":"specimen_appears_clotted_or_layered","label":"Specimen appears clotted or layered","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "specimen_appears_diluted_discolored_or_contaminated": {"id":"specimen_appears_diluted_discolored_or_contaminated","code":"specimen_appears_diluted_discolored_or_contaminated","label":"Specimen appears diluted, discolored or contaminated","domain":"specimen","category":"serum_index","requires_recollection":true},
  "specimen_appears_scratched_or_abraded": {"id":"specimen_appears_scratched_or_abraded","code":"specimen_appears_scratched_or_abraded","label":"Specimen appears scratched or abraded","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "specimen_appears_supersaturated": {"id":"specimen_appears_supersaturated","code":"specimen_appears_supersaturated","label":"Specimen appears supersaturated","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "specimen_damaged_during_transport": {"id":"specimen_damaged_during_transport","code":"specimen_damaged_during_transport","label":"Specimen damaged during transport","domain":"specimen","category":"stability_transport","requires_recollection":true},
  "specimen_exhibits_serum_rings": {"id":"specimen_exhibits_serum_rings","code":"specimen_exhibits_serum_rings","label":"Specimen exhibits serum rings","domain":"specimen","category":"serum_index","requires_recollection":true},
  "specimen_has_uneven_saturation": {"id":"specimen_has_uneven_saturation","code":"specimen_has_uneven_saturation","label":"Specimen has uneven saturation","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "specimen_not_dry_before_mailing": {"id":"specimen_not_dry_before_mailing","code":"specimen_not_dry_before_mailing","label":"Specimen not dry before mailing","domain":"specimen","category":"stability_transport","requires_recollection":true},
  "specimen_not_eluting": {"id":"specimen_not_eluting","code":"specimen_not_eluting","label":"Specimen not eluting","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "specimen_quantity_insufficient_because_blood_did_not_completely_fill_specimen_circles": {"id":"specimen_quantity_insufficient_because_blood_did_not_completely_fill_specimen_circles","code":"specimen_quantity_insufficient_because_blood_did_not_completely_fill_specimen_circles","label":"Specimen quantity insufficient because blood did not completely fill specimen circles","domain":"specimen","category":"container_volume","requires_recollection":true},
  "specimen_quantity_insufficient_due_to_incomplete_saturation_blood_did_not_soak_through_paper": {"id":"specimen_quantity_insufficient_due_to_incomplete_saturation_blood_did_not_soak_through_paper","code":"specimen_quantity_insufficient_due_to_incomplete_saturation_blood_did_not_soak_through_paper","label":"Specimen quantity insufficient due to incomplete saturation (blood did not soak through paper)","domain":"specimen","category":"container_volume","requires_recollection":true},
  "specimen_received_in_sealed_plastic_container": {"id":"specimen_received_in_sealed_plastic_container","code":"specimen_received_in_sealed_plastic_container","label":"Specimen received in sealed plastic container","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "specimen_results_inconsistent": {"id":"specimen_results_inconsistent","code":"specimen_results_inconsistent","label":"Specimen results inconsistent","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "specimen_submitted_on_expired_filter_paper": {"id":"specimen_submitted_on_expired_filter_paper","code":"specimen_submitted_on_expired_filter_paper","label":"Specimen submitted on expired filter paper","domain":"specimen","category":"stability_transport","requires_recollection":true},
  "specimen_unsatisfactory_due_to_delay_in_transit": {"id":"specimen_unsatisfactory_due_to_delay_in_transit","code":"specimen_unsatisfactory_due_to_delay_in_transit","label":"Specimen unsatisfactory due to delay in transit","domain":"specimen","category":"stability_transport","requires_recollection":true},
  "specimencondition_hl7_2x": {"id":"specimencondition_hl7_2x","code":"specimencondition_hl7_2x","label":"SpecimenCondition_HL7_2x","domain":"specimen","description":"LOINC external answer list LL5347-1; http://terminology.hl7.org/ValueSet/v2-0493","category":"specimen_integrity","requires_recollection":true},
  "steroid_treatment": {"id":"steroid_treatment","code":"steroid_treatment","label":"Steroid treatment","domain":"analytical","stage":"linearity_interference","blocks_autoverification":true},
  "supplemental_oxygen": {"id":"supplemental_oxygen","code":"supplemental_oxygen","label":"Supplemental oxygen","domain":"analytical","stage":"linearity_interference","blocks_autoverification":true},
  "testing_of_this_specimen_indicates_more_than_one_source_of_blood_is_present_on_the_filter_paper_card": {"id":"testing_of_this_specimen_indicates_more_than_one_source_of_blood_is_present_on_the_filter_paper_card","code":"testing_of_this_specimen_indicates_more_than_one_source_of_blood_is_present_on_the_filter_paper_card","label":"Testing of this specimen indicates more than one source of blood is present on the filter paper card","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "unable_to_analyze_specimen_due_to_laboratory_accident": {"id":"unable_to_analyze_specimen_due_to_laboratory_accident","code":"unable_to_analyze_specimen_due_to_laboratory_accident","label":"Unable to analyze specimen due to laboratory accident","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
  "unsuitable_for_other_reasons": {"id":"unsuitable_for_other_reasons","code":"unsuitable_for_other_reasons","label":"Unsuitable for other reasons","domain":"specimen","category":"specimen_integrity","requires_recollection":true},
};

export const REJECTION_REASON_BY_ID: Readonly<Record<string, string>> = {
  "anticoagulant_therapy": "Anticoagulant therapy",
  "assay_interference": "Assay interference",
  "collection_supplies_malfunctioned": "Collection supplies malfunctioned",
  "demographic_information_is_incomplete_or_invalid": "Demographic information is incomplete or invalid",
  "demographic_information_on_filter_paper_does_not_match_electronically_submitted_information": "Demographic information on filter paper does not match electronically submitted information",
  "diluted": "Diluted",
  "hemolyzed": "Hemolyzed",
  "icteric": "Icteric",
  "ivig_therapy_in_the_past_month": "IVIG therapy in the past month",
  "lactescent": "Lactescent",
  "language_issue": "Language issue",
  "no_blood": "No blood",
  "no_sample_received": "No sample received",
  "no_time": "No time",
  "observationinterpretationcodes_hl7_fhir": "ObservationInterpretationCodes_HL7_FHIR",
  "other": "Other",
  "participant_ill_or_emergency": "Participant ill or emergency",
  "patient_refused": "Patient refused",
  "phvs_specimenrejectreason_hl7_2x": "PHVS_SpecimenRejectReason_HL7_2x",
  "physical_limitation": "Physical limitation",
  "platelet_transfusion_in_the_last_3_days": "Platelet transfusion in the last 3 days",
  "rejected": "Rejected",
  "sample_collected_too_early": "Sample collected too early",
  "sample_too_old": "Sample too old",
  "serial_number_on_filter_paper_does_not_match_serial_number_on_patient_information_form": "Serial number on filter paper does not match serial number on patient information form",
  "specimen_appears_clotted_or_layered": "Specimen appears clotted or layered",
  "specimen_appears_diluted_discolored_or_contaminated": "Specimen appears diluted, discolored or contaminated",
  "specimen_appears_scratched_or_abraded": "Specimen appears scratched or abraded",
  "specimen_appears_supersaturated": "Specimen appears supersaturated",
  "specimen_damaged_during_transport": "Specimen damaged during transport",
  "specimen_exhibits_serum_rings": "Specimen exhibits serum rings",
  "specimen_has_uneven_saturation": "Specimen has uneven saturation",
  "specimen_not_dry_before_mailing": "Specimen not dry before mailing",
  "specimen_not_eluting": "Specimen not eluting",
  "specimen_quantity_insufficient_because_blood_did_not_completely_fill_specimen_circles": "Specimen quantity insufficient because blood did not completely fill specimen circles",
  "specimen_quantity_insufficient_due_to_incomplete_saturation_blood_did_not_soak_through_paper": "Specimen quantity insufficient due to incomplete saturation (blood did not soak through paper)",
  "specimen_received_in_sealed_plastic_container": "Specimen received in sealed plastic container",
  "specimen_results_inconsistent": "Specimen results inconsistent",
  "specimen_submitted_on_expired_filter_paper": "Specimen submitted on expired filter paper",
  "specimen_unsatisfactory_due_to_delay_in_transit": "Specimen unsatisfactory due to delay in transit",
  "specimencondition_hl7_2x": "SpecimenCondition_HL7_2x",
  "steroid_treatment": "Steroid treatment",
  "supplemental_oxygen": "Supplemental oxygen",
  "testing_of_this_specimen_indicates_more_than_one_source_of_blood_is_present_on_the_filter_paper_card": "Testing of this specimen indicates more than one source of blood is present on the filter paper card",
  "unable_to_analyze_specimen_due_to_laboratory_accident": "Unable to analyze specimen due to laboratory accident",
  "unsuitable_for_other_reasons": "Unsuitable for other reasons",
};

export const REJECTION_REASON_DOMAIN_BY_ID: Readonly<Record<string, RejectionDomain>> = {
  "anticoagulant_therapy": "analytical",
  "assay_interference": "specimen",
  "collection_supplies_malfunctioned": "specimen",
  "demographic_information_is_incomplete_or_invalid": "specimen",
  "demographic_information_on_filter_paper_does_not_match_electronically_submitted_information": "specimen",
  "diluted": "specimen",
  "hemolyzed": "specimen",
  "icteric": "specimen",
  "ivig_therapy_in_the_past_month": "analytical",
  "lactescent": "specimen",
  "language_issue": "specimen",
  "no_blood": "specimen",
  "no_sample_received": "specimen",
  "no_time": "specimen",
  "observationinterpretationcodes_hl7_fhir": "analytical",
  "other": "specimen",
  "participant_ill_or_emergency": "specimen",
  "patient_refused": "specimen",
  "phvs_specimenrejectreason_hl7_2x": "specimen",
  "physical_limitation": "specimen",
  "platelet_transfusion_in_the_last_3_days": "analytical",
  "rejected": "specimen",
  "sample_collected_too_early": "specimen",
  "sample_too_old": "specimen",
  "serial_number_on_filter_paper_does_not_match_serial_number_on_patient_information_form": "specimen",
  "specimen_appears_clotted_or_layered": "specimen",
  "specimen_appears_diluted_discolored_or_contaminated": "specimen",
  "specimen_appears_scratched_or_abraded": "specimen",
  "specimen_appears_supersaturated": "specimen",
  "specimen_damaged_during_transport": "specimen",
  "specimen_exhibits_serum_rings": "specimen",
  "specimen_has_uneven_saturation": "specimen",
  "specimen_not_dry_before_mailing": "specimen",
  "specimen_not_eluting": "specimen",
  "specimen_quantity_insufficient_because_blood_did_not_completely_fill_specimen_circles": "specimen",
  "specimen_quantity_insufficient_due_to_incomplete_saturation_blood_did_not_soak_through_paper": "specimen",
  "specimen_received_in_sealed_plastic_container": "specimen",
  "specimen_results_inconsistent": "specimen",
  "specimen_submitted_on_expired_filter_paper": "specimen",
  "specimen_unsatisfactory_due_to_delay_in_transit": "specimen",
  "specimencondition_hl7_2x": "specimen",
  "steroid_treatment": "analytical",
  "supplemental_oxygen": "analytical",
  "testing_of_this_specimen_indicates_more_than_one_source_of_blood_is_present_on_the_filter_paper_card": "specimen",
  "unable_to_analyze_specimen_due_to_laboratory_accident": "specimen",
  "unsuitable_for_other_reasons": "specimen",
};

export const SPECIMEN_REASON_IDS: ReadonlySet<string> = new Set(
  Object.entries(REJECTION_REASONS_BY_ID)
    .filter(([, row]) => row.domain === 'specimen')
    .map(([id]) => id),
);

export const ANALYTICAL_REASON_IDS: ReadonlySet<string> = new Set(
  Object.entries(REJECTION_REASONS_BY_ID)
    .filter(([, row]) => row.domain === 'analytical')
    .map(([id]) => id),
);

const LABEL_TO_ID: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(REJECTION_REASON_BY_ID).map(([id, label]) => [label, id]),
);

/** Resolve registry id or canonical label to display label. */
export function resolveRejectionReasonLabel(value: string | null | undefined): string {
  const stripped = (value ?? '').trim();
  if (!stripped) return stripped;
  if (REJECTION_REASON_BY_ID[stripped]) {
    return REJECTION_REASON_BY_ID[stripped];
  }
  if (LABEL_TO_ID[stripped] !== undefined) {
    return stripped;
  }
  return stripped.replace(/_/g, ' ');
}

export function rejectionReasonDomain(
  value: string,
): RejectionDomain | undefined {
  const stripped = value.trim();
  if (!stripped) return undefined;
  if (REJECTION_REASON_DOMAIN_BY_ID[stripped]) {
    return REJECTION_REASON_DOMAIN_BY_ID[stripped];
  }
  const id = LABEL_TO_ID[stripped];
  if (id) return REJECTION_REASON_DOMAIN_BY_ID[id];
  return undefined;
}
