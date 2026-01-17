/**
 * DashboardLayout Component
 * Main layout wrapper with sidebar
 */

import React, { type ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};
