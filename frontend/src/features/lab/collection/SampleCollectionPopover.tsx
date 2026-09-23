/**
 * SampleCollectionPopover - Popover for collecting samples
 *
 * Technician selects container type (tube or cup), top color, required quantity, and optional notes.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { notify } from '@/utils/feedback';
import { actionButtonPreset, Popover, Button, Icon, FooterInfo, SelectionCheck, PopoverFormChrome, RadioCard } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import type { ContainerType } from '@/types';
import { COLLECTION_TOP_COLOR_VALUES, CONTAINER_CONFIG } from '@/types';
import type { SampleRequirement } from '@/features/lab';
import { cn } from '@/utils';
import { getContainerIcon } from '@/config/icons';
import { ICONS } from '@/config/icons';
import { inputBase, inputError, FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import { RADIUS, SHADOW, TONE, TYPE } from '@/components/theme/recipes';
import {
  getDefaultCollectionTopColor,
  getEffectiveContainerType,
} from '@/features/lab';

/** Container type choices for collection: tube or cup only */
const COLLECTION_CONTAINER_OPTIONS: { value: ContainerType; label: string }[] = [
  { value: 'tube', label: 'Tube' },
  { value: 'cup', label: 'Cup' },
];

/** Static bg classes so Tailwind includes them (uses semantic container tokens). */
const COLLECTION_TOP_COLOR_BG: Record<
  'red-top' | 'yellow-top' | 'green-top' | 'black-top' | 'blue-top',
  string
> = {
  'red-top': 'bg-container-red-bg',
  'yellow-top': 'bg-container-yellow-bg',
  'green-top': 'bg-container-green-bg',
  'black-top': 'bg-container-black-bg',
  'blue-top': 'bg-container-blue-bg',
};

