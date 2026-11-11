/**
 * CatalogDetail Component
 *
 * Displays comprehensive details about a single test from the catalog.
 * Uses BalancedColumnsLayout for automatic table arrangement.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import { useTest } from '../api/tests';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { BalancedColumnsLayout } from '@/components/display';
import { DetailPageShell, PageHeader } from '@/components/layout';
import { Panel } from '@/components/surfaces';
import { SPACING } from '@/theme/recipes';
import { feedbackTitle } from '@/feedback';
import { buildCatalogDetailTables, catalogDetailColumnCount } from './catalogDetailTables';

/**
 * Catalog detail page for a single test code.
 */
export const CatalogDetail: React.FC = () => {
  const { testCode } = useParams<{ testCode: string }>();
  const breakpoint = useBreakpoint();
  const columnCount = catalogDetailColumnCount(breakpoint);
  const { test, isLoading, isError } = useTest(testCode);

  if (isLoading) {
    return (
      <DetailPageShell header={<PageHeader title="Test" />} loading>
        <div
          className="grid gap-layout-section"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columnCount * 2 }).map((_, index) => (
            <Panel
              key={index}
              preset="panel.pageEmbed.visible"
              title="Loading"
              loading
            />
          ))}
        </div>
      </DetailPageShell>
    );
  }

  if (isError || !test) {
    return (
      <DetailPageShell
        header={<PageHeader title="Test" />}
        notFound
        notFoundTitle={feedbackTitle('catalog.detail.notFoundTitle')}
        notFoundDescription={
          testCode != null
            ? `The test with code "${testCode}" could not be found in the catalog.`
            : feedbackTitle('catalog.detail.notFoundDescription')
        }
      >
        {null}
      </DetailPageShell>
    );
  }

  return (
    <DetailPageShell header={<PageHeader title={test.name} subtitle={test.code} />}>
      <BalancedColumnsLayout
        tables={buildCatalogDetailTables(test)}
        columns={columnCount}
        className={SPACING.pbScrollEnd}
      />
    </DetailPageShell>
  );
};
