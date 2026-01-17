/**
 * Samples Provider Component
 * Manages sample collection and tracking
 */

import React, { useCallback, useState, type ReactNode } from 'react';
import type {
  Sample,
  CollectedSample,
  RejectedSample,
  RejectionReason,
  SampleStatus,
  ContainerType,
  ContainerTopColor,
} from '@/types';
import { isCollectedSample } from '@/types';
import { generateSampleId } from '@/utils/sampleHelpers';
import { SamplesContext, type SamplesContextType } from './SamplesContext';

interface SamplesProviderProps {
  children: ReactNode;
}

export const SamplesProvider: React.FC<SamplesProviderProps> = ({ children }) => {
  const [samples, setSamples] = useState<Sample[]>([]);




  const getSample = useCallback((sampleId: string) => {
    return samples.find((s) => s.sampleId === sampleId);
  }, [samples]);

  const getSamplesByOrder = useCallback((orderId: string) => {
    return samples.filter((s) => s.orderId === orderId);
  }, [samples]);

  const getSamplesByPatient = useCallback((patientId: string, orders: Array<{ orderId: string; patientId: string }>) => {
    const orderIds = orders.filter((o) => o.patientId === patientId).map((o) => o.orderId);
    return samples.filter((s) => orderIds.includes(s.orderId));
  }, [samples]);

  const getSamplesByStatus = useCallback((status: SampleStatus) => {
    return samples.filter((s) => s.status === status);
  }, [samples]);

  const createSample = useCallback((
    orderId: string,
    sampleType: Sample['sampleType'],
    requiredVolume: number,
    testCodes: string[],
    requiredContainerTypes: ContainerType[],
    requiredContainerColors: ContainerTopColor[],
    priority: 'routine' | 'urgent' | 'stat',
    initialCollection?: {
      collectedBy: string;
      collectedVolume: number;
      actualContainerType: ContainerType;
      actualContainerColor: ContainerTopColor;
      collectionNotes?: string;
    }
  ): Sample => {
    const sampleId = generateSampleId(orderId, sampleType);
    const now = new Date().toISOString();

    const baseSample = {
      sampleId,
      orderId,
      sampleType,
      testCodes,
      requiredVolume,
      priority,
      requiredContainerTypes,
      requiredContainerColors,
      createdAt: now,
      updatedAt: now,
    };

    const newSample: Sample = initialCollection
      ? {
          ...baseSample,
          createdBy: initialCollection.collectedBy,
          updatedBy: initialCollection.collectedBy,
          status: 'collected',
          collectedAt: now,
          collectedBy: initialCollection.collectedBy,
          collectedVolume: initialCollection.collectedVolume,
          actualContainerType: initialCollection.actualContainerType,
          actualContainerColor: initialCollection.actualContainerColor,
          collectionNotes: initialCollection.collectionNotes,
          remainingVolume: initialCollection.collectedVolume,
        } as CollectedSample
      : {
          ...baseSample,
          createdBy: 'system',
          updatedBy: 'system',
          status: 'pending',
        };

    setSamples(prev => [...prev, newSample]);
    return newSample;
  }, [setSamples]);

  const collectSample = useCallback((
    sampleId: string,
    collectedBy: string,
    collectedVolume: number,
    actualContainerType: ContainerType,
    actualContainerColor: ContainerTopColor,
    collectionNotes?: string
  ) => {
    const now = new Date().toISOString();

    setSamples(prev => prev.map((sample) => {
      if (sample.sampleId === sampleId && sample.status === 'pending') {
        return {
          ...sample,
          status: 'collected',
          collectedAt: now,
          collectedBy,
          collectedVolume,
          actualContainerType,
          actualContainerColor,
          collectionNotes,
          remainingVolume: collectedVolume,
          updatedAt: now,
          updatedBy: collectedBy,
        } as CollectedSample;
      }
      return sample;
    }));
  }, [setSamples]);

  const rejectSample = useCallback((
    sampleId: string,
    reasons: RejectionReason[],
    rejectedBy: string,
    notes?: string,
    requireRecollection: boolean = true
  ): RejectedSample | undefined => {
    const now = new Date().toISOString();
    const sample = samples.find(s => s.sampleId === sampleId);

    if (!sample || !isCollectedSample(sample)) return undefined;

    const rejectedSample: RejectedSample = {
      ...sample,
      status: 'rejected',
      rejectedAt: now,
      rejectedBy,
      rejectionReasons: reasons,
      rejectionNotes: notes,
      recollectionRequired: requireRecollection,
      updatedAt: now,
      updatedBy: rejectedBy,
    };

    if (requireRecollection) {
      const newSampleId = generateSampleId(rejectedSample.orderId, rejectedSample.sampleType);
      rejectedSample.recollectionSampleId = newSampleId;

      const newPendingSample: Sample = {
        sampleId: newSampleId,
        orderId: rejectedSample.orderId,
        sampleType: rejectedSample.sampleType,
        testCodes: rejectedSample.testCodes,
        requiredVolume: rejectedSample.requiredVolume,
        priority: rejectedSample.priority,
        requiredContainerTypes: rejectedSample.requiredContainerTypes,
        requiredContainerColors: rejectedSample.requiredContainerColors,
        createdAt: now,
        createdBy: rejectedBy,
        updatedAt: now,
        updatedBy: rejectedBy,
        status: 'pending',
      };

      setSamples(prev => [
        ...prev.map(s => s.sampleId === sampleId ? rejectedSample : s),
        newPendingSample
      ]);
    } else {
      setSamples(prev => prev.map(s => s.sampleId === sampleId ? rejectedSample : s));
    }

    return rejectedSample;
  }, [samples, setSamples]);

  const updateRemainingVolume = useCallback((sampleId: string, remainingVolume: number) => {
    setSamples(prev => prev.map((s) => {
      if (s.sampleId === sampleId && isCollectedSample(s)) {
        return { ...s, remainingVolume, updatedAt: new Date().toISOString() };
      }
      return s;
    }));
  }, [setSamples]);

  const value: SamplesContextType = {
    samples,
    getSample,
    getSamplesByOrder,
    getSamplesByPatient,
    getSamplesByStatus,
    createSample,
    collectSample,
    rejectSample,
    updateRemainingVolume,
  };

  return <SamplesContext.Provider value={value}>{children}</SamplesContext.Provider>;
};