interface CollectionPopoverContentProps {
  requirement: SampleRequirement;
  patientName?: string;
  testName?: string;
  onConfirm: (
    volume: number,
    notes?: string,
    color?: string,
    containerType?: ContainerType
  ) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

// eslint-disable-next-line max-lines-per-function -- form sections (quantity, container type, color, notes) kept in one component for cohesion
const CollectionPopoverContent: React.FC<CollectionPopoverContentProps> = ({
  requirement,
  patientName,
  testName,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) => {
  const minimumVolume = requirement.totalVolume;
  const [volume, setVolume] = useState<number>(minimumVolume);
  const [notes, setNotes] = useState('');
  const defaultContainerType = useMemo(
    () => getEffectiveContainerType(undefined, requirement.sampleType),
    [requirement.sampleType]
  );

  const defaultTopColor = useMemo(
    () => getDefaultCollectionTopColor(requirement.sampleType),
    [requirement.sampleType]
  );

  const [selectedColor, setSelectedColor] = useState<string>(defaultTopColor);
  const [showVolumeError, setShowVolumeError] = useState(false);

  const [selectedContainerType, setSelectedContainerType] =
    useState<ContainerType>(defaultContainerType);

  const isValid = Boolean(selectedColor && selectedContainerType) && volume >= minimumVolume;

  const handleSubmit = useCallback(async () => {
    if (!selectedColor) {
      notify.toast('lab.collection.popover.colorRequired');
      return;
    }
    if (!selectedContainerType) {
      notify.toast('lab.collection.popover.containerRequired');
      return;
    }
    if (volume < minimumVolume) {
      setShowVolumeError(true);
      return;
    }
    await Promise.resolve(
      onConfirm(volume, notes || undefined, selectedColor, selectedContainerType)
    );
  }, [selectedColor, selectedContainerType, volume, notes, minimumVolume, onConfirm]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, onCancel]);

  return (
    <PopoverFormChrome
      title={patientName || 'Collect Sample'}
      subtitle={`${requirement.sampleType.toUpperCase()} - ${testName || requirement.containerTypes.join(', ')}`}
      onCancel={onCancel}
      onConfirm={handleSubmit}
      confirmLabel="Confirm"
      confirmVariant="primary"
      disabled={!isValid}
      isSubmitting={isSubmitting}
      footerInfo={<FooterInfo icon={MODULE_ICONS.laboratory} label="Laboratory" />}
    >
      {/* Required quantity (volume) */}
      <div>
        <div className="flex items-center justify-between mb-space-1">
          <label className={FORM_FIELD_LABEL}>
            Required Quantity <span className={TONE.danger.fg}>*</span>
          </label>
          {minimumVolume > 0 && (
            <div className={cn(`text-xxs px-space-2 py-space-0-5 ${RADIUS.field} flex items-center gap-space-1`, TONE.warning.well, TONE.warning.fg)}>
              <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
              Min: {minimumVolume} mL
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={volume}
            onChange={e => {
              const v = Number(e.target.value);
              setVolume(Number.isNaN(v) ? minimumVolume : v);
              if (showVolumeError && v >= minimumVolume) {
                setShowVolumeError(false);
              }
            }}
            className={cn(inputBase, 'pr-space-8', volume < minimumVolume && inputError)}
            placeholder="0.0"
          />
          <span className={`absolute right-space-3 top-1/2 -translate-y-1/2 ${TYPE.meta} pointer-events-none select-none`}>
            mL
          </span>
        </div>
        {showVolumeError && volume < minimumVolume && (
          <p className={`text-xxs ${TONE.danger.fg} mt-space-1`}>
            Volume must be at least {minimumVolume} mL
          </p>
        )}
      </div>

      {/* Container Type: tube or cup only */}
      <div>
        <label className={`${FORM_FIELD_LABEL} mb-space-2`}>
          Container Type <span className={TONE.danger.fg}>*</span>
        </label>
        <div className="grid grid-cols-2 gap-space-2">
          {COLLECTION_CONTAINER_OPTIONS.map(option => (
            <RadioCard
              key={option.value}
              name="collection-container-type"
              label={option.label}
              selected={selectedContainerType === option.value}
              align="center"
              leading={
                <Icon
                  name={getContainerIcon(option.value)}
                  className="w-7 h-7 text-text-disabled"
                />
              }
              onClick={() => setSelectedContainerType(option.value)}
            />
          ))}
        </div>
      </div>

      {/* Top color: list of coloured circles */}
      <div>
        <label className={`${FORM_FIELD_LABEL} mb-space-1`}>
          Top Color <span className={TONE.danger.fg}>*</span>
        </label>
        <div className="flex flex-wrap gap-space-3">
          {COLLECTION_TOP_COLOR_VALUES.map(value => {
            const isSelected = selectedColor === value;
            const config = CONTAINER_CONFIG[value];
            const bgClass =
              value in COLLECTION_TOP_COLOR_BG
                ? COLLECTION_TOP_COLOR_BG[value as keyof typeof COLLECTION_TOP_COLOR_BG]
                : 'bg-container-gray-bg';
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedColor(value)}
                className={cn(
                  `relative w-8 h-8 ${RADIUS.pill} transition-all duration-200`,
                  !isSelected && `opacity-80 hover:opacity-100 hover:scale-105 hover:${SHADOW.subtle}`
                )}
                title={config?.label ?? value}
                aria-pressed={isSelected}
              >
                <span
                  className={cn(
                    `absolute inset-0 ${RADIUS.pill}`,
                    bgClass,
                    isSelected ? 'blur-[2px]' : 'scale-100'
                  )}
                  aria-hidden
                />
                {isSelected && (
                  <span
                    className={`absolute inset-0 z-10 flex items-center justify-center ${RADIUS.pill}`}
                    aria-hidden
                  >
                    <SelectionCheck isSelected />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={`${FORM_FIELD_LABEL} mb-space-1`}>Notes</label>
        <textarea
          rows={2}
          placeholder="Add optional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className={cn(inputBase, 'resize-none')}
        />
      </div>
    </PopoverFormChrome>
  );
};

interface CollectionPopoverProps {
  /** Sample requirement data */
  requirement: SampleRequirement;
  /** Patient name for display */
  patientName?: string;
  /** Test name for display */
  testName?: string;
  /** Whether this is a recollection */
  isRecollection?: boolean;
  /** Callback when collection is confirmed */
  onConfirm: (
    volume: number,
    notes?: string,
    color?: string,
    containerType?: ContainerType
  ) => void;
  /** When true, confirm button shows loading (e.g. collect mutation in progress) */
  isSubmitting?: boolean;
  /** Called when submitting state changes (e.g. so parent modal can set disableClose) */
  onSubmittingChange?: (submitting: boolean) => void;
  /** Custom trigger element (uses default button if not provided) */
  trigger?: React.ReactNode;
}

export const SampleCollectionPopover: React.FC<CollectionPopoverProps> = ({
  requirement,
  patientName,
  testName,
  isRecollection = false,
  onConfirm,
  isSubmitting = false,
  onSubmittingChange,
  trigger,
}) => {
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const effectiveSubmitting = isSubmitting || localSubmitting;

  React.useEffect(() => {
    onSubmittingChange?.(effectiveSubmitting);
  }, [effectiveSubmitting, onSubmittingChange]);

  return (
    <Popover
      placement="bottom-end"
      offsetValue={8}
      preventClose={effectiveSubmitting}
      trigger={
        trigger || (
          <Button {...actionButtonPreset('collect')} size="sm">
            {isRecollection ? 'Recollect' : 'Collect'}
          </Button>
        )
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <CollectionPopoverContent
            requirement={requirement}
            patientName={patientName}
            testName={testName}
            onConfirm={async (volume, notes, color, containerType) => {
              setLocalSubmitting(true);
              try {
                await Promise.resolve(onConfirm(volume, notes, color, containerType));
                close();
              } finally {
                setLocalSubmitting(false);
              }
            }}
            onCancel={close}
            isSubmitting={effectiveSubmitting}
          />
        </div>
      )}
    </Popover>
  );
};
