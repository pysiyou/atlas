/**
 * Filter-bar entity ID input — ORD/TST prefix + debounced value (matches EntityId display).
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/primitives';
import { SpinnerLoader } from '@/components/loaders/SpinnerLoader';
import { ENTITY_ID } from '@/utils/constants';
import { cn, ID_PREFIXES, type EntityType } from '@/utils';
import { ICONS } from '@/config/icons';
import { inputWrapper, inputInner, inputText, inputClearButton, inputContainerError } from './inputStyles';

export type EntityIdFilterEntityType = Extract<EntityType, 'order' | 'orderTest'>;

const ENTITY_ID_FILTER_LABEL: Record<EntityIdFilterEntityType, string> = {
  order: 'Order ID',
  orderTest: 'Order test ID',
};

export interface EntityIdFilterInputProps {
  entityType: EntityIdFilterEntityType;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  /** Debounce delay in ms; default 300 */
  debounceMs?: number;
  className?: string;
}

export const EntityIdFilterInput: React.FC<EntityIdFilterInputProps> = ({
  entityType,
  value,
  onChange,
  invalid = false,
  debounceMs = 300,
  className,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const prefix = ID_PREFIXES[entityType];
  const ariaLabel = ENTITY_ID_FILTER_LABEL[entityType];

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      onChange(localValue);
      setIsDebouncing(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsDebouncing(false);
    };
  }, [localValue, value, onChange, debounceMs]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div
      className={cn(
        inputWrapper,
        invalid && inputContainerError,
        className
      )}
    >
      <span className={cn(ENTITY_ID, 'shrink-0 select-none')} aria-hidden>
        {prefix}
      </span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        placeholder="0000"
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(inputInner, inputText, ENTITY_ID)}
      />
      <div className="flex shrink-0 items-center gap-space-1">
        {isDebouncing && <SpinnerLoader size="xs" />}
        {localValue && !isDebouncing && (
          <button
            onClick={handleClear}
            className={cn(inputClearButton, 'hover:bg-surface-page')}
            aria-label={`Clear ${ariaLabel}`}
            type="button"
          >
            <Icon name={ICONS.actions.closeCircle} className="h-4 w-4 text-text-tertiary" />
          </button>
        )}
      </div>
    </div>
  );
};
