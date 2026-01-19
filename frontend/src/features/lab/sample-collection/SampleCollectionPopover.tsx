/**
 * SampleCollectionPopover - Popover for collecting samples
 * 
 * Allows lab staff to record collection details: volume, container type, and color.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Popover, Button, Icon } from '@/shared/ui';
import { PopoverForm } from '../shared/PopoverForm';
import type { ContainerType } from '@/types';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_TYPE_OPTIONS } from '@/types';
import type { SampleRequirement } from '../../../utils/sampleHelpers';

interface SampleCollectionPopoverContentProps {
  requirement: SampleRequirement;
  patientName?: string;
  testName?: string;
  onConfirm: (volume: number, notes?: string, color?: string, containerType?: ContainerType) => void;
  onCancel: () => void;
}

const SampleCollectionPopoverContent: React.FC<SampleCollectionPopoverContentProps> = ({
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

  const [selectedContainerType, setSelectedContainerType] = useState<ContainerType>(defaultContainerType);

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
          <Icon name="alert-circle" className="w-3.5 h-3.5" />
          <span>Collecting sample</span>
        </div>
      }
    >
      {/* Volume Input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-gray-500">
            Volume Collected <span className="text-red-500">*</span>
          </label>
          {minimumVolume > 0 && (
            <div className="text-[10px] text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 flex items-center gap-1">
              <Icon name="alert-circle" className="w-3 h-3" />
              Min: {minimumVolume} mL
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className={`w-full pl-3 pr-8 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all placeholder-gray-400 ${
              volume < minimumVolume ? 'border-red-500' : volume > 100 ? 'border-yellow-500' : 'border-gray-300'
            }`}
            placeholder="0.0"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 pointer-events-none">
            mL
          </span>
        </div>
        {volume > 100 && (
          <div className="text-xs text-yellow-600 mt-1.5 flex items-center gap-1.5 bg-yellow-50 p-1.5 rounded border border-yellow-100">
            <Icon name="alert-circle" className="w-3.5 h-3.5" />
            Unusually high volume - please verify
          </div>
        )}
      </div>

      {/* Container Type */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Container Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {CONTAINER_TYPE_OPTIONS.map((option) => {
            const isRequired = requirement.containerTypes.includes(option.value as ContainerType);
            const isSelected = selectedContainerType === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedContainerType(option.value as ContainerType)}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-sm border transition-all duration-200 text-xs font-medium w-28 ${
                  isSelected
                    ? isRequired
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-200'
                      : 'bg-yellow-50 border-yellow-500 text-yellow-700 ring-1 ring-yellow-200'
                    : isRequired
                    ? 'bg-white border-green-300 text-gray-700 hover:bg-green-50 hover:border-green-400'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
                title={isRequired ? 'Required container type' : 'Not in requirements'}
              >
                <Icon
                  name={option.value === 'cup' ? 'lab-cup' : 'lab-tube'}
                  className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                />
                <span>{option.name}</span>
              </button>
            );
          })}
        </div>
        {selectedContainerType && !requirement.containerTypes.includes(selectedContainerType) && (
          <div className="text-xs text-yellow-600 mt-1.5 flex items-center gap-1.5 bg-yellow-50 p-1.5 rounded border border-yellow-100">
            <Icon name="alert-circle" className="w-3.5 h-3.5" />
            Warning: Selected container type not in requirements
          </div>
        )}
      </div>

      {/* Container Color */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Container Color <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {CONTAINER_COLOR_OPTIONS.map((option) => {
            const isRequired = requirement.containerTopColors.includes(option.value);
            const isSelected = selectedColor === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedColor(option.value)}
                className={`w-8 h-8 rounded-full transition-all duration-200 ${option.colorClass} ${
                  isSelected
                    ? 'scale-110 ring-2 ring-offset-2 ring-blue-400 shadow-md'
                    : isRequired
                    ? 'opacity-100 hover:scale-105 hover:shadow-sm ring-2 ring-green-300'
                    : 'opacity-60 hover:opacity-80 hover:scale-105 hover:shadow-sm'
                }`}
                title={`${option.name}${isRequired ? ' (Required)' : ''}`}
              />
            );
          })}
        </div>
        {!selectedColor && (
          <div className="text-xs text-orange-600 mt-2 flex items-center gap-1.5 bg-orange-50 p-1.5 rounded border border-orange-100">
            <Icon name="alert-circle" className="w-3.5 h-3.5" />
            Selection required
          </div>
        )}
        {selectedColor && !requirement.containerTopColors.includes(selectedColor as never) && (
          <div className="text-xs text-yellow-600 mt-1.5 flex items-center gap-1.5 bg-yellow-50 p-1.5 rounded border border-yellow-100">
            <Icon name="alert-circle" className="w-3.5 h-3.5" />
            Warning: Selected color not in requirements
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <textarea
          rows={2}
          placeholder="Add optional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>
    </PopoverForm>
  );
};

interface SampleCollectionPopoverProps {
  /** Sample requirement data */
  requirement: SampleRequirement;
  /** Patient name for display */
  patientName?: string;
  /** Test name for display */
  testName?: string;
  /** Whether this is a recollection */
  isRecollection?: boolean;
  /** Callback when collection is confirmed */
  onConfirm: (volume: number, notes?: string, color?: string, containerType?: ContainerType) => void;
  /** Custom trigger element (uses default button if not provided) */
  trigger?: React.ReactNode;
}

export const SampleCollectionPopover: React.FC<SampleCollectionPopoverProps> = ({
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
        <Button variant="primary" size="xs" icon={<Icon name="sample-collection" className="text-white" />}>
          {isRecollection ? 'RECOLLECT' : 'COLLECT'}
        </Button>
      )
    }
  >
    {({ close }) => (
      <div data-popover-content onClick={(e) => e.stopPropagation()}>
        <SampleCollectionPopoverContent
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
