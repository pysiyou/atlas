import { useState } from 'react';
import type { PriorityLevel } from '@/types';

interface OrderFormData {
  referringPhysician: string;
  priority: PriorityLevel;
  clinicalNotes: string;
  selectedTests: string[];
}

export const useOrderForm = (initialData?: Partial<OrderFormData>) => {
  const [formData, setFormData] = useState<OrderFormData>({
    referringPhysician: initialData?.referringPhysician || '',
    priority: initialData?.priority || 'routine',
    clinicalNotes: initialData?.clinicalNotes || '',
    selectedTests: initialData?.selectedTests || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof OrderFormData>(
    field: K,
    value: OrderFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.selectedTests.length === 0) {
      newErrors.tests = 'Please select at least one test';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const setError = (field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const reset = () => {
    setFormData({
      referringPhysician: '',
      priority: 'routine',
      clinicalNotes: '',
      selectedTests: [],
    });
    setErrors({});
    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    updateField,
    validate,
    setError,
    reset,
  };
};
