/**
 * Reports Page
 * Report generation and management with PDF support.
 * `/reports` and `/reports/:id` both render the list so the table stays
 * visible behind the preview modal.
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { ReportList } from './ReportList';

/**
 * Reports Page Component
 * Handles routing between the report list and a deep-linked preview.
 */
export function Reports() {
  return (
    <Routes>
      <Route index element={<ReportList />} />
      <Route path=":id" element={<ReportList />} />
      <Route path="*" element={<Navigate to="/reports" replace />} />
    </Routes>
  );
}
