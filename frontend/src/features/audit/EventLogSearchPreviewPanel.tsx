/**
 * Large anchored panel for global event log search preview (criteria, counts, suggestions).
 */
import React from 'react';
import { Avatar, EmptyState, Icon, PANEL_EMPTY_STATE, SpinnerLoader } from '@/components';
import { FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import { CONTROL, OVERLAY, RADIUS, TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import type { AuditSearchPreviewResponse } from './api';
import {
  eventLogSearchModeLabel,
  getEventLogSearchCriteria,
} from './eventLogSearchCriteria';
import type { EventLogSearchIntent } from './eventLogSearchIntent';
import { EVENT_LOG_COPY } from './types';

const PANEL_CLASS = [
  'absolute left-0 right-0 top-full z-50 mt-space-1 text-text-primary',
  'border border-border-default/80',
  RADIUS.menu,
  'overflow-hidden',
  'bg-surface',
  OVERLAY.anchoredRaised,
  'sm:min-w-[28rem]',
].join(' ');

const SCROLL_CLASS = 'max-h-[min(70vh,28rem)] overflow-y-auto';

export interface EventLogSearchPreviewPanelProps {
  instantIntent: EventLogSearchIntent;
  preview: AuditSearchPreviewResponse | undefined;
  isFetching: boolean;
  previewInSync: boolean;
  isEmpty: boolean;
  onSelectMatch: (searchValue: string) => void;
}

export const EventLogSearchPreviewPanel: React.FC<EventLogSearchPreviewPanelProps> = ({
  instantIntent,
  preview,
  isFetching,
  previewInSync,
  isEmpty,
  onSelectMatch,
}) => {
  const criteria = getEventLogSearchCriteria(instantIntent);
  const modeLabel = eventLogSearchModeLabel(instantIntent.mode);
  const suggestionCount = (preview?.patients.length ?? 0) + (preview?.users.length ?? 0);
  const showSuggestionsSection =
    instantIntent.mode === 'text' ||
    instantIntent.mode === 'numeric' ||
    suggestionCount > 0;

  return (
    <div className={PANEL_CLASS}>
      <div className="px-space-4 py-space-3 bg-surface-page/70 border-b border-border-default/70 space-y-space-2">
        <div className="flex items-start justify-between gap-space-3">
          <div className="min-w-0 space-y-space-1">
            <div className={FORM_FIELD_LABEL}>{EVENT_LOG_COPY.searchPreviewTitle}</div>
            <p className={`${TYPE.caption} text-text-muted leading-snug`}>
              {EVENT_LOG_COPY.searchPreviewSubtitle}
            </p>
          </div>
          {isFetching ? (
            <div className="flex items-center gap-space-1-5 shrink-0 text-text-muted" aria-live="polite">
              <SpinnerLoader size="xs" />
              <span className={TYPE.meta}>Updating</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-space-2 min-h-[2.25rem]">
          {modeLabel ? (
            <span
              className={cn(
                TYPE.caption,
                'inline-flex items-center rounded-md px-space-2 py-space-0-5',
                'bg-brand/10 text-brand border border-brand/20'
              )}
            >
              {modeLabel}
            </span>
          ) : null}
          {previewInSync && preview?.eventCount != null ? (
            <span
              className={cn(
                TYPE.value,
                'inline-flex items-baseline gap-space-1 rounded-md px-space-2-5 py-space-1',
                'bg-surface border border-border-default/80 tabular-nums transition-opacity',
                isFetching && 'opacity-70'
              )}
            >
              <span className="font-semibold text-text-primary">{preview.eventCount}</span>
              <span className={`${TYPE.caption} font-normal text-text-muted`}>
                {EVENT_LOG_COPY.searchPreviewEventCount}
              </span>
            </span>
          ) : previewInSync && isFetching && preview == null ? (
            <span className={`${TYPE.caption} text-text-muted`}>
              {EVENT_LOG_COPY.searchPreviewEventCountLoading}
            </span>
          ) : null}
        </div>
      </div>

      {isEmpty ? (
        <EmptyState
          {...PANEL_EMPTY_STATE}
          fill={false}
          title={EVENT_LOG_COPY.searchPreviewMatching}
          description={isFetching ? EVENT_LOG_COPY.searchPreviewEventCountLoading : EVENT_LOG_COPY.searchPreviewNoSuggestions}
        />
      ) : (
        <div className={SCROLL_CLASS}>
          <section className="px-space-4 py-space-3 border-b border-border-default/70">
            <div className="flex items-baseline justify-between gap-space-2 mb-space-3">
              <h3 className={`${TYPE.caption} font-medium text-text-muted uppercase tracking-wide`}>
                {EVENT_LOG_COPY.searchPreviewMatching}
              </h3>
              <span className={TYPE.meta}>{EVENT_LOG_COPY.searchPreviewMatchingHint}</span>
            </div>
            <ul className="space-y-space-2-5">
              {criteria.map(row => (
                <li key={row.key}>
                  <button
                    type="button"
                    role="option"
                    className={cn(
                      'w-full text-left flex gap-space-3 rounded-lg border border-border-default/60',
                      'bg-surface-page/40 px-space-3 py-space-2-5',
                      'hover:border-border-default hover:bg-surface-page transition-colors',
                      CONTROL.focusVisibleTight
                    )}
                    onClick={() => onSelectMatch(row.searchValue)}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        'bg-surface border border-border-default/70'
                      )}
                    >
                      <Icon name={row.icon} className="w-4 h-4 text-text-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`${TYPE.value} font-medium text-text-primary leading-snug`}>
                        {row.title}
                      </p>
                      <p className={`${TYPE.caption} mt-space-1 text-text-muted leading-relaxed`}>
                        {row.detail}
                      </p>
                      <p className={`${TYPE.meta} mt-space-1-5 truncate text-brand`}>
                        {row.searchValue}
                      </p>
                    </div>
                    <Icon
                      name={ICONS.actions.chevronRight}
                      className="w-4 h-4 shrink-0 self-center text-text-tertiary"
                    />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {showSuggestionsSection ? (
            <section className="px-space-4 py-space-3 border-b border-border-default/70 space-y-space-4">
              {preview && preview.patients.length > 0 ? (
                <div>
                  <div className="flex items-baseline justify-between gap-space-2 mb-space-2">
                    <h3 className={`${TYPE.caption} font-medium text-text-muted uppercase tracking-wide`}>
                      {EVENT_LOG_COPY.searchPreviewPatients}
                    </h3>
                    <span className={TYPE.meta}>{EVENT_LOG_COPY.searchPreviewPatientsHint}</span>
                  </div>
                  <ul className="space-y-space-1">
                    {preview.patients.map(patient => (
                      <li key={patient.id}>
                        <button
                          type="button"
                          role="option"
                          className={cn(
                            'w-full text-left flex items-center gap-space-3 rounded-lg px-space-3 py-space-2-5',
                            'border border-transparent hover:border-border-default/60',
                            'hover:bg-surface-page transition-colors',
                            CONTROL.focusVisibleTight
                          )}
                          onClick={() => onSelectMatch(patient.displayId)}
                        >
                          <Avatar
                            primaryText={patient.fullName}
                            size="sm"
                            avatarOnly
                            className="shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className={`${TYPE.value} font-normal truncate capitalize`}>
                              {patient.fullName}
                            </p>
                            <p className={`${TYPE.caption} truncate uppercase text-text-muted`}>
                              {patient.displayId}
                            </p>
                          </div>
                          <Icon
                            name={ICONS.actions.chevronRight}
                            className="w-4 h-4 shrink-0 text-text-tertiary"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {preview && preview.users.length > 0 ? (
                <div>
                  <div className="flex items-baseline justify-between gap-space-2 mb-space-2">
                    <h3 className={`${TYPE.caption} font-medium text-text-muted uppercase tracking-wide`}>
                      {EVENT_LOG_COPY.searchPreviewUsers}
                    </h3>
                    <span className={TYPE.meta}>{EVENT_LOG_COPY.searchPreviewUsersHint}</span>
                  </div>
                  <ul className="space-y-space-1">
                    {preview.users.map(user => (
                      <li key={user.id}>
                        <button
                          type="button"
                          role="option"
                          className={cn(
                            'w-full text-left flex items-center gap-space-3 rounded-lg px-space-3 py-space-2-5',
                            'border border-transparent hover:border-border-default/60',
                            'hover:bg-surface-page transition-colors',
                            CONTROL.focusVisibleTight
                          )}
                          onClick={() => onSelectMatch(user.name)}
                        >
                          <div
                            className={cn(
                              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                              'bg-surface-page border border-border-default/70'
                            )}
                          >
                            <Icon name={ICONS.dataFields.user} className="w-4 h-4 text-text-muted" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`${TYPE.value} font-normal truncate`}>{user.name}</p>
                            <p className={`${TYPE.caption} truncate text-text-muted`}>
                              @{user.username}
                            </p>
                          </div>
                          <Icon
                            name={ICONS.actions.chevronRight}
                            className="w-4 h-4 shrink-0 text-text-tertiary"
                          />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {preview &&
              showSuggestionsSection &&
              preview.patients.length === 0 &&
              preview.users.length === 0 &&
              !isFetching ? (
                <p className={`${TYPE.caption} text-text-muted`}>{EVENT_LOG_COPY.searchPreviewNoSuggestions}</p>
              ) : null}
            </section>
          ) : null}

          <section className="px-space-4 py-space-3 bg-surface-page/30">
            <h3 className={`${TYPE.caption} font-medium text-text-muted uppercase tracking-wide mb-space-2`}>
              {EVENT_LOG_COPY.searchPreviewTipsTitle}
            </h3>
            <ul className={`${TYPE.caption} space-y-space-2 text-text-muted leading-relaxed list-disc pl-space-4`}>
              <li>{EVENT_LOG_COPY.searchPreviewTipPrefixes}</li>
              <li>{EVENT_LOG_COPY.searchPreviewTipNumeric}</li>
              <li>{EVENT_LOG_COPY.searchPreviewTipText}</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};
