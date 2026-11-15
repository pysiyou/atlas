/**
 * Patients Page
 * Patient management - list, search, and register
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { PatientList } from './PatientList';
import { PatientDetail } from './PatientDetail';

export function Patients() {
  return (
    <Routes>
      <Route index element={<PatientList />} />
      <Route path=":id" element={<PatientDetail />} />

      <Route path="*" element={<Navigate to="/patients" replace />} />
    </Routes>
  );
}
