/**
 * Amount field for partial or full payment. Caps at remaining balance.
 */
import React, { useState } from 'react';
import { cn, formatCurrency } from '@/utils';
import { FIELD_ERROR_CAPTION, FORM_FIELD_LABEL, TONE, inputBase, inputError, text } from '@/theme/recipes';
import { parsePaymentAmount, roundMoney } from '../utils/paymentStatus';

export interface PaymentAmountInputProps {
  /** Remaining balance that this payment cannot exceed. */
  remainingAmount: number;
  /** Current amount to charge. */
  value: number;
  /** Called with a rounded amount whenever the field changes. */
  onChange: (amount: number) => void;
  disabled?: boolean;
  /** Inline validation message (e.g. exceeds remaining). */
  error?: string | null;
}

function formatDraft(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return String(roundMoney(amount));
}

export const PaymentAmountInput: React.FC<PaymentAmountInputProps> = ({
  remainingAmount,
  value,
  onChange,
  disabled = false,
  error = null,
}) => {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatDraft(value));
  const display = focused ? draft : formatDraft(value);

  const commit = (raw: string) => {
    const parsed = parsePaymentAmount(raw);
    const capped = Math.min(parsed, roundMoney(remainingAmount));
    onChange(capped);
    return formatDraft(capped);
  };

  return (
    <div>
      <label className={`${FORM_FIELD_LABEL} mb-space-2`} htmlFor="payment-amount">
        Amount <span className={TONE.danger.fg}>*</span>
      </label>
      <input
        id="payment-amount"
        type="text"
        inputMode="decimal"
        placeholder={formatCurrency(remainingAmount)}
        value={display}
        onFocus={() => {
          setDraft(formatDraft(value));
          setFocused(true);
        }}
        onChange={e => {
          const raw = e.target.value;
          setDraft(raw);
          onChange(parsePaymentAmount(raw));
        }}
        onBlur={() => {
          setDraft(commit(draft));
          setFocused(false);
        }}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={cn(inputBase, error && inputError)}
      />
      <p className={`${text({ role: 'caption' })} mt-space-1`}>
        Remaining {formatCurrency(remainingAmount)}
      </p>
      {error ? <p className={`${FIELD_ERROR_CAPTION} mt-space-1`}>{error}</p> : null}
    </div>
  );
};
