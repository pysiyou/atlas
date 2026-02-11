/**
 * PatientDetail Component
 * Main component for displaying patient details with responsive layouts
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useResponsiveLayout } from '@/hooks';
import { usePatient, useOrdersByPatient } from '@/hooks/queries';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { DetailPageShell, DetailPageHeader } from '@/shared/components';
import { EditPatientModal } from '../components/EditPatientModal';
import { PatientHeader } from '../components/PatientHeader';
import { SmallScreenLayout, MediumScreenLayout, LargeScreenLayout } from './PatientDetailLayouts';

export const PatientDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const { isSmall, isMedium, isLarge } = useResponsiveLayout();
  const { openModal } = useModal();

  const { patient, isLoading: patientLoading } = usePatient(id);
  const { orders: patientOrders, isLoading: ordersLoading } = useOrdersByPatient(id);

  const handleEdit = () => setIsEditModalOpen(true);
  const handleCloseEdit = () => setIsEditModalOpen(false);
  const handleNewOrder = () => openModal(ModalType.NEW_ORDER, { patientId: patient?.id.toString() ?? '' });
  const handleOrderClick = (orderId: string) => navigate(`/orders/${orderId}`);

  const renderContent = () => {
    if (!patient) return null;
    const layoutProps = {
      patient,
      orders: patientOrders,
      onOrderClick: handleOrderClick,
      onNewOrder: handleNewOrder,
    };
    if (isSmall) return <SmallScreenLayout {...layoutProps} />;
    if (isMedium) return <MediumScreenLayout {...layoutProps} />;
    return <LargeScreenLayout {...layoutProps} />;
  };

  const header = patient ? (
    <PatientHeader
      patient={patient}
      isLarge={isLarge}
      onEdit={handleEdit}
      onNewOrder={handleNewOrder}
    />
  ) : (
    <DetailPageHeader title="Patient" />
  );

  return (
    <>
      <DetailPageShell
        header={header}
        loading={patientLoading || ordersLoading}
        loadingMessage="Loading patient..."
        notFound={!patient}
        notFoundTitle="Patient Not Found"
        notFoundDescription="The patient could not be found."
      >
        {renderContent()}
      </DetailPageShell>
      {patient != null && (
        <EditPatientModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEdit}
          patient={patient}
          mode="edit"
        />
      )}
    </>
  );
};
