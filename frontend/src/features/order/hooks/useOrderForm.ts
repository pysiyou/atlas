import { useState, useMemo } from 'react';
import type { Order } from '@/types';
import type { OrderFormData } from '../types/orderForm';

/**
 * Creates initial form data from an existing order
 * Filters out superseded tests when initializing
 */
const createInitialFormDataFromOrder = (order?: Partial<Order>): OrderFormData => {
  if (order) {
    // Only include active tests (not superseded)
    const activeTests = order.tests?.filter(t => t.status !== 'superseded') || [];
    return {
      referringPhysician: order.referringPhysician || '',
      priority: order.priority || 'routine',
      clinicalNotes: order.clinicalNotes || '',
      selectedTests: activeTests.map(t => t.testCode),
    };
  }
  return {
    referringPhysician: '',
    priority: 'routine',
    clinicalNotes: '',
    selectedTests: [],
  };
};

export const useOrderForm = (initialData?: Partial<Order>) => {
  const initialFormData = useMemo(
    () => createInitialFormDataFromOrder(initialData),
    [initialData]
  );

  const [formData, setFormData] = useState<OrderFormData>(initialFormData);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => {
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
    setErrors(prev => ({ ...prev, [field]: message }));
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
