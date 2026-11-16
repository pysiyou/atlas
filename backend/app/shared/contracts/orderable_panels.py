"""
Orderable panel registry — GENERATED from contracts/catalog/orderable-panels.json. DO NOT EDIT.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class OrderablePanelDef:
    id: str
    name: str
    description: str
    loinc_code: str | None = None


ORDERABLE_PANEL_BY_ID: dict[str, OrderablePanelDef] = {
    "ACS": OrderablePanelDef(id="ACS", name="Acute Coronary Syndrome Panel", description="", loinc_code=None),
    "INFACUTE": OrderablePanelDef(id="INFACUTE", name="Acute Infection Workup", description="", loinc_code=None),
    "PANC": OrderablePanelDef(id="PANC", name="Acute Pancreatitis Panel", description="", loinc_code=None),
    "ANEMIA": OrderablePanelDef(id="ANEMIA", name="Anemia Workup Panel", description="", loinc_code=None),
    "BONE": OrderablePanelDef(id="BONE", name="Bone Metabolism Panel", description="", loinc_code=None),
    "COVID": OrderablePanelDef(id="COVID", name="COVID-19 Diagnosis Panel", description="", loinc_code=None),
    "COAG": OrderablePanelDef(id="COAG", name="Coagulation Panel", description="", loinc_code="34529-8"),
    "COLON": OrderablePanelDef(id="COLON", name="Colon Cancer Markers", description="", loinc_code=None),
    "HEMFULL": OrderablePanelDef(id="HEMFULL", name="Complete Hematology Panel", description="", loinc_code=None),
    "DIC": OrderablePanelDef(id="DIC", name="DIC Panel", description="", loinc_code=None),
    "DMGMT": OrderablePanelDef(id="DMGMT", name="Diabetes Management Panel", description="", loinc_code=None),
    "DMSCR": OrderablePanelDef(id="DMSCR", name="Diabetes Screening", description="", loinc_code=None),
    "DMPANEL": OrderablePanelDef(id="DMPANEL", name="Diabetes Screening Panel", description="", loinc_code=None),
    "DIARRHEA": OrderablePanelDef(id="DIARRHEA", name="Diarrhea Workup Panel", description="", loinc_code=None),
    "DRTB": OrderablePanelDef(id="DRTB", name="Drug-Resistant TB Panel", description="", loinc_code=None),
    "LYTES": OrderablePanelDef(id="LYTES", name="Electrolyte Panel", description="", loinc_code="24326-1"),
    "FEVER": OrderablePanelDef(id="FEVER", name="Fever Workup Panel", description="", loinc_code=None),
    "ULCER": OrderablePanelDef(id="ULCER", name="Gastric Ulcer Workup", description="", loinc_code=None),
    "HIVMGMT": OrderablePanelDef(id="HIVMGMT", name="HIV Management Panel", description="", loinc_code=None),
    "HIV": OrderablePanelDef(id="HIV", name="HIV Testing Panel", description="", loinc_code=None),
    "HBPATH": OrderablePanelDef(id="HBPATH", name="Hemoglobinopathy Panel", description="", loinc_code=None),
    "HEMOLYS": OrderablePanelDef(id="HEMOLYS", name="Hemolysis Workup Panel", description="", loinc_code=None),
    "HEP": OrderablePanelDef(id="HEP", name="Hepatitis Panel", description="", loinc_code="24363-4"),
    "IMMCOMP": OrderablePanelDef(id="IMMCOMP", name="Immunocompromised Patient Workup", description="", loinc_code=None),
    "INFECT": OrderablePanelDef(id="INFECT", name="Infection Workup Panel", description="", loinc_code=None),
    "INFLAMM": OrderablePanelDef(id="INFLAMM", name="Inflammatory Markers Panel", description="", loinc_code=None),
    "IRON": OrderablePanelDef(id="IRON", name="Iron Studies Panel", description="", loinc_code="50190-8"),
    "LACTATE": OrderablePanelDef(id="LACTATE", name="Lactic Acidosis Panel", description="", loinc_code=None),
    "LIPID": OrderablePanelDef(id="LIPID", name="Lipid Panel", description="", loinc_code="24331-1"),
    "LFT": OrderablePanelDef(id="LFT", name="Liver Function Panel", description="", loinc_code="24325-3"),
    "MACANEM": OrderablePanelDef(id="MACANEM", name="Macrocytic Anemia Workup Panel", description="", loinc_code=None),
    "MDIFF": OrderablePanelDef(id="MDIFF", name="Manual Differential Panel", description="", loinc_code="24318-8"),
    "CMP": OrderablePanelDef(id="CMP", name="Metabolic Panel", description="", loinc_code="24323-8"),
    "MINERAL": OrderablePanelDef(id="MINERAL", name="Mineral Panel", description="", loinc_code=None),
    "MPROTEIN": OrderablePanelDef(id="MPROTEIN", name="Monoclonal Protein Panel", description="", loinc_code=None),
    "NUTRI": OrderablePanelDef(id="NUTRI", name="Nutritional Assessment Panel", description="", loinc_code=None),
    "PREG": OrderablePanelDef(id="PREG", name="Pregnancy Panel", description="", loinc_code=None),
    "PREGSER": OrderablePanelDef(id="PREGSER", name="Pregnancy Serology Panel", description="", loinc_code=None),
    "PRENATAL": OrderablePanelDef(id="PRENATAL", name="Prenatal Serology Panel", description="", loinc_code=None),
    "PSASCR": OrderablePanelDef(id="PSASCR", name="Prostate Cancer Screening", description="", loinc_code=None),
    "RENAL": OrderablePanelDef(id="RENAL", name="Renal Panel", description="", loinc_code="24362-6"),
    "UAPANEL": OrderablePanelDef(id="UAPANEL", name="Routine Urinalysis Panel", description="", loinc_code="24356-8"),
    "STI": OrderablePanelDef(id="STI", name="STI Panel", description="", loinc_code=None),
    "SEPSIS": OrderablePanelDef(id="SEPSIS", name="Sepsis Workup Panel", description="", loinc_code=None),
    "SYPH": OrderablePanelDef(id="SYPH", name="Syphilis Diagnosis Panel", description="", loinc_code=None),
    "TB": OrderablePanelDef(id="TB", name="TB Diagnosis Panel", description="", loinc_code=None),
    "VTE": OrderablePanelDef(id="VTE", name="Thromboembolism Panel", description="", loinc_code=None),
    "TFT": OrderablePanelDef(id="TFT", name="Thyroid Function Panel", description="", loinc_code="24348-5"),
    "TXFUSE": OrderablePanelDef(id="TXFUSE", name="Transfusion Screening Panel", description="", loinc_code=None),
    "UTI": OrderablePanelDef(id="UTI", name="UTI Management Panel", description="", loinc_code=None),
}

ORDERABLE_PANEL_IDS: frozenset[str] = frozenset(("ACS", "INFACUTE", "PANC", "ANEMIA", "BONE", "COVID", "COAG", "COLON", "HEMFULL", "DIC", "DMGMT", "DMSCR", "DMPANEL", "DIARRHEA", "DRTB", "LYTES", "FEVER", "ULCER", "HIVMGMT", "HIV", "HBPATH", "HEMOLYS", "HEP", "IMMCOMP", "INFECT", "INFLAMM", "IRON", "LACTATE", "LIPID", "LFT", "MACANEM", "MDIFF", "CMP", "MINERAL", "MPROTEIN", "NUTRI", "PREG", "PREGSER", "PRENATAL", "PSASCR", "RENAL", "UAPANEL", "STI", "SEPSIS", "SYPH", "TB", "VTE", "TFT", "TXFUSE", "UTI"))


def is_orderable_panel_id(value: str) -> bool:
    return value in ORDERABLE_PANEL_BY_ID


def resolve_orderable_panel_label(panel_id: str) -> str:
    entry = ORDERABLE_PANEL_BY_ID.get(panel_id)
    return entry.name if entry else panel_id
