/**
 * Billing Page
 * Billing and payment management
 */

import React, { useState } from 'react';
import { useBilling } from '@/features/billing/BillingContext';
import { useUpdateOrder } from '@/hooks/queries';
import { Card, SectionContainer, Badge, Button, Input, Select, Icon } from '@/shared/ui';
import { formatCurrency, formatDate } from '@/utils';
import { displayId } from '@/utils/id-display';
import toast from 'react-hot-toast';
import type { PaymentMethod, Payment } from '@/types';

export const Billing: React.FC = () => {
  const billingContext = useBilling();
  const updateOrderMutation = useUpdateOrder();
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');

  if (!billingContext) return <div>Loading...</div>;

  const { invoices, payments, addPayment, getTotalRevenue, getOutstandingInvoices } =
    billingContext;

  const outstandingInvoices = getOutstandingInvoices();
  const todayRevenue = getTotalRevenue(new Date().toISOString().split('T')[0]);

  const handleProcessPayment = () => {
    if (!selectedInvoice) return;

    const invoice = invoices.find(i => i.invoiceId === selectedInvoice);
    if (!invoice) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    const payment: Payment = {
      paymentId: 0, // Temporary - backend will assign real ID
      orderId: invoice.orderId,
      invoiceId: invoice.invoiceId,
      amount,
      paymentMethod,
      paidAt: new Date().toISOString(),
      receivedBy: 0, // Should be current user ID (number)
      receiptGenerated: true,
    };

    addPayment(payment);

    // Update order payment status
    const newAmountPaid = invoice.amountPaid + amount;
    // Order uses 'unpaid' | 'paid', so we convert the status
    const orderPaymentStatus = newAmountPaid >= invoice.total ? 'paid' : 'unpaid';
    updateOrderMutation.mutate({
      orderId: invoice.orderId.toString(),
      updates: { paymentStatus: orderPaymentStatus },
    });

    toast.success('Payment processed successfully');
    setSelectedInvoice(null);
    setPaymentAmount('');
  };

  const paymentMethodOptions = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit-card', label: 'Credit Card' },
    { value: 'debit-card', label: 'Debit Card' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'bank-transfer', label: 'Bank Transfer' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start gap-3">
            <div className="p-3 bg-green-50 rounded">
              <Icon name="trending-up" className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Today's Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(todayRevenue)}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="p-3 bg-orange-50 rounded">
              <Icon name="dollar-sign" className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Outstanding</div>
              <div className="text-2xl font-bold text-orange-600">{outstandingInvoices.length}</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="p-3 bg-sky-50 rounded">
              <Icon name="credit-card" className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Payments</div>
              <div className="text-2xl font-bold text-sky-600">{payments.length}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Outstanding Invoices */}
      <SectionContainer title="Outstanding Invoices">
        {outstandingInvoices.length > 0 ? (
          <div className="space-y-3">
            {outstandingInvoices.map(invoice => (
              <div key={invoice.invoiceId} className="border border-gray-200 rounded p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{displayId.invoice(invoice.invoiceId)}</div>
                    <div className="text-sm text-gray-600">{invoice.patientName}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(invoice.createdAt)} • {invoice.items.length} item(s)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-sky-600">
                      {formatCurrency(invoice.total)}
                    </div>
                    <Badge variant={invoice.paymentStatus} size="sm" />
                  </div>
                </div>

                {selectedInvoice === invoice.invoiceId ? (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                    />
                    <Select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      options={paymentMethodOptions}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="cancel"
                        showIcon={false}
                        onClick={() => setSelectedInvoice(null)}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" variant="submit" onClick={handleProcessPayment}>
                        Process
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedInvoice(invoice.invoiceId);
                        setPaymentAmount(invoice.amountDue.toString());
                      }}
                    >
                      Process Payment
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No outstanding invoices</p>
          </div>
        )}
      </SectionContainer>
    </div>
  );
};
