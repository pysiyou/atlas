/**
 * Application Entry Point
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { initializeTheme, preloadThemePair } from '@/theme/theme';
import { companyConfig } from '@/config';
import '@/theme/tokens/primitives.css';
import '@/theme/tokens/typography.css';
import '@/theme/tokens/semantic-light.css';
import '@/theme/tokens/semantic-dark.css';
import '@/theme/components/index.css';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

document.title = companyConfig.getDisplayName();

/** Paint after the instance theme pair CSS is ready so the first frame is not unthemed. */
function renderApp(root: HTMLElement): void {
  initializeTheme();
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void preloadThemePair().then(
  () => renderApp(rootElement),
  () => renderApp(rootElement),
);
