/**
 * CollectionPopover - Popover for collecting samples
 *
 * Allows lab staff to record collection details: volume, container type, and color.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from '@/shared/components/feedback';
import { Popover, Button, Icon, FooterInfo } from '@/shared/ui';
import { PopoverForm } from '../components/PopoverForm';
import type { ContainerType } from '@/types';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_TYPE_OPTIONS } from '@/types';
import type { SampleRequirement } from '@/utils';
import { cn, ICONS, getContainerIcon } from '@/utils';
import { inputBase, inputError } from '@/shared/ui/forms/inputStyles';

interface CollectionPopoverContentProps {
  requirement: SampleRequirement;
  patientName?: string;
  testName?: string;
  onConfirm: (
    volume: number,
    notes?: string,
    color?: string,
    containerType?: ContainerType
  ) => void;
  onCancel: () => void;
}

// Large component is necessary for comprehensive collection popover with requirement display, rejection options, and form handling
// eslint-disable-next-line max-lines-per-function
const CollectionPopoverContent: React.FC<CollectionPopoverContentProps> = ({
  requirement,
  patientName,
  testName,
  onConfirm,
  onCancel,
}) => {
  const minimumVolume = requirement.totalVolume;
  const [volume, setVolume] = useState<number>(requirement.totalVolume);
  const [notes, setNotes] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  // Default container type based on sample type
  const defaultContainerType: ContainerType = useMemo(() => {
    const sampleType = requirement.sampleType?.toLowerCase() || '';
    return sampleType === 'urine' || sampleType === 'stool' ? 'cup' : 'tube';
  }, [requirement.sampleType]);

  const [selectedContainerType, setSelectedContainerType] =
    useState<ContainerType>(defaultContainerType);

  const isValid = selectedColor && selectedContainerType && volume >= minimumVolume;

  const handleSubmit = useCallback(() => {
    if (!selectedColor) {
      toast.error({
        title: 'Please select the container color',
        subtitle: 'Select the container cap color to match the actual sample container used.',
      });
      return;
    }
    if (!selectedContainerType) {
      toast.error({
        title: 'Please select the container type',
        subtitle: 'Select the container type (cup or tube) used for this sample.',
      });
      return;
    }
    if (volume < minimumVolume) {
      toast.error({
        title: `Volume must be at least ${minimumVolume} mL`,
        subtitle: 'Enter a volume that meets the minimum required for this sample type.',
      });
      return;
    }
    onConfirm(volume, notes, selectedColor, selectedContainerType);
  }, [selectedColor, selectedContainerType, volume, minimumVolume, notes, onConfirm]);

  // Keyboard shortcuts
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
    <PopoverForm
      title={patientName || 'Collect Sample'}
      subtitle={`${requirement.sampleType.toUpperCase()} - ${testName || requirement.containerTypes.join(', ')}`}
      onCancel={onCancel}
      onConfirm={handleSubmit}
      confirmLabel="Confirm"
      confirmVariant="primary"
      disabled={!isValid}
      footerInfo={<FooterInfo icon={ICONS.actions.alertCircle} text="Collecting sample" />}
    >
      {/* Volume Input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-fg-subtle">
            Volume Collected <span className="text-danger-fg">*</span>
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
            onChange={e => setVolume(Number(e.target.value))}
            className={cn(
              inputBase,
              'pr-8',
              volume < minimumVolume && inputError,
              volume > 100 && 'border-warning-stroke-emphasis focus:ring-2 focus:ring-warning-stroke focus:ring-opacity-20'
            )}
            placeholder="0.0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-fg-disabled pointer-events-none">
            mL
          </span>
        </div>
        <div className="h-6 mt-1.5">
          <div
            className={`text-xs text-warning-fg flex items-center gap-1.5 bg-warning-bg p-1.5 rounded border border-warning-stroke transition-opacity duration-200 ${volume > 100 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
            Unusually high volume - please verify
          </div>
        </div>
      </div>

      {/* Container Type - static card + checkmark only on selection (matches PaymentMethodSelector) */}
      <div>
        <label className="block text-xs font-medium text-fg-subtle mb-2">
          Container Type <span className="text-danger-fg">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CONTAINER_TYPE_OPTIONS.map(option => {
            const isRequired = requirement.containerTypes.includes(option.value as ContainerType);
            const isSelected = selectedContainerType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedContainerType(option.value as ContainerType)}
                title={isRequired ? 'Required container type' : 'Not in requirements'}
                className="relative flex items-center gap-2.5 p-3 rounded border border-stroke bg-panel hover:border-stroke-strong transition-colors duration-200 cursor-pointer"
              >
                <Icon
                  name={getContainerIcon(option.value)}
                  className="w-7 h-7 shrink-0 text-fg-disabled"
                />
                <span className="flex-1 text-xs font-medium text-left text-fg-muted">
                  {option.name.toUpperCase()}
                </span>
                <div
                  className={`
                    absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-200
                    ${isSelected ? 'bg-brand' : 'bg-transparent border-2 border-stroke-strong'}
                  `}
                >
                  {isSelected && (
                    <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="h-6 mt-1.5">
          <div
            className={`text-xs text-warning-fg flex items-center gap-1.5 bg-warning-bg p-1.5 rounded border border-warning-stroke transition-opacity duration-200 ${selectedContainerType && !requirement.containerTypes.includes(selectedContainerType) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
            Warning: Selected container type not in requirements
          </div>
        </div>
      </div>

      {/* Container Color */}
      <div>
        <label className="block text-xs font-medium text-fg-subtle mb-1">
          Container Color <span className="text-danger-fg">*</span>
        </label>
        <div className="flex gap-3">
          {CONTAINER_COLOR_OPTIONS.map(option => {
            const isRequired = requirement.containerTopColors.includes(option.value);
            const isSelected = selectedColor === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedColor(option.value)}
                className={`w-8 h-8 rounded-full transition-all duration-200 ${option.colorClass} ${
                  isSelected
                    ? 'scale-110 ring-2 ring-offset-2 ring-brand shadow-md'
                    : isRequired
                      ? 'opacity-100 hover:scale-105 hover:shadow-sm ring-2 ring-success-stroke'
                      : 'opacity-60 hover:opacity-80 hover:scale-105 hover:shadow-sm'
                }`}
                title={`${option.name.toUpperCase()}${isRequired ? ' (Required)' : ''}`}
              />
            );
          })}
        </div>
        <div className="h-6 mt-1.5">
          <div
            className={`text-xs flex items-center gap-1.5 p-1.5 rounded border transition-opacity duration-200 ${
              !selectedColor
                ? 'opacity-100 text-warning-fg bg-warning-bg border-warning-stroke'
                : selectedColor && !requirement.containerTopColors.includes(selectedColor as never)
                  ? 'opacity-100 text-warning-fg bg-warning-bg border-warning-stroke'
                  : 'opacity-0 pointer-events-none border-transparent'
            }`}
          >
            <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
            {!selectedColor ? 'Selection required' : 'Warning: Selected color not in requirements'}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-fg-subtle mb-1">Notes</label>
        <textarea
          rows={2}
          placeholder="Add optional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className={cn(inputBase, 'resize-none')}
        />
      </div>
    </PopoverForm>
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
  /** Custom trigger element (uses default button if not provided) */
  trigger?: React.ReactNode;
}

export const CollectionPopover: React.FC<CollectionPopoverProps> = ({
  requirement,
  patientName,
  testName,
  isRecollection = false,
  onConfirm,
  trigger,
}) => (
  <Popover
    placement="bottom-end"
    offsetValue={8}
    trigger={
      trigger || (
        <Button variant="primary" size="xs" icon={<Icon name={ICONS.dataFields.flask} className="text-on-brand" />}>
          {isRecollection ? 'RECOLLECT' : 'COLLECT'}
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
          onConfirm={(volume, notes, color, containerType) => {
            onConfirm(volume, notes, color, containerType);
            close();
          }}
          onCancel={close}
        />
      </div>
    )}
  </Popover>
);
