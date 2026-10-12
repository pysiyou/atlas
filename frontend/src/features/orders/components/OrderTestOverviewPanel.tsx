/**
 * Full-width test overview panel for the order test detail modal.
 */

import React, { useMemo } from 'react';
import { Panel } from '@/components';
import { useUserLookup } from '@/lib/api/users';
import type { OrderTest, Test } from '@/types';
import {
  buildOrderTestOverviewFields,
  type OrderTestOverviewOptions,
} from '../utils/orderTestDetailSections';
import {
  OrderTestDetailFieldGrid,
  detailFieldIsVisible,
  splitDetailFieldsIntoTwoColumns,
} from '../utils/orderTestDetailFieldColumns';

export type OrderTestOverviewPanelProps = {
  orderTest: OrderTest;
  catalogTest?: Test;
} & OrderTestOverviewOptions;

export const OrderTestOverviewPanel: React.FC<OrderTestOverviewPanelProps> = ({
  orderTest,
  catalogTest,
  onCatalogNavigate,
}) => {
  const { getUserName } = useUserLookup();

  const columns = useMemo(() => {
    const fields = buildOrderTestOverviewFields(orderTest, catalogTest, {
      onCatalogNavigate,
    });
    if (!fields.some(detailFieldIsVisible)) {
      return null;
    }
    return splitDetailFieldsIntoTwoColumns(fields);
  }, [orderTest, catalogTest, onCatalogNavigate]);

  if (columns == null) {
    return null;
  }

  return (
    <Panel variant="lab" title="Test overview" className="w-full">
      <OrderTestDetailFieldGrid columns={columns} resolveUserDisplay={getUserName} />
    </Panel>
  );
};
