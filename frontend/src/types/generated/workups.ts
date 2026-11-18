/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:workups */
/** Display labels only — list/detail data comes from GET /workups. */

export type WorkupId = "ACS" | "ANEMIA" | "AUTOIMM" | "BONE" | "CMP" | "COAG" | "COAGUL" | "COLON" | "COVID" | "DIC" | "DMGMT" | "DMPANEL" | "DMSCR" | "DRTB" | "FERTIL" | "FEVER" | "GENCHK" | "HBPATH" | "HEMFULL" | "HEMOLYS" | "HEP" | "HEPATIT" | "HIVMGMT" | "IMMCOMP" | "INFACUTE" | "INFECT" | "INFLAM" | "INFLAMM" | "IRON" | "LACTATE" | "LFT" | "LIPID" | "LYTES" | "MACANEM" | "MDIFF" | "METAB" | "MINERAL" | "MPROTEIN" | "NUTRI" | "PANC" | "PREG" | "PREGSER" | "PRENATAL" | "RENAL" | "SEPSIS" | "TB" | "TFT" | "TXFUSE" | "VTE";

export const WORKUP_LABEL_BY_ID: Record<WorkupId, string> = {
  "ACS": "Acute Coronary Syndrome Panel",
  "ANEMIA": "Anemia Workup Panel",
  "AUTOIMM": "Autoimmune Serology Panel",
  "BONE": "Bone Metabolism Panel",
  "CMP": "Metabolic Panel",
  "COAG": "Coagulation Panel",
  "COAGUL": "Coagulation Workup",
  "COLON": "Colon Cancer Markers",
  "COVID": "COVID-19 Diagnosis Panel",
  "DIC": "DIC Panel",
  "DMGMT": "Diabetes Management Panel",
  "DMPANEL": "Diabetes Screening Panel",
  "DMSCR": "Diabetes Screening",
  "DRTB": "Drug-Resistant TB Panel",
  "FERTIL": "Fertility Hormone Panel",
  "FEVER": "Fever Workup Panel",
  "GENCHK": "General Health Check",
  "HBPATH": "Hemoglobinopathy Panel",
  "HEMFULL": "Complete Hematology Panel",
  "HEMOLYS": "Hemolysis Workup Panel",
  "HEP": "Hepatitis Panel",
  "HEPATIT": "Hepatitis Serology Panel",
  "HIVMGMT": "HIV Management Panel",
  "IMMCOMP": "Immunocompromised Patient Workup",
  "INFACUTE": "Acute Infection Workup",
  "INFECT": "Infection Workup Panel",
  "INFLAM": "Inflammatory Markers Panel",
  "INFLAMM": "Inflammatory Markers Panel",
  "IRON": "Iron Studies Panel",
  "LACTATE": "Lactic Acidosis Panel",
  "LFT": "Liver Function Panel",
  "LIPID": "Lipid Panel",
  "LYTES": "Electrolyte Panel",
  "MACANEM": "Macrocytic Anemia Workup Panel",
  "MDIFF": "Manual Differential Panel",
  "METAB": "Metabolic Health Panel",
  "MINERAL": "Mineral Panel",
  "MPROTEIN": "Monoclonal Protein Panel",
  "NUTRI": "Nutritional Assessment Panel",
  "PANC": "Acute Pancreatitis Panel",
  "PREG": "Pregnancy Panel",
  "PREGSER": "Pregnancy Serology Panel",
  "PRENATAL": "Prenatal Serology Panel",
  "RENAL": "Renal Panel",
  "SEPSIS": "Sepsis Workup Panel",
  "TB": "TB Diagnosis Panel",
  "TFT": "Thyroid Function Panel",
  "TXFUSE": "Transfusion Screening Panel",
  "VTE": "Thromboembolism Panel",
};

export function isWorkupId(value: string): value is WorkupId {
  return Object.prototype.hasOwnProperty.call(WORKUP_LABEL_BY_ID, value);
}

export function resolveWorkupLabel(workupId: string): string {
  return WORKUP_LABEL_BY_ID[workupId as WorkupId] ?? workupId;
}
