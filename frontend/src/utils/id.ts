/**
 * Clinical LIS identifier display, parsing, and validation.
 *
 * Row ids use these formats: patient id = MRN, order id = filler number,
 * sample id = accession, user id = employee number, invoice id, payment id.
 */

/**
 * Regex contracts — canonical list in `contracts/entity-ids.json`;
 * keep in sync with `backend/app/shared/identifiers.py`.
 */
export const ID_PATTERNS = {
  mrn: /^3\d{7}$/,
  filler: /^\d{13}$/,
  accession: /^\d{2}-\d{5}$/,
  aliquotAccession: /^\d{2}-\d{5}\.\d{1,2}$/,
  sampleId: /^\d{2}-\d{5}(\.\d{1,2})?$/,
  testMnemonic: /^[A-Z][A-Z0-9]{1,7}$/,
  referentDoctorId: /^2\d{7}$/,
  employeeNumber: /^1\d{7}$/,
  labActorUserId: /^(?:100000|1\d{7})$/,
  invoiceNumber: /^\d{12}$/,
  receiptNumber: /^\d{8}$/,
  memberId: /^[0-9A-Z]{6,20}$/,
  analyzerId: /^[A-Z0-9][A-Z0-9._-]{2,31}$/,
} as const;

export type EntityType =
  | 'patient'
  | 'order'
  | 'sample'
  | 'orderTest'
  | 'invoice'
  | 'payment'
  | 'report'
  | 'user'
  | 'audit';

export type ClinicalSearchKind =
  | 'mrn'
  | 'filler'
  | 'accession'
  | 'mnemonic'
  | 'orderTest'
  | 'text';

export type ParsedOrderTestSearch = {
  accession: string;
  testCode: string;
};

/**
 * Split an order-test display token (`YY-NNNNN/CODE`) into accession + mnemonic.
 */
export function parseOrderTestDisplaySearch(input: string): ParsedOrderTestSearch | null {
  const trimmed = input.trim();
  const slashIdx = trimmed.indexOf('/');
  if (slashIdx <= 0) return null;
  const accession = trimmed.slice(0, slashIdx).trim();
  const testCode = trimmed.slice(slashIdx + 1).trim().toUpperCase();
  if (!looksLikeAccession(accession) || !looksLikeMnemonic(testCode)) return null;
  return { accession, testCode };
}

/**
 * Render a stored clinical identifier. Empty values become a placeholder dash.
 */
export function formatClinicalId(value: string | null | undefined): string {
  if (value == null || value.trim() === '') return '-';
  return value.trim();
}

/** Compact a search token (strip spaces/dashes, uppercase) for numeric matching. */
export function compactIdentifier(input: string): string {
  return input.trim().replace(/[\s-]/g, '').toUpperCase();
}

export function looksLikeMrn(input: string): boolean {
  return ID_PATTERNS.mrn.test(compactIdentifier(input));
}

export function looksLikeFiller(input: string): boolean {
  return ID_PATTERNS.filler.test(compactIdentifier(input));
}

export function looksLikeAccession(input: string): boolean {
  const trimmed = input.trim();
  return ID_PATTERNS.accession.test(trimmed) || ID_PATTERNS.aliquotAccession.test(trimmed);
}

export function looksLikeMnemonic(input: string): boolean {
  return ID_PATTERNS.testMnemonic.test(input.trim().toUpperCase());
}

/**
 * Classify a search box token into the clinical identifier it most likely is.
 */
export function classifyClinicalSearch(input: string): ClinicalSearchKind {
  const trimmed = input.trim();
  if (!trimmed) return 'text';
  if (parseOrderTestDisplaySearch(trimmed)) return 'orderTest';
  if (looksLikeMnemonic(trimmed)) return 'mnemonic';
  if (looksLikeFiller(trimmed)) return 'filler';
  if (looksLikeAccession(trimmed)) return 'accession';
  if (looksLikeMrn(trimmed)) return 'mrn';
  return 'text';
}

/**
 * Order-line display: accession/mnemonic (e.g. `26-04567/CBC`).
 */
export function formatOrderTestDisplay(
  accession?: string | null,
  testCode?: string | null,
): string {
  const acc = accession?.trim() ?? '';
  const code = testCode?.trim().toUpperCase() ?? '';
  if (acc && code) return `${acc}/${code}`;
  return acc || code || '-';
}

export function formatAccessionNumber(value: string | null | undefined): string {
  if (!value || !value.trim()) return '';
  return value.trim();
}

/**
 * Display helpers. Pass the row id (already in clinical format).
 */
export const displayId = {
  patient: (patientId: string | null | undefined) => formatClinicalId(patientId),
  order: (orderId: string | null | undefined) => formatClinicalId(orderId),
  sample: (sampleId: string | null | undefined) => formatClinicalId(sampleId),
  orderTest: (sampleIdOrDisplay: string | null | undefined, testCode?: string | null) =>
    typeof sampleIdOrDisplay === 'string' && testCode
      ? formatOrderTestDisplay(sampleIdOrDisplay, testCode)
      : formatClinicalId(sampleIdOrDisplay),
  accession: formatAccessionNumber,
  invoice: (invoiceId: string | null | undefined) => formatClinicalId(invoiceId),
  payment: (paymentId: string | null | undefined) => formatClinicalId(paymentId),
  report: (orderId: string | null | undefined) => formatClinicalId(orderId),
  user: (userId: string | null | undefined) => formatClinicalId(userId),
  audit: (eventId: string | null | undefined) => formatClinicalId(eventId),
};
