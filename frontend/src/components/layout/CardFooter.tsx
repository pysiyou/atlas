import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface CardFooterProps {
  children: ReactNode;
  align?: 'start' | 'end' | 'between';
  className?: string;
}

const ALIGN_CLASS = {
  start: 'justify-start',
  end: 'justify-end',
  between: 'justify-between',
} as const;

export function CardFooter({ children, align = 'between', className }: CardFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center mt-auto pt-space-3 gap-space-2',
        ALIGN_CLASS[align],
        className
      )}
    >
      {children}
    </div>
  );
}
