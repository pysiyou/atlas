/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:workups */
export type ClinicalWorkupId = "ACS" | "INFACUTE" | "PANC" | "ANEMIA" | "BONE" | "COVID" | "COAG" | "COLON" | "HEMFULL" | "DIC" | "DMGMT" | "DMSCR" | "DMPANEL" | "DIARRHEA" | "DRTB" | "LYTES" | "FEVER" | "ULCER" | "HIVMGMT" | "HIV" | "HBPATH" | "HEMOLYS" | "HEP" | "IMMCOMP" | "INFECT" | "INFLAMM" | "IRON" | "LACTATE" | "LIPID" | "LFT" | "MACANEM" | "MDIFF" | "CMP" | "MINERAL" | "MPROTEIN" | "NUTRI" | "PREG" | "PREGSER" | "PRENATAL" | "PSASCR" | "RENAL" | "UAPANEL" | "STI" | "SEPSIS" | "SYPH" | "TB" | "VTE" | "TFT" | "TXFUSE" | "UTI";

export interface ClinicalWorkupDef {
  id: ClinicalWorkupId;
  name: string;
  description: string;
  /** Orderable test mnemonics included in this workup. */
  test_codes?: string[];
}

export const CLINICAL_WORKUP_BY_ID: Record<ClinicalWorkupId, ClinicalWorkupDef> = {
  "ACS": { id: "ACS", name: "Acute Coronary Syndrome Panel", description: "", test_codes: ["BNP","CK","CKMB","CTNI","LDH"] },
  "INFACUTE": { id: "INFACUTE", name: "Acute Infection Workup", description: "", test_codes: ["BCULT","CBC","CRP","EBV","LAC","MALRDT","PROCAL"] },
  "PANC": { id: "PANC", name: "Acute Pancreatitis Panel", description: "", test_codes: ["AMY","LAC","LIP"] },
  "ANEMIA": { id: "ANEMIA", name: "Anemia Workup Panel", description: "", test_codes: ["B12","CBC","FE","FERR","FOL","HBELEC","RETIC","TIBC"] },
  "BONE": { id: "BONE", name: "Bone Metabolism Panel", description: "", test_codes: ["CA","MG","PO4","VITD"] },
  "COVID": { id: "COVID", name: "COVID-19 Diagnosis Panel", description: "", test_codes: ["COVIDAG","COVIDPCR"] },
  "COAG": { id: "COAG", name: "Coagulation Panel", description: "", test_codes: ["APTT","ATIII","FIB","PTINR"] },
  "COLON": { id: "COLON", name: "Colon Cancer Markers", description: "", test_codes: ["CEA","FOOB"] },
  "HEMFULL": { id: "HEMFULL", name: "Complete Hematology Panel", description: "", test_codes: ["CBC","ESR","RETIC"] },
  "DIC": { id: "DIC", name: "DIC Panel", description: "", test_codes: ["APTT","ATIII","DDIMER","FIB","PTINR"] },
  "DMGMT": { id: "DMGMT", name: "Diabetes Management Panel", description: "", test_codes: ["GLU","HBA1C","UALB"] },
  "DMSCR": { id: "DMSCR", name: "Diabetes Screening", description: "", test_codes: ["GLU","HBA1C","RBS"] },
  "DMPANEL": { id: "DMPANEL", name: "Diabetes Screening Panel", description: "", test_codes: ["GLU","HBA1C","RBS"] },
  "DIARRHEA": { id: "DIARRHEA", name: "Diarrhea Workup Panel", description: "", test_codes: ["FOOB","SCULT","STOOL"] },
  "DRTB": { id: "DRTB", name: "Drug-Resistant TB Panel", description: "", test_codes: ["AFB","XPERT"] },
  "LYTES": { id: "LYTES", name: "Electrolyte Panel", description: "", test_codes: ["CL","HCO3","NA","POT"] },
  "FEVER": { id: "FEVER", name: "Fever Workup Panel", description: "", test_codes: ["BCULT","CHIKV","CRP","DENGUE","LAC","MALRDT","MALSMEAR","YF"] },
  "ULCER": { id: "ULCER", name: "Gastric Ulcer Workup", description: "", test_codes: ["HPYLORI","STOOL"] },
  "HIVMGMT": { id: "HIVMGMT", name: "HIV Management Panel", description: "", test_codes: ["CD4","HBVDNA","HIVCONF","HIVVL"] },
  "HIV": { id: "HIV", name: "HIV Testing Panel", description: "", test_codes: ["HIVAGAB","HIVCONF"] },
  "HBPATH": { id: "HBPATH", name: "Hemoglobinopathy Panel", description: "", test_codes: ["CBC","HBELEC","SICKLE"] },
  "HEMOLYS": { id: "HEMOLYS", name: "Hemolysis Workup Panel", description: "", test_codes: ["CBC","CK","DAT","G6PD","LDH","RETIC"] },
  "HEP": { id: "HEP", name: "Hepatitis Panel", description: "", test_codes: ["AHBC","AHBS","AHCV","HBEAG","HBSAG","HBVDNA"] },
  "IMMCOMP": { id: "IMMCOMP", name: "Immunocompromised Patient Workup", description: "", test_codes: ["CBC","CD4","CMV","HIVVL"] },
  "INFECT": { id: "INFECT", name: "Infection Workup Panel", description: "", test_codes: ["BCULT","CRP","LAC","PROCAL","UCULT"] },
  "INFLAMM": { id: "INFLAMM", name: "Inflammatory Markers Panel", description: "", test_codes: ["CRP","ESR"] },
  "IRON": { id: "IRON", name: "Iron Studies Panel", description: "", test_codes: ["FE","FERR","TIBC"] },
  "LACTATE": { id: "LACTATE", name: "Lactic Acidosis Panel", description: "", test_codes: ["GLU","LAC"] },
  "LIPID": { id: "LIPID", name: "Lipid Panel", description: "", test_codes: ["CHOL","HDL","LDL","TG"] },
  "LFT": { id: "LFT", name: "Liver Function Panel", description: "", test_codes: ["ALB","ALP","ALT","AST","DBIL","GGT","LDH","TBIL"] },
  "MACANEM": { id: "MACANEM", name: "Macrocytic Anemia Workup Panel", description: "", test_codes: ["B12","FOL","HBA1C","RETIC"] },
  "MDIFF": { id: "MDIFF", name: "Manual Differential Panel", description: "", test_codes: ["CBC","PBS"] },
  "CMP": { id: "CMP", name: "Metabolic Panel", description: "", test_codes: ["ALB","ALP","ALT","AST","BUN","CA","CL","CREA","GLU","HCO3","NA","POT","TBIL","TP"] },
  "MINERAL": { id: "MINERAL", name: "Mineral Panel", description: "", test_codes: ["CA","MG","PO4"] },
  "MPROTEIN": { id: "MPROTEIN", name: "Monoclonal Protein Panel", description: "", test_codes: ["SPEP"] },
  "NUTRI": { id: "NUTRI", name: "Nutritional Assessment Panel", description: "", test_codes: ["ALB","B12","FOL","PAB","TP"] },
  "PREG": { id: "PREG", name: "Pregnancy Panel", description: "", test_codes: ["BHCG","UHCG"] },
  "PREGSER": { id: "PREGSER", name: "Pregnancy Serology Panel", description: "", test_codes: ["CMV","HIVAGAB","RUBELLA","TOXO"] },
  "PRENATAL": { id: "PRENATAL", name: "Prenatal Serology Panel", description: "", test_codes: ["AHBC","AHBS","HIVAGAB","RUBELLA","TOXO"] },
  "PSASCR": { id: "PSASCR", name: "Prostate Cancer Screening", description: "", test_codes: ["PSA"] },
  "RENAL": { id: "RENAL", name: "Renal Panel", description: "", test_codes: ["BUN","CREA","EGFR","UA","UALB"] },
  "UAPANEL": { id: "UAPANEL", name: "Routine Urinalysis Panel", description: "", test_codes: ["UA"] },
  "STI": { id: "STI", name: "STI Panel", description: "", test_codes: ["HIVAGAB","RPR","TPHA"] },
  "SEPSIS": { id: "SEPSIS", name: "Sepsis Workup Panel", description: "", test_codes: ["BCULT","BNP","CRP","LAC","PROCAL"] },
  "SYPH": { id: "SYPH", name: "Syphilis Diagnosis Panel", description: "", test_codes: ["RPR","TPHA"] },
  "TB": { id: "TB", name: "TB Diagnosis Panel", description: "", test_codes: ["AFB","BCULT","XPERT"] },
  "VTE": { id: "VTE", name: "Thromboembolism Panel", description: "", test_codes: ["APTT","DDIMER","PTINR"] },
  "TFT": { id: "TFT", name: "Thyroid Function Panel", description: "", test_codes: ["FT3","FT4","TSH"] },
  "TXFUSE": { id: "TXFUSE", name: "Transfusion Screening Panel", description: "", test_codes: ["ABO","DAT","XMATCH"] },
  "UTI": { id: "UTI", name: "UTI Management Panel", description: "", test_codes: ["UA","UCULT","UQUANT"] },
};

export function isClinicalWorkupId(value: string): value is ClinicalWorkupId {
  return Object.prototype.hasOwnProperty.call(CLINICAL_WORKUP_BY_ID, value);
}

export function resolveClinicalWorkupLabel(workupId: string): string {
  const entry = CLINICAL_WORKUP_BY_ID[workupId as ClinicalWorkupId];
  return entry?.name ?? workupId;
}
