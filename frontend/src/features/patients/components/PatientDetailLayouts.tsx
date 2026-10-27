/**
 * Patient Detail Layout Components
 * Responsive layouts for the patient detail page.
 *
 * Top row is the patient record, grouped by topic.
 * Bottom row places related orders beside the reports list.
 */

import React from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import { Panel } from '@/components/surfaces';
import { LAYOUT } from '@/theme/recipes';
import { cn } from '@/utils';
import type { Patient, Order } from '@/types';
import { GeneralInfoSection } from './GeneralInfoSection';
import { MedicalHistorySectionDisplay } from './MedicalHistorySectionDisplay';
import { CareSnapshotSection } from './CareSnapshotSection';
import { PatientOrdersTable } from './PatientOrdersTable';
import { PatientReportsList } from './PatientReportsList';
import { getReportableOrders } from '../utils/patientFormatters';

interface LayoutProps {
  loading?: boolean;
  patient?: Patient;
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  onNewOrder: () => void;
}

/** Count label for a panel header. Always a string so the meta slot stays stable. */
function countMeta(count: number): string {
  return String(count);
}

function RelatedOrdersHeader({ onNewOrder }: { onNewOrder: () => void }) {
  return (
    <IconButton onClick={onNewOrder} {...actionButtonPreset('add')} size="sm" title="New Order" />
  );
}

/**
 * SmallScreenLayout — single column.
 * Record panels first, then orders, then reports directly underneath.
 */
export const SmallScreenLayout: React.FC<LayoutProps> = ({
  loading = false,
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className={LAYOUT.detailScroll}>
      <Panel
        preset="panel.page.visible.shrink"
        title="General Info"
        loading={loading}
        loadingShape="fields"
        loadingRows={6}
      >
        {patient ? <GeneralInfoSection patient={patient} /> : null}
      </Panel>

      <Panel
        preset="panel.page.visible.shrink"
        title="Medical History"
        loading={loading}
        loadingShape="fields"
        loadingRows={6}
      >
        {patient ? <MedicalHistorySectionDisplay patient={patient} /> : null}
      </Panel>

      <Panel
        preset="panel.page.visible.shrink"
        title="Care Snapshot"
        loading={loading}
        loadingShape="fields"
        loadingRows={4}
      >
        {patient ? <CareSnapshotSection patient={patient} /> : null}
      </Panel>

      <Panel
        preset="panel.pageEmbed.visible.shrink"
        title="Related Orders"
        loading={loading}
        loadingShape="table"
        loadingTableColumns={5}
        loadingTableRows={4}
        loadingHeaderAside={!loading}
        headerEnd={loading ? undefined : <RelatedOrdersHeader onNewOrder={onNewOrder} />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} loading={loading} />
      </Panel>

      <Panel
        preset="panel.page.visible.shrink.flexColumn"
        title="Reports"
        meta={loading ? undefined : countMeta(getReportableOrders(orders).length)}
        loading={loading}
        loadingShape="list"
        loadingRows={3}
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
  loading = false,
  patient,
  orders,
  onOrderClick,
  onNewOrder,
}) => {
  return (
    <div className={cn(LAYOUT.detailGrid2, 'w-full pb-layout-scroll-end')}>
      <Panel preset="panel.page.visible" title="General Info" loading={loading} loadingShape="fields" loadingRows={6}>
        {patient ? <GeneralInfoSection patient={patient} /> : null}
      </Panel>

      <Panel preset="panel.page.visible" title="Medical History" loading={loading} loadingShape="fields" loadingRows={6}>
        {patient ? <MedicalHistorySectionDisplay patient={patient} /> : null}
      </Panel>

      <Panel preset="panel.page.visible.span2" title="Care Snapshot" loading={loading} loadingShape="fields" loadingRows={4}>
        {patient ? <CareSnapshotSection patient={patient} /> : null}
      </Panel>

      <Panel
        preset="panel.pageEmbed.visible"
        title="Related Orders"
        loading={loading}
        loadingShape="table"
        loadingTableColumns={5}
        loadingTableRows={4}
        loadingHeaderAside={!loading}
        headerEnd={loading ? undefined : <RelatedOrdersHeader onNewOrder={onNewOrder} />}
      >
        <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} loading={loading} />
      </Panel>

      <Panel
        preset="panel.page.visible.flexColumn"
        title="Reports"
        meta={loading ? undefined : countMeta(getReportableOrders(orders).length)}
        loading={loading}
        loadingShape="list"
        loadingRows={3}
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
  loading = false,
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
        <Panel preset="panel.page.auto.fill" title="General Info" loading={loading} loadingShape="fields" loadingRows={6}>
          {patient ? <GeneralInfoSection patient={patient} /> : null}
        </Panel>

        <Panel preset="panel.page.auto.fill" title="Medical History" loading={loading} loadingShape="fields" loadingRows={6}>
          {patient ? <MedicalHistorySectionDisplay patient={patient} /> : null}
        </Panel>

        <Panel preset="panel.page.auto.fill" title="Care Snapshot" loading={loading} loadingShape="fields" loadingRows={4}>
          {patient ? <CareSnapshotSection patient={patient} /> : null}
        </Panel>
      </div>

      <div className={cn(LAYOUT.detailGrid3, 'min-h-0 h-full items-stretch')}>
        <Panel
          preset="panel.pageEmbed.span2Min"
          title="Related Orders"
          loading={loading}
          loadingShape="table"
          loadingTableColumns={5}
          loadingTableRows={5}
          loadingHeaderAside={!loading}
          headerEnd={loading ? undefined : <RelatedOrdersHeader onNewOrder={onNewOrder} />}
        >
          <PatientOrdersTable orders={orders} onOrderClick={onOrderClick} loading={loading} />
        </Panel>

        <Panel
          preset="panel.page.detailMinH.flexColumn"
          title="Reports"
          meta={loading ? undefined : countMeta(getReportableOrders(orders).length)}
          loading={loading}
          loadingShape="list"
          loadingRows={3}
        >
          <PatientReportsList orders={orders} />
        </Panel>
      </div>
    </div>
  );
};
