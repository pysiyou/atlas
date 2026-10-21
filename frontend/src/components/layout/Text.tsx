import React, { type ElementType } from 'react';
import { text, type TextRecipeProps } from '@/theme/recipes';
import { cn } from '@/utils/cn';

export interface TextProps extends TextRecipeProps {
  as?: ElementType;
  className?: string;
  children?: React.ReactNode;
  truncate?: boolean;
  title?: string;
}

export function Text({
  as: Component = 'span',
  role,
  intent,
  density,
  className,
  children,
  truncate,
  title,
}: TextProps) {
  return (
    <Component
      className={cn(text({ role, intent, density }), truncate && 'truncate', className)}
      title={title}
    >
      {children}
    </Component>
  );
}
