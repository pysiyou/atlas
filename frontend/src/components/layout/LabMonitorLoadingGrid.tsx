/**
 * Lab monitor loading chrome — same 3+table split as the live board.
 * Each panel is already at final size; table headers are static (not fetched).
 */

import { Panel } from '@/components/surfaces';
import { TableLoadingPlaceholder } from '@/components/data-table/TableLoadingPlaceholder';
import {
  SPLIT_BOTTOM_PANEL,
  SPLIT_BOTTOM_ROW,
  SPLIT_TABLE_WRAP,
  SPLIT_WORKSPACE_PAGE,
  SPLIT_WORKSPACE_PANEL,
} from '@/theme/recipes';

/** Must match LabOrdersTable.config VIEWS.full headers. */
export const LAB_MONITOR_TABLE_HEADERS = [
  'Test',
  'Patient',
  'Sample Type',
  'Referent doctor',
  'Priority',
  'Category',
  'Status',
  'Date',
] as const;

const TOP_PANELS = ['Today', 'Attention queue', 'Event log'] as const;

/**
 * Final-size monitor board skeleton used while the laboratory chunk or board data is loading.
 */
export function LabMonitorLoadingGrid() {
  return (
    <div className={SPLIT_WORKSPACE_PANEL.page}>
      <div className={SPLIT_WORKSPACE_PAGE}>
        <div className={SPLIT_BOTTOM_ROW}>
          {TOP_PANELS.map(title => (
            <div key={title} className={SPLIT_BOTTOM_PANEL}>
              <Panel
                preset="panel.pageEmbed.flexColumnFill"
                title={title}
                loading
                loadingShape="fields"
                loadingRows={6}
              />
            </div>
          ))}
        </div>
        <div className={SPLIT_TABLE_WRAP}>
          <Panel preset="panel.pageEmbed.flushHeader">
            <TableLoadingPlaceholder headers={LAB_MONITOR_TABLE_HEADERS} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
