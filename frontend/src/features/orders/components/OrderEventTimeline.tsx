/**
 * Order activity timeline — placeholder shell; timeline UI will be rebuilt here.
 */

import React from 'react';

interface OrderEventTimelineProps {
  orderId: number;
}

export const OrderEventTimeline: React.FC<OrderEventTimelineProps> = ({ orderId }) => {
  return (
    <div
      className="min-h-32 w-full"
      data-order-id={orderId}
      aria-label="Order activity timeline"
    />
  );
};
