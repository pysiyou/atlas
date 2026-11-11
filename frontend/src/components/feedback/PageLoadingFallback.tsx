/**
 * Route / auth gate loading.
 * Detail routes paint the real page grid so layout does not pop in after the chunk loads.
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { DetailPageLoadingGrid } from '@/components/layout/DetailPageLoadingGrid';
import {
  ORDER_DETAIL_LOADING_GRID,
  PATIENT_DETAIL_LOADING_GRID,
} from '@/components/layout/detailPageLoadingPresets';
import { LabMonitorLoadingGrid } from '@/components/layout/LabMonitorLoadingGrid';
import { PageHeader } from '@/components/layout/PageHeader';
import { TableLoadingPlaceholder } from '@/components/data-table/TableLoadingPlaceholder';
import { PANEL, WORKSPACE } from '@/theme/recipes';
import { ROUTES } from '@/config';

function pathWithoutTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isRecordDetailPath(pathname: string, collectionPath: string): boolean {
  const path = pathWithoutTrailingSlash(pathname);
  const prefix = `${collectionPath}/`;
  if (!path.startsWith(prefix)) return false;
  const rest = path.slice(prefix.length);
  return rest.length > 0 && !rest.includes('/');
}

/** Default laboratory tab is monitor (`/laboratory` and `/laboratory/monitor`). */
function isLabMonitorPath(pathname: string): boolean {
  const path = pathWithoutTrailingSlash(pathname);
  return path === ROUTES.LABORATORY || path === `${ROUTES.LABORATORY}/monitor`;
}

function TablePageLoadingLayout({ fullScreen }: { fullScreen: boolean }) {
  const rootClass = fullScreen
    ? 'flex min-h-screen flex-col bg-surface-page p-space-6'
    : `flex flex-1 min-h-0 flex-col ${WORKSPACE.contentInset}`;

  return (
    <div className={rootClass} aria-busy="true">
      <div className={`${PANEL.raisedShadowSm} flex min-h-0 flex-1 flex-col overflow-hidden`}>
        <TableLoadingPlaceholder />
      </div>
    </div>
  );
}

function DetailRouteLoadingFallback({
  title,
  grid,
}: {
  title: string;
  grid: typeof PATIENT_DETAIL_LOADING_GRID | typeof ORDER_DETAIL_LOADING_GRID;
}) {
  return (
    <div className={WORKSPACE.page} aria-busy="true">
      <PageHeader title={title} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <DetailPageLoadingGrid
          topTitles={grid.topTitles}
          bottomLeftTitle={grid.bottomLeftTitle}
          bottomRightTitle={grid.bottomRightTitle}
        />
      </div>
    </div>
  );
}

function LabMonitorRouteLoadingFallback() {
  return (
    <div className={WORKSPACE.page} aria-busy="true">
      <PageHeader variant="bar" title="Lab monitor" />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <LabMonitorLoadingGrid />
      </div>
    </div>
  );
}

function PageLoadingLayout({ fullScreen = false }: { fullScreen?: boolean }) {
  const { pathname } = useLocation();

  if (!fullScreen && isRecordDetailPath(pathname, ROUTES.PATIENTS)) {
    return <DetailRouteLoadingFallback title="Patient" grid={PATIENT_DETAIL_LOADING_GRID} />;
  }
  if (!fullScreen && isRecordDetailPath(pathname, ROUTES.ORDERS)) {
    return <DetailRouteLoadingFallback title="Order" grid={ORDER_DETAIL_LOADING_GRID} />;
  }
  if (!fullScreen && isLabMonitorPath(pathname)) {
    return <LabMonitorRouteLoadingFallback />;
  }

  return <TablePageLoadingLayout fullScreen={fullScreen} />;
}

/** Full-screen fallback for auth bootstrap and public routes (no app shell). */
export const PageLoadingFallback: React.FC = () => <PageLoadingLayout fullScreen />;

/** Fills the app shell content pane during lazy route chunk loads. */
export const PageContentLoadingFallback: React.FC = () => <PageLoadingLayout />;
