/** GENERATED — DO NOT EDIT. Regenerate: npm run codegen:workups */
export type ClinicalWorkupId = "ANEMIA" | "TFT" | "ACS" | "METAB" | "INFLAM" | "GENCHK";

export interface ClinicalWorkupDef {
  id: ClinicalWorkupId;
  name: string;
  description: string;
  /** Orderable test mnemonics included in this workup. */
  test_codes?: string[];
}

export const CLINICAL_WORKUP_BY_ID: Record<ClinicalWorkupId, ClinicalWorkupDef> = {
  "ANEMIA": { id: "ANEMIA", name: "Anemia Workup", description: "Routine anemia evaluation: CBC, iron studies, ferritin, B12, and folate.", test_codes: ["CBC","IRONP","FERR","B12","FOL"] },
  "TFT": { id: "TFT", name: "Thyroid Function Panel", description: "TSH with free T4 and free T3.", test_codes: ["TSH","FT4","FT3"] },
  "ACS": { id: "ACS", name: "Acute Coronary Syndrome Panel", description: "Cardiac biomarkers and supporting labs for ACS evaluation.", test_codes: ["TROP","CK","BNP","CBC","BMP","COAG","DDIM"] },
  "METAB": { id: "METAB", name: "Metabolic Health Panel", description: "Metabolic screening: CMP, lipids, HbA1c, uric acid, and TSH.", test_codes: ["CMP","LIPID","HBA1C","URIC","TSH"] },
  "INFLAM": { id: "INFLAM", name: "Inflammatory Markers Panel", description: "CBC with CRP and ESR.", test_codes: ["CBC","CRP","ESR"] },
  "GENCHK": { id: "GENCHK", name: "General Health Check", description: "Broad preventive screening profile.", test_codes: ["CBC","CMP","LIPID","TSH","VITD"] },
};

export function isClinicalWorkupId(value: string): value is ClinicalWorkupId {
  return Object.prototype.hasOwnProperty.call(CLINICAL_WORKUP_BY_ID, value);
}

export function resolveClinicalWorkupLabel(workupId: string): string {
  const entry = CLINICAL_WORKUP_BY_ID[workupId as ClinicalWorkupId];
  return entry?.name ?? workupId;
}
