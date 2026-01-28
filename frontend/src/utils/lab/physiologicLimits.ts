/**
 * Physiologic Limits
 *
 * Defines absolute limits for laboratory values that are incompatible with life.
 * Values outside these ranges should be blocked from entry.
 */

export interface PhysiologicLimit {
  min: number;
  max: number;
  unit?: string;
  description?: string;
}

/**
 * Physiologic limits by item code
 * Values outside these ranges are physically impossible
 */
export const PHYSIOLOGIC_LIMITS: Record<string, PhysiologicLimit> = {
  // Blood gases
  pH: { min: 6.5, max: 8.0, description: 'Blood pH' },
  pCO2: { min: 5, max: 150, unit: 'mmHg', description: 'Partial pressure of CO2' },
  pO2: { min: 0, max: 700, unit: 'mmHg', description: 'Partial pressure of O2' },
  HCO3: { min: 1, max: 60, unit: 'mEq/L', description: 'Bicarbonate' },

  // Electrolytes
  Na: { min: 90, max: 200, unit: 'mEq/L', description: 'Sodium' },
  Sodium: { min: 90, max: 200, unit: 'mEq/L', description: 'Sodium' },
  K: { min: 1.0, max: 12.0, unit: 'mEq/L', description: 'Potassium' },
  Potassium: { min: 1.0, max: 12.0, unit: 'mEq/L', description: 'Potassium' },
  Cl: { min: 60, max: 150, unit: 'mEq/L', description: 'Chloride' },
  Chloride: { min: 60, max: 150, unit: 'mEq/L', description: 'Chloride' },
  Ca: { min: 2.0, max: 20.0, unit: 'mg/dL', description: 'Calcium' },
  Calcium: { min: 2.0, max: 20.0, unit: 'mg/dL', description: 'Calcium' },
  Mg: { min: 0.3, max: 10.0, unit: 'mg/dL', description: 'Magnesium' },
  Magnesium: { min: 0.3, max: 10.0, unit: 'mg/dL', description: 'Magnesium' },
  Phosphorus: { min: 0.5, max: 20.0, unit: 'mg/dL', description: 'Phosphorus' },
  P: { min: 0.5, max: 20.0, unit: 'mg/dL', description: 'Phosphorus' },

  // Glucose
  Glucose: { min: 5, max: 2000, unit: 'mg/dL', description: 'Blood glucose' },
  GLU: { min: 5, max: 2000, unit: 'mg/dL', description: 'Blood glucose' },

  // Renal function
  BUN: { min: 0, max: 300, unit: 'mg/dL', description: 'Blood urea nitrogen' },
  Creatinine: { min: 0.1, max: 50, unit: 'mg/dL', description: 'Serum creatinine' },
  Cr: { min: 0.1, max: 50, unit: 'mg/dL', description: 'Serum creatinine' },
  eGFR: { min: 0, max: 200, unit: 'mL/min', description: 'Estimated GFR' },

  // Liver function
  AST: { min: 0, max: 10000, unit: 'U/L', description: 'Aspartate aminotransferase' },
  ALT: { min: 0, max: 10000, unit: 'U/L', description: 'Alanine aminotransferase' },
  ALP: { min: 0, max: 5000, unit: 'U/L', description: 'Alkaline phosphatase' },
  Bilirubin: { min: 0, max: 100, unit: 'mg/dL', description: 'Total bilirubin' },
  TBil: { min: 0, max: 100, unit: 'mg/dL', description: 'Total bilirubin' },
  DBil: { min: 0, max: 50, unit: 'mg/dL', description: 'Direct bilirubin' },
  Albumin: { min: 0.5, max: 10, unit: 'g/dL', description: 'Serum albumin' },
  Protein: { min: 1, max: 20, unit: 'g/dL', description: 'Total protein' },

  // Hematology
  WBC: { min: 0.1, max: 500, unit: '×10⁹/L', description: 'White blood cell count' },
  RBC: { min: 0.5, max: 12, unit: '×10¹²/L', description: 'Red blood cell count' },
  Hemoglobin: { min: 1, max: 30, unit: 'g/dL', description: 'Hemoglobin' },
  Hgb: { min: 1, max: 30, unit: 'g/dL', description: 'Hemoglobin' },
  HGB: { min: 1, max: 30, unit: 'g/dL', description: 'Hemoglobin' },
  Hematocrit: { min: 5, max: 80, unit: '%', description: 'Hematocrit' },
  Hct: { min: 5, max: 80, unit: '%', description: 'Hematocrit' },
  HCT: { min: 5, max: 80, unit: '%', description: 'Hematocrit' },
  Platelets: { min: 1, max: 2000, unit: '×10⁹/L', description: 'Platelet count' },
  PLT: { min: 1, max: 2000, unit: '×10⁹/L', description: 'Platelet count' },
  MCV: { min: 30, max: 200, unit: 'fL', description: 'Mean corpuscular volume' },
  MCH: { min: 10, max: 60, unit: 'pg', description: 'Mean corpuscular hemoglobin' },
  MCHC: { min: 20, max: 50, unit: 'g/dL', description: 'Mean corpuscular hemoglobin concentration' },
  RDW: { min: 5, max: 40, unit: '%', description: 'Red cell distribution width' },

  // Coagulation
  PT: { min: 5, max: 200, unit: 'seconds', description: 'Prothrombin time' },
  INR: { min: 0.5, max: 20, description: 'International normalized ratio' },
  PTT: { min: 10, max: 250, unit: 'seconds', description: 'Partial thromboplastin time' },
  aPTT: { min: 10, max: 250, unit: 'seconds', description: 'Activated partial thromboplastin time' },

  // Cardiac markers
  Troponin: { min: 0, max: 1000, unit: 'ng/mL', description: 'Troponin' },
  TnI: { min: 0, max: 1000, unit: 'ng/mL', description: 'Troponin I' },
  TnT: { min: 0, max: 1000, unit: 'ng/mL', description: 'Troponin T' },
  BNP: { min: 0, max: 100000, unit: 'pg/mL', description: 'B-type natriuretic peptide' },

  // Thyroid
  TSH: { min: 0, max: 500, unit: 'mIU/L', description: 'Thyroid stimulating hormone' },
  T3: { min: 0, max: 1000, unit: 'ng/dL', description: 'Triiodothyronine' },
  T4: { min: 0, max: 50, unit: 'μg/dL', description: 'Thyroxine' },
  FT3: { min: 0, max: 50, unit: 'pg/mL', description: 'Free T3' },
  FT4: { min: 0, max: 20, unit: 'ng/dL', description: 'Free T4' },

  // Lipids
  Cholesterol: { min: 20, max: 1000, unit: 'mg/dL', description: 'Total cholesterol' },
  TotalCholesterol: { min: 20, max: 1000, unit: 'mg/dL', description: 'Total cholesterol' },
  Triglycerides: { min: 10, max: 10000, unit: 'mg/dL', description: 'Triglycerides' },
  HDL: { min: 5, max: 200, unit: 'mg/dL', description: 'HDL cholesterol' },
  LDL: { min: 5, max: 500, unit: 'mg/dL', description: 'LDL cholesterol' },

  // Urinalysis
  UrineSpecificGravity: { min: 1.0, max: 1.06, description: 'Urine specific gravity' },
  SG: { min: 1.0, max: 1.06, description: 'Specific gravity' },

  // Temperature
  Temperature: { min: 85, max: 115, unit: '°F', description: 'Body temperature (Fahrenheit)' },
  TemperatureC: { min: 25, max: 45, unit: '°C', description: 'Body temperature (Celsius)' },
};

