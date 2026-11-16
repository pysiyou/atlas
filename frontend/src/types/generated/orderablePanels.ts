/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:panels */
export type OrderablePanelId = "ACS" | "INFACUTE" | "PANC" | "ANEMIA" | "BONE" | "COVID" | "COAG" | "COLON" | "HEMFULL" | "DIC" | "DMGMT" | "DMSCR" | "DMPANEL" | "DIARRHEA" | "DRTB" | "LYTES" | "FEVER" | "ULCER" | "HIVMGMT" | "HIV" | "HBPATH" | "HEMOLYS" | "HEP" | "IMMCOMP" | "INFECT" | "INFLAMM" | "IRON" | "LACTATE" | "LIPID" | "LFT" | "MACANEM" | "MDIFF" | "CMP" | "MINERAL" | "MPROTEIN" | "NUTRI" | "PREG" | "PREGSER" | "PRENATAL" | "PSASCR" | "RENAL" | "UAPANEL" | "STI" | "SEPSIS" | "SYPH" | "TB" | "VTE" | "TFT" | "TXFUSE" | "UTI";

export interface OrderablePanelDef {
  id: OrderablePanelId;
  name: string;
  description: string;
  /** Order-level LOINC panel code when mapped (e.g. 57021-8). */
  loinc_code?: string;
}

export const ORDERABLE_PANEL_BY_ID: Record<OrderablePanelId, OrderablePanelDef> = {
  "ACS": { id: "ACS", name: "Acute Coronary Syndrome Panel", description: "" },
  "INFACUTE": { id: "INFACUTE", name: "Acute Infection Workup", description: "" },
  "PANC": { id: "PANC", name: "Acute Pancreatitis Panel", description: "" },
  "ANEMIA": { id: "ANEMIA", name: "Anemia Workup Panel", description: "" },
  "BONE": { id: "BONE", name: "Bone Metabolism Panel", description: "" },
  "COVID": { id: "COVID", name: "COVID-19 Diagnosis Panel", description: "" },
  "COAG": { id: "COAG", name: "Coagulation Panel", description: "", loinc_code: "34529-8" },
  "COLON": { id: "COLON", name: "Colon Cancer Markers", description: "" },
  "HEMFULL": { id: "HEMFULL", name: "Complete Hematology Panel", description: "" },
  "DIC": { id: "DIC", name: "DIC Panel", description: "" },
  "DMGMT": { id: "DMGMT", name: "Diabetes Management Panel", description: "" },
  "DMSCR": { id: "DMSCR", name: "Diabetes Screening", description: "" },
  "DMPANEL": { id: "DMPANEL", name: "Diabetes Screening Panel", description: "" },
  "DIARRHEA": { id: "DIARRHEA", name: "Diarrhea Workup Panel", description: "" },
  "DRTB": { id: "DRTB", name: "Drug-Resistant TB Panel", description: "" },
  "LYTES": { id: "LYTES", name: "Electrolyte Panel", description: "", loinc_code: "24326-1" },
  "FEVER": { id: "FEVER", name: "Fever Workup Panel", description: "" },
  "ULCER": { id: "ULCER", name: "Gastric Ulcer Workup", description: "" },
  "HIVMGMT": { id: "HIVMGMT", name: "HIV Management Panel", description: "" },
  "HIV": { id: "HIV", name: "HIV Testing Panel", description: "" },
  "HBPATH": { id: "HBPATH", name: "Hemoglobinopathy Panel", description: "" },
  "HEMOLYS": { id: "HEMOLYS", name: "Hemolysis Workup Panel", description: "" },
  "HEP": { id: "HEP", name: "Hepatitis Panel", description: "", loinc_code: "24363-4" },
  "IMMCOMP": { id: "IMMCOMP", name: "Immunocompromised Patient Workup", description: "" },
  "INFECT": { id: "INFECT", name: "Infection Workup Panel", description: "" },
  "INFLAMM": { id: "INFLAMM", name: "Inflammatory Markers Panel", description: "" },
  "IRON": { id: "IRON", name: "Iron Studies Panel", description: "", loinc_code: "50190-8" },
  "LACTATE": { id: "LACTATE", name: "Lactic Acidosis Panel", description: "" },
  "LIPID": { id: "LIPID", name: "Lipid Panel", description: "", loinc_code: "24331-1" },
  "LFT": { id: "LFT", name: "Liver Function Panel", description: "", loinc_code: "24325-3" },
  "MACANEM": { id: "MACANEM", name: "Macrocytic Anemia Workup Panel", description: "" },
  "MDIFF": { id: "MDIFF", name: "Manual Differential Panel", description: "", loinc_code: "24318-8" },
  "CMP": { id: "CMP", name: "Metabolic Panel", description: "", loinc_code: "24323-8" },
  "MINERAL": { id: "MINERAL", name: "Mineral Panel", description: "" },
  "MPROTEIN": { id: "MPROTEIN", name: "Monoclonal Protein Panel", description: "" },
  "NUTRI": { id: "NUTRI", name: "Nutritional Assessment Panel", description: "" },
  "PREG": { id: "PREG", name: "Pregnancy Panel", description: "" },
  "PREGSER": { id: "PREGSER", name: "Pregnancy Serology Panel", description: "" },
  "PRENATAL": { id: "PRENATAL", name: "Prenatal Serology Panel", description: "" },
  "PSASCR": { id: "PSASCR", name: "Prostate Cancer Screening", description: "" },
  "RENAL": { id: "RENAL", name: "Renal Panel", description: "", loinc_code: "24362-6" },
  "UAPANEL": { id: "UAPANEL", name: "Routine Urinalysis Panel", description: "", loinc_code: "24356-8" },
  "STI": { id: "STI", name: "STI Panel", description: "" },
  "SEPSIS": { id: "SEPSIS", name: "Sepsis Workup Panel", description: "" },
  "SYPH": { id: "SYPH", name: "Syphilis Diagnosis Panel", description: "" },
  "TB": { id: "TB", name: "TB Diagnosis Panel", description: "" },
  "VTE": { id: "VTE", name: "Thromboembolism Panel", description: "" },
  "TFT": { id: "TFT", name: "Thyroid Function Panel", description: "", loinc_code: "24348-5" },
  "TXFUSE": { id: "TXFUSE", name: "Transfusion Screening Panel", description: "" },
  "UTI": { id: "UTI", name: "UTI Management Panel", description: "" },
};

export function isOrderablePanelId(value: string): value is OrderablePanelId {
  return Object.prototype.hasOwnProperty.call(ORDERABLE_PANEL_BY_ID, value);
}

export function resolveOrderablePanelLabel(panelId: string): string {
  const entry = ORDERABLE_PANEL_BY_ID[panelId as OrderablePanelId];
  return entry?.name ?? panelId;
}
