/**
 * Orders Page
 * Test orders management
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OrderList } from '@/features/order/pages/OrderList';
import { OrderUpsertForm } from '@/features/order/forms/OrderUpsertForm';
import { OrderDetail } from '@/features/order/pages/OrderDetail';

export const Orders: React.FC = () => {
  return (
    <Routes>
      <Route index element={<OrderList />} />
      <Route path="new" element={<OrderUpsertForm />} />
      <Route path=":id" element={<OrderDetail />} />
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
};
