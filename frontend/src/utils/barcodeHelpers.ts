/**
 * Barcode Generation Utilities
 * Generates and validates barcodes for samples, patients, and orders
 */

export interface BarcodeData {
  value: string;
  type: 'sample' | 'patient' | 'order' | 'aliquot';
  displayValue: string;
  format: 'CODE128' | 'CODE39' | 'EAN13';
}

/**
 * Generate barcode for a sample
 */
export function generateSampleBarcode(sampleId: string): BarcodeData {
  return {
    value: sampleId,
    type: 'sample',
    displayValue: sampleId,
    format: 'CODE128',
  };
}

/**
 * Generate barcode for a patient
 */
export function generatePatientBarcode(patientId: string): BarcodeData {
  return {
    value: patientId,
    type: 'patient',
    displayValue: patientId,
    format: 'CODE128',
  };
}

/**
 * Generate barcode for an order
 */
export function generateOrderBarcode(orderId: string): BarcodeData {
  return {
    value: orderId,
    type: 'order',
    displayValue: orderId,
    format: 'CODE128',
  };
}

/**
 * Generate barcode for an aliquot
 */
export function generateAliquotBarcode(aliquotId: string): BarcodeData {
  return {
    value: aliquotId,
    type: 'aliquot',
    displayValue: aliquotId,
    format: 'CODE128',
  };
}

/**
 * Validate barcode format
 */
export function validateBarcode(barcode: string, type: BarcodeData['type']): boolean {
  // Basic validation - can be enhanced based on requirements
  if (!barcode || barcode.length === 0) return false;
  
  switch (type) {
    case 'sample':
      // Sample IDs should match pattern: ORD-XXXXXX-TYPE
      return /^ORD-\d{6}-[A-Z]+$/.test(barcode);
    case 'patient':
      // Patient IDs should match pattern: PAT-XXXXXX
      return /^PAT-\d{6}$/.test(barcode);
    case 'order':
      // Order IDs should match pattern: ORD-XXXXXX
      return /^ORD-\d{6}$/.test(barcode);
    case 'aliquot':
      // Aliquot IDs should match pattern: ALQ-XXXXXX
      return /^ALQ-\d{6}$/.test(barcode);
    default:
      return false;
  }
}

/**
 * Parse barcode to extract information
 */
export function parseBarcode(barcode: string): {
  type: BarcodeData['type'] | null;
  id: string;
  isValid: boolean;
} {
  if (barcode.startsWith('PAT-')) {
    return {
      type: 'patient',
      id: barcode,
      isValid: validateBarcode(barcode, 'patient'),
    };
  }
  
  if (barcode.startsWith('ORD-') && !barcode.includes('-', 4)) {
    return {
      type: 'order',
      id: barcode,
      isValid: validateBarcode(barcode, 'order'),
    };
  }
  
  if (barcode.startsWith('ORD-') && barcode.includes('-', 4)) {
    return {
      type: 'sample',
      id: barcode,
      isValid: validateBarcode(barcode, 'sample'),
    };
  }
  
  if (barcode.startsWith('ALQ-')) {
    return {
      type: 'aliquot',
      id: barcode,
      isValid: validateBarcode(barcode, 'aliquot'),
    };
  }
  
  return {
    type: null,
    id: barcode,
    isValid: false,
  };
}

/**
 * Generate unique barcode ID
 */
export function generateUniqueBarcode(prefix: string = 'BAR'): string {
  // Use timestamp and random number for uniqueness
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${(timestamp + random).slice(-12)}`;
}
