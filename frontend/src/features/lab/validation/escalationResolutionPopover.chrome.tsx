/**
 * Shared popover chrome for escalation resolution actions.
 */

import { type ReactNode } from 'react';
import { Button } from '@/components/primitives';
import { Popover, PopoverFormChrome } from '@/components/overlays';
import { cn } from '@/utils';
import { inputBase } from '@/theme/recipes';

interface ResolutionPopoverProps {
  resolving: boolean;
  triggerLabel: string;
  triggerVariant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  triggerIcon?: ReactNode;
  title: string;
  subtitle: string;
  textareaId: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  confirmLabel: string;
  confirmVariant: 'success' | 'danger';
  disabled?: boolean;
  onConfirm: () => Promise<void | boolean>;
  children?: React.ReactNode;
}

/**
 * Confirm popover with optional extra fields and a notes textarea.
 */
export function ResolutionPopover({
  resolving,
  triggerLabel,
  triggerVariant,
  triggerIcon,
  title,
  subtitle,
  textareaId,
  placeholder,
  value,
  onChange,
  confirmLabel,
  confirmVariant,
  disabled,
  onConfirm,
  children,
}: ResolutionPopoverProps) {
  return (
    <Popover
      placement="top-end"
      offsetValue={8}
      preventClose={resolving}
      trigger={
        <Button
          variant={triggerVariant}
          size="sm"
          layout={triggerIcon ? 'icon-text' : 'text'}
          icon={triggerIcon}
          disabled={resolving}
          isLoading={resolving}
        >
          {triggerLabel}
        </Button>
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <PopoverFormChrome
            title={title}
            subtitle={subtitle}
            onCancel={close}
            onConfirm={async () => {
              const shouldClose = await onConfirm();
              if (shouldClose !== false) close();
            }}
            confirmLabel={confirmLabel}
            confirmVariant={confirmVariant}
            isSubmitting={resolving}
            disabled={disabled}
          >
            {children}
            <div>
              <label className="sr-only" htmlFor={textareaId}>
                {subtitle}
              </label>
              <textarea
                id={textareaId}
                className={cn(inputBase, 'min-h-[80px] resize-none')}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                maxLength={1000}
              />
            </div>
          </PopoverFormChrome>
        </div>
      )}
    </Popover>
  );
}
