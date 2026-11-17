/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:workups */
export type ClinicalWorkupId = "ACS" | "ANEMIA" | "AUTOIMM" | "BONE" | "CMP" | "COAG" | "COAGUL" | "COLON" | "COVID" | "DIARRHEA" | "DIC" | "DMGMT" | "DMPANEL" | "DMSCR" | "DRTB" | "FERTIL" | "FEVER" | "GENCHK" | "HBPATH" | "HEMFULL" | "HEMOLYS" | "HEP" | "HEPATIT" | "HIV" | "HIVMGMT" | "IMMCOMP" | "INFACUTE" | "INFECT" | "INFLAM" | "INFLAMM" | "IRON" | "LACTATE" | "LFT" | "LIPID" | "LYTES" | "MACANEM" | "MDIFF" | "METAB" | "MINERAL" | "MPROTEIN" | "NUTRI" | "PANC" | "PREG" | "PREGSER" | "PRENATAL" | "PSASCR" | "RENAL" | "SEPSIS" | "STI" | "SYPH" | "TB" | "TFT" | "TXFUSE" | "UAPANEL" | "ULCER" | "URINE" | "UTI" | "VTE";

export interface ClinicalWorkupDef {
  id: ClinicalWorkupId;
  name: string;
  description: string;
  /** Orderable test mnemonics included in this workup. */
  test_codes?: string[];
}

