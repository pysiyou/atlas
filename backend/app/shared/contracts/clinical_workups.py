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
    "ACS": ClinicalWorkupDef(id="ACS", name="Acute Coronary Syndrome Panel", description="Cardiac biomarkers and supporting labs for ACS evaluation.", test_codes=("BMP", "BNP", "CBC", "CK", "CKMB", "COAG", "CTNI", "LDH")),
    "ANEMIA": ClinicalWorkupDef(id="ANEMIA", name="Anemia Workup Panel", description="Routine anemia evaluation: CBC, iron studies, ferritin, B12, and folate.", test_codes=("B12", "CBC", "FE", "FERR", "FOL", "HBELEC", "IRONP", "RETIC", "TIBC")),
    "AUTOIMM": ClinicalWorkupDef(id="AUTOIMM", name="Autoimmune Serology Panel", description="ANA, RF, anti-CCP, complement, and immunoglobulins.", test_codes=("ACCP", "ANA", "C3", "C4", "IGA", "IGG", "IGM", "RF")),
    "BONE": ClinicalWorkupDef(id="BONE", name="Bone Metabolism Panel", description="", test_codes=("CA", "MG", "PO4", "VITD")),
    "CMP": ClinicalWorkupDef(id="CMP", name="Metabolic Panel", description="", test_codes=("ALB", "ALP", "ALT", "AST", "BUN", "CA", "CL", "CREA", "GLU", "HCO3", "NA", "POT", "TBIL", "TP")),
    "COAG": ClinicalWorkupDef(id="COAG", name="Coagulation Panel", description="", test_codes=("APTT", "ATIII", "FIB")),
    "COAGUL": ClinicalWorkupDef(id="COAGUL", name="Coagulation Workup", description="PT/INR, aPTT, fibrinogen, D-dimer, and antithrombin.", test_codes=("APTT", "ATIII", "COAG", "FIB")),
    "COLON": ClinicalWorkupDef(id="COLON", name="Colon Cancer Markers", description="", test_codes=("CEA", "FOOB")),
    "COVID": ClinicalWorkupDef(id="COVID", name="COVID-19 Diagnosis Panel", description="", test_codes=("COVIDAG", "COVIDPCR")),
    "DIARRHEA": ClinicalWorkupDef(id="DIARRHEA", name="Diarrhea Workup Panel", description="", test_codes=("FOOB", "SCULT", "STOOL")),
    "DIC": ClinicalWorkupDef(id="DIC", name="DIC Panel", description="", test_codes=("APTT", "ATIII", "DDIMER", "FIB")),
    "DMGMT": ClinicalWorkupDef(id="DMGMT", name="Diabetes Management Panel", description="", test_codes=("GLU", "HBA1C", "UALB")),
    "DMPANEL": ClinicalWorkupDef(id="DMPANEL", name="Diabetes Screening Panel", description="", test_codes=("GLU", "HBA1C", "RBS")),
    "DMSCR": ClinicalWorkupDef(id="DMSCR", name="Diabetes Screening", description="", test_codes=("GLU", "HBA1C", "RBS")),
    "DRTB": ClinicalWorkupDef(id="DRTB", name="Drug-Resistant TB Panel", description="", test_codes=("AFB", "XPERT")),
    "FERTIL": ClinicalWorkupDef(id="FERTIL", name="Fertility Hormone Panel", description="FSH, LH, estradiol, progesterone, prolactin, and testosterone.", test_codes=("BHCG", "E2", "FSH", "LH", "PRL", "PROG", "TESTO")),
    "FEVER": ClinicalWorkupDef(id="FEVER", name="Fever Workup Panel", description="", test_codes=("BCULT", "CHIKV", "CRP", "DENGUE", "LAC", "MALRDT", "MALSMEAR", "YF")),
    "GENCHK": ClinicalWorkupDef(id="GENCHK", name="General Health Check", description="Broad preventive screening profile.", test_codes=("CBC", "CMP", "LIPID", "TSH", "VITD")),
    "HBPATH": ClinicalWorkupDef(id="HBPATH", name="Hemoglobinopathy Panel", description="", test_codes=("CBC", "HBELEC", "SICKLE")),
    "HEMFULL": ClinicalWorkupDef(id="HEMFULL", name="Complete Hematology Panel", description="", test_codes=("CBC", "ESR", "RETIC")),
    "HEMOLYS": ClinicalWorkupDef(id="HEMOLYS", name="Hemolysis Workup Panel", description="", test_codes=("CBC", "CK", "DAT", "G6PD", "LDH", "RETIC")),
    "HEP": ClinicalWorkupDef(id="HEP", name="Hepatitis Panel", description="", test_codes=("AHBC", "AHBS", "AHCV", "HBEAG", "HBSAG", "HBVDNA")),
    "HEPATIT": ClinicalWorkupDef(id="HEPATIT", name="Hepatitis Serology Panel", description="HBV and HCV serologic screening.", test_codes=("AHBC", "AHBS", "AHCV", "HBSAG", "LFT")),
    "HIV": ClinicalWorkupDef(id="HIV", name="HIV Testing Panel", description="", test_codes=("HIVAGAB", "HIVCONF")),
    "HIVMGMT": ClinicalWorkupDef(id="HIVMGMT", name="HIV Management Panel", description="", test_codes=("CD4", "HBVDNA", "HIVCONF", "HIVVL")),
    "IMMCOMP": ClinicalWorkupDef(id="IMMCOMP", name="Immunocompromised Patient Workup", description="", test_codes=("CBC", "CD4", "CMV", "HIVVL")),
    "INFACUTE": ClinicalWorkupDef(id="INFACUTE", name="Acute Infection Workup", description="", test_codes=("BCULT", "CBC", "CRP", "EBV", "LAC", "MALRDT", "PROCAL")),
    "INFECT": ClinicalWorkupDef(id="INFECT", name="Infection Workup Panel", description="", test_codes=("BCULT", "CRP", "LAC", "PROCAL", "UCULT")),
    "INFLAM": ClinicalWorkupDef(id="INFLAM", name="Inflammatory Markers Panel", description="CBC with CRP and ESR.", test_codes=("CBC", "CRP", "ESR")),
    "INFLAMM": ClinicalWorkupDef(id="INFLAMM", name="Inflammatory Markers Panel", description="", test_codes=("CRP", "ESR")),
    "IRON": ClinicalWorkupDef(id="IRON", name="Iron Studies Panel", description="", test_codes=("FE", "FERR", "TIBC")),
    "LACTATE": ClinicalWorkupDef(id="LACTATE", name="Lactic Acidosis Panel", description="", test_codes=("GLU", "LAC")),
    "LFT": ClinicalWorkupDef(id="LFT", name="Liver Function Panel", description="", test_codes=("ALB", "ALP", "ALT", "AST", "DBIL", "GGT", "LDH", "TBIL")),
    "LIPID": ClinicalWorkupDef(id="LIPID", name="Lipid Panel", description="", test_codes=("CHOL", "HDL", "LDL", "TG")),
    "LYTES": ClinicalWorkupDef(id="LYTES", name="Electrolyte Panel", description="", test_codes=("CL", "HCO3", "NA", "POT")),
    "MACANEM": ClinicalWorkupDef(id="MACANEM", name="Macrocytic Anemia Workup Panel", description="", test_codes=("B12", "FOL", "HBA1C", "RETIC")),
    "MDIFF": ClinicalWorkupDef(id="MDIFF", name="Manual Differential Panel", description="", test_codes=("CBC", "PBS")),
    "METAB": ClinicalWorkupDef(id="METAB", name="Metabolic Health Panel", description="Metabolic screening: CMP, lipids, HbA1c, uric acid, and TSH.", test_codes=("CMP", "HBA1C", "LIPID", "TSH")),
    "MINERAL": ClinicalWorkupDef(id="MINERAL", name="Mineral Panel", description="", test_codes=("CA", "MG", "PO4")),
    "MPROTEIN": ClinicalWorkupDef(id="MPROTEIN", name="Monoclonal Protein Panel", description="", test_codes=("SPEP")),
    "NUTRI": ClinicalWorkupDef(id="NUTRI", name="Nutritional Assessment Panel", description="", test_codes=("ALB", "B12", "FOL", "PAB", "TP")),
    "PANC": ClinicalWorkupDef(id="PANC", name="Acute Pancreatitis Panel", description="", test_codes=("AMY", "LAC", "LIP")),
    "PREG": ClinicalWorkupDef(id="PREG", name="Pregnancy Panel", description="", test_codes=("BHCG", "UHCG")),
    "PREGSER": ClinicalWorkupDef(id="PREGSER", name="Pregnancy Serology Panel", description="", test_codes=("CMV", "HIVAGAB", "RUBELLA", "TOXO")),
    "PRENATAL": ClinicalWorkupDef(id="PRENATAL", name="Prenatal Serology Panel", description="CBC, rubella, HIV, hepatitis B, TSH, and urine protein screening.", test_codes=("AHBC", "AHBS", "BHCG", "CBC", "HBSAG", "HIVAGAB", "RUBELLA", "TOXO", "TSH", "UA")),
    "PSASCR": ClinicalWorkupDef(id="PSASCR", name="Prostate Cancer Screening", description="", test_codes=("PSA")),
    "RENAL": ClinicalWorkupDef(id="RENAL", name="Renal Panel", description="", test_codes=("BUN", "CREA", "EGFR", "UA", "UALB")),
    "SEPSIS": ClinicalWorkupDef(id="SEPSIS", name="Sepsis Workup Panel", description="", test_codes=("BCULT", "BNP", "CRP", "LAC", "PROCAL")),
    "STI": ClinicalWorkupDef(id="STI", name="STI Panel", description="", test_codes=("HIVAGAB", "RPR", "TPHA")),
    "SYPH": ClinicalWorkupDef(id="SYPH", name="Syphilis Diagnosis Panel", description="", test_codes=("RPR", "TPHA")),
    "TB": ClinicalWorkupDef(id="TB", name="TB Diagnosis Panel", description="", test_codes=("AFB", "BCULT", "XPERT")),
    "TFT": ClinicalWorkupDef(id="TFT", name="Thyroid Function Panel", description="TSH with free T4 and free T3.", test_codes=("FT3", "FT4", "TSH")),
    "TXFUSE": ClinicalWorkupDef(id="TXFUSE", name="Transfusion Screening Panel", description="", test_codes=("ABO", "DAT", "XMATCH")),
    "UAPANEL": ClinicalWorkupDef(id="UAPANEL", name="Routine Urinalysis Panel", description="", test_codes=("UA")),
    "ULCER": ClinicalWorkupDef(id="ULCER", name="Gastric Ulcer Workup", description="", test_codes=("HPYLORI", "STOOL")),
    "URINE": ClinicalWorkupDef(id="URINE", name="Urinalysis Workup", description="Complete urinalysis with microalbumin/creatinine ratio.", test_codes=("UA", "UACR", "UALB")),
    "UTI": ClinicalWorkupDef(id="UTI", name="UTI Management Panel", description="", test_codes=("UA", "UCULT", "UQUANT")),
    "VTE": ClinicalWorkupDef(id="VTE", name="Thromboembolism Panel", description="", test_codes=("APTT", "DDIMER")),
}

