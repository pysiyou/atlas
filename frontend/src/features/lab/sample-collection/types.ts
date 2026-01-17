/**
 * Sample Collection Types
 */

import type { Sample, Order, Patient, SampleType, ContainerType, ContainerTopColor } from '@/types';

export interface SampleRequirement {
  sampleType: SampleType;
  testCodes: string[];  // Links to Test catalog (testNames should be looked up)
  totalVolume: number;
  containerTypes: ContainerType[];
  containerTopColors: ContainerTopColor[];
  priority: 'routine' | 'urgent' | 'stat';
  orderId: string;
}

export interface SampleDisplay {
  sample?: Sample;
  order: Order;
  patient: Patient;
  priority: string;
  requirement?: SampleRequirement;
}
