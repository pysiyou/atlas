/**
 * ProductivityTable Component
 * Technician productivity breakdown
 */

import React from 'react';
import type { ProductivityMetrics } from '../types';

interface ProductivityTableProps {
  data: ProductivityMetrics;
  /** When true, render only the table (no card wrapper/heading); for embedding in WidgetCard */
  compact?: boolean;
}

export const ProductivityTable: React.FC<ProductivityTableProps> = ({ data, compact = false }) => {
  if (data.byTechnician.length === 0) {
    const empty = <div className="flex items-center justify-center py-8 text-fg-subtle text-sm">No productivity data available</div>;
    if (compact) return empty;
    return (
      <div className="bg-panel border border-stroke rounded-lg p-4">
        <h3 className="text-sm text-fg mb-4">Technician Productivity</h3>
        <div className="flex items-center justify-center h-[200px] text-fg-subtle text-sm">No productivity data available</div>
      </div>
    );
  }

  const table = (
    <div className="overflow-x-auto max-h-[200px] overflow-y-auto">
      <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stroke">
              <th className="text-left py-2 px-3 text-xs text-fg-subtle uppercase tracking-wide">
                Technician
              </th>
              <th className="text-right py-2 px-3 text-xs text-fg-subtle uppercase tracking-wide">
                Results Entered
              </th>
              <th className="text-right py-2 px-3 text-xs text-fg-subtle uppercase tracking-wide">
                Validations
              </th>
              <th className="text-right py-2 px-3 text-xs text-fg-subtle uppercase tracking-wide">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.byTechnician.slice(0, 10).map((tech) => (
              <tr key={tech.userId} className="border-b border-stroke/50 hover:bg-panel-hover">
                <td className="py-2 px-3 text-fg">
                  {tech.userName}
                </td>
                <td className="py-2 px-3 text-right text-fg-muted">
                  {tech.resultsEntered}
                </td>
                <td className="py-2 px-3 text-right text-fg-muted">
                  {tech.validations}
                </td>
                <td className="py-2 px-3 text-right text-brand">
                  {tech.resultsEntered + tech.validations}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );

  if (compact) return table;
  return (
    <div className="bg-panel border border-stroke rounded-lg p-4">
      <h3 className="text-sm text-fg mb-4">Technician Productivity</h3>
      {table}
    </div>
  );
};
