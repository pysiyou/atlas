/**
 * Reports Page
 * Report generation and management with PDF support
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ReportList } from '@/features/lab/reports/pages/ReportList';
import { ReportDetail } from '@/features/lab/reports/pages/ReportDetail';

/**
 * Reports Page Component
 * Handles routing between report list and detail views
 */
export const Reports: React.FC = () => {
  return (
    <Routes>
      {/* Default route: show report list */}
      <Route index element={<ReportList />} />
      {/* Detail route: show individual report preview */}
      <Route path=":id" element={<ReportDetail />} />
      {/* Fallback: redirect to report list */}
      <Route path="*" element={<Navigate to="/reports" replace />} />
    </Routes>
  );
};
