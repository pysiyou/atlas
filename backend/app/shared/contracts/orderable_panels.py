"""
Orderable panel registry — GENERATED from contracts/orderable-panels.json. DO NOT EDIT.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class OrderablePanelDef:
    id: str
    name: str
    description: str


ORDERABLE_PANEL_BY_ID: dict[str, OrderablePanelDef] = {
    "acute_coronary_syndrome_panel": OrderablePanelDef(id="acute_coronary_syndrome_panel", name="Acute Coronary Syndrome Panel", description=""),
    "acute_infection_workup": OrderablePanelDef(id="acute_infection_workup", name="Acute Infection Workup", description=""),
    "acute_pancreatitis_panel": OrderablePanelDef(id="acute_pancreatitis_panel", name="Acute Pancreatitis Panel", description=""),
    "anemia_workup_panel": OrderablePanelDef(id="anemia_workup_panel", name="Anemia Workup Panel", description=""),
    "bone_metabolism_panel": OrderablePanelDef(id="bone_metabolism_panel", name="Bone Metabolism Panel", description=""),
    "covid_19_diagnosis_panel": OrderablePanelDef(id="covid_19_diagnosis_panel", name="COVID-19 Diagnosis Panel", description=""),
    "coagulation_panel": OrderablePanelDef(id="coagulation_panel", name="Coagulation Panel", description=""),
    "colon_cancer_markers": OrderablePanelDef(id="colon_cancer_markers", name="Colon Cancer Markers", description=""),
    "complete_hematology_panel": OrderablePanelDef(id="complete_hematology_panel", name="Complete Hematology Panel", description=""),
    "dic_panel": OrderablePanelDef(id="dic_panel", name="DIC Panel", description=""),
    "diabetes_management_panel": OrderablePanelDef(id="diabetes_management_panel", name="Diabetes Management Panel", description=""),
    "diabetes_screening": OrderablePanelDef(id="diabetes_screening", name="Diabetes Screening", description=""),
    "diabetes_screening_panel": OrderablePanelDef(id="diabetes_screening_panel", name="Diabetes Screening Panel", description=""),
    "diarrhea_workup_panel": OrderablePanelDef(id="diarrhea_workup_panel", name="Diarrhea Workup Panel", description=""),
    "drug_resistant_tb_panel": OrderablePanelDef(id="drug_resistant_tb_panel", name="Drug-Resistant TB Panel", description=""),
    "electrolyte_panel": OrderablePanelDef(id="electrolyte_panel", name="Electrolyte Panel", description=""),
    "fever_workup_panel": OrderablePanelDef(id="fever_workup_panel", name="Fever Workup Panel", description=""),
    "gastric_ulcer_workup": OrderablePanelDef(id="gastric_ulcer_workup", name="Gastric Ulcer Workup", description=""),
    "hiv_management_panel": OrderablePanelDef(id="hiv_management_panel", name="HIV Management Panel", description=""),
    "hiv_testing_panel": OrderablePanelDef(id="hiv_testing_panel", name="HIV Testing Panel", description=""),
    "hemoglobinopathy_panel": OrderablePanelDef(id="hemoglobinopathy_panel", name="Hemoglobinopathy Panel", description=""),
    "hemolysis_workup_panel": OrderablePanelDef(id="hemolysis_workup_panel", name="Hemolysis Workup Panel", description=""),
    "hepatitis_panel": OrderablePanelDef(id="hepatitis_panel", name="Hepatitis Panel", description=""),
    "immunocompromised_patient_workup": OrderablePanelDef(id="immunocompromised_patient_workup", name="Immunocompromised Patient Workup", description=""),
    "infection_workup_panel": OrderablePanelDef(id="infection_workup_panel", name="Infection Workup Panel", description=""),
    "inflammatory_markers_panel": OrderablePanelDef(id="inflammatory_markers_panel", name="Inflammatory Markers Panel", description=""),
    "iron_studies_panel": OrderablePanelDef(id="iron_studies_panel", name="Iron Studies Panel", description=""),
    "lactic_acidosis_panel": OrderablePanelDef(id="lactic_acidosis_panel", name="Lactic Acidosis Panel", description=""),
    "lipid_panel": OrderablePanelDef(id="lipid_panel", name="Lipid Panel", description=""),
    "liver_function_panel": OrderablePanelDef(id="liver_function_panel", name="Liver Function Panel", description=""),
    "macrocytic_anemia_workup_panel": OrderablePanelDef(id="macrocytic_anemia_workup_panel", name="Macrocytic Anemia Workup Panel", description=""),
    "manual_differential_panel": OrderablePanelDef(id="manual_differential_panel", name="Manual Differential Panel", description=""),
    "metabolic_panel": OrderablePanelDef(id="metabolic_panel", name="Metabolic Panel", description=""),
    "mineral_panel": OrderablePanelDef(id="mineral_panel", name="Mineral Panel", description=""),
    "monoclonal_protein_panel": OrderablePanelDef(id="monoclonal_protein_panel", name="Monoclonal Protein Panel", description=""),
    "nutritional_assessment_panel": OrderablePanelDef(id="nutritional_assessment_panel", name="Nutritional Assessment Panel", description=""),
    "pregnancy_panel": OrderablePanelDef(id="pregnancy_panel", name="Pregnancy Panel", description=""),
    "pregnancy_serology_panel": OrderablePanelDef(id="pregnancy_serology_panel", name="Pregnancy Serology Panel", description=""),
    "prenatal_serology_panel": OrderablePanelDef(id="prenatal_serology_panel", name="Prenatal Serology Panel", description=""),
    "prostate_cancer_screening": OrderablePanelDef(id="prostate_cancer_screening", name="Prostate Cancer Screening", description=""),
    "renal_panel": OrderablePanelDef(id="renal_panel", name="Renal Panel", description=""),
    "routine_urinalysis_panel": OrderablePanelDef(id="routine_urinalysis_panel", name="Routine Urinalysis Panel", description=""),
    "sti_panel": OrderablePanelDef(id="sti_panel", name="STI Panel", description=""),
    "sepsis_workup_panel": OrderablePanelDef(id="sepsis_workup_panel", name="Sepsis Workup Panel", description=""),
    "syphilis_diagnosis_panel": OrderablePanelDef(id="syphilis_diagnosis_panel", name="Syphilis Diagnosis Panel", description=""),
    "tb_diagnosis_panel": OrderablePanelDef(id="tb_diagnosis_panel", name="TB Diagnosis Panel", description=""),
    "thromboembolism_panel": OrderablePanelDef(id="thromboembolism_panel", name="Thromboembolism Panel", description=""),
    "thyroid_function_panel": OrderablePanelDef(id="thyroid_function_panel", name="Thyroid Function Panel", description=""),
    "transfusion_screening_panel": OrderablePanelDef(id="transfusion_screening_panel", name="Transfusion Screening Panel", description=""),
    "uti_management_panel": OrderablePanelDef(id="uti_management_panel", name="UTI Management Panel", description=""),
}

ORDERABLE_PANEL_IDS: frozenset[str] = frozenset(("acute_coronary_syndrome_panel", "acute_infection_workup", "acute_pancreatitis_panel", "anemia_workup_panel", "bone_metabolism_panel", "covid_19_diagnosis_panel", "coagulation_panel", "colon_cancer_markers", "complete_hematology_panel", "dic_panel", "diabetes_management_panel", "diabetes_screening", "diabetes_screening_panel", "diarrhea_workup_panel", "drug_resistant_tb_panel", "electrolyte_panel", "fever_workup_panel", "gastric_ulcer_workup", "hiv_management_panel", "hiv_testing_panel", "hemoglobinopathy_panel", "hemolysis_workup_panel", "hepatitis_panel", "immunocompromised_patient_workup", "infection_workup_panel", "inflammatory_markers_panel", "iron_studies_panel", "lactic_acidosis_panel", "lipid_panel", "liver_function_panel", "macrocytic_anemia_workup_panel", "manual_differential_panel", "metabolic_panel", "mineral_panel", "monoclonal_protein_panel", "nutritional_assessment_panel", "pregnancy_panel", "pregnancy_serology_panel", "prenatal_serology_panel", "prostate_cancer_screening", "renal_panel", "routine_urinalysis_panel", "sti_panel", "sepsis_workup_panel", "syphilis_diagnosis_panel", "tb_diagnosis_panel", "thromboembolism_panel", "thyroid_function_panel", "transfusion_screening_panel", "uti_management_panel"))


def is_orderable_panel_id(value: str) -> bool:
    return value in ORDERABLE_PANEL_BY_ID


def resolve_orderable_panel_label(panel_id: str) -> str:
    entry = ORDERABLE_PANEL_BY_ID.get(panel_id)
    return entry.name if entry else panel_id