/**
 * Get physiologic limit for an item code
 */
export function getPhysiologicLimit(itemCode: string): PhysiologicLimit | undefined {
  // Direct match
  if (PHYSIOLOGIC_LIMITS[itemCode]) {
    return PHYSIOLOGIC_LIMITS[itemCode];
  }

  // Case-insensitive match
  const upperCode = itemCode.toUpperCase();
  for (const [key, limit] of Object.entries(PHYSIOLOGIC_LIMITS)) {
    if (key.toUpperCase() === upperCode) {
      return limit;
    }
  }

  // Partial match
  for (const [key, limit] of Object.entries(PHYSIOLOGIC_LIMITS)) {
    if (key.toLowerCase().includes(itemCode.toLowerCase()) ||
        itemCode.toLowerCase().includes(key.toLowerCase())) {
      return limit;
    }
  }

  return undefined;
}

/**
 * Validate a value against physiologic limits
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  limit?: PhysiologicLimit;
}

export function validatePhysiologicValue(itemCode: string, value: string | number): ValidationResult {
  const limit = getPhysiologicLimit(itemCode);

  if (!limit) {
    // No limit defined, allow the value
    return { isValid: true };
  }

  // Parse the value
  let numValue: number;
  if (typeof value === 'string') {
    // Handle special prefixes like < or >
    const cleanValue = value.replace(/^[<>]/, '');
    numValue = parseFloat(cleanValue);
  } else {
    numValue = value;
  }

  if (isNaN(numValue)) {
    // Not a number, can't validate
    return { isValid: true };
  }

  if (numValue < limit.min) {
    return {
      isValid: false,
      error: `Value ${numValue} is below physiologic minimum (${limit.min}). This value is not compatible with life.`,
      limit,
    };
  }

  if (numValue > limit.max) {
    return {
      isValid: false,
      error: `Value ${numValue} exceeds physiologic maximum (${limit.max}). This value is not compatible with life.`,
      limit,
    };
  }

  return { isValid: true, limit };
}

/**
 * Check if a value is within physiologic limits (simple boolean check)
 */
export function isWithinPhysiologicLimits(itemCode: string, value: string | number): boolean {
  return validatePhysiologicValue(itemCode, value).isValid;
}
