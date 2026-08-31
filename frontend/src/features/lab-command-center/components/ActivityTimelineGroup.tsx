/**
 * Single activity group (date section) in ActivitiesTimeline.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/primitives/Badge';
import { formatRelativeDateTime } from '@/utils';
import type { ActivityItemResult } from '../formatters/activityFormatters';

export interface ActivityTimelineGroupProps {
  label: string;
  items: ActivityItemResult[];
}

export const ActivityTimelineGroup: React.FC<ActivityTimelineGroupProps> = ({ label, items }) => (
  <section className="px-4 pb-6 first:pt-1">
    <div className="flex items-center gap-3 py-3 sticky top-0 z-1 bg-surface/95 backdrop-blur-[2px]">
      <div className="flex-1 h-px bg-stroke/80 min-w-0" />
      <span className="text-xxs font-medium text-text-tertiary uppercase tracking-widest shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-stroke/80 min-w-0" />
    </div>
    <div className="relative">
      <div
        className="absolute top-4 bottom-4 w-px bg-gradient-to-b from-stroke via-stroke/60 to-stroke pointer-events-none"
        aria-hidden
        style={{ left: '5px', transform: 'translateX(-50%)' }}
      />
      <ul className="space-y-0 list-none">
        {items.map(item => (
          <li key={item.id} className="flex items-start gap-3 relative">
            <div className="w-[10px] flex justify-center shrink-0 z-10 pt-[7px]">
              <div
                className="w-2 h-2 rounded-full border-2 border-surface bg-brand shrink-0 ring-2 ring-surface"
                aria-hidden
              />
            </div>
            <div className="flex-1 min-w-0 pt-0.5 pb-4">
              <div className="space-y-1">
                {item.lines.map((line, lineIdx) => (
                  <p
                    key={lineIdx}
                    className={`text-sm leading-[1.45] flex flex-wrap items-baseline gap-x-1.5 gap-y-1 ${lineIdx === 0 ? 'text-text-primary' : 'text-text-secondary'}`}
                  >
                    {line.map((segment, idx) =>
                      segment.type === 'name' ? (
                        <span key={idx} className="font-medium text-brand">
                          {segment.value}
                        </span>
                      ) : segment.type === 'badge' ? (
                        segment.link ? (
                          <Link
                            key={idx}
                            to={segment.link}
                            className="inline-flex hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand rounded"
                          >
                            <Badge
                              variant={segment.variant}
                              size="xs"
                              className={segment.isId ? 'font-mono' : undefined}
                            >
                              {segment.value}
                            </Badge>
                          </Link>
                        ) : (
                          <Badge
                            key={idx}
                            variant={segment.variant}
                            size="xs"
                            className={segment.isId ? 'font-mono' : undefined}
                          >
                            {segment.value}
                          </Badge>
                        )
                      ) : (
                        <span key={idx}>{segment.value}</span>
                      )
                    )}
                  </p>
                ))}
              </div>
              <p className="text-xxs font-normal text-text-tertiary mt-1.5 tabular-nums">
                <time dateTime={item.timestamp.toISOString()}>
                  {formatRelativeDateTime(item.timestamp)}
                </time>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
