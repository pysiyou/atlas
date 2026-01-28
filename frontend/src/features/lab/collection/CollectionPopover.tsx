/**
 * CollectionPopover - Popover for collecting samples
 *
 * Allows lab staff to record collection details: volume, container type, and color.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Popover, Button, Icon, FooterInfo } from '@/shared/ui';
import { PopoverForm } from '../components/PopoverForm';
import type { ContainerType } from '@/types';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_TYPE_OPTIONS } from '@/types';
import type { SampleRequirement } from '@/utils';
import { ICONS, getContainerIcon } from '@/utils';

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
      toast.error('Please select the container color');
      return;
    }
    if (!selectedContainerType) {
      toast.error('Please select the container type');
      return;
    }
    if (volume < minimumVolume) {
      toast.error(`Volume must be at least ${minimumVolume} mL`);
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
          <label className="block text-xs font-medium text-text-tertiary">
            Volume Collected <span className="text-red-600">*</span>
          </label>
          {minimumVolume > 0 && (
            <div className="text-xxs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
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
            className={`w-full pl-3 pr-8 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder-gray-400 ${
              volume < minimumVolume
                ? 'border-red-500'
                : volume > 100
                  ? 'border-amber-300'
                  : 'border-border-strong'
            }`}
            placeholder="0.0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-disabled pointer-events-none">
            mL
          </span>
        </div>
        <div className="h-6 mt-1.5">
          <div
            className={`text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 p-1.5 rounded border border-amber-200 transition-opacity duration-200 ${volume > 100 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
            Unusually high volume - please verify
          </div>
        </div>
      </div>

      {/* Container Type */}
      <div>
        <label className="block text-xs font-medium text-text-tertiary mb-2">
          Container Type <span className="text-danger">*</span>
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
                className={`
                  relative flex items-center gap-2.5 p-3 rounded border transition-all duration-200
                  ${
                    isSelected
                      ? 'bg-surface border-brand border-2'
                      : 'bg-surface border-border hover:border-border-strong'
                  }
                `}
              >
                {/* Container icon on the left */}
                <Icon
                  name={getContainerIcon(option.value)}
                  className={`w-7 h-7 shrink-0 ${isSelected ? 'text-brand' : 'text-text-disabled'}`}
                />
                {/* Container label */}
                <span
                  className={`flex-1 text-xs font-medium text-left ${
                    isSelected ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {option.name}
                </span>
                {/* Checkmark indicator in top-right */}
                <div
                  className={`
                    absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors
                    ${isSelected ? 'bg-green-600' : 'bg-transparent border-2 border-border-strong'}
                  `}
                >
                  <Icon
                    name={ICONS.actions.check}
                    className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-text-disabled'}`}
                  />
                </div>
              </button>
            );
          })}
        </div>
        <div className="h-6 mt-1.5">
          <div
            className={`text-xs text-amber-600 flex items-center gap-1.5 bg-amber-50 p-1.5 rounded border border-amber-200 transition-opacity duration-200 ${selectedContainerType && !requirement.containerTypes.includes(selectedContainerType) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
            Warning: Selected container type not in requirements
          </div>
        </div>
      </div>

      {/* Container Color */}
      <div>
        <label className="block text-xs font-medium text-text-tertiary mb-1">
          Container Color <span className="text-red-600">*</span>
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
                    ? 'scale-110 ring-2 ring-offset-2 ring-sky-400 shadow-md'
                    : isRequired
                      ? 'opacity-100 hover:scale-105 hover:shadow-sm ring-2 ring-green-300'
                      : 'opacity-60 hover:opacity-80 hover:scale-105 hover:shadow-sm'
                }`}
                title={`${option.name}${isRequired ? ' (Required)' : ''}`}
              />
            );
          })}
        </div>
        <div className="h-6 mt-1.5">
          <div
            className={`text-xs flex items-center gap-1.5 p-1.5 rounded border transition-opacity duration-200 ${
              !selectedColor
                ? 'opacity-100 text-amber-600 bg-amber-50 border-amber-200'
                : selectedColor && !requirement.containerTopColors.includes(selectedColor as never)
                  ? 'opacity-100 text-amber-600 bg-amber-50 border-amber-200'
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
        <label className="block text-xs font-medium text-text-tertiary mb-1">Notes</label>
        <textarea
          rows={2}
          placeholder="Add optional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-border-strong rounded focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
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
        <Button variant="primary" size="xs" icon={<Icon name={ICONS.dataFields.flask} className="text-white" />}>
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
