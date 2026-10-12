/**
 * Full-width workflow panel for the order test detail modal.
 */

import React, { useMemo } from 'react';
import { Panel } from '@/components';
import { useUserLookup } from '@/lib/api/users';
import type { OrderTest } from '@/types';
import {
  buildOrderTestWorkflowFields,
  type OrderTestWorkflowOptions,
} from '../utils/orderTestDetailSections';
import {
  OrderTestDetailFieldGrid,
  detailFieldIsVisible,
  splitDetailFieldsIntoTwoColumns,
} from '../utils/orderTestDetailFieldColumns';

export type OrderTestWorkflowPanelProps = {
  orderTest: OrderTest;
} & OrderTestWorkflowOptions;

export const OrderTestWorkflowPanel: React.FC<OrderTestWorkflowPanelProps> = ({
  orderTest,
  linked,
  onOpenLinkedTest,
  omitResultDuplicates,
}) => {
  const { getUserName } = useUserLookup();

  const columns = useMemo(() => {
    const fields = buildOrderTestWorkflowFields(orderTest, {
      linked,
      onOpenLinkedTest,
      omitResultDuplicates,
    });
    if (!fields.some(detailFieldIsVisible)) {
      return null;
    }
    return splitDetailFieldsIntoTwoColumns(fields);
  }, [orderTest, linked, onOpenLinkedTest, omitResultDuplicates]);

  if (columns == null) {
    return null;
  }

  return (
    <Panel variant="lab" title="Workflow" className="w-full">
      <OrderTestDetailFieldGrid columns={columns} resolveUserDisplay={getUserName} />
    </Panel>
  );
};
