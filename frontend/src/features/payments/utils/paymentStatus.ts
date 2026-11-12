/**
 * Payment-status helpers shared by list, receipt, and pay-now UI.
 */

/** Round currency to cents so remaining/partial math stays stable. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

/** True when the order has no remaining balance. */
export function isFullyPaid(status: string | null | undefined): boolean {
  return status === 'paid';
}

/** True when at least one payment has been recorded (partial or paid). */
export function hasRecordedPayment(status: string | null | undefined): boolean {
  return status === 'paid' || status === 'partial';
}

/**
 * Parse a typed amount string into a non-negative money value.
 * Empty or invalid input returns 0.
 */
export function parsePaymentAmount(raw: string): number {
  const cleaned = raw.replace(/[^\d.]/g, '');
  if (cleaned === '' || cleaned === '.') return 0;
  const parsed = Number.parseFloat(cleaned);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return roundMoney(parsed);
}
