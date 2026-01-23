/**
 * PatientDetail Component
 * Main component for displaying patient details with responsive layouts
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResponsiveLayout } from '@/hooks';
import { usePatient, useOrdersByPatient } from '@/hooks/queries';
import { EditPatientModal } from './EditPatientModal';
import {
  PatientHeader,
  SmallScreenLayout,
  MediumScreenLayout,
  LargeScreenLayout,
} from './components';

export const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();

  // Use TanStack Query hooks
  const { patient, isLoading: patientLoading } = usePatient(id);
  const { orders: patientOrders, isLoading: ordersLoading } = useOrdersByPatient(id);

  // Loading state
  if (patientLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-12">
          <p className="text-gray-600">Patient not found</p>
        </div>
      </div>
    );
  }

  // Event handlers
  const handleEdit = () => setIsEditModalOpen(true);
  const handleCloseEdit = () => setIsEditModalOpen(false);
  const handleNewOrder = () => navigate(`/orders/new?patientId=${patient.id}`);
  const handleOrderClick = (orderId: string) => navigate(`/orders/${orderId}`);

  // Render appropriate layout based on screen size
  const renderContent = () => {
    const layoutProps = {
      patient,
      orders: patientOrders,
      onOrderClick: handleOrderClick,
      onNewOrder: handleNewOrder,
    };

    if (isSmall) {
      return <SmallScreenLayout {...layoutProps} />;
    }

    if (isMedium) {
      return <MediumScreenLayout {...layoutProps} />;
    }

    return <LargeScreenLayout {...layoutProps} />;
  };

  return (
    <div className="h-full flex flex-col p-6 transition-all duration-300">
      <PatientHeader
        patient={patient}
        isLarge={isLarge}
        onEdit={handleEdit}
        onNewOrder={handleNewOrder}
      />

      {renderContent()}

      {patient && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEdit}
          patient={patient}
          mode="edit"
        />
      )}
    </div>
  );
};
