/**
 * Patient Detail Layout Components
 * Responsive layouts for patient detail page
 */

import React from 'react';
import { SectionContainer, IconButton } from '@/shared/ui';
import type { Patient, Order } from '@/types';
import { GeneralInfoSection } from '../components/GeneralInfoSection';
import { MedicalHistorySectionDisplay } from '../components/MedicalHistorySectionDisplay';
import { PatientOrdersTable } from '../components/PatientOrdersTable';
import { ReportsList } from '../components/ReportsList';

interface LayoutProps {
  patient: Patient;
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  onNewOrder: () => void;
}

/**
 * SmallScreenLayout - Single column stack layout for small screens.
 * Uses theme tokens (bg-surface-page, bg-surface, border-border-default) so theme applies correctly.
 */
export const SmallScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-5 overflow-y-auto pb-6 bg-surface-page">
      <SectionContainer
        title="General Info"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible"
      >
        <GeneralInfoSection patient={patient} layout="grid" />
      </SectionContainer>

      <SectionContainer
        title="Medical History"
        className="shrink-0 bg-surface"
        contentClassName="overflow-visible"
      >
        <MedicalHistorySectionDisplay patient={patient} layout="grid" />
      </SectionContainer>

      <SectionContainer
        title="Related Orders"
        className="shrink-0 bg-surface"
        contentClassName="p-0 overflow-visible"
        headerClassName="!py-1.5"
        headerRight={<IconButton onClick={onNewOrder} variant="add" size="sm" title="New Order" />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} />
      </SectionContainer>

      <SectionContainer
        title="Reports"
        className="bg-surface"
        contentClassName="overflow-visible"
      >
        <ReportsList orders={orders} />
      </SectionContainer>
    </div>
  );
};

/**
 * MediumScreenLayout - Row 1: General Info | Medical History; Row 2: Reports (full width); Row 3: Related Orders (full width).
 */
export const MediumScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 w-full pb-6">
      <SectionContainer
        title="General Info"
        className="bg-surface"
        contentClassName="overflow-visible"
      >
        <GeneralInfoSection patient={patient} layout="column" />
      </SectionContainer>

      <SectionContainer
        title="Medical History"
        className="bg-surface"
        contentClassName="overflow-visible"
      >
        <MedicalHistorySectionDisplay patient={patient} layout="column" />
      </SectionContainer>

      <SectionContainer
        title="Reports"
        className="bg-surface col-span-2"
        contentClassName="overflow-visible flex flex-col"
      >
        <ReportsList orders={orders} />
      </SectionContainer>

      <SectionContainer
        title="Related Orders"
        className="bg-surface col-span-2"
        contentClassName="p-0 overflow-visible"
        headerClassName="!py-1.5"
        headerRight={<IconButton onClick={onNewOrder} variant="add" size="sm" title="New Order" />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} />
      </SectionContainer>
    </div>
  );
};

/**
 * LargeScreenLayout - Row 1: General Info | Medical History | Reports; Row 2: Related Orders (full width).
 * Vital Signs section hidden for future release.
 */
export const LargeScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div
      className="flex-1 grid grid-cols-3 grid-rows-[1fr_1fr] gap-4 min-h-0 h-full"
      style={{ height: '100%', maxHeight: '100%', overflow: 'hidden' }}
    >
      <SectionContainer
        title="General Info"
        className="h-full flex flex-col min-h-0"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
      >
        <GeneralInfoSection patient={patient} layout="column" />
      </SectionContainer>

      <SectionContainer
        title="Medical History"
        className="h-full flex flex-col min-h-0"
        contentClassName="flex-1 min-h-0 overflow-y-auto"
      >
        <MedicalHistorySectionDisplay patient={patient} layout="column" />
      </SectionContainer>

      <SectionContainer
        title="Reports"
        className="h-full flex flex-col min-h-0"
        contentClassName="flex-1 min-h-0 overflow-y-auto flex flex-col"
      >
        <ReportsList orders={orders} />
      </SectionContainer>

      <SectionContainer
        title="Related Orders"
        className="h-full flex flex-col col-span-3 min-h-0"
        contentClassName="flex-1 min-h-0 p-0 overflow-y-auto"
        headerClassName="!py-1.5"
        headerRight={
          <IconButton onClick={onNewOrder} variant="add" size="sm" title="New Order" />
        }
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} />
      </SectionContainer>
    </div>
  );
};
