import React, { type ReactNode } from 'react';
import { Card } from '@/shared/ui';
import { OrderHeader, OrderMetadata } from './OrderDetailComponents';
import { usePatients } from '@/hooks';
import { getPatientName } from '@/utils/typeHelpers';
import type { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  children?: ReactNode;
  className?: string;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  children,
  className = '',
}) => {
  const patientsContext = usePatients();
  const patientName = patientsContext
    ? getPatientName(order.patientId, patientsContext.patients)
    : 'Unknown Patient';

  return (
    <Card className={className}>
      <div className="space-y-4">
        <OrderHeader
          orderId={order.orderId}
          orderDate={order.orderDate}
          priority={order.priority}
          status={order.overallStatus}
        />
        <OrderMetadata
          patientName={patientName}
          patientId={order.patientId}
          orderDate={order.orderDate}
          referringPhysician={order.referringPhysician}
        />
        {children}
      </div>
    </Card>
  );
};
