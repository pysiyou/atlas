/**
 * Detail-page loading chrome — same 3+2 panel grid as patient/order large layouts.
 * Each panel is already at final size with the shared field placeholder.
 */

import { Panel } from '@/components/surfaces';
import { LAYOUT } from '@/theme/recipes';
import { cn } from '@/utils';

export function DetailPageLoadingGrid({
  topTitles,
  bottomLeftTitle,
  bottomRightTitle,
}: {
  topTitles: readonly [string, string, string];
  bottomLeftTitle: string;
  bottomRightTitle: string;
}) {
  return (
    <div className={LAYOUT.detailGridRowsSplit}>
      <div className={cn(LAYOUT.detailGrid3, 'min-h-0 h-full items-stretch')}>
        {topTitles.map(title => (
          <Panel
            key={title}
            preset="panel.page.auto.fill"
            title={title}
            loading
          />
        ))}
      </div>
      <div className={cn(LAYOUT.detailGrid3, 'min-h-0 h-full items-stretch')}>
        <Panel
          preset="panel.pageEmbed.span2Min"
          title={bottomLeftTitle}
          loading
        />
        <Panel
          preset="panel.page.detailMinH.flexColumn"
          title={bottomRightTitle}
          loading
        />
      </div>
    </div>
  );
}

export const PATIENT_DETAIL_LOADING_GRID = {
  topTitles: ['General Info', 'Medical History', 'Care Snapshot'] as const,
  bottomLeftTitle: 'Related Orders',
  bottomRightTitle: 'Reports',
};

export const ORDER_DETAIL_LOADING_GRID = {
  topTitles: ['Order Information', 'Patient Information', 'Order activity'] as const,
  bottomLeftTitle: 'Tests',
  bottomRightTitle: 'Billing Summary',
};
