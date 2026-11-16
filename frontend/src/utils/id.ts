/**
 * Clinical LIS identifier display, parsing, and validation.
 *
 * Integer primary keys stay internal. UI, barcodes, and search use MRN,
 * filler/placer numbers, accessions, and catalog mnemonics.
 */

/** Regex contracts — keep in sync with `backend/app/platform/utils.py`. */
export const ID_PATTERNS = {
  mrn: /^[0-9A-Z]{6,12}$/,
  filler: /^\d{13}$/,
  accession: /^\d{2}-\d{5}$/,
  aliquotAccession: /^\d{2}-\d{5}\.\d{1,2}$/,
  testMnemonic: /^[A-Z][A-Z0-9]{1,7}$/,
  npi: /^\d{10}$/,
  employeeNumber: /^\d{6}$/,
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

export type ClinicalSearchKind = 'mrn' | 'filler' | 'accession' | 'mnemonic' | 'text';

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
 * Display helpers. Pass the stored clinical identifier, not the integer PK.
 */
export const displayId = {
  patient: (mrn: string | null | undefined) => formatClinicalId(mrn),
  order: (fillerNumber: string | null | undefined) => formatClinicalId(fillerNumber),
  sample: (accessionNumber: string | null | undefined) => formatClinicalId(accessionNumber),
  orderTest: (accessionOrDisplay: string | null | undefined, testCode?: string | null) =>
    typeof accessionOrDisplay === 'string' && testCode
      ? formatOrderTestDisplay(accessionOrDisplay, testCode)
      : formatClinicalId(accessionOrDisplay),
  accession: formatAccessionNumber,
  invoice: (invoiceNumber: string | null | undefined) => formatClinicalId(invoiceNumber),
  payment: (receiptNumber: string | null | undefined) => formatClinicalId(receiptNumber),
  report: (fillerNumber: string | null | undefined) => formatClinicalId(fillerNumber),
  user: (usernameOrEmployee: string | null | undefined) => formatClinicalId(usernameOrEmployee),
  audit: (eventId: string | null | undefined) => formatClinicalId(eventId),
};
