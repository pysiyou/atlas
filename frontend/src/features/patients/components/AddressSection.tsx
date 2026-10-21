import React from 'react';
import { useController } from 'react-hook-form';
import { Input } from '@/components/inputs';
import type { PatientFormSectionProps } from '../patientFormTypes';
import { patientFieldError } from '../patientFormFieldError';

export const AddressSection: React.FC<PatientFormSectionProps> = ({ control, errors }) => {
  const { field: street } = useController({ control, name: 'address.street' });
  const { field: city } = useController({ control, name: 'address.city' });
  const { field: postalCode } = useController({ control, name: 'address.postalCode' });

  return (
    <div className="space-y-space-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-layout-section">
        <div className="md:col-span-2">
          <Input
            inferIcon
            label="Street Address"
            name="street"
            value={street.value ?? ''}
            onChange={street.onChange}
            error={patientFieldError(errors, 'address.street')}
            required
            placeholder="123 Main Street"
          />
        </div>
        <Input
          inferIcon
          label="City"
          name="city"
          value={city.value ?? ''}
          onChange={city.onChange}
          error={patientFieldError(errors, 'address.city')}
          required
          placeholder="Springfield"
        />
        <Input
          inferIcon
          label="Postal Code"
          name="postalCode"
          value={postalCode.value ?? ''}
          onChange={postalCode.onChange}
          error={patientFieldError(errors, 'address.postalCode')}
          required
          placeholder="12345"
        />
      </div>
    </div>
  );
};
