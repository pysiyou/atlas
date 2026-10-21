import { type ReactNode } from 'react';
import { text, IDENTITY_INLINE } from '@/theme/recipes';
import { cn } from '@/utils/cn';
import { InlineSeparator } from './ListMarker';

export type IdentitySegment =
  | {
      kind: 'text';
      key: string;
      text: string;
      emphasis?: 'primary' | 'secondary';
      capitalize?: boolean;
      truncate?: boolean;
      hideBelow?: 'md' | 'lg';
    }
  | {
      kind: 'node';
      key: string;
      node: ReactNode;
      hideBelow?: 'md' | 'lg';
    };

export interface IdentityInlineProps {
  segments: IdentitySegment[];
  className?: string;
  nowrap?: boolean;
}

function hideClass(breakpoint?: 'md' | 'lg'): string | undefined {
  if (!breakpoint) return undefined;
  return breakpoint === 'md' ? 'hidden md:inline' : 'hidden lg:inline';
}

function SegmentWrap({ hide, children }: { hide?: string; children: ReactNode }) {
  if (!hide) return <>{children}</>;
  return <span className={hide}>{children}</span>;
}

export function IdentityInline({ segments, className, nowrap = false }: IdentityInlineProps) {
  const parts: ReactNode[] = [];
  let needsSep = false;

  for (const segment of segments) {
    if (!segment) continue;
    const hide = segment.kind === 'text' || segment.kind === 'node' ? hideClass(segment.hideBelow) : undefined;

    if (needsSep) {
      parts.push(<InlineSeparator key={`sep-${segment.key}`} className={hide} />);
    }

    if (segment.kind === 'text') {
      const textClass = cn(
        segment.emphasis === 'primary'
          ? IDENTITY_INLINE.primaryText
          : segment.emphasis === 'secondary'
            ? 'font-normal text-text-secondary'
            : text({ role: 'label' }),
        segment.capitalize === false && 'normal-case',
        segment.truncate && 'min-w-0 truncate'
      );
      parts.push(
        <SegmentWrap key={segment.key} hide={hide}>
          <span className={textClass} title={segment.text}>
            {segment.text}
          </span>
        </SegmentWrap>
      );
      needsSep = true;
      continue;
    }

    parts.push(
      <SegmentWrap key={segment.key} hide={hide}>
        {segment.node}
      </SegmentWrap>
    );
    needsSep = true;
  }

  return (
    <div
      className={cn(
        IDENTITY_INLINE.container,
        nowrap && 'flex-nowrap overflow-hidden',
        className
      )}
    >
      {parts}
    </div>
  );
}
