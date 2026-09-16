/**
 * SampleCollectionPopover - Popover for collecting samples
 *
 * Technician selects container type (tube or cup), top color, required quantity, and optional notes.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { notify } from '@/utils/feedback';
import { Popover, Button, Icon, FooterInfo } from '@/components';
import { LabWorkflowPopoverChrome, RadioCard } from '../components/LabWorkflowPopoverChrome';
import { MODULE_ICONS } from '@/config/icons';
import type { ContainerType } from '@/types';
import { COLLECTION_TOP_COLOR_VALUES, CONTAINER_CONFIG } from '@/types';
import type { SampleRequirement } from '@/features/lab/utils';
import { cn } from '@/utils';
import { getContainerIcon } from '@/config/icons';
import { ICONS } from '@/config/icons';
import { inputBase, inputError, FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';

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
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [showVolumeError, setShowVolumeError] = useState(false);

  const defaultContainerType: ContainerType = useMemo(() => {
    const sampleType = requirement.sampleType?.toLowerCase() || '';
    return sampleType === 'urine' || sampleType === 'stool' ? 'cup' : 'tube';
  }, [requirement.sampleType]);

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
    <LabWorkflowPopoverChrome
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
        <div className="flex items-center justify-between mb-1">
          <label className={FORM_FIELD_LABEL}>
            Required Quantity <span className="text-danger-fg">*</span>
          </label>
          {minimumVolume > 0 && (
            <div className="text-xxs text-warning-fg bg-warning-bg px-2 py-0.5 rounded border border-warning-stroke flex items-center gap-1">
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
            className={cn(inputBase, 'pr-8', volume < minimumVolume && inputError)}
            placeholder="0.0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-normal text-text-disabled pointer-events-none">
            mL
          </span>
        </div>
        {showVolumeError && volume < minimumVolume && (
          <p className="text-xxs text-danger-fg mt-1">
            Volume must be at least {minimumVolume} mL
          </p>
        )}
      </div>

      {/* Container Type: tube or cup only */}
      <div>
        <label className={`${FORM_FIELD_LABEL} mb-2`}>
          Container Type <span className="text-danger-fg">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
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
        <label className={`${FORM_FIELD_LABEL} mb-1`}>
          Top Color <span className="text-danger-fg">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
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
                  'w-8 h-8 rounded-full transition-all duration-200',
                  bgClass,
                  isSelected
                    ? 'scale-110 ring-2 ring-offset-2 ring-brand shadow-md'
                    : 'opacity-80 hover:opacity-100 hover:scale-105 hover:shadow-sm'
                )}
                title={config?.label ?? value}
              />
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={`${FORM_FIELD_LABEL} mb-1`}>Notes</label>
        <textarea
          rows={2}
          placeholder="Add optional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className={cn(inputBase, 'resize-none')}
        />
      </div>
    </LabWorkflowPopoverChrome>
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
          <Button variant="collect" size="sm">
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