CLINICAL_WORKUP_IDS: frozenset[str] = frozenset(("ACS", "ANEMIA", "AUTOIMM", "BONE", "CMP", "COAG", "COAGUL", "COLON", "COVID", "DIARRHEA", "DIC", "DMGMT", "DMPANEL", "DMSCR", "DRTB", "FERTIL", "FEVER", "GENCHK", "HBPATH", "HEMFULL", "HEMOLYS", "HEP", "HEPATIT", "HIV", "HIVMGMT", "IMMCOMP", "INFACUTE", "INFECT", "INFLAM", "INFLAMM", "IRON", "LACTATE", "LFT", "LIPID", "LYTES", "MACANEM", "MDIFF", "METAB", "MINERAL", "MPROTEIN", "NUTRI", "PANC", "PREG", "PREGSER", "PRENATAL", "PSASCR", "RENAL", "SEPSIS", "STI", "SYPH", "TB", "TFT", "TXFUSE", "UAPANEL", "ULCER", "URINE", "UTI", "VTE"))


def is_clinical_workup_id(value: str) -> bool:
    return value in CLINICAL_WORKUP_BY_ID


def resolve_clinical_workup_label(workup_id: str) -> str:
    entry = CLINICAL_WORKUP_BY_ID.get(workup_id)
    return entry.name if entry else workup_id
