import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { ListMarker } from './ListMarker';
import { Stack } from './Stack';
import { Text } from './Text';

export interface MetadataItemProps {
  children: ReactNode;
  marker?: 'dot' | 'dotDanger' | 'none';
  className?: string;
}

export function MetadataItem({ children, marker = 'dot', className }: MetadataItemProps) {
  if (marker === 'none') {
    return <div className={cn('min-w-0', className)}>{children}</div>;
  }
  return (
    <Stack direction="row" gap="inline" className={cn('min-w-0 items-center', className)}>
      <ListMarker variant={marker === 'dotDanger' ? 'dotDanger' : 'dot'} />
      {typeof children === 'string' ? (
        <Text role="label" truncate>{children}</Text>
      ) : (
        children
      )}
    </Stack>
  );
}

export interface MetadataGridProps {
  columns?: 1 | 2 | 3;
  gapX?: 'inline' | 'relaxed';
  gapY?: 'tight' | 'inline' | 'relaxed';
  children: ReactNode;
  className?: string;
}

const COLS_CLASS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
} as const;

const GAP_X: Record<string, string> = {
  inline: 'gap-x-space-2',
  relaxed: 'gap-x-space-3',
};

const GAP_Y: Record<string, string> = {
  tight: 'gap-y-space-1',
  inline: 'gap-y-space-2',
  relaxed: 'gap-y-space-3',
};

export function MetadataGrid({
  columns = 2,
  gapX = 'relaxed',
  gapY = 'inline',
  children,
  className,
}: MetadataGridProps) {
  return (
    <div className={cn('grid', COLS_CLASS[columns], GAP_X[gapX], GAP_Y[gapY], className)}>
      {children}
    </div>
  );
}
