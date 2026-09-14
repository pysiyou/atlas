/**
 * InsuranceClaimSection — list and submit insurance claims for an order invoice.
 */
import React, { useState } from 'react';
import { Badge, Button } from '@/components';
import { Input } from '@/components/inputs/FormField';
import { formatCurrency, displayId } from '@/utils';
import type { Invoice } from '@/types';
import {
  useOrderInsuranceClaims,
  useSubmitInsuranceClaim,
  type InsuranceClaim,
} from '../api/billing.hooks';

export interface InsuranceClaimSectionProps {
  orderId: number;
  invoice: Invoice;
}

export const InsuranceClaimSection: React.FC<InsuranceClaimSectionProps> = ({
  orderId,
  invoice,
}) => {
  const { claims, isLoading } = useOrderInsuranceClaims(orderId);
  const submitMutation = useSubmitInsuranceClaim();
  const [provider, setProvider] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [notes, setNotes] = useState('');

  const canSubmit =
    provider.trim().length > 0 &&
    policyNumber.trim().length > 0 &&
    invoice.amountDue > 0 &&
    !submitMutation.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await submitMutation.mutateAsync({
      orderId,
      invoiceId: invoice.invoiceId,
      insuranceProvider: provider.trim(),
      insuranceNumber: policyNumber.trim(),
      claimAmount: invoice.amountDue,
      notes: notes.trim() || undefined,
    });
    setProvider('');
    setPolicyNumber('');
    setNotes('');
  };

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-border-strong space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
          Insurance Claims
        </span>
        <span className="text-[10px] text-text-tertiary entity-id">
          {displayId.invoice(invoice.invoiceId)}
        </span>
      </div>

      {isLoading ? (
        <p className="text-xs text-text-tertiary">Loading claims…</p>
      ) : claims.length > 0 ? (
        <ul className="space-y-2">
          {claims.map((claim: InsuranceClaim) => (
            <li
              key={claim.claimId}
              className="flex items-start justify-between gap-2 text-xs border border-border-default rounded px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="font-medium text-text-primary truncate">{claim.insuranceProvider}</p>
                <p className="text-text-tertiary truncate">{claim.insuranceNumber}</p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant="default" size="xs">{claim.claimStatus}</Badge>
                <p className="tabular-nums mt-0.5">{formatCurrency(claim.claimAmount)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-text-tertiary">No claims submitted yet.</p>
      )}

      {invoice.amountDue > 0 && (
        <div className="space-y-2">
          <Input
            label="Provider"
            required
            value={provider}
            onChange={e => setProvider(e.target.value)}
            placeholder="Insurance company"
          />
          <Input
            label="Policy number"
            required
            value={policyNumber}
            onChange={e => setPolicyNumber(e.target.value)}
            placeholder="Member / policy ID"
          />
          <Input
            label="Notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional"
          />
          {submitMutation.isError && (
            <p className="text-xs text-danger">
              {submitMutation.error instanceof Error
                ? submitMutation.error.message
                : 'Failed to submit claim'}
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}
          >
            Submit claim ({formatCurrency(invoice.amountDue)})
          </Button>
        </div>
      )}
    </div>
  );
};
