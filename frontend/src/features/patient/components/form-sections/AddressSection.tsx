import React from 'react';
import { Input } from '@/shared/ui';
import type { PatientFormSectionProps } from './types';

export const AddressSection: React.FC<
  Pick<PatientFormSectionProps, 'formData' | 'errors' | 'onFieldChange'>
> = ({ formData, errors, onFieldChange }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Input
          label="Street Address"
          name="street"
          value={formData.street}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFieldChange('street', e.target.value)
          }
          error={errors.street}
          required
          placeholder="123 Main Street"
        />
      </div>
      <Input
        label="City"
        name="city"
        value={formData.city}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('city', e.target.value)}
        error={errors.city}
        required
        placeholder="Springfield"
      />
      <Input
        label="Postal Code"
        name="postalCode"
        value={formData.postalCode}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFieldChange('postalCode', e.target.value)
        }
        error={errors.postalCode}
        required
        placeholder="12345"
      />
    </div>
  </div>
);
