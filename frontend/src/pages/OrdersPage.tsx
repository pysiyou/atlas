/**
 * Orders Page
 * Test orders management
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OrderList } from '@/features/order/pages/OrderList';
import { CreateOrder } from '@/features/order/forms/OrderCreate';
import { OrderDetail } from '@/features/order/pages/OrderDetail';

export const Orders: React.FC = () => {
  return (
    <Routes>
      <Route index element={<OrderList />} />
      <Route path="new" element={<CreateOrder />} />
      <Route path=":id" element={<OrderDetail />} />
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
};
