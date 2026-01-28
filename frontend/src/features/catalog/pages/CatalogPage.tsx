/**
 * Catalog Page
 * Test catalog management - browse and view test details
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CatalogList } from './CatalogList';
import { CatalogDetail } from './CatalogDetail';

/**
 * Catalog Page Component
 * Handles routing between catalog list and detail views
 */
export const Catalog: React.FC = () => {
  return (
    <Routes>
      {/* Default route: show catalog list */}
      <Route index element={<CatalogList />} />
      {/* Detail route: show individual test details */}
      <Route path=":testCode" element={<CatalogDetail />} />
      {/* Fallback: redirect to catalog list */}
      <Route path="*" element={<Navigate to="/catalog" replace />} />
    </Routes>
  );
};
