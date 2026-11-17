"""
Clinical workup registry — GENERATED from contracts/catalog/clinical-workups.json. DO NOT EDIT.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class ClinicalWorkupDef:
    id: str
    name: str
    description: str
    test_codes: tuple[str, ...] = ()


CLINICAL_WORKUP_BY_ID: dict[str, ClinicalWorkupDef] = {
    "ANEMIA": ClinicalWorkupDef(id="ANEMIA", name="Anemia Workup", description="Routine anemia evaluation: CBC, iron studies, ferritin, B12, and folate.", test_codes=("CBC", "IRONP", "FERR", "B12", "FOL")),
    "TFT": ClinicalWorkupDef(id="TFT", name="Thyroid Function Panel", description="TSH with free T4 and free T3.", test_codes=("TSH", "FT4", "FT3")),
    "ACS": ClinicalWorkupDef(id="ACS", name="Acute Coronary Syndrome Panel", description="Cardiac biomarkers and supporting labs for ACS evaluation.", test_codes=("TROP", "CK", "BNP", "CBC", "BMP", "COAG", "DDIM")),
    "METAB": ClinicalWorkupDef(id="METAB", name="Metabolic Health Panel", description="Metabolic screening: CMP, lipids, HbA1c, uric acid, and TSH.", test_codes=("CMP", "LIPID", "HBA1C", "URIC", "TSH")),
    "INFLAM": ClinicalWorkupDef(id="INFLAM", name="Inflammatory Markers Panel", description="CBC with CRP and ESR.", test_codes=("CBC", "CRP", "ESR")),
    "GENCHK": ClinicalWorkupDef(id="GENCHK", name="General Health Check", description="Broad preventive screening profile.", test_codes=("CBC", "CMP", "LIPID", "TSH", "VITD")),
}

CLINICAL_WORKUP_IDS: frozenset[str] = frozenset(("ANEMIA", "TFT", "ACS", "METAB", "INFLAM", "GENCHK"))


def is_clinical_workup_id(value: str) -> bool:
    return value in CLINICAL_WORKUP_BY_ID


def resolve_clinical_workup_label(workup_id: str) -> str:
    entry = CLINICAL_WORKUP_BY_ID.get(workup_id)
    return entry.name if entry else workup_id
