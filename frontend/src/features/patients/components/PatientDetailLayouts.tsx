/**
 * Patient Detail Layout Components
 * Responsive layouts for the patient detail page.
 *
 * Top row is the patient record, grouped by topic.
 * Bottom row places related orders beside the reports list.
 */

import React from 'react';
import { actionButtonPreset, Panel, IconButton } from '@/components';
import { LAYOUT } from '@/components/theme/recipes';
import { cn } from '@/utils';
import type { Patient, Order } from '@/types';
import { GeneralInfoSection } from './GeneralInfoSection';
import { MedicalHistorySectionDisplay } from './MedicalHistorySectionDisplay';
import { CareSnapshotSection } from './CareSnapshotSection';
import { PatientOrdersTable } from './PatientOrdersTable';
import { PatientReportsList } from './PatientReportsList';
import { getReportableOrders } from '../utils/patientFormatters';

interface LayoutProps {
  patient: Patient;
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  onNewOrder: () => void;
}

/** Count label for a panel header. Always a string so the meta slot stays stable. */
function countMeta(count: number): string {
  return String(count);
}

/**
 * SmallScreenLayout — single column.
 * Record panels first, then orders, then reports directly underneath.
 */
export const SmallScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className={LAYOUT.detailScroll}>
      <Panel title="General Info" className="shrink-0" scroll="visible">
        <GeneralInfoSection patient={patient} />
      </Panel>

      <Panel title="Medical History" className="shrink-0" scroll="visible">
        <MedicalHistorySectionDisplay patient={patient} />
      </Panel>

      <Panel title="Care Snapshot" className="shrink-0" scroll="visible">
        <CareSnapshotSection patient={patient} />
      </Panel>

      <Panel
        title="Related Orders"
        meta={countMeta(orders.length)}
        className="shrink-0"
        padding="none"
        scroll="visible"
        headerEnd={<IconButton onClick={onNewOrder} {...actionButtonPreset('add')} size="sm" title="New Order" />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} />
      </Panel>

      <Panel
        title="Reports"
        meta={countMeta(getReportableOrders(orders).length)}
        className="shrink-0"
        scroll="visible"
        bodyClassName="flex flex-col"
      >
        <PatientReportsList orders={orders} />
      </Panel>
    </div>
  );
};

/**
 * MediumScreenLayout — two columns.
 * Profile and history share the first row, the care snapshot spans the width,
 * and reports sit beside related orders.
 */
export const MediumScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className={cn(LAYOUT.detailGrid2, 'w-full pb-layout-scroll-end')}>
      <Panel title="General Info" scroll="visible">
        <GeneralInfoSection patient={patient} />
      </Panel>

      <Panel title="Medical History" scroll="visible">
        <MedicalHistorySectionDisplay patient={patient} />
      </Panel>

      <Panel title="Care Snapshot" className="col-span-2" scroll="visible">
        <CareSnapshotSection patient={patient} />
      </Panel>

      <Panel
        title="Related Orders"
        meta={countMeta(orders.length)}
        padding="none"
        scroll="visible"
        headerEnd={<IconButton onClick={onNewOrder} {...actionButtonPreset('add')} size="sm" title="New Order" />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} />
      </Panel>

      <Panel
        title="Reports"
        meta={countMeta(getReportableOrders(orders).length)}
        scroll="visible"
        bodyClassName="flex flex-col"
      >
        <PatientReportsList orders={orders} />
      </Panel>
    </div>
  );
};

/**
 * LargeScreenLayout — three record panels on top, orders and reports on the bottom.
 * Orders take two columns so the table keeps its columns; reports use the remaining column.
 */
export const LargeScreenLayout: React.FC<LayoutProps> = ({
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div
      className="flex-1 grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-layout-section min-h-0 h-full overflow-hidden"
      style={{ height: '100%', maxHeight: '100%' }}
    >
      <div className={cn(LAYOUT.detailGrid3, 'min-h-0 h-full items-stretch')}>
        <Panel
          title="General Info"
          className="min-h-0 h-full"
          scroll="auto"
          bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <GeneralInfoSection patient={patient} />
        </Panel>

        <Panel
          title="Medical History"
          className="min-h-0 h-full"
          scroll="auto"
          bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <MedicalHistorySectionDisplay patient={patient} />
        </Panel>

        <Panel
          title="Care Snapshot"
          className="min-h-0 h-full"
          scroll="auto"
          bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <CareSnapshotSection patient={patient} />
        </Panel>
      </div>

      <div className={cn(LAYOUT.detailGrid3, 'min-h-0 h-full items-stretch')}>
        <Panel
          title="Related Orders"
          meta={countMeta(orders.length)}
          className="col-span-2 min-h-0"
          padding="none"
          scroll="auto"
          headerEnd={<IconButton onClick={onNewOrder} {...actionButtonPreset('add')} size="sm" title="New Order" />}
        >
          <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} />
        </Panel>

        <Panel
          title="Reports"
          meta={countMeta(getReportableOrders(orders).length)}
          className="min-h-0"
          scroll="auto"
          bodyClassName="flex flex-col"
        >
          <PatientReportsList orders={orders} />
        </Panel>
      </div>
    </div>
  );
};
