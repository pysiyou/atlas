/**
 * Application Entry Point
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initializeTheme } from '@/shared/theme/theme';
import { companyConfig } from '@/config';
import '@/shared/theme/theme.css';
import './index.css';

// Initialize theme immediately
initializeTheme();

// Set document title from company configuration
document.title = companyConfig.getDisplayName();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
