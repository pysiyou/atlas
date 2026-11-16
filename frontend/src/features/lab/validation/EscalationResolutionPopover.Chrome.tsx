/**
 * Shared popover chrome for escalation resolution actions.
 */

import React, { type ReactNode } from 'react';
import { Button, FormNotesField } from '@/components/primitives';
import { Popover, PopoverFormChrome } from '@/components/overlays';

interface ResolutionPopoverProps {
  resolving: boolean;
  triggerLabel: string;
  triggerVariant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  triggerIcon?: ReactNode;
  title: string;
  subtitle: string;
  textareaId: string;
  notesLabel?: string;
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
  notesLabel = 'Notes',
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
            <FormNotesField
              id={textareaId}
              label={notesLabel}
              placeholder={placeholder}
              value={value}
              onChange={onChange}
              maxLength={1000}
              rows={4}
            />
          </PopoverFormChrome>
        </div>
      )}
    </Popover>
  );
}