export const CLINICAL_WORKUP_BY_ID: Record<ClinicalWorkupId, ClinicalWorkupDef> = {
  "ACS": { id: "ACS", name: "Acute Coronary Syndrome Panel", description: "Cardiac biomarkers and supporting labs for ACS evaluation.", test_codes: ["BMP","BNP","CBC","CK","CKMB","COAG","CTNI","LDH"] },
  "ANEMIA": { id: "ANEMIA", name: "Anemia Workup Panel", description: "Routine anemia evaluation: CBC, iron studies, ferritin, B12, and folate.", test_codes: ["B12","CBC","FE","FERR","FOL","HBELEC","IRONP","RETIC","TIBC"] },
  "AUTOIMM": { id: "AUTOIMM", name: "Autoimmune Serology Panel", description: "ANA, RF, anti-CCP, complement, and immunoglobulins.", test_codes: ["ACCP","ANA","C3","C4","IGA","IGG","IGM","RF"] },
  "BONE": { id: "BONE", name: "Bone Metabolism Panel", description: "", test_codes: ["CA","MG","PO4","VITD"] },
  "CMP": { id: "CMP", name: "Metabolic Panel", description: "", test_codes: ["ALB","ALP","ALT","AST","BUN","CA","CL","CREA","GLU","HCO3","NA","POT","TBIL","TP"] },
  "COAG": { id: "COAG", name: "Coagulation Panel", description: "", test_codes: ["APTT","ATIII","FIB"] },
  "COAGUL": { id: "COAGUL", name: "Coagulation Workup", description: "PT/INR, aPTT, fibrinogen, D-dimer, and antithrombin.", test_codes: ["APTT","ATIII","COAG","FIB"] },
  "COLON": { id: "COLON", name: "Colon Cancer Markers", description: "", test_codes: ["CEA","FOOB"] },
  "COVID": { id: "COVID", name: "COVID-19 Diagnosis Panel", description: "", test_codes: ["COVIDAG","COVIDPCR"] },
  "DIARRHEA": { id: "DIARRHEA", name: "Diarrhea Workup Panel", description: "", test_codes: ["FOOB","SCULT","STOOL"] },
  "DIC": { id: "DIC", name: "DIC Panel", description: "", test_codes: ["APTT","ATIII","DDIMER","FIB"] },
  "DMGMT": { id: "DMGMT", name: "Diabetes Management Panel", description: "", test_codes: ["GLU","HBA1C","UALB"] },
  "DMPANEL": { id: "DMPANEL", name: "Diabetes Screening Panel", description: "", test_codes: ["GLU","HBA1C","RBS"] },
  "DMSCR": { id: "DMSCR", name: "Diabetes Screening", description: "", test_codes: ["GLU","HBA1C","RBS"] },
  "DRTB": { id: "DRTB", name: "Drug-Resistant TB Panel", description: "", test_codes: ["AFB","XPERT"] },
  "FERTIL": { id: "FERTIL", name: "Fertility Hormone Panel", description: "FSH, LH, estradiol, progesterone, prolactin, and testosterone.", test_codes: ["BHCG","E2","FSH","LH","PRL","PROG","TESTO"] },
  "FEVER": { id: "FEVER", name: "Fever Workup Panel", description: "", test_codes: ["BCULT","CHIKV","CRP","DENGUE","LAC","MALRDT","MALSMEAR","YF"] },
  "GENCHK": { id: "GENCHK", name: "General Health Check", description: "Broad preventive screening profile.", test_codes: ["CBC","CMP","LIPID","TSH","VITD"] },
  "HBPATH": { id: "HBPATH", name: "Hemoglobinopathy Panel", description: "", test_codes: ["CBC","HBELEC","SICKLE"] },
  "HEMFULL": { id: "HEMFULL", name: "Complete Hematology Panel", description: "", test_codes: ["CBC","ESR","RETIC"] },
  "HEMOLYS": { id: "HEMOLYS", name: "Hemolysis Workup Panel", description: "", test_codes: ["CBC","CK","DAT","G6PD","LDH","RETIC"] },
  "HEP": { id: "HEP", name: "Hepatitis Panel", description: "", test_codes: ["AHBC","AHBS","AHCV","HBEAG","HBSAG","HBVDNA"] },
  "HEPATIT": { id: "HEPATIT", name: "Hepatitis Serology Panel", description: "HBV and HCV serologic screening.", test_codes: ["AHBC","AHBS","AHCV","HBSAG","LFT"] },
  "HIV": { id: "HIV", name: "HIV Testing Panel", description: "", test_codes: ["HIVAGAB","HIVCONF"] },
  "HIVMGMT": { id: "HIVMGMT", name: "HIV Management Panel", description: "", test_codes: ["CD4","HBVDNA","HIVCONF","HIVVL"] },
  "IMMCOMP": { id: "IMMCOMP", name: "Immunocompromised Patient Workup", description: "", test_codes: ["CBC","CD4","CMV","HIVVL"] },
  "INFACUTE": { id: "INFACUTE", name: "Acute Infection Workup", description: "", test_codes: ["BCULT","CBC","CRP","EBV","LAC","MALRDT","PROCAL"] },
  "INFECT": { id: "INFECT", name: "Infection Workup Panel", description: "", test_codes: ["BCULT","CRP","LAC","PROCAL","UCULT"] },
  "INFLAM": { id: "INFLAM", name: "Inflammatory Markers Panel", description: "CBC with CRP and ESR.", test_codes: ["CBC","CRP","ESR"] },
  "INFLAMM": { id: "INFLAMM", name: "Inflammatory Markers Panel", description: "", test_codes: ["CRP","ESR"] },
  "IRON": { id: "IRON", name: "Iron Studies Panel", description: "", test_codes: ["FE","FERR","TIBC"] },
  "LACTATE": { id: "LACTATE", name: "Lactic Acidosis Panel", description: "", test_codes: ["GLU","LAC"] },
  "LFT": { id: "LFT", name: "Liver Function Panel", description: "", test_codes: ["ALB","ALP","ALT","AST","DBIL","GGT","LDH","TBIL"] },
  "LIPID": { id: "LIPID", name: "Lipid Panel", description: "", test_codes: ["CHOL","HDL","LDL","TG"] },
  "LYTES": { id: "LYTES", name: "Electrolyte Panel", description: "", test_codes: ["CL","HCO3","NA","POT"] },
  "MACANEM": { id: "MACANEM", name: "Macrocytic Anemia Workup Panel", description: "", test_codes: ["B12","FOL","HBA1C","RETIC"] },
  "MDIFF": { id: "MDIFF", name: "Manual Differential Panel", description: "", test_codes: ["CBC","PBS"] },
  "METAB": { id: "METAB", name: "Metabolic Health Panel", description: "Metabolic screening: CMP, lipids, HbA1c, uric acid, and TSH.", test_codes: ["CMP","HBA1C","LIPID","TSH"] },
  "MINERAL": { id: "MINERAL", name: "Mineral Panel", description: "", test_codes: ["CA","MG","PO4"] },
  "MPROTEIN": { id: "MPROTEIN", name: "Monoclonal Protein Panel", description: "", test_codes: ["SPEP"] },
  "NUTRI": { id: "NUTRI", name: "Nutritional Assessment Panel", description: "", test_codes: ["ALB","B12","FOL","PAB","TP"] },
  "PANC": { id: "PANC", name: "Acute Pancreatitis Panel", description: "", test_codes: ["AMY","LAC","LIP"] },
  "PREG": { id: "PREG", name: "Pregnancy Panel", description: "", test_codes: ["BHCG","UHCG"] },
  "PREGSER": { id: "PREGSER", name: "Pregnancy Serology Panel", description: "", test_codes: ["CMV","HIVAGAB","RUBELLA","TOXO"] },
  "PRENATAL": { id: "PRENATAL", name: "Prenatal Serology Panel", description: "CBC, rubella, HIV, hepatitis B, TSH, and urine protein screening.", test_codes: ["AHBC","AHBS","BHCG","CBC","HBSAG","HIVAGAB","RUBELLA","TOXO","TSH","UA"] },
  "PSASCR": { id: "PSASCR", name: "Prostate Cancer Screening", description: "", test_codes: ["PSA"] },
  "RENAL": { id: "RENAL", name: "Renal Panel", description: "", test_codes: ["BUN","CREA","EGFR","UA","UALB"] },
  "SEPSIS": { id: "SEPSIS", name: "Sepsis Workup Panel", description: "", test_codes: ["BCULT","BNP","CRP","LAC","PROCAL"] },
  "STI": { id: "STI", name: "STI Panel", description: "", test_codes: ["HIVAGAB","RPR","TPHA"] },
  "SYPH": { id: "SYPH", name: "Syphilis Diagnosis Panel", description: "", test_codes: ["RPR","TPHA"] },
  "TB": { id: "TB", name: "TB Diagnosis Panel", description: "", test_codes: ["AFB","BCULT","XPERT"] },
  "TFT": { id: "TFT", name: "Thyroid Function Panel", description: "TSH with free T4 and free T3.", test_codes: ["FT3","FT4","TSH"] },
  "TXFUSE": { id: "TXFUSE", name: "Transfusion Screening Panel", description: "", test_codes: ["ABO","DAT","XMATCH"] },
  "UAPANEL": { id: "UAPANEL", name: "Routine Urinalysis Panel", description: "", test_codes: ["UA"] },
  "ULCER": { id: "ULCER", name: "Gastric Ulcer Workup", description: "", test_codes: ["HPYLORI","STOOL"] },
  "URINE": { id: "URINE", name: "Urinalysis Workup", description: "Complete urinalysis with microalbumin/creatinine ratio.", test_codes: ["UA","UACR","UALB"] },
  "UTI": { id: "UTI", name: "UTI Management Panel", description: "", test_codes: ["UA","UCULT","UQUANT"] },
  "VTE": { id: "VTE", name: "Thromboembolism Panel", description: "", test_codes: ["APTT","DDIMER"] },
};

export function isClinicalWorkupId(value: string): value is ClinicalWorkupId {
  return Object.prototype.hasOwnProperty.call(CLINICAL_WORKUP_BY_ID, value);
}

export function resolveClinicalWorkupLabel(workupId: string): string {
  const entry = CLINICAL_WORKUP_BY_ID[workupId as ClinicalWorkupId];
  return entry?.name ?? workupId;
}
