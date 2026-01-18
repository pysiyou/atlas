/**
 * Aliquots Provider Component
 * Manages sample aliquots for distributed testing with proper error handling
 */

import React, { useState, useCallback, type ReactNode } from 'react';
import type { Aliquot, AliquotPlan, AliquotStatus, ContainerType } from '@/types';
import { generateAliquotId } from '@/utils/sampleHelpers';
import { AliquotsContext, type AliquotsContextType, type AliquotError } from './AliquotsContext';

interface AliquotsProviderProps {
  children: ReactNode;
}

export const AliquotsProvider: React.FC<AliquotsProviderProps> = ({ children }) => {
  const [aliquots, setAliquots] = useState<Aliquot[]>([]);
  const [loading] = useState(false);
  const [error, setError] = useState<AliquotError | null>(null);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);


  const getAliquot = (aliquotId: string) => {
    return aliquots.find((a) => a.aliquotId === aliquotId);
  };

  const getAliquotsBySample = (sampleId: string) => {
    return aliquots.filter((a) => a.parentSampleId === sampleId);
  };

  const getAliquotsByOrder = (orderId: string) => {
    return aliquots.filter((a) => a.orderId === orderId);
  };

  const getAliquotsByStatus = (status: AliquotStatus) => {
    return aliquots.filter((a) => a.status === status);
  };

  const createAliquot = (
    parentSampleId: string,
    orderId: string,
    patientId: string,
    aliquotNumber: number,
    volume: number,
    linkedTestCodes: string[],
    containerType: ContainerType,
    purpose: string,
    createdBy: string
  ): Aliquot => {
    const aliquotId = generateAliquotId(parentSampleId, aliquotNumber);
    const barcode = `${aliquotId}-${Date.now()}`;
    const now = new Date().toISOString();

    const aliquot: Aliquot = {
      aliquotId,
      parentSampleId,
      orderId,
      patientId,
      aliquotNumber,
      volume,
      remainingVolume: volume,
      linkedTestCodes,
      purpose,
      containerType,
      barcode,
      status: 'available',
      currentLocation: 'lab',
      createdAt: now,
      createdBy,
      usedForTests: [],
      consumedAt: null,
      consumedBy: null,
      disposedAt: null,
      disposedBy: null,
    };

    setAliquots((prev) => [...prev, aliquot]);
    return aliquot;
  };

  const createAliquotsFromPlan = (
    sampleId: string,
    orderId: string,
    patientId: string,
    plan: AliquotPlan,
    createdBy: string
  ): Aliquot[] => {
    const createdAliquots: Aliquot[] = [];

    plan.aliquots.forEach((aliquotPlan) => {
      const aliquot = createAliquot(
        sampleId,
        orderId,
        patientId,
        aliquotPlan.aliquotNumber,
        aliquotPlan.volume,
        aliquotPlan.testCodes,
        aliquotPlan.containerType,
        `For ${aliquotPlan.destination}`,
        createdBy
      );
      createdAliquots.push(aliquot);
    });

    return createdAliquots;
  };

  const generateAliquotPlan = (
    sampleId: string,
    totalVolume: number,
    testGroups: {
      testCodes: string[];
      destination: string;
      requiredVolume: number;
      containerType: ContainerType;
    }[]
  ): AliquotPlan => {
    const deadVolume = 0.1; // 100µL loss per transfer
    let totalAliquotVolume = deadVolume * testGroups.length;

    const aliquots = testGroups.map((group, index) => {
      totalAliquotVolume += group.requiredVolume;
      return {
        aliquotNumber: index + 1,
        volume: group.requiredVolume,
        testCodes: group.testCodes,
        destination: group.destination,
        containerType: group.containerType,
      };
    });

    const isFeasible = totalAliquotVolume <= totalVolume;
    const warnings: string[] = [];

    if (!isFeasible) {
      warnings.push(
        `Insufficient volume: Need ${totalAliquotVolume.toFixed(1)}mL, have ${totalVolume.toFixed(1)}mL`
      );
    } else if (totalAliquotVolume > totalVolume * 0.9) {
      warnings.push('Very tight on volume. Minimal margin for error.');
    }

    return {
      sampleId,
      totalVolume,
      aliquots,
      deadVolume: deadVolume * testGroups.length,
      totalAliquotVolume,
      isFeasible,
      warnings,
    };
  };

  const markAliquotInUse = (aliquotId: string) => {
    setAliquots((prev) =>
      prev.map((a) => {
        if (a.aliquotId === aliquotId) {
          return {
            ...a,
            status: 'in-use' as AliquotStatus,
          };
        }
        return a;
      })
    );
  };

  const markAliquotConsumed = (
    aliquotId: string,
    consumedBy: string,
    usedForTests: string[]
  ) => {
    const now = new Date().toISOString();

    setAliquots((prev) =>
      prev.map((a) => {
        if (a.aliquotId === aliquotId) {
          return {
            ...a,
            status: 'consumed' as AliquotStatus,
            consumedAt: now,
            consumedBy,
            usedForTests: [...a.usedForTests, ...usedForTests],
            remainingVolume: 0,
          };
        }
        return a;
      })
    );
  };

  const updateRemainingVolume = (aliquotId: string, remainingVolume: number) => {
    setAliquots((prev) =>
      prev.map((a) => {
        if (a.aliquotId === aliquotId) {
          return {
            ...a,
            remainingVolume,
          };
        }
        return a;
      })
    );
  };

  const moveAliquot = (aliquotId: string, location: string) => {
    setAliquots((prev) =>
      prev.map((a) => {
        if (a.aliquotId === aliquotId) {
          return {
            ...a,
            currentLocation: location,
          };
        }
        return a;
      })
    );
  };

  const disposeAliquot = (aliquotId: string, disposedBy: string) => {
    const now = new Date().toISOString();

    setAliquots((prev) =>
      prev.map((a) => {
        if (a.aliquotId === aliquotId) {
          return {
            ...a,
            status: 'disposed' as AliquotStatus,
            disposedAt: now,
            disposedBy,
          };
        }
        return a;
      })
    );
  };

  const value: AliquotsContextType = {
    aliquots,
    loading,
    error,
    getAliquot,
    getAliquotsBySample,
    getAliquotsByOrder,
    getAliquotsByStatus,
    createAliquot,
    createAliquotsFromPlan,
    generateAliquotPlan,
    markAliquotInUse,
    markAliquotConsumed,
    updateRemainingVolume,
    moveAliquot,
    disposeAliquot,
    clearError,
  };

  return <AliquotsContext.Provider value={value}>{children}</AliquotsContext.Provider>;
};
