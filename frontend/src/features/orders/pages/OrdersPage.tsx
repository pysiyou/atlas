/**
 * Orders Page
 * Test orders management
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { OrderList } from './OrderList';
import { OrderDetail } from './OrderDetail';
import { useModal, ModalType } from '@/lib/context/ModalContext';

export const Orders: React.FC = () => {
  const { openModal } = useModal();

  // Redirect /new to list and open modal
  const NewOrderRedirect = () => {
    React.useEffect(() => {
      openModal(ModalType.NEW_ORDER);
    }, []);
    return <Navigate to="/orders" replace />;
  };

  return (
    <Routes>
      <Route index element={<OrderList />} />
      <Route path="new" element={<NewOrderRedirect />} />
      <Route path=":id" element={<OrderDetail />} />
      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  );
};
