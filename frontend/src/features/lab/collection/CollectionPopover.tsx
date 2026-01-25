/**
 * CollectionPopover - Popover for collecting samples
 *
 * Allows lab staff to record collection details: volume, container type, and color.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Popover, Button, Icon } from '@/shared/ui';
import { PopoverForm } from '../components/PopoverForm';
import type { ContainerType } from '@/types';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_TYPE_OPTIONS } from '@/types';
import type { SampleRequirement } from '@/utils/sampleHelpers';
import { ICONS, getContainerIcon } from '@/utils/icon-mappings';
import { semanticColors, brandColors } from '@/shared/design-system/tokens/colors';

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
      footerInfo={
        <div className="flex items-center gap-1.5">
          <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
          <span>Collecting sample</span>
        </div>
      }
    >
      {/* Volume Input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-500">
            Volume Collected <span className={semanticColors.danger.requiredIndicator}>*</span>
          </label>
          {minimumVolume > 0 && (
            <div className={`text-xxs ${semanticColors.warning.valueHigh} ${semanticColors.warning.backgroundLight} px-2 py-0.5 rounded border ${semanticColors.warning.border} flex items-center gap-1`}>
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
            className={`w-full pl-3 pr-8 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder-gray-400 ${
              volume < minimumVolume
                ? 'border-red-500'
                : volume > 100
                  ? 'border-yellow-500'
                  : 'border-gray-300'
            }`}
            placeholder="0.0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">
            mL
          </span>
        </div>
        <div className="h-6 mt-1.5">
          <div
            className={`text-xs ${semanticColors.warning.valueHigh} flex items-center gap-1.5 ${semanticColors.warning.backgroundLight} p-1.5 rounded ${semanticColors.warning.border} transition-opacity duration-200 ${volume > 100 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
            Unusually high volume - please verify
          </div>
        </div>
      </div>

      {/* Container Type */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Container Type <span className={semanticColors.danger.requiredIndicator}>*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CONTAINER_TYPE_OPTIONS.map(option => {
            const isRequired = requirement.containerTypes.includes(option.value as ContainerType);
            const isSelected = selectedContainerType === option.value;
            const showWarning = isSelected && !isRequired;
            return (
              <div
                key={option.value}
                className={`
                  relative flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 cursor-pointer
                  ${
                    isSelected
                      ? showWarning
                        ? 'bg-yellow-50 border-yellow-200 ring-1 ring-yellow-200'
                        : 'bg-sky-50 border-sky-200 ring-1 ring-sky-200'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => setSelectedContainerType(option.value as ContainerType)}
                title={isRequired ? 'Required container type' : 'Not in requirements'}
              >
                <input
                  type="radio"
                  name="container-type"
                  checked={isSelected}
                  onChange={() => setSelectedContainerType(option.value as ContainerType)}
                  className={`h-3.5 w-3.5 border-gray-300 ${showWarning ? `${semanticColors.warning.icon} ${semanticColors.warning.focusRing}` : `${brandColors.primary.icon} ${brandColors.primary.focusRing}`}`}
                />
                <span
                  className={`flex-1 text-xs font-medium ${isSelected ? (showWarning ? semanticColors.warning.textOnLight : brandColors.primary.textOnLight) : 'text-gray-900'}`}
                >
                  {option.name}
                </span>
                <Icon
                  name={getContainerIcon(option.value)}
                  className={`w-5 h-5 ${isSelected ? (showWarning ? semanticColors.warning.icon : brandColors.primary.icon) : 'text-gray-400'}`}
                />
              </div>
            );
          })}
        </div>
        <div className="h-6 mt-1.5">
          <div
            className={`text-xs text-yellow-600 flex items-center gap-1.5 bg-yellow-50 p-1.5 rounded border border-yellow-100 transition-opacity duration-200 ${selectedContainerType && !requirement.containerTypes.includes(selectedContainerType) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <Icon name={ICONS.actions.alertCircle} className="w-3.5 h-3.5" />
            Warning: Selected container type not in requirements
          </div>
        </div>
      </div>

      {/* Container Color */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Container Color <span className={semanticColors.danger.requiredIndicator}>*</span>
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
                ? `opacity-100 ${semanticColors.warning.valueHigh} ${semanticColors.warning.backgroundLight} ${semanticColors.warning.border}`
                : selectedColor && !requirement.containerTopColors.includes(selectedColor as never)
                  ? `opacity-100 ${semanticColors.warning.valueHigh} ${semanticColors.warning.backgroundLight} ${semanticColors.warning.border}`
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
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <textarea
          rows={2}
          placeholder="Add optional notes..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
