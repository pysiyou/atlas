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


ORDERABLE_PANEL_BY_ID: dict[str, OrderablePanelDef] = {
    "ACS": OrderablePanelDef(id="ACS", name="Acute Coronary Syndrome Panel", description=""),
    "INFACUTE": OrderablePanelDef(id="INFACUTE", name="Acute Infection Workup", description=""),
    "PANC": OrderablePanelDef(id="PANC", name="Acute Pancreatitis Panel", description=""),
    "ANEMIA": OrderablePanelDef(id="ANEMIA", name="Anemia Workup Panel", description=""),
    "BONE": OrderablePanelDef(id="BONE", name="Bone Metabolism Panel", description=""),
    "COVID": OrderablePanelDef(id="COVID", name="COVID-19 Diagnosis Panel", description=""),
    "COAG": OrderablePanelDef(id="COAG", name="Coagulation Panel", description=""),
    "COLON": OrderablePanelDef(id="COLON", name="Colon Cancer Markers", description=""),
    "HEMFULL": OrderablePanelDef(id="HEMFULL", name="Complete Hematology Panel", description=""),
    "DIC": OrderablePanelDef(id="DIC", name="DIC Panel", description=""),
    "DMGMT": OrderablePanelDef(id="DMGMT", name="Diabetes Management Panel", description=""),
    "DMSCR": OrderablePanelDef(id="DMSCR", name="Diabetes Screening", description=""),
    "DMPANEL": OrderablePanelDef(id="DMPANEL", name="Diabetes Screening Panel", description=""),
    "DIARRHEA": OrderablePanelDef(id="DIARRHEA", name="Diarrhea Workup Panel", description=""),
    "DRTB": OrderablePanelDef(id="DRTB", name="Drug-Resistant TB Panel", description=""),
    "LYTES": OrderablePanelDef(id="LYTES", name="Electrolyte Panel", description=""),
    "FEVER": OrderablePanelDef(id="FEVER", name="Fever Workup Panel", description=""),
    "ULCER": OrderablePanelDef(id="ULCER", name="Gastric Ulcer Workup", description=""),
    "HIVMGMT": OrderablePanelDef(id="HIVMGMT", name="HIV Management Panel", description=""),
    "HIV": OrderablePanelDef(id="HIV", name="HIV Testing Panel", description=""),
    "HBPATH": OrderablePanelDef(id="HBPATH", name="Hemoglobinopathy Panel", description=""),
    "HEMOLYS": OrderablePanelDef(id="HEMOLYS", name="Hemolysis Workup Panel", description=""),
    "HEP": OrderablePanelDef(id="HEP", name="Hepatitis Panel", description=""),
    "IMMCOMP": OrderablePanelDef(id="IMMCOMP", name="Immunocompromised Patient Workup", description=""),
    "INFECT": OrderablePanelDef(id="INFECT", name="Infection Workup Panel", description=""),
    "INFLAMM": OrderablePanelDef(id="INFLAMM", name="Inflammatory Markers Panel", description=""),
    "IRON": OrderablePanelDef(id="IRON", name="Iron Studies Panel", description=""),
    "LACTATE": OrderablePanelDef(id="LACTATE", name="Lactic Acidosis Panel", description=""),
    "LIPID": OrderablePanelDef(id="LIPID", name="Lipid Panel", description=""),
    "LFT": OrderablePanelDef(id="LFT", name="Liver Function Panel", description=""),
    "MACANEM": OrderablePanelDef(id="MACANEM", name="Macrocytic Anemia Workup Panel", description=""),
    "MDIFF": OrderablePanelDef(id="MDIFF", name="Manual Differential Panel", description=""),
    "CMP": OrderablePanelDef(id="CMP", name="Metabolic Panel", description=""),
    "MINERAL": OrderablePanelDef(id="MINERAL", name="Mineral Panel", description=""),
    "MPROTEIN": OrderablePanelDef(id="MPROTEIN", name="Monoclonal Protein Panel", description=""),
    "NUTRI": OrderablePanelDef(id="NUTRI", name="Nutritional Assessment Panel", description=""),
    "PREG": OrderablePanelDef(id="PREG", name="Pregnancy Panel", description=""),
    "PREGSER": OrderablePanelDef(id="PREGSER", name="Pregnancy Serology Panel", description=""),
    "PRENATAL": OrderablePanelDef(id="PRENATAL", name="Prenatal Serology Panel", description=""),
    "PSASCR": OrderablePanelDef(id="PSASCR", name="Prostate Cancer Screening", description=""),
    "RENAL": OrderablePanelDef(id="RENAL", name="Renal Panel", description=""),
    "UAPANEL": OrderablePanelDef(id="UAPANEL", name="Routine Urinalysis Panel", description=""),
    "STI": OrderablePanelDef(id="STI", name="STI Panel", description=""),
    "SEPSIS": OrderablePanelDef(id="SEPSIS", name="Sepsis Workup Panel", description=""),
    "SYPH": OrderablePanelDef(id="SYPH", name="Syphilis Diagnosis Panel", description=""),
    "TB": OrderablePanelDef(id="TB", name="TB Diagnosis Panel", description=""),
    "VTE": OrderablePanelDef(id="VTE", name="Thromboembolism Panel", description=""),
    "TFT": OrderablePanelDef(id="TFT", name="Thyroid Function Panel", description=""),
    "TXFUSE": OrderablePanelDef(id="TXFUSE", name="Transfusion Screening Panel", description=""),
    "UTI": OrderablePanelDef(id="UTI", name="UTI Management Panel", description=""),
}

ORDERABLE_PANEL_IDS: frozenset[str] = frozenset(("ACS", "INFACUTE", "PANC", "ANEMIA", "BONE", "COVID", "COAG", "COLON", "HEMFULL", "DIC", "DMGMT", "DMSCR", "DMPANEL", "DIARRHEA", "DRTB", "LYTES", "FEVER", "ULCER", "HIVMGMT", "HIV", "HBPATH", "HEMOLYS", "HEP", "IMMCOMP", "INFECT", "INFLAMM", "IRON", "LACTATE", "LIPID", "LFT", "MACANEM", "MDIFF", "CMP", "MINERAL", "MPROTEIN", "NUTRI", "PREG", "PREGSER", "PRENATAL", "PSASCR", "RENAL", "UAPANEL", "STI", "SEPSIS", "SYPH", "TB", "VTE", "TFT", "TXFUSE", "UTI"))


def is_orderable_panel_id(value: str) -> bool:
    return value in ORDERABLE_PANEL_BY_ID


def resolve_orderable_panel_label(panel_id: str) -> str:
    entry = ORDERABLE_PANEL_BY_ID.get(panel_id)
    return entry.name if entry else panel_id
