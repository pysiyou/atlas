/**
 * Analyzer activity — polls ingest audit events, refreshes lab queues, slides in bottom-right.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/authStore';
import { ROUTES } from '@/app/routes';
import { isFeatureEnabled } from '@/config';
import { fetchAuditEvents, type EventLogKind, type EventLogRecord } from '@/features/audit';
import { resolveEventLogItems } from '@/features/audit/catalog';
import { useOrderableTestNameLookup } from '@/features/catalog';
import {
  NOTICE_CARD_SHELL,
  NoticeCardBody,
  NoticeCardFooter,
  NoticeCardHeader,
} from '@/feedback';
import { Icon } from '@/components/primitives';
import { FEEDBACK_ICON_KEYS } from '@/icons';
import { invalidateWorklistQueries, queryKeys } from '@/lib/query';
import { INTERACTIVE, SHADOW, TONE, text } from '@/theme/recipes';
import { cn } from '@/utils';
import { useLabCopy } from '@/strings';
import { getLabQueueUrl } from '../constants/labConstants';
import { LAB_TECH_ROLES } from '../pages/laboratoryPageAccess';

const SEEN_KEY = 'atlas.labActivity.seenIds';
const QUERY_KEY = ['labActivity'] as const;
const POLL_MS = 5_000;
const LIMIT = 30;
const KINDS: EventLogKind[] = ['laboratory:result', 'laboratory:analyzer', 'laboratory:validation'];

interface ActivityItem {
  eventId: string;
  eventType: string;
  headline: string;
  metaTime: string;
  orderId?: string | null;
  sampleId?: string | null;
}

function isAnalyzerEvent(record: EventLogRecord): boolean {
  return record.eventType.startsWith('laboratory.analyzer.')
    || record.metadata?.source === 'analyzer'
    || record.actorSnapshot.role === 'analyzer'
    || record.actorId === '100000';
}

function readSeen(): Set<string> | null {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? 'null');
    if (!Array.isArray(parsed)) return null;
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return null;
  }
}

function writeSeen(ids: Set<string>): void {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...ids].slice(-200)));
  } catch {
    /* quota */
  }
}

function refreshLabData(client: QueryClient): void {
  void invalidateWorklistQueries(client);
  void client.invalidateQueries({ queryKey: queryKeys.results.all });
  void client.invalidateQueries({ queryKey: queryKeys.orders.all });
  void client.invalidateQueries({ queryKey: queryKeys.criticalValues.all });
}

function orderHref(orderId: string): string {
  return `${ROUTES.ORDERS}/${orderId}`;
}

function validationHref(item: Pick<ActivityItem, 'orderId' | 'sampleId'>): string {
  const search = item.sampleId?.trim() || item.orderId?.trim();
  return getLabQueueUrl('validation', search ? { search } : undefined);
}

function headlineText(item: ReturnType<typeof resolveEventLogItems>[number]): string {
  const fromParts = item.headlineParts.map(part => part.text).join('').replace(/\s+/g, ' ').trim();
  return fromParts || `${item.headline.verbPhrase} ${item.headline.targetLabel}`.trim();
}

