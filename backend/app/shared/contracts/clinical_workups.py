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
    "ACS": ClinicalWorkupDef(id="ACS", name="Acute Coronary Syndrome Panel", description="", test_codes=("BNP", "CK", "CKMB", "CTNI", "LDH")),
    "INFACUTE": ClinicalWorkupDef(id="INFACUTE", name="Acute Infection Workup", description="", test_codes=("BCULT", "CBC", "CRP", "EBV", "LAC", "MALRDT", "PROCAL")),
    "PANC": ClinicalWorkupDef(id="PANC", name="Acute Pancreatitis Panel", description="", test_codes=("AMY", "LAC", "LIP")),
    "ANEMIA": ClinicalWorkupDef(id="ANEMIA", name="Anemia Workup Panel", description="", test_codes=("B12", "CBC", "FE", "FERR", "FOL", "HBELEC", "RETIC", "TIBC")),
    "BONE": ClinicalWorkupDef(id="BONE", name="Bone Metabolism Panel", description="", test_codes=("CA", "MG", "PO4", "VITD")),
    "COVID": ClinicalWorkupDef(id="COVID", name="COVID-19 Diagnosis Panel", description="", test_codes=("COVIDAG", "COVIDPCR")),
    "COAG": ClinicalWorkupDef(id="COAG", name="Coagulation Panel", description="", test_codes=("APTT", "ATIII", "FIB", "PTINR")),
    "COLON": ClinicalWorkupDef(id="COLON", name="Colon Cancer Markers", description="", test_codes=("CEA", "FOOB")),
    "HEMFULL": ClinicalWorkupDef(id="HEMFULL", name="Complete Hematology Panel", description="", test_codes=("CBC", "ESR", "RETIC")),
    "DIC": ClinicalWorkupDef(id="DIC", name="DIC Panel", description="", test_codes=("APTT", "ATIII", "DDIMER", "FIB", "PTINR")),
    "DMGMT": ClinicalWorkupDef(id="DMGMT", name="Diabetes Management Panel", description="", test_codes=("GLU", "HBA1C", "UALB")),
    "DMSCR": ClinicalWorkupDef(id="DMSCR", name="Diabetes Screening", description="", test_codes=("GLU", "HBA1C", "RBS")),
    "DMPANEL": ClinicalWorkupDef(id="DMPANEL", name="Diabetes Screening Panel", description="", test_codes=("GLU", "HBA1C", "RBS")),
    "DIARRHEA": ClinicalWorkupDef(id="DIARRHEA", name="Diarrhea Workup Panel", description="", test_codes=("FOOB", "SCULT", "STOOL")),
    "DRTB": ClinicalWorkupDef(id="DRTB", name="Drug-Resistant TB Panel", description="", test_codes=("AFB", "XPERT")),
    "LYTES": ClinicalWorkupDef(id="LYTES", name="Electrolyte Panel", description="", test_codes=("CL", "HCO3", "NA", "POT")),
    "FEVER": ClinicalWorkupDef(id="FEVER", name="Fever Workup Panel", description="", test_codes=("BCULT", "CHIKV", "CRP", "DENGUE", "LAC", "MALRDT", "MALSMEAR", "YF")),
    "ULCER": ClinicalWorkupDef(id="ULCER", name="Gastric Ulcer Workup", description="", test_codes=("HPYLORI", "STOOL")),
    "HIVMGMT": ClinicalWorkupDef(id="HIVMGMT", name="HIV Management Panel", description="", test_codes=("CD4", "HBVDNA", "HIVCONF", "HIVVL")),
    "HIV": ClinicalWorkupDef(id="HIV", name="HIV Testing Panel", description="", test_codes=("HIVAGAB", "HIVCONF")),
    "HBPATH": ClinicalWorkupDef(id="HBPATH", name="Hemoglobinopathy Panel", description="", test_codes=("CBC", "HBELEC", "SICKLE")),
    "HEMOLYS": ClinicalWorkupDef(id="HEMOLYS", name="Hemolysis Workup Panel", description="", test_codes=("CBC", "CK", "DAT", "G6PD", "LDH", "RETIC")),
    "HEP": ClinicalWorkupDef(id="HEP", name="Hepatitis Panel", description="", test_codes=("AHBC", "AHBS", "AHCV", "HBEAG", "HBSAG", "HBVDNA")),
    "IMMCOMP": ClinicalWorkupDef(id="IMMCOMP", name="Immunocompromised Patient Workup", description="", test_codes=("CBC", "CD4", "CMV", "HIVVL")),
    "INFECT": ClinicalWorkupDef(id="INFECT", name="Infection Workup Panel", description="", test_codes=("BCULT", "CRP", "LAC", "PROCAL", "UCULT")),
    "INFLAMM": ClinicalWorkupDef(id="INFLAMM", name="Inflammatory Markers Panel", description="", test_codes=("CRP", "ESR")),
    "IRON": ClinicalWorkupDef(id="IRON", name="Iron Studies Panel", description="", test_codes=("FE", "FERR", "TIBC")),
    "LACTATE": ClinicalWorkupDef(id="LACTATE", name="Lactic Acidosis Panel", description="", test_codes=("GLU", "LAC")),
    "LIPID": ClinicalWorkupDef(id="LIPID", name="Lipid Panel", description="", test_codes=("CHOL", "HDL", "LDL", "TG")),
    "LFT": ClinicalWorkupDef(id="LFT", name="Liver Function Panel", description="", test_codes=("ALB", "ALP", "ALT", "AST", "DBIL", "GGT", "LDH", "TBIL")),
    "MACANEM": ClinicalWorkupDef(id="MACANEM", name="Macrocytic Anemia Workup Panel", description="", test_codes=("B12", "FOL", "HBA1C", "RETIC")),
    "MDIFF": ClinicalWorkupDef(id="MDIFF", name="Manual Differential Panel", description="", test_codes=("CBC", "PBS")),
    "CMP": ClinicalWorkupDef(id="CMP", name="Metabolic Panel", description="", test_codes=("ALB", "ALP", "ALT", "AST", "BUN", "CA", "CL", "CREA", "GLU", "HCO3", "NA", "POT", "TBIL", "TP")),
    "MINERAL": ClinicalWorkupDef(id="MINERAL", name="Mineral Panel", description="", test_codes=("CA", "MG", "PO4")),
    "MPROTEIN": ClinicalWorkupDef(id="MPROTEIN", name="Monoclonal Protein Panel", description="", test_codes=("SPEP")),
    "NUTRI": ClinicalWorkupDef(id="NUTRI", name="Nutritional Assessment Panel", description="", test_codes=("ALB", "B12", "FOL", "PAB", "TP")),
    "PREG": ClinicalWorkupDef(id="PREG", name="Pregnancy Panel", description="", test_codes=("BHCG", "UHCG")),
    "PREGSER": ClinicalWorkupDef(id="PREGSER", name="Pregnancy Serology Panel", description="", test_codes=("CMV", "HIVAGAB", "RUBELLA", "TOXO")),
    "PRENATAL": ClinicalWorkupDef(id="PRENATAL", name="Prenatal Serology Panel", description="", test_codes=("AHBC", "AHBS", "HIVAGAB", "RUBELLA", "TOXO")),
    "PSASCR": ClinicalWorkupDef(id="PSASCR", name="Prostate Cancer Screening", description="", test_codes=("PSA")),
    "RENAL": ClinicalWorkupDef(id="RENAL", name="Renal Panel", description="", test_codes=("BUN", "CREA", "EGFR", "UA", "UALB")),
    "UAPANEL": ClinicalWorkupDef(id="UAPANEL", name="Routine Urinalysis Panel", description="", test_codes=("UA")),
    "STI": ClinicalWorkupDef(id="STI", name="STI Panel", description="", test_codes=("HIVAGAB", "RPR", "TPHA")),
    "SEPSIS": ClinicalWorkupDef(id="SEPSIS", name="Sepsis Workup Panel", description="", test_codes=("BCULT", "BNP", "CRP", "LAC", "PROCAL")),
    "SYPH": ClinicalWorkupDef(id="SYPH", name="Syphilis Diagnosis Panel", description="", test_codes=("RPR", "TPHA")),
    "TB": ClinicalWorkupDef(id="TB", name="TB Diagnosis Panel", description="", test_codes=("AFB", "BCULT", "XPERT")),
    "VTE": ClinicalWorkupDef(id="VTE", name="Thromboembolism Panel", description="", test_codes=("APTT", "DDIMER", "PTINR")),
    "TFT": ClinicalWorkupDef(id="TFT", name="Thyroid Function Panel", description="", test_codes=("FT3", "FT4", "TSH")),
    "TXFUSE": ClinicalWorkupDef(id="TXFUSE", name="Transfusion Screening Panel", description="", test_codes=("ABO", "DAT", "XMATCH")),
    "UTI": ClinicalWorkupDef(id="UTI", name="UTI Management Panel", description="", test_codes=("UA", "UCULT", "UQUANT")),
}

CLINICAL_WORKUP_IDS: frozenset[str] = frozenset(("ACS", "INFACUTE", "PANC", "ANEMIA", "BONE", "COVID", "COAG", "COLON", "HEMFULL", "DIC", "DMGMT", "DMSCR", "DMPANEL", "DIARRHEA", "DRTB", "LYTES", "FEVER", "ULCER", "HIVMGMT", "HIV", "HBPATH", "HEMOLYS", "HEP", "IMMCOMP", "INFECT", "INFLAMM", "IRON", "LACTATE", "LIPID", "LFT", "MACANEM", "MDIFF", "CMP", "MINERAL", "MPROTEIN", "NUTRI", "PREG", "PREGSER", "PRENATAL", "PSASCR", "RENAL", "UAPANEL", "STI", "SEPSIS", "SYPH", "TB", "VTE", "TFT", "TXFUSE", "UTI"))


def is_clinical_workup_id(value: str) -> bool:
    return value in CLINICAL_WORKUP_BY_ID


def resolve_clinical_workup_label(workup_id: str) -> str:
    entry = CLINICAL_WORKUP_BY_ID.get(workup_id)
    return entry.name if entry else workup_id
