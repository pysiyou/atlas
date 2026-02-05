/**
 * PatientDetail Component
 * Main component for displaying patient details with responsive layouts
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResponsiveLayout } from '@/hooks';
import { usePatient, useOrdersByPatient } from '@/hooks/queries';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { EditPatientModal } from '../components/EditPatientModal';
import { PatientHeader } from '../components/PatientHeader';
import { SmallScreenLayout, MediumScreenLayout, LargeScreenLayout } from './PatientDetailLayouts';

export const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();
  const { openModal } = useModal();

  // Use TanStack Query hooks
  const { patient, isLoading: patientLoading } = usePatient(id);
  const { orders: patientOrders, isLoading: ordersLoading } = useOrdersByPatient(id);

  // Loading state
  if (patientLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-tertiary">Loading...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-12">
          <p className="text-text-tertiary">Patient not found</p>
        </div>
      </div>
    );
  }

  // Event handlers
  const handleEdit = () => setIsEditModalOpen(true);
  const handleCloseEdit = () => setIsEditModalOpen(false);
  const handleNewOrder = () => openModal(ModalType.NEW_ORDER, { patientId: patient.id.toString() });
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
    <div className="h-full flex flex-col p-6">
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
