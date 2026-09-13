/**
 * Application Entry Point
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { initializeTheme } from '@/components/theme/theme';
import { companyConfig } from '@/config';
import '@/components/theme/tokens/primitives.css';
import '@/components/theme/tokens/semantic-light.css';
import '@/components/theme/tokens/semantic-dark.css';
import '@/components/theme/themes/studio-light.css';
import '@/components/theme/themes/noir-studio.css';
import '@/components/theme/themes/github.css';
import '@/components/theme/components.css';
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
