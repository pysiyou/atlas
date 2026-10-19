import { describe, expect, it } from 'vitest';
import { formatUnitForPdf } from './reportPDFBody';

describe('formatUnitForPdf', () => {
  it('converts multiplication sign and superscript exponents for Courier', () => {
    expect(formatUnitForPdf('×10⁹/L')).toBe('x10^9/L');
    expect(formatUnitForPdf('×10¹²/L')).toBe('x10^12/L');
  });

  it('leaves plain units unchanged', () => {
    expect(formatUnitForPdf('g/dL')).toBe('g/dL');
    expect(formatUnitForPdf('%')).toBe('%');
  });
});
