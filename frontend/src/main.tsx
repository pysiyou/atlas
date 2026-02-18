/**
 * Application Entry Point
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { initializeTheme } from '@/components/theme/theme';
import { companyConfig } from '@/config';
import '@/components/theme/theme.css';
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