function useAnalyzerActivity() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isRestoring, hasRole } = useAuthStore();
  const enabled = isAuthenticated && !isRestoring && hasRole(LAB_TECH_ROLES);
  const { getTestName } = useOrderableTestNameLookup();
  const refreshedIds = useRef(new Set<string>());
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const rows = await fetchAuditEvents({
        scope: 'stream',
        kinds: KINDS.join(','),
        hours: 1,
        limit: LIMIT,
      });
      return rows.filter(isAnalyzerEvent).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          || b.eventId.localeCompare(a.eventId),
      );
    },
    enabled,
    staleTime: 0,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
  });
  const events = useMemo(() => query.data ?? [], [query.data]);
  const [seen, setSeen] = useState<Set<string> | null>(readSeen);

  if (query.isSuccess && seen == null) {
    const seeded = new Set(events.map(event => event.eventId));
    writeSeen(seeded);
    setSeen(seeded);
  }

  const items = useMemo<ActivityItem[]>(() => {
    if (!seen) return [];
    const fresh = events.filter(event => !seen.has(event.eventId));
    return resolveEventLogItems(fresh, { getTestName }).map((resolved, index) => {
      const record = fresh[index] ?? resolved.record;
      return {
        eventId: record.eventId,
        eventType: record.eventType,
        headline: headlineText(resolved),
        metaTime: resolved.metaTime,
        orderId: record.orderId,
        sampleId: record.sampleId,
      };
    });
  }, [events, getTestName, seen]);

  useEffect(() => {
    const unseen = items.filter(item => !refreshedIds.current.has(item.eventId));
    if (unseen.length === 0) return;
    for (const item of unseen) refreshedIds.current.add(item.eventId);
    refreshLabData(queryClient);
  }, [items, queryClient]);

  const markRead = useCallback((ids: string[]) => {
    setSeen(prev => {
      const next = new Set(prev ?? []);
      for (const id of ids) next.add(id);
      writeSeen(next);
      return next;
    });
  }, []);

  return {
    enabled,
    items,
    markAllRead: () => markRead(events.map(event => event.eventId)),
    dismissItem: (eventId: string) => markRead([eventId]),
  };
}

const LINK_BTN = cn(INTERACTIVE.clickable, text({ role: 'link' }), 'border-0 bg-transparent p-0');

export function LabActivityPanel() {
  const copy = useLabCopy().activity;
  const navigate = useNavigate();
  const { enabled, items, markAllRead, dismissItem } = useAnalyzerActivity();
  const open = enabled && items.length > 0;

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          key="lab-activity"
          role="status"
          aria-label={copy.panelTitle}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            NOTICE_CARD_SHELL,
            'border border-border-default',
            SHADOW.overlay,
            'toast-wash',
            'fixed bottom-space-4 right-space-4 z-[60] w-[min(100vw-2rem,24rem)] max-h-[min(28rem,70vh)]',
          )}
        >
          <NoticeCardHeader
            icon={
              <Icon
                iconKey={FEEDBACK_ICON_KEYS.info}
                className={cn('mt-space-0-5 h-5 w-5 shrink-0', TONE.info.fg)}
              />
            }
            title={copy.panelTitle}
            titleClassName={text({ role: 'title-section' })}
          />
          <NoticeCardBody padded={false} className="min-h-0 flex-1 overflow-y-auto">
            <ul className="m-0 list-none divide-y divide-border-subtle p-0">
              {items.map(item => {
                const ingest = item.eventType.startsWith('laboratory.analyzer.');
                const orderLink = item.orderId ? orderHref(item.orderId) : null;
                const primaryHref = ingest ? orderLink : validationHref(item);
                const primaryLabel = ingest ? copy.viewOrder : copy.openValidation;
                const go = (href: string) => {
                  dismissItem(item.eventId);
                  navigate(href);
                };
                return (
                  <li key={item.eventId} className="px-space-4 py-space-3">
                    <p className={cn('m-0', text({ role: 'body' }))}>{item.headline}</p>
                    <p className={cn('mt-space-1 mb-0', text({ role: 'caption', intent: 'muted' }))}>
                      {item.metaTime}
                    </p>
                    <div className="mt-space-2 flex flex-wrap gap-space-2">
                      {primaryHref ? (
                        <button type="button" className={LINK_BTN} onClick={() => go(primaryHref)}>
                          {primaryLabel}
                        </button>
                      ) : null}
                      {orderLink && primaryHref !== orderLink ? (
                        <button type="button" className={LINK_BTN} onClick={() => go(orderLink)}>
                          {copy.viewOrder}
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </NoticeCardBody>
          <NoticeCardFooter>
            <button
              type="button"
              className={cn(INTERACTIVE.clickable, text({ role: 'body', intent: 'muted' }), 'border-0 bg-transparent p-0')}
              onClick={markAllRead}
            >
              {copy.markAllRead}
            </button>
            {isFeatureEnabled('audit') ? (
              <button
                type="button"
                className={LINK_BTN}
                onClick={() => navigate(`${ROUTES.EVENT_LOG}?eventKinds=${KINDS.join(',')}`)}
              >
                {copy.viewEventLog}
              </button>
            ) : null}
          </NoticeCardFooter>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
