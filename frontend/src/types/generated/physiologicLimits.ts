/**
 * Physiologic limits — GENERATED from test-catalog.json result_items.physiologic_range. DO NOT EDIT.
 */
export interface PhysiologicLimit {
  min: number;
  max: number;
  unit?: string;
  description?: string;
}

export const PHYSIOLOGIC_LIMITS: Record<string, PhysiologicLimit> = {
  "ALB": { min: 0.5, max: 10, unit: "g/dL", description: "Albumin" },
  "ALP": { min: 0, max: 5000, unit: "U/L", description: "Alkaline Phosphatase" },
  "ALT": { min: 0, max: 10000, unit: "U/L", description: "ALT (SGPT)" },
  "APTT": { min: 10, max: 250, unit: "seconds", description: "aPTT" },
  "AST": { min: 0, max: 10000, unit: "U/L", description: "AST (SGOT)" },
  "BILI_DIRECT": { min: 0, max: 50, unit: "mg/dL", description: "Direct Bilirubin" },
  "BILI_TOTAL": { min: 0, max: 100, unit: "mg/dL", description: "Total Bilirubin" },
  "BUN": { min: 0, max: 300, unit: "mg/dL", description: "Blood Urea Nitrogen" },
  "CA_TOTAL": { min: 2, max: 20, unit: "mg/dL", description: "Total Calcium" },
  "CHOL_TOTAL": { min: 20, max: 1000, unit: "mg/dL", description: "Total Cholesterol" },
  "CL": { min: 60, max: 150, unit: "mEq/L (mmol/L)", description: "Chloride" },
  "CREAT": { min: 0.1, max: 50, unit: "mg/dL", description: "Serum Creatinine" },
  "EGFR_VALUE": { min: 0, max: 200, unit: "mL/min/1.73m²", description: "eGFR" },
  "FT4": { min: 0, max: 20, unit: "ng/dL (pmol/L)", description: "Free Thyroxine" },
  "GLU_FAST": { min: 5, max: 2000, unit: "mg/dL", description: "Fasting Glucose" },
  "GLU_RANDOM": { min: 5, max: 2000, unit: "mg/dL", description: "Random Glucose" },
  "HCO3": { min: 1, max: 60, unit: "mEq/L (mmol/L)", description: "Bicarbonate (HCO3)" },
  "HCT": { min: 5, max: 80, unit: "%", description: "Hematocrit" },
  "HDL": { min: 5, max: 200, unit: "mg/dL", description: "HDL Cholesterol" },
  "HGB": { min: 1, max: 30, unit: "g/dL", description: "Hemoglobin" },
  "INR": { min: 0.5, max: 20, unit: "ratio", description: "International Normalized Ratio" },
  "K": { min: 1, max: 12, unit: "mEq/L (mmol/L)", description: "Potassium" },
  "LDL": { min: 5, max: 500, unit: "mg/dL", description: "LDL Cholesterol" },
  "MCV": { min: 30, max: 200, unit: "fL", description: "Mean Corpuscular Volume" },
  "MG": { min: 0.3, max: 10, unit: "mg/dL", description: "Magnesium" },
  "NA": { min: 90, max: 200, unit: "mEq/L (mmol/L)", description: "Sodium" },
  "PHOS": { min: 0.5, max: 20, unit: "mg/dL", description: "Inorganic Phosphate" },
  "PLAT": { min: 1, max: 2000, unit: "×10⁹/L", description: "Platelet Count" },
  "PT_SEC": { min: 5, max: 200, unit: "seconds", description: "Prothrombin Time (seconds)" },
  "RBC": { min: 0.5, max: 12, unit: "×10¹²/L", description: "Red Blood Cell Count" },
  "TG": { min: 10, max: 10000, unit: "mg/dL", description: "Triglycerides" },
  "TOTAL_PROTEIN": { min: 1, max: 20, unit: "g/dL", description: "Total Protein" },
  "TROPONIN_I": { min: 0, max: 1000, unit: "pg/mL", description: "Troponin I" },
  "TSH": { min: 0, max: 500, unit: "mIU/L", description: "TSH" },
  "UA_GRAVITY": { min: 1, max: 1.06, unit: "density", description: "Specific Gravity" },
  "UA_pH": { min: 6.5, max: 8, unit: "pH units", description: "pH" },
  "WBC": { min: 0.1, max: 500, unit: "×10⁹/L", description: "White Blood Cell Count" }
};
