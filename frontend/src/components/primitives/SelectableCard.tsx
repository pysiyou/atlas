import { type HTMLAttributes, type ReactNode } from 'react';
import { selectableCard, type SelectableCardRecipeProps } from '@/theme/recipes';
import { cn } from '@/utils/cn';

export interface SelectableCardProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'>,
    SelectableCardRecipeProps {
  children: ReactNode;
  onSelect?: () => void;
}

export function SelectableCard({
  selected,
  emphasis,
  className,
  children,
  onSelect,
  onClick,
  ...props
}: SelectableCardProps) {
  return (
    <div
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      className={cn(selectableCard({ selected, emphasis }), className)}
      onClick={e => {
        onClick?.(e);
        onSelect?.();
      }}
      onKeyDown={e => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}
