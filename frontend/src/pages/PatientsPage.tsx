/**
 * Patients Page
 * Patient management - list, search, and register
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PatientList } from '@/features/patient/pages/PatientList/PatientList';
import { PatientDetail } from '@/features/patient/pages/PatientDetail/PatientDetail';

export const Patients: React.FC = () => {
  return (
    <Routes>
      <Route index element={<PatientList />} />
      <Route path=":id" element={<PatientDetail />} />

      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  );
};
