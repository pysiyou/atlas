/**
 * ReportDetail Component
 * Detail view for a specific report - opens preview modal for a validated test
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrdersList, usePatientsList, useTestCatalog, usePatientNameLookup, useSampleLookup, useUserLookup } from '@/hooks/queries';
import { ReportPreviewModal } from '../components/ReportPreviewModal';
import { generateLabReport, downloadPDF } from '../utils/reportPDF';
import type { ReportData, ValidatedTest } from '../types';
import { formatDate } from '@/utils';
import { companyConfig } from '@/config';
import { toast } from '@/shared/components/feedback';

export const ReportDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const testId = id ? parseInt(id, 10) : null;

  // Use TanStack Query hooks
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { patients, isLoading: patientsLoading } = usePatientsList();
  const { tests, isLoading: testsLoading } = useTestCatalog();
  const { getPatientName } = usePatientNameLookup();
  const { getSample } = useSampleLookup();
  const { getUserName, isLoading: _usersLoading } = useUserLookup();

  const [isGenerating, setIsGenerating] = useState(false);

  // Find the validated test by ID
  const validatedTest = useMemo(() => {
    if (!testId) return null;

    for (const order of orders) {
      const test = order.tests.find(t => t.id === testId && t.status === 'validated');
      if (test) {
        const patient = patients?.find(p => p.id === order.patientId);
        
        // Calculate age if DOB available
        let age: number | undefined;
        if (patient?.dateOfBirth) {
          const birthDate = new Date(patient.dateOfBirth);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        const validatedTest: ValidatedTest = {
          testId: test.id!,
          testCode: test.testCode,
          testName: test.testName,
          orderId: order.orderId,
          orderDate: order.orderDate,
          patientId: order.patientId,
          patientName: getPatientName(order.patientId),
          patientAge: age,
          patientGender: patient?.gender,
          test,
          order,
        };
        return validatedTest;
      }
    }
    return null;
  }, [testId, orders, patients, getPatientName]);

  // Redirect if test not found
  useEffect(() => {
    if (!ordersLoading && !patientsLoading && !testsLoading && !validatedTest) {
      navigate('/reports', { replace: true });
    }
  }, [ordersLoading, patientsLoading, testsLoading, validatedTest, navigate]);

  // Loading state
  if (ordersLoading || patientsLoading || testsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-text-tertiary">Loading...</div>
      </div>
    );
  }

  // If test not found after loading, return null (useEffect will redirect)
  if (!validatedTest) {
    return null;
  }

  /**
   * Prepare report data from validated test
   */
  const prepareReportData = (test: ValidatedTest): ReportData => {
    // Find patient to get phone and email
    const patient = patients?.find(p => p.id === test.patientId);

    // Get sample collection data if sampleId is available
    const sample = test.test.sampleId ? getSample(test.test.sampleId) : undefined;
    const collectedAt = sample && sample.status === 'collected' 
      ? (sample as { collectedAt?: string }).collectedAt 
      : undefined;
    const collectedBy = sample && sample.status === 'collected' 
      ? (sample as { collectedBy?: string }).collectedBy 
      : undefined;

    // Find test in catalog to get parameter names
    const catalogTest = tests.find(t => t.code === test.test.testCode);

    const testResults = [{
      testCode: test.test.testCode,
      testName: test.test.testName,
      parameters: Object.entries(test.test.results || {}).map(([code, result]) => {
        // Look up parameter name from catalog
        const parameter = catalogTest?.parameters?.find(p => p.code === code);
        const fullName = parameter?.name || code;
        
        return {
          name: fullName,
          code: code,
          value: result.value,
          unit: result.unit,
          referenceRange: result.referenceRange,
          status: result.status,
          isCritical:
            result.status === 'critical' ||
            result.status === 'critical-high' ||
            result.status === 'critical-low',
        };
      }),
      technicianNotes: test.test.technicianNotes,
      validationNotes: test.test.validationNotes,
      enteredBy: test.test.enteredBy?.toString(),
      validatedBy: test.test.validatedBy?.toString(),
      validatedByName: test.test.validatedBy 
        ? getUserName(String(test.test.validatedBy).trim())
        : undefined,
      enteredAt: test.test.resultEnteredAt,
      validatedAt: test.test.resultValidatedAt,
    }];

    // Extend order with patient contact info
    const orderWithPatientInfo = {
      ...test.order,
      patientPhone: patient?.phone,
      patientEmail: patient?.email,
    };

    return {
      order: orderWithPatientInfo,
      patientId: test.patientId,
      patientName: test.patientName,
      patientAge: test.patientAge,
      patientGender: test.patientGender,
      timestamps: {
        registeredAt: test.order.orderDate || test.order.createdAt,
        collectedAt: collectedAt,
        reportedAt: test.test.resultValidatedAt || new Date().toISOString(),
      },
      sampleCollection: {
        collectedAt: collectedAt,
        collectedBy: collectedBy,
        address: companyConfig.getContact().address.fullAddress,
      },
      testResults,
    };
  };

  /**
   * Handle report generation
   */
  const handleGenerateReport = async () => {
    if (!validatedTest) return;

    try {
      setIsGenerating(true);
      const reportData = prepareReportData(validatedTest);
      const doc = generateLabReport(reportData);

      const filename = `Lab_Report_TST${validatedTest.testId.toString().padStart(6, '0')}_${formatDate(new Date())}.pdf`;
      downloadPDF(doc, filename);

      toast.success({
        title: 'Report downloaded successfully',
        subtitle: 'The report has been generated and the download should start shortly. Check your downloads folder.',
      });
      navigate('/reports');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error({
        title: 'Failed to generate report',
        subtitle: 'The report could not be generated. Please try again or contact support if the issue persists.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    navigate('/reports');
  };

  return (
    <ReportPreviewModal
      isOpen={true}
      onClose={handleClose}
      reportData={prepareReportData(validatedTest)}
      onGenerate={handleGenerateReport}
      isGenerating={isGenerating}
    />
  );
};
