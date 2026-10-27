/**
 * Route / auth gate loading — skeleton layout matching app shell pages.
 */

import React from 'react';
import { Card, Panel } from '@/components/surfaces';
import { WORKSPACE, LAYOUT } from '@/theme/recipes';

function PageLoadingLayout({ fullScreen = false }: { fullScreen?: boolean }) {
  const rootClass = fullScreen
    ? 'flex min-h-screen flex-col gap-space-6 bg-surface-page p-space-6'
    : `flex flex-1 min-h-0 flex-col gap-space-6 ${WORKSPACE.contentInset}`;

  return (
    <div className={rootClass} aria-busy="true" aria-label="Loading page">
      <Card padding="md" loading loadingVariant="banner" />
      <div className={`grid grid-cols-1 lg:grid-cols-3 ${LAYOUT.balancedColumns} flex-1 min-h-0`}>
        <Panel preset="panel.page.visible" title="Loading" loading loadingShape="fields" loadingRows={6} />
        <Panel preset="panel.page.visible" title="Loading" loading loadingShape="fields" loadingRows={6} />
        <Panel preset="panel.page.visible" title="Loading" loading loadingShape="fields" loadingRows={6} />
      </div>
      <Panel preset="panel.pageEmbed.visible" title="Loading" loading loadingShape="table" loadingTableRows={4} />
    </div>
  );
}

/** Full-screen fallback for auth bootstrap and public routes (no app shell). */
export const PageLoadingFallback: React.FC = () => <PageLoadingLayout fullScreen />;

/** Fills the app shell content pane during lazy route chunk loads. */
export const PageContentLoadingFallback: React.FC = () => <PageLoadingLayout />;
