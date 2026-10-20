/**
 * Orders Page
 * Test orders management
 */

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OrderList } from './OrderList';
import { OrderDetail } from './OrderDetail';
import { useModal, ModalType } from '@/lib/context/ModalContext';

/**
 * Redirect /orders/new to the list and open the create-order modal.
 * Defined at module scope so the route element type is stable across renders.
 */
function NewOrderRedirect() {
  const { openModal } = useModal();

  useEffect(() => {
    openModal(ModalType.NEW_ORDER, {});
  }, [openModal]);

  return <Navigate to="/orders" replace />;
}

export const Orders: React.FC = () => {
  return (
    <Routes>
      <Route index element={<OrderList />} />
      <Route path="new" element={<NewOrderRedirect />} />
      <Route path=":id" element={<OrderDetail />} />
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
};
